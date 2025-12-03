// ====================================================================
// 🏷️ SISTEMA ETIQUETAS V2.5 - APLICACIÓN DE BANDEJA
// ====================================================================
// Gestión de servidor desde la bandeja del sistema Windows
// ====================================================================

const { app, Tray, Menu, shell, BrowserWindow, dialog, nativeImage } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const notifier = require('node-notifier');

// Configuración de rutas
const BASE_DIR = path.join(__dirname, '..');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const LOGS_DIR = path.join(__dirname, 'logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Variables globales
let logWindow = null;
const LOG_LEVELS = {
    INFO: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    SUCCESS: '🎉'
};

// ====================================================================
// CLASE PRINCIPAL: SistemaEtiquetasTray
// ====================================================================
class SistemaEtiquetasTray {
    constructor() {
        this.tray = null;
        this.serverProcess = null;
        this.watchdogInterval = null;
        this.config = this.loadConfig();
        this.serverActive = false;
        this.printerStatus = {
            zebra: false,
            godex: false
        };
    }

    // ================================================================
    // CONFIGURACIÓN
    // ================================================================

    loadConfig() {
        const defaultConfig = {
            auto_start: false,
            auto_start_server: false,
            auto_restart: true,
            notifications: true,
            server_port: 3012,
            watchdog_interval: 30,
            printers: {
                zebra: { ip: '192.168.1.34', port: 9100 },
                godex: { ip: '192.168.1.35', port: 9100 }
            }
        };

        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                return { ...defaultConfig, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('⚠️ Error cargando config:', error);
        }

        return defaultConfig;
    }

    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
            this.log('Configuración guardada', 'SUCCESS');
        } catch (error) {
            this.log(`Error guardando config: ${error.message}`, 'ERROR');
        }
    }

    // ================================================================
    // SISTEMA DE LOGS
    // ================================================================

    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleString('es-ES');
        const icon = LOG_LEVELS[level] || '📝';
        const logMessage = `[${timestamp}] ${icon} ${message}`;
        
        // Guardar en archivo
        const logFile = path.join(LOGS_DIR, 'app.log');
        try {
            fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
        } catch (error) {
            console.error('Error escribiendo log:', error);
        }
        
        // Enviar a ventana de logs si está abierta
        if (logWindow && !logWindow.isDestroyed()) {
            logWindow.webContents.send('new-log', { 
                message, level, timestamp, icon 
            });
        }
        
        // Solo mostrar en consola si es ERROR o WARNING
        if (level === 'ERROR' || level === 'WARNING') {
            console.log(logMessage);
        }
    }

    logProcess(processName, data, isError = false) {
        const message = data.toString().trim();
        if (!message) return;
        
        const level = isError ? 'ERROR' : 'INFO';
        const logFile = path.join(LOGS_DIR, 
            `${processName.toLowerCase()}${isError ? '-error' : ''}.log`
        );
        const timestamp = new Date().toLocaleString('es-ES');
        
        try {
            fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
        } catch (error) {
            console.error('Error escribiendo log de proceso:', error);
        }
        
        if (logWindow && !logWindow.isDestroyed()) {
            logWindow.webContents.send('new-log', {
                message: `[${processName}] ${message}`,
                level,
                timestamp,
                icon: isError ? '❌' : '📝'
            });
        }
        
        if (isError) {
            console.error(`[${processName} Error] ${message}`);
        }
    }

    clearLogs() {
        try {
            const logFiles = ['app.log', 'servidor.log', 'servidor-error.log'];
            logFiles.forEach(file => {
                const logPath = path.join(LOGS_DIR, file);
                if (fs.existsSync(logPath)) {
                    fs.writeFileSync(logPath, '', 'utf8');
                }
            });
            this.log('Logs limpiados', 'SUCCESS');
            this.showNotification('Logs', 'Todos los logs han sido limpiados');
        } catch (error) {
            this.log(`Error limpiando logs: ${error.message}`, 'ERROR');
        }
    }

    // ================================================================
    // VERIFICACIÓN DE PUERTOS Y ESTADO
    // ================================================================

    checkPort(port) {
        return new Promise((resolve) => {
            const options = {
                host: 'localhost',
                port: port,
                timeout: 1000
            };

            const req = http.request(options, () => {
                resolve(false); // Puerto ocupado
            });

            req.on('error', () => {
                resolve(true); // Puerto disponible
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(true); // Puerto disponible
            });

            req.end();
        });
    }

    async checkServerHealth() {
        return new Promise((resolve) => {
            const req = http.request({
                host: 'localhost',
                port: this.config.server_port,
                path: '/health',
                method: 'GET',
                timeout: 2000
            }, (res) => {
                console.log(`✅ Health check OK: ${res.statusCode}`);
                resolve(res.statusCode === 200);
            });

            req.on('error', (err) => {
                console.log(`❌ Health check error: ${err.message}`);
                resolve(false);
            });
            
            req.on('timeout', () => {
                console.log('⏱️ Health check timeout');
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    async updateStatus() {
        // Verificar si el puerto está ocupado (método simple y confiable)
        const portAvailable = await this.checkPort(this.config.server_port);
        this.serverActive = !portAvailable; // Si puerto ocupado = servidor activo
        
        console.log(`📊 Estado actualizado: Puerto ${this.config.server_port} ${portAvailable ? 'LIBRE' : 'OCUPADO'}, ServerActive=${this.serverActive}`);
        
        this.updateTrayIcon();
    }

    // ================================================================
    // GESTIÓN DE PROCESOS
    // ================================================================

    killProcessOnPort(port) {
        return new Promise((resolve) => {
            const command = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`;
            
            exec(command, { shell: 'cmd.exe' }, (error) => {
                if (error) {
                    this.log(`No hay procesos en puerto ${port}`, 'INFO');
                } else {
                    this.log(`Proceso en puerto ${port} eliminado`, 'WARNING');
                }
                setTimeout(() => resolve(), 2000);
            });
        });
    }

    async startServer() {
        // Primero actualizar estado real
        await this.updateStatus();
        
        if (this.serverActive) {
            this.showNotification('Servidor', 'El servidor ya está activo');
            this.log('Servidor ya está activo', 'INFO');
            return;
        }

        this.log('Iniciando servidor...', 'INFO');
        this.showNotification('Iniciando...', 'Preparando servidor...');

        try {
            // Matar proceso zombie si existe
            if (this.serverProcess) {
                try {
                    this.serverProcess.kill();
                } catch (e) {}
                this.serverProcess = null;
            }

            // Liberar puerto si está ocupado
            const portAvailable = await this.checkPort(this.config.server_port);
            if (!portAvailable) {
                this.log('Liberando puerto ocupado...', 'WARNING');
                await this.killProcessOnPort(this.config.server_port);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Iniciar servidor
            this.log('Lanzando proceso de Node.js...', 'INFO');
            this.serverProcess = spawn('node', ['server.js'], {
                cwd: BASE_DIR,
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, FORCE_COLOR: '0' }
            });

            this.log('Proceso de servidor creado (PID: ' + this.serverProcess.pid + ')', 'INFO');

            // Variable para detectar cuando el servidor está listo
            let serverReady = false;

            // Capturar salida estándar
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                this.logProcess('Servidor', data, false);
                
                // Detectar cuando el servidor está listo
                if (output.includes('Servidor HTTP ejecutándose') || 
                    output.includes('listening on') ||
                    output.includes('Conectado a PostgreSQL exitosamente')) {
                    serverReady = true;
                    console.log('✅ Servidor detectado como listo');
                }
            });

            // Capturar errores
            this.serverProcess.stderr.on('data', (data) => {
                this.logProcess('Servidor', data, true);
            });

            // Manejar cierre del proceso
            this.serverProcess.on('close', (code) => {
                this.log(`Servidor cerrado con código ${code}`, code === 0 ? 'INFO' : 'WARNING');
                this.serverProcess = null;
                this.serverActive = false;
                this.updateTrayIcon();
            });

            this.serverProcess.on('error', (error) => {
                this.log(`Error en proceso del servidor: ${error.message}`, 'ERROR');
                this.showNotification('Error', 'No se pudo iniciar el servidor');
                this.serverProcess = null;
            });

            // Esperar a que el servidor abra el puerto
            this.log('Esperando a que el servidor abra el puerto...', 'INFO');
            
            for (let i = 1; i <= 6; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Verificar si el puerto está ocupado
                const portOccupied = !(await this.checkPort(this.config.server_port));
                console.log(`[${i}/6] Puerto ${this.config.server_port} ocupado: ${portOccupied}, ServerReady por logs: ${serverReady}`);
                
                if (portOccupied || serverReady) {
                    // El puerto está ocupado = servidor está corriendo
                    this.serverActive = true;
                    this.updateTrayIcon();
                    this.log('Servidor iniciado correctamente', 'SUCCESS');
                    this.showNotification('Servidor Iniciado', 
                        `Sistema Etiquetas corriendo en puerto ${this.config.server_port}`);
                    return;
                }
                
                this.log(`Verificando puerto ${this.config.server_port}... (${i}/6)`, 'INFO');
            }

            // Última verificación
            const portOccupied = !(await this.checkPort(this.config.server_port));
            if (portOccupied) {
                this.serverActive = true;
                this.updateTrayIcon();
                this.log('Servidor iniciado correctamente', 'SUCCESS');
                this.showNotification('Servidor Iniciado', 
                    `Sistema Etiquetas corriendo en puerto ${this.config.server_port}`);
            } else {
                this.log('El puerto no se abrió después de 12 segundos', 'WARNING');
                this.showNotification('Advertencia', 
                    'El servidor se inició pero el puerto no está abierto. Revisa los logs.');
            }

        } catch (error) {
            this.log(`Error iniciando servidor: ${error.message}`, 'ERROR');
            this.showNotification('Error', 'No se pudo iniciar el servidor');
            this.serverProcess = null;
            this.serverActive = false;
            this.updateTrayIcon();
        }
    }

    async stopServer() {
        if (!this.serverActive && !this.serverProcess) {
            this.showNotification('Servidor', 'El servidor no está activo');
            return;
        }

        this.log('Deteniendo servidor...', 'INFO');

        try {
            // Intentar matar el proceso primero
            if (this.serverProcess) {
                try {
                    this.serverProcess.kill('SIGTERM');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Si todavía existe, forzar
                    if (this.serverProcess && !this.serverProcess.killed) {
                        this.serverProcess.kill('SIGKILL');
                    }
                } catch (e) {
                    this.log(`Error matando proceso: ${e.message}`, 'WARNING');
                }
                this.serverProcess = null;
            }

            // Liberar puerto por las dudas
            await this.killProcessOnPort(this.config.server_port);
            
            this.serverActive = false;
            this.updateTrayIcon();
            
            this.log('Servidor detenido', 'SUCCESS');
            this.showNotification('Servidor Detenido', 'El servidor se ha detenido correctamente');
        } catch (error) {
            this.log(`Error deteniendo servidor: ${error.message}`, 'ERROR');
            this.serverActive = false;
            this.serverProcess = null;
            this.updateTrayIcon();
        }
    }

    async restartServer() {
        this.log('Reiniciando servidor...', 'INFO');
        this.showNotification('Reiniciando...', 'Deteniendo servidor...');
        
        await this.stopServer();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        this.showNotification('Reiniciando...', 'Iniciando servidor...');
        await this.startServer();
    }

    // ================================================================
    // WATCHDOG - MONITOREO AUTOMÁTICO
    // ================================================================

    startWatchdog() {
        if (this.watchdogInterval) {
            return;
        }

        this.log('Watchdog iniciado', 'SUCCESS');
        
        this.watchdogInterval = setInterval(async () => {
            if (!this.config.auto_restart) return;

            await this.updateStatus();

            if (this.serverActive) {
                const healthy = await this.checkServerHealth();
                
                if (!healthy) {
                    console.log('⚠️ Servidor no responde al health check');
                    this.log('Servidor no responde', 'WARNING');
                    
                    // PASO 1: Intentar reanimarlo con un ping
                    if (this.serverProcess && this.serverProcess.stdin) {
                        try {
                            this.serverProcess.stdin.write('\n');
                            console.log('📡 Ping enviado al servidor');
                            this.log('Ping enviado al servidor', 'INFO');
                        } catch (error) {
                            console.log('⚠️ No se pudo enviar ping');
                        }
                    }

                    // PASO 2: Esperar 2 segundos y verificar de nuevo
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    if (!await this.checkServerHealth()) {
                        // PASO 3: Reiniciar si sigue sin responder
                        console.log('🔄 Reiniciando servidor automáticamente...');
                        this.log('Reiniciando servidor automáticamente', 'WARNING');
                        this.stopServer();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await this.startServer();
                        this.showNotification('🔄 Servidor Reiniciado', 
                            'El servidor fue reiniciado automáticamente');
                    } else {
                        console.log('✅ Servidor respondió después del ping');
                        this.log('Servidor recuperado después del ping', 'SUCCESS');
                    }
                }
            }
        }, this.config.watchdog_interval * 1000);
    }

    stopWatchdog() {
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
            this.log('Watchdog detenido', 'INFO');
        }
    }

    // ================================================================
    // NOTIFICACIONES
    // ================================================================

    showNotification(title, message) {
        if (this.config.notifications) {
            notifier.notify({
                title: `🏷️ ${title}`,
                message: message,
                icon: path.join(__dirname, 'icon.ico'),
                sound: false,
                wait: false
            });
        }
    }

    // ================================================================
    // INTERFAZ - ICONO Y MENÚ
    // ================================================================

    getTrayIcon() {
        // Intentar cargar el nuevo logo oficial
        const newIconPath = path.join(BASE_DIR, 'founds', 'work-founds', 'logo_bandeja.ico');
        if (fs.existsSync(newIconPath)) {
            console.log('✅ Usando logo oficial de bandeja');
            return nativeImage.createFromPath(newIconPath);
        }
        
        // Fallback al icono antiguo
        const oldIconPath = path.join(__dirname, 'icon.ico');
        if (fs.existsSync(oldIconPath)) {
            console.log('⚠️ Usando logo antiguo de bandeja');
            return nativeImage.createFromPath(oldIconPath);
        }
        
        // Si no existe ningún icono, crear uno vacío
        console.log('❌ No se encontró ningún icono de bandeja');
        return nativeImage.createEmpty();
    }

    updateTrayIcon() {
        if (this.tray) {
            const tooltip = this.serverActive 
                ? `Sistema Etiquetas - ACTIVO (Puerto ${this.config.server_port})`
                : 'Sistema Etiquetas - INACTIVO';
            
            this.tray.setToolTip(tooltip);
            this.tray.setContextMenu(this.createMenu());
        }
    }

    createMenu() {
        return Menu.buildFromTemplate([
            {
                label: 'Iniciar Servidor',
                enabled: !this.serverActive,
                click: () => this.startServer()
            },
            {
                label: 'Detener Servidor',
                enabled: this.serverActive,
                click: () => this.stopServer()
            },
            {
                label: 'Reiniciar Servidor',
                enabled: true, // Siempre habilitado para casos de error
                click: async () => {
                    if (this.serverActive) {
                        await this.restartServer();
                    } else {
                        // Si está inactivo, intentar iniciar
                        await this.startServer();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Estado',
                submenu: [
                    {
                        label: `${this.serverActive ? '[ACTIVO]' : '[INACTIVO]'} Servidor (Puerto ${this.config.server_port})`,
                        enabled: false
                    },
                    { type: 'separator' },
                    {
                        label: `Zebra ZD230 (${this.config.printers.zebra.ip})`,
                        enabled: false
                    },
                    {
                        label: `Godex G500 (${this.config.printers.godex.ip})`,
                        enabled: false
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Abrir Sistema',
                enabled: this.serverActive,
                click: () => shell.openExternal(`http://localhost:${this.config.server_port}`)
            },
            {
                label: 'Abrir Ubicacion',
                click: () => shell.openPath(BASE_DIR)
            },
            { type: 'separator' },
            {
                label: 'Ver Logs',
                submenu: [
                    {
                        label: 'Logs en Tiempo Real',
                        click: () => this.openLogWindow()
                    },
                    { type: 'separator' },
                    {
                        label: 'Abrir Carpeta de Logs',
                        click: () => shell.openPath(LOGS_DIR)
                    },
                    { type: 'separator' },
                    {
                        label: 'App.log',
                        click: () => {
                            const logPath = path.join(LOGS_DIR, 'app.log');
                            if (fs.existsSync(logPath)) {
                                shell.openPath(logPath);
                            } else {
                                this.showNotification('Logs', 'No hay logs de aplicación');
                            }
                        }
                    },
                    {
                        label: 'Servidor.log',
                        click: () => {
                            const logPath = path.join(LOGS_DIR, 'servidor.log');
                            if (fs.existsSync(logPath)) {
                                shell.openPath(logPath);
                            } else {
                                this.showNotification('Logs', 'No hay logs del servidor');
                            }
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Limpiar Logs',
                        click: () => this.clearLogs()
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Configuracion',
                submenu: [
                    {
                        label: `${this.config.auto_start ? '[X]' : '[ ]'} Iniciar con Windows`,
                        click: () => this.toggleAutoStart()
                    },
                    {
                        label: `${this.config.auto_start_server ? '[X]' : '[ ]'} Iniciar servidor automaticamente`,
                        click: () => this.toggleAutoStartServer()
                    },
                    {
                        label: `${this.config.auto_restart ? '[X]' : '[ ]'} Mantener servidor activo (Watchdog)`,
                        click: () => this.toggleAutoRestart()
                    },
                    {
                        label: `${this.config.notifications ? '[X]' : '[ ]'} Notificaciones`,
                        click: () => this.toggleNotifications()
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Acerca de',
                click: () => {
                    this.showNotification('Sistema Etiquetas v2.5', 
                        'Gestor de Servidor desde Bandeja del Sistema');
                }
            },
            {
                label: 'Salir',
                click: () => {
                    this.stopServer();
                    this.stopWatchdog();
                    app.quit();
                }
            }
        ]);
    }

    // ================================================================
    // OPCIONES DE CONFIGURACIÓN
    // ================================================================

    toggleAutoStart() {
        this.config.auto_start = !this.config.auto_start;
        this.saveConfig();

        if (this.config.auto_start) {
            app.setLoginItemSettings({
                openAtLogin: true,
                path: process.execPath
            });
            this.showNotification('Inicio Automático', 
                'La aplicación iniciará con Windows');
        } else {
            app.setLoginItemSettings({ openAtLogin: false });
            this.showNotification('Inicio Automático', 
                'La aplicación NO iniciará con Windows');
        }

        this.updateTrayIcon();
    }

    toggleAutoStartServer() {
        this.config.auto_start_server = !this.config.auto_start_server;
        this.saveConfig();
        
        const message = this.config.auto_start_server
            ? 'El servidor se iniciará automáticamente'
            : 'El servidor NO se iniciará automáticamente';
        
        this.showNotification('Inicio Automático de Servidor', message);
        this.updateTrayIcon();
    }

    toggleAutoRestart() {
        this.config.auto_restart = !this.config.auto_restart;
        this.saveConfig();
        
        const message = this.config.auto_restart
            ? 'El watchdog mantendrá el servidor activo'
            : 'El watchdog está desactivado';
        
        this.showNotification('Watchdog', message);
        this.updateTrayIcon();
    }

    toggleNotifications() {
        this.config.notifications = !this.config.notifications;
        this.saveConfig();
        this.updateTrayIcon();
    }

    // ================================================================
    // VENTANA DE LOGS EN TIEMPO REAL
    // ================================================================

    openLogWindow() {
        if (logWindow && !logWindow.isDestroyed()) {
            logWindow.focus();
            return;
        }

        logWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            title: 'Sistema Etiquetas - Logs en Tiempo Real',
            icon: path.join(__dirname, 'icon.ico'),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            backgroundColor: '#1a1a1a'
        });

        const logsHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Logs - Sistema Etiquetas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a1a;
            color: #e0e0e0;
            padding: 20px;
            overflow-x: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid;
        }
        
        .stat-card.info { border-left-color: #3b82f6; }
        .stat-card.success { border-left-color: #10b981; }
        .stat-card.warning { border-left-color: #f59e0b; }
        .stat-card.error { border-left-color: #ef4444; }
        
        .stat-card h3 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            font-size: 12px;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .controls {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .btn-clear {
            background: #ef4444;
            color: white;
        }
        
        .btn-clear:hover {
            background: #dc2626;
        }
        
        .btn-export {
            background: #3b82f6;
            color: white;
        }
        
        .btn-export:hover {
            background: #2563eb;
        }
        
        .log-container {
            background: #2a2a2a;
            border-radius: 8px;
            padding: 15px;
            height: 400px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .log-container::-webkit-scrollbar {
            width: 10px;
        }
        
        .log-container::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        
        .log-container::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 5px;
        }
        
        .log-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        .log-entry {
            padding: 8px 12px;
            margin-bottom: 5px;
            border-left: 3px solid #666;
            background: rgba(255,255,255,0.02);
            border-radius: 4px;
            animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .log-entry.ERROR {
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        
        .log-entry.SUCCESS {
            border-left-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }
        
        .log-entry.WARNING {
            border-left-color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
        }
        
        .log-entry.INFO {
            border-left-color: #3b82f6;
        }
        
        .log-timestamp {
            color: #888;
            margin-right: 10px;
        }
        
        .log-icon {
            margin-right: 8px;
        }
        
        .log-message {
            color: #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏷️ Sistema Etiquetas v2.5 - Monitor de Logs</h1>
        <p>Logs en tiempo real • Solo errores en consola</p>
    </div>
    
    <div class="stats">
        <div class="stat-card info">
            <h3 id="stat-info">0</h3>
            <p>Info</p>
        </div>
        <div class="stat-card success">
            <h3 id="stat-success">0</h3>
            <p>Éxitos</p>
        </div>
        <div class="stat-card warning">
            <h3 id="stat-warning">0</h3>
            <p>Advertencias</p>
        </div>
        <div class="stat-card error">
            <h3 id="stat-error">0</h3>
            <p>Errores</p>
        </div>
    </div>
    
    <div class="controls">
        <button class="btn btn-clear" onclick="clearLogs()">🗑️ Limpiar Vista</button>
        <button class="btn btn-export" onclick="exportLogs()">💾 Exportar Logs</button>
    </div>
    
    <div class="log-container" id="logs"></div>
    
    <script>
        const stats = { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 };
        
        window.electronAPI.onNewLog((data) => {
            addLog(data);
        });
        
        function addLog(data) {
            const container = document.getElementById('logs');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + data.level;
            entry.innerHTML = \`
                <span class="log-timestamp">\${data.timestamp}</span>
                <span class="log-icon">\${data.icon}</span>
                <span class="log-message">\${escapeHtml(data.message)}</span>
            \`;
            container.appendChild(entry);
            container.scrollTop = container.scrollHeight;
            
            stats[data.level]++;
            updateStats();
            
            while (container.children.length > 500) {
                container.removeChild(container.firstChild);
            }
        }
        
        function updateStats() {
            document.getElementById('stat-info').textContent = stats.INFO;
            document.getElementById('stat-success').textContent = stats.SUCCESS;
            document.getElementById('stat-warning').textContent = stats.WARNING;
            document.getElementById('stat-error').textContent = stats.ERROR;
        }
        
        function clearLogs() {
            document.getElementById('logs').innerHTML = '';
            Object.keys(stats).forEach(key => stats[key] = 0);
            updateStats();
        }
        
        function exportLogs() {
            const logs = Array.from(document.querySelectorAll('.log-entry')).map(entry => entry.textContent);
            const blob = new Blob([logs.join('\\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logs-' + new Date().toISOString().replace(/:/g, '-') + '.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
        `;

        logWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(logsHTML));
        
        logWindow.on('closed', () => {
            logWindow = null;
        });

        this.log('Ventana de logs abierta', 'INFO');
    }

    // ================================================================
    // INICIALIZACIÓN
    // ================================================================

    async init() {
        try {
            // Crear icono de bandeja
            let trayIcon;
            try {
                trayIcon = this.getTrayIcon();
            } catch (error) {
                console.log('⚠️ Error cargando icono, usando icono por defecto');
                trayIcon = nativeImage.createEmpty();
            }
            
            this.tray = new Tray(trayIcon);
            this.tray.setToolTip('Sistema Etiquetas v2.5');
            this.tray.setContextMenu(this.createMenu());

            // Mensaje de inicio PRIMERO
            this.log('Sistema Etiquetas iniciado', 'SUCCESS');
            this.showNotification('Sistema Etiquetas', 
                'Aplicación iniciada correctamente');

            // Verificar si hay un servidor corriendo
            await this.updateStatus();
            
            if (this.serverActive) {
                console.log('✅ Servidor ya está corriendo');
                this.log('Servidor detectado corriendo', 'INFO');
            } else {
                // Auto-iniciar servidor si está configurado Y no está corriendo
                if (this.config.auto_start_server) {
                    console.log('🚀 Iniciando servidor automáticamente en segundo plano...');
                    this.log('Iniciando servidor automáticamente', 'INFO');
                    // NO usar await - dejar que inicie en segundo plano
                    this.startServer().catch(err => {
                        console.error('Error en auto-start:', err);
                        this.log(`Error en auto-inicio: ${err.message}`, 'ERROR');
                    });
                }
            }

            // Iniciar watchdog
            this.startWatchdog();

            // Actualizar menú cada 10 segundos
            setInterval(() => {
                this.updateStatus();
            }, 10000);
        } catch (error) {
            console.error('❌ Error en init:', error);
            this.log(`Error en inicialización: ${error.message}`, 'ERROR');
            dialog.showErrorBox('Error', 
                `No se pudo iniciar la aplicación: ${error.message}`);
        }
    }
}

// ====================================================================
// INICIALIZACIÓN DE ELECTRON
// ====================================================================

app.whenReady().then(() => {
    const trayApp = new SistemaEtiquetasTray();
    trayApp.init();
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
});

app.on('before-quit', () => {
    console.log('👋 Cerrando aplicación...');
});
