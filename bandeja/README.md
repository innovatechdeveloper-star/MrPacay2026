# 🏷️ Sistema Etiquetas v2.5 - Aplicación de Bandeja

## 📋 Descripción

Aplicación Electron que gestiona el servidor del Sistema Etiquetas desde la **bandeja del sistema de Windows** (system tray). Permite iniciar, detener y monitorear el servidor sin ventanas CMD visibles.

---

## ✨ Características

- 🎯 **Icono en bandeja del sistema** - Control completo desde el menú contextual
- 🚀 **Inicio/Detención de servidor** - Sin ventanas CMD molestas
- 🔄 **Watchdog automático** - Reinicia el servidor si deja de responder
- 📊 **Logs en tiempo real** - Ventana visual con estadísticas
- 🔔 **Notificaciones Windows** - Alertas de eventos importantes
- ⚙️ **Inicio con Windows** - Configuración persistente
- 🖨️ **Monitoreo de impresoras** - Estado de Zebra y Godex

---

## 📦 Instalación

### Requisitos Previos

1. **Node.js** instalado (versión 14 o superior)
   - Descargar: https://nodejs.org/
   - Verificar: `node --version`

2. **PostgreSQL** instalado y corriendo (puerto 5432)

3. **Sistema Etiquetas** configurado en `system.config`

### Pasos de Instalación

1. **Instalar dependencias:**
   ```cmd
   INSTALAR-BANDEJA.bat
   ```
   Esto instalará:
   - Electron v27.0.0 (~200 MB)
   - electron-builder (~50 MB)
   - node-notifier (~5 MB)
   
   ⏱️ Tiempo estimado: 3-10 minutos

2. **Ejecutar aplicación:**
   ```cmd
   EJECUTAR-SISTEMA-ETIQUETAS.bat
   ```

3. **Buscar icono en bandeja:**
   - Mira la barra de tareas (junto al reloj)
   - Verás el icono 🏷️ de Sistema Etiquetas

---

## 🚀 Uso

### Primera Ejecución

1. Ejecuta `EJECUTAR-SISTEMA-ETIQUETAS.bat`
2. Aparecerá el icono en la bandeja del sistema
3. **Clic derecho** en el icono para ver el menú

### Menú Principal

```
🏷️ Sistema Etiquetas
├─ 🚀 Iniciar Servidor
├─ 🛑 Detener Servidor
├─ 🔄 Reiniciar Servidor
├─ ─────────────────────
├─ 📊 Estado
│  ├─ ✅/❌ Servidor (Puerto 3012)
│  ├─ 🖨️ Zebra ZD230
│  └─ 🖨️ Godex G500
├─ ─────────────────────
├─ 🌐 Abrir Sistema
├─ 📂 Abrir Ubicación
├─ ─────────────────────
├─ 📝 Ver Logs
│  ├─ 🖥️ Logs en Tiempo Real
│  ├─ 📂 Abrir Carpeta de Logs
│  ├─ 📄 App.log
│  ├─ 📄 Servidor.log
│  └─ 🗑️ Limpiar Logs
├─ ─────────────────────
├─ ⚙️ Configuración
│  ├─ ☐ Iniciar con Windows
│  ├─ ☐ Iniciar servidor automáticamente
│  ├─ ☑ Mantener servidor activo (Watchdog)
│  └─ ☑ Notificaciones
├─ ─────────────────────
├─ ℹ️ Acerca de
└─ ❌ Salir
```

---

## ⚙️ Configuración

### Archivo `config.json`

Ubicación: `bandeja/config.json`

```json
{
  "auto_start": false,              // ¿Iniciar con Windows?
  "auto_start_server": false,       // ¿Iniciar servidor automáticamente?
  "auto_restart": true,             // ¿Watchdog activo?
  "notifications": true,            // ¿Mostrar notificaciones?
  "server_port": 3012,              // Puerto del servidor
  "watchdog_interval": 30,          // Segundos entre verificaciones
  "printers": {
    "zebra": {
      "ip": "192.168.1.34",
      "port": 9100
    },
    "godex": {
      "ip": "192.168.1.35",
      "port": 9100
    }
  }
}
```

### Configurar Inicio con Windows

**Opción 1: Desde el menú (RECOMENDADO)**
1. Clic derecho en icono de bandeja
2. `⚙️ Configuración`
3. Marcar `☑ Iniciar con Windows`
4. Marcar `☑ Iniciar servidor automáticamente`
5. ✅ Listo - Al siguiente reinicio todo se iniciará solo

**Opción 2: Programador de Tareas de Windows**
1. Presiona `Win + R`
2. Escribe `taskschd.msc` y Enter
3. Clic en "Crear tarea básica"
4. Nombre: `Sistema Etiquetas - Bandeja`
5. Desencadenador: `Al iniciar sesión`
6. Acción: `Iniciar un programa`
7. Programa: Ruta completa a `EJECUTAR-SISTEMA-ETIQUETAS.bat`
   ```
   d:\Informacion\DESARROLLO\Sistema-EtiquetasV2.5\mi-app-etiquetas\EJECUTAR-SISTEMA-ETIQUETAS.bat
   ```
8. ✅ Finalizar

---

## 🐕 Watchdog Automático

### ¿Qué hace?

El watchdog verifica cada 30 segundos si el servidor está respondiendo:

```
Cada 30 segundos:
├─ Verifica puerto 3012
├─ HTTP GET http://localhost:3012/health
└─ Si no responde:
   ├─ PASO 1: Envía ping (stdin.write('\n'))
   ├─ PASO 2: Espera 2 segundos
   └─ PASO 3: Si sigue sin responder → Reinicia servidor
```

### Endpoint /health

El servidor ahora tiene un endpoint de health check:

**Request:**
```http
GET http://localhost:3012/health
```

**Response (OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-11-05T14:30:00.000Z",
  "uptime": 3600,
  "puerto": 3012,
  "database": "connected",
  "printers": {
    "zebra": "192.168.1.34:9100",
    "godex": "192.168.1.35:9100"
  }
}
```

### Activar/Desactivar Watchdog

En el menú:
- `⚙️ Configuración` → `☑ Mantener servidor activo (Watchdog)`

---

## 📝 Sistema de Logs

### Archivos de Log

Ubicación: `bandeja/logs/`

| Archivo | Contenido |
|---------|-----------|
| `app.log` | Eventos de la aplicación Electron |
| `servidor.log` | Salida estándar (stdout) de server.js |
| `servidor-error.log` | Errores (stderr) de server.js |

### Ventana de Logs en Tiempo Real

1. Clic derecho en icono
2. `📝 Ver Logs` → `🖥️ Logs en Tiempo Real`
3. Se abre ventana con:
   - **Estadísticas:** Info, Éxitos, Advertencias, Errores
   - **Logs en vivo** con colores por nivel
   - **Auto-scroll** al final
   - **Límite de 500 entradas** (las más recientes)

### Limpiar Logs

En el menú: `📝 Ver Logs` → `🗑️ Limpiar Logs`

---

## 🔧 Compilar a Ejecutable

### Generar instalador .exe

```cmd
cd bandeja
npm run build:win
```

**Genera:**
```
bandeja/dist/
├── Sistema Etiquetas Setup 2.5.0.exe    ← Instalador (50-100 MB)
└── win-unpacked/
    └── Sistema Etiquetas.exe            ← Ejecutable standalone
```

**Instalador incluye:**
- ✅ Icono en escritorio
- ✅ Acceso en menú inicio
- ✅ Desinstalador
- ✅ Auto-actualización (futuro)

---

## 🚨 Solución de Problemas

### ❌ Error: "Node.js no está instalado"

**Solución:**
1. Descargar Node.js: https://nodejs.org/
2. Instalar con opción "Add to PATH" marcada
3. Reiniciar terminal/CMD
4. Verificar: `node --version`

---

### ❌ Error: "Puerto 3012 ocupado"

**Síntoma:** No puede iniciar el servidor

**Solución 1 (Desde la app):**
1. Clic derecho → `🛑 Detener Servidor`
2. Esperar 3 segundos
3. Clic derecho → `🚀 Iniciar Servidor`

**Solución 2 (Manual):**
```cmd
# Encontrar proceso
netstat -ano | findstr :3012

# Matar proceso (reemplaza PID)
taskkill /F /PID <numero_pid>
```

---

### ❌ Servidor se reinicia constantemente

**Síntoma:** Notificaciones de "Servidor Reiniciado" cada 30-60 segundos

**Causa:** Endpoint `/health` no responde correctamente

**Solución:**
1. Verificar que server.js tenga el endpoint `/health`
2. Verificar PostgreSQL está corriendo
3. Revisar logs: `📝 Ver Logs` → `📄 Servidor-error.log`
4. Como último recurso: Desactivar watchdog temporalmente

---

### ❌ Icono no aparece en la bandeja

**Causa 1:** Windows ocultó el icono

**Solución:**
1. `Configuración Windows` → `Personalización`
2. `Barra de tareas`
3. `Seleccionar los iconos que aparecen en la barra de tareas`
4. Activar "Sistema Etiquetas"

**Causa 2:** Aplicación no inició correctamente

**Solución:**
1. Cerrar desde Administrador de Tareas
2. Ejecutar `EJECUTAR-SISTEMA-ETIQUETAS.bat` de nuevo
3. Revisar `bandeja/logs/app.log`

---

### ❌ Logs no se guardan

**Solución:**
1. Verificar permisos de escritura en `bandeja/logs/`
2. Ejecutar CMD como Administrador
3. Limpiar logs antiguos: `📝 Ver Logs` → `🗑️ Limpiar Logs`

---

## 📂 Estructura de Archivos

```
mi-app-etiquetas/
├── bandeja/                              ← Aplicación de bandeja
│   ├── main.js                          ← Lógica principal (1025 líneas)
│   ├── preload.js                       ← Puente IPC seguro
│   ├── package.json                     ← Dependencias Electron
│   ├── config.json                      ← Configuración persistente
│   ├── icon.ico                         ← Icono de la bandeja
│   ├── logs/                            ← Logs generados
│   │   ├── app.log
│   │   ├── servidor.log
│   │   └── servidor-error.log
│   └── node_modules/                    ← Dependencias instaladas
│
├── EJECUTAR-SISTEMA-ETIQUETAS.bat       ← Script principal de ejecución
├── INSTALAR-BANDEJA.bat                 ← Instalador de dependencias
│
└── server.js                            ← Servidor Node.js (modificado con /health)
```

---

## 🎯 Flujo de Usuario Ideal

### Configuración Inicial (Solo una vez)

```
1. Ejecutar INSTALAR-BANDEJA.bat
   ↓ (3-10 minutos instalando)
2. Ejecutar EJECUTAR-SISTEMA-ETIQUETAS.bat
   ↓
3. Aparece icono 🏷️ en bandeja
   ↓
4. Clic derecho → ⚙️ Configuración
   ↓
5. Marcar:
   ☑ Iniciar con Windows
   ☑ Iniciar servidor automáticamente
   ☑ Mantener servidor activo
   ↓
6. Clic derecho → 🚀 Iniciar Servidor
   ↓
7. ✅ Sistema operativo
```

### Uso Diario (Automático)

```
1. Encender PC
   ↓
2. Windows inicia sesión
   ↓
3. Aplicación de bandeja se ejecuta automáticamente
   ↓
4. Servidor inicia automáticamente (puerto 3012)
   ↓
5. Watchdog comienza a monitorear
   ↓
6. ✅ Sistema 100% operativo sin intervención manual
```

---

## 🔐 Seguridad

- ✅ **Procesos ocultos** - Sin ventanas CMD visibles
- ✅ **Context Isolation** - Renderer aislado del main process
- ✅ **No Node Integration** - HTML sin acceso directo a Node.js
- ✅ **Preload seguro** - Solo APIs específicas expuestas

---

## 📊 Recursos del Sistema

### Uso de Memoria

| Componente | Memoria |
|------------|---------|
| Electron (main process) | ~80-120 MB |
| Renderer (ventana logs) | ~50-80 MB |
| Server.js (Node.js) | ~100-200 MB |
| **Total** | **~230-400 MB** |

### Espacio en Disco

| Componente | Tamaño |
|------------|--------|
| node_modules/ | ~255 MB |
| Ejecutable compilado | ~150 MB |
| Logs (acumulados) | ~1-10 MB |

---

## 🆘 Soporte

### Logs de Diagnóstico

Si tienes problemas, envía estos logs:
1. `bandeja/logs/app.log`
2. `bandeja/logs/servidor-error.log`
3. Captura de pantalla del menú de bandeja

### Información del Sistema

Ejecutar en CMD:
```cmd
node --version
npm --version
electron --version  (desde carpeta bandeja)
```

---

## 📚 Referencias

- **Electron:** https://www.electronjs.org/
- **Node.js:** https://nodejs.org/
- **Sistema Etiquetas:** Ver `SISTEMA-ETIQUETAS-V2.5-DOCUMENTACION-COMPLETA.md`

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado (v14+)
- [ ] PostgreSQL corriendo (puerto 5432)
- [ ] Ejecutado `INSTALAR-BANDEJA.bat`
- [ ] Ejecutado `EJECUTAR-SISTEMA-ETIQUETAS.bat`
- [ ] Icono aparece en bandeja del sistema
- [ ] Servidor inicia correctamente (puerto 3012)
- [ ] Endpoint /health responde: http://localhost:3012/health
- [ ] Configurado inicio con Windows (opcional)
- [ ] Watchdog funcionando (verificar después de 30s)

---

## 📄 Licencia

MIT License - Sistema Etiquetas v2.5

---

**Versión:** 2.5.0  
**Fecha:** 5 de Noviembre de 2025  
**Autor:** Sistema Etiquetas  
