/**
 * SISTEMA DE LOGGING PROFESIONAL
 * Registra cada paso del flujo: PostgreSQL → Node.js → Impresora → Cliente
 * Autor: Sistema de Etiquetas QR
 * Fecha: 2025-10-16
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.createLogsDirectory();
        
        // Archivos de log separados por categoría
        this.files = {
            database: path.join(this.logsDir, 'database.log'),
            printer: path.join(this.logsDir, 'printer.log'),
            server: path.join(this.logsDir, 'server.log'),
            errors: path.join(this.logsDir, 'errors.log'),
            security: path.join(this.logsDir, 'security.log'),
            combined: path.join(this.logsDir, 'combined.log')
        };
        
        // Limpiar logs antiguos al iniciar (mantener últimos 7 días)
        this.cleanOldLogs();
    }
    
    createLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
            console.log(`✅ Directorio de logs creado: ${this.logsDir}`);
        }
    }
    
    /**
     * Formato de timestamp legible
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 23);
    }
    
    /**
     * Escribe en archivo de log
     */
    writeToFile(filename, level, category, message, data = null) {
        const timestamp = this.getTimestamp();
        let logLine = `[${timestamp}] [${level.padEnd(5)}] [${category}] ${message}`;
        
        if (data) {
            // Si es un objeto, convertirlo a JSON legible
            if (typeof data === 'object') {
                logLine += '\n' + JSON.stringify(data, null, 2);
            } else {
                logLine += ` | Datos: ${data}`;
            }
        }
        
        logLine += '\n';
        
        // Escribir en archivo específico y en combined
        fs.appendFileSync(filename, logLine);
        fs.appendFileSync(this.files.combined, logLine);
        
        // También mostrar en consola con colores
        this.consoleLog(level, category, message, data);
    }
    
    /**
     * Log en consola con colores
     */
    consoleLog(level, category, message, data) {
        const colors = {
            INFO: '\x1b[36m',  // Cyan
            WARN: '\x1b[33m',  // Yellow
            ERROR: '\x1b[31m', // Red
            DEBUG: '\x1b[90m', // Gray
            SUCCESS: '\x1b[32m' // Green
        };
        const reset = '\x1b[0m';
        const color = colors[level] || reset;
        
        console.log(`${color}[${level}] [${category}]${reset} ${message}`);
        if (data && level !== 'DEBUG') {
            console.log(data);
        }
    }
    
    // ==================== DATABASE LOGS ====================
    
    /**
     * Log de consulta SQL ejecutada
     */
    dbQuery(query, params = null) {
        this.writeToFile(this.files.database, 'DEBUG', 'DB-QUERY', query, params);
    }
    
    /**
     * Log de resultado de consulta
     */
    dbResult(query, rowCount, duration = null) {
        const msg = `Query exitosa: ${rowCount} filas${duration ? ` (${duration}ms)` : ''}`;
        this.writeToFile(this.files.database, 'INFO', 'DB-RESULT', msg, { query: query.substring(0, 100) });
    }
    
    /**
     * Log de error en base de datos
     */
    dbError(query, error) {
        const msg = `Error en query: ${error.message}`;
        this.writeToFile(this.files.database, 'ERROR', 'DB-ERROR', msg, {
            query,
            error: error.message,
            stack: error.stack
        });
        this.writeToFile(this.files.errors, 'ERROR', 'DB-ERROR', msg, { query, error: error.message });
    }
    
    /**
     * Log de conexión a base de datos
     */
    dbConnect(status, details = null) {
        const level = status === 'success' ? 'SUCCESS' : 'ERROR';
        const msg = status === 'success' ? 'Conectado a PostgreSQL' : 'Error al conectar a PostgreSQL';
        this.writeToFile(this.files.database, level, 'DB-CONNECT', msg, details);
    }
    
    /**
     * Log de transacción
     */
    dbTransaction(action, details = null) {
        this.writeToFile(this.files.database, 'INFO', 'DB-TRANSACTION', action, details);
    }
    
    // ==================== PRINTER LOGS ====================
    
    /**
     * Log de intento de impresión
     */
    printAttempt(solicitud, printerIP) {
        const msg = `Intentando imprimir: ${solicitud}`;
        this.writeToFile(this.files.printer, 'INFO', 'PRINT-ATTEMPT', msg, { 
            solicitud, 
            printer: printerIP,
            timestamp: this.getTimestamp()
        });
    }
    
    /**
     * Log de conexión a impresora
     */
    printerConnection(ip, port, status, error = null) {
        const level = status === 'success' ? 'SUCCESS' : 'ERROR';
        const msg = status === 'success' 
            ? `Conexión exitosa a impresora ${ip}:${port}` 
            : `Error al conectar a impresora ${ip}:${port}`;
        
        this.writeToFile(this.files.printer, level, 'PRINTER-CONN', msg, error ? { error: error.message } : null);
    }
    
    /**
     * Log de envío de ZPL
     */
    printZPL(solicitud, zplLength, printerIP) {
        const msg = `Enviando ZPL a impresora: ${solicitud}`;
        this.writeToFile(this.files.printer, 'INFO', 'PRINT-ZPL', msg, {
            solicitud,
            printer: printerIP,
            zplBytes: zplLength,
            timestamp: this.getTimestamp()
        });
    }
    
    /**
     * Log de impresión exitosa
     */
    printSuccess(solicitud, duration = null) {
        const msg = `Impresión exitosa: ${solicitud}${duration ? ` (${duration}ms)` : ''}`;
        this.writeToFile(this.files.printer, 'SUCCESS', 'PRINT-SUCCESS', msg);
    }
    
    /**
     * Log de error de impresión
     */
    printError(solicitud, error) {
        const msg = `Error al imprimir: ${solicitud}`;
        this.writeToFile(this.files.printer, 'ERROR', 'PRINT-ERROR', msg, {
            solicitud,
            error: error.message,
            stack: error.stack
        });
        this.writeToFile(this.files.errors, 'ERROR', 'PRINT-ERROR', msg, { solicitud, error: error.message });
    }
    
    /**
     * Log de cola de impresión
     */
    printQueue(action, queueSize, details = null) {
        const msg = `Cola de impresión ${action}: ${queueSize} elementos`;
        this.writeToFile(this.files.printer, 'INFO', 'PRINT-QUEUE', msg, details);
    }
    
    // ==================== SERVER LOGS ====================
    
    /**
     * Log de inicio del servidor
     */
    serverStart(port, ip = null) {
        const msg = `Servidor iniciado en puerto ${port}${ip ? ` (IP: ${ip})` : ''}`;
        this.writeToFile(this.files.server, 'SUCCESS', 'SERVER-START', msg);
    }
    
    /**
     * Log de petición HTTP
     */
    httpRequest(method, path, ip, user = null) {
        const msg = `${method} ${path}`;
        this.writeToFile(this.files.server, 'DEBUG', 'HTTP-REQUEST', msg, {
            method,
            path,
            ip,
            user,
            timestamp: this.getTimestamp()
        });
    }
    
    /**
     * Log de respuesta HTTP
     */
    httpResponse(method, path, statusCode, duration = null) {
        const level = statusCode >= 400 ? 'WARN' : 'DEBUG';
        const msg = `${method} ${path} → ${statusCode}${duration ? ` (${duration}ms)` : ''}`;
        this.writeToFile(this.files.server, level, 'HTTP-RESPONSE', msg);
    }
    
    /**
     * Log de WebSocket
     */
    websocket(action, data = null) {
        this.writeToFile(this.files.server, 'INFO', 'WEBSOCKET', action, data);
    }
    
    /**
     * Log de sesión de usuario
     */
    userSession(action, username, details = null) {
        this.writeToFile(this.files.server, 'INFO', 'USER-SESSION', `${action}: ${username}`, details);
        this.writeToFile(this.files.security, 'INFO', 'SESSION', `${action}: ${username}`, details);
    }
    
    // ==================== SECURITY LOGS ====================
    
    /**
     * Log de intento de login
     */
    loginAttempt(username, ip, success) {
        const level = success ? 'INFO' : 'WARN';
        const msg = success ? `Login exitoso: ${username}` : `Login fallido: ${username}`;
        this.writeToFile(this.files.security, level, 'LOGIN', msg, { ip, timestamp: this.getTimestamp() });
    }
    
    /**
     * Log de bloqueo de IP
     */
    ipBlocked(ip, reason) {
        this.writeToFile(this.files.security, 'WARN', 'IP-BLOCKED', `IP bloqueada: ${ip}`, { reason });
    }
    
    /**
     * Log de acceso denegado
     */
    accessDenied(username, resource, reason) {
        this.writeToFile(this.files.security, 'WARN', 'ACCESS-DENIED', `Acceso denegado a ${resource}`, {
            username,
            reason,
            timestamp: this.getTimestamp()
        });
    }
    
    // ==================== ERROR LOGS ====================
    
    /**
     * Log de error genérico
     */
    error(category, message, error) {
        this.writeToFile(this.files.errors, 'ERROR', category, message, {
            error: error.message,
            stack: error.stack,
            timestamp: this.getTimestamp()
        });
    }
    
    /**
     * Log de advertencia
     */
    warn(category, message, details = null) {
        this.writeToFile(this.files.server, 'WARN', category, message, details);
    }
    
    /**
     * Log informativo
     */
    info(category, message, details = null) {
        this.writeToFile(this.files.server, 'INFO', category, message, details);
    }
    
    /**
     * Log de debug
     */
    debug(category, message, details = null) {
        this.writeToFile(this.files.server, 'DEBUG', category, message, details);
    }
    
    /**
     * Log de éxito
     */
    success(category, message, details = null) {
        this.writeToFile(this.files.server, 'SUCCESS', category, message, details);
    }
    
    // ==================== MAINTENANCE ====================
    
    /**
     * Limpiar logs antiguos (mantener últimos 7 días)
     */
    cleanOldLogs() {
        try {
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
            
            if (!fs.existsSync(this.logsDir)) return;
            
            const files = fs.readdirSync(this.logsDir);
            files.forEach(file => {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Log antiguo eliminado: ${file}`);
                }
            });
        } catch (error) {
            console.error('Error al limpiar logs antiguos:', error.message);
        }
    }
    
    /**
     * Rotar logs cuando sean muy grandes (>10MB)
     */
    rotateLogs() {
        try {
            Object.entries(this.files).forEach(([name, filepath]) => {
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    const maxSize = 10 * 1024 * 1024; // 10MB
                    
                    if (stats.size > maxSize) {
                        const timestamp = new Date().toISOString().split('T')[0];
                        const newPath = filepath.replace('.log', `-${timestamp}.log`);
                        fs.renameSync(filepath, newPath);
                        console.log(`📦 Log rotado: ${name} → ${path.basename(newPath)}`);
                    }
                }
            });
        } catch (error) {
            console.error('Error al rotar logs:', error.message);
        }
    }
    
    /**
     * Obtener estadísticas de logs
     */
    getStats() {
        const stats = {};
        Object.entries(this.files).forEach(([name, filepath]) => {
            if (fs.existsSync(filepath)) {
                const fileStats = fs.statSync(filepath);
                const lines = fs.readFileSync(filepath, 'utf8').split('\n').length;
                stats[name] = {
                    size: (fileStats.size / 1024).toFixed(2) + ' KB',
                    lines,
                    modified: fileStats.mtime
                };
            }
        });
        return stats;
    }
}

// Exportar instancia única (Singleton)
const logger = new Logger();

module.exports = logger;
