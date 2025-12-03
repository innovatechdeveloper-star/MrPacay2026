# 📊 SISTEMA DE LOGGING PROFESIONAL

## 🎯 Objetivo
Sistema completo de logging que registra **cada paso** del flujo de datos entre PostgreSQL → Node.js → Impresora Zebra → Cliente, garantizando trazabilidad total y facilitando el debugging.

---

## 📁 Estructura de Archivos de Log

El sistema genera 6 archivos de log separados por categoría:

```
logs/
├── database.log       # Consultas SQL, conexiones, transacciones
├── printer.log        # Comunicación con impresora, ZPL, errores de impresión
├── server.log         # HTTP requests, WebSocket, eventos del servidor
├── errors.log         # Solo errores críticos (consolidado)
├── security.log       # Login, accesos denegados, bloqueos de IP
└── combined.log       # Todos los logs mezclados (archivo maestro)
```

### 🔄 Rotación Automática
- **Tamaño máximo:** 10 MB por archivo
- **Antigüedad:** Se eliminan logs mayores a 7 días
- **Formato de rotación:** `database-2025-10-16.log`

---

## 🔍 Categorías de Logs

### 1️⃣ DATABASE LOGS (`database.log`)
Registra toda la actividad con PostgreSQL:

```
[2025-10-16 14:30:45.123] [INFO ] [DB-QUERY] SELECT * FROM solicitudes_etiquetas WHERE estado='proceso'
[2025-10-16 14:30:45.156] [INFO ] [DB-RESULT] Query exitosa: 3 filas (33ms)
[2025-10-16 14:30:46.001] [ERROR] [DB-ERROR] Error en query: relation "tabla_no_existe" does not exist
```

**Eventos registrados:**
- `DB-CONNECT`: Conexión a PostgreSQL
- `DB-QUERY`: Consultas SQL ejecutadas
- `DB-RESULT`: Resultados de queries (filas, duración)
- `DB-ERROR`: Errores de SQL
- `DB-TRANSACTION`: BEGIN, COMMIT, ROLLBACK

### 2️⃣ PRINTER LOGS (`printer.log`)
Registra todo relacionado con la impresora Zebra:

```
[2025-10-16 14:31:00.234] [INFO ] [PRINT-ATTEMPT] Intentando imprimir: SOL-20251016-0001
  printer: 192.168.1.34:9100
[2025-10-16 14:31:00.456] [SUCCESS] [PRINTER-CONN] Conexión exitosa a impresora 192.168.1.34:9100
[2025-10-16 14:31:00.789] [INFO ] [PRINT-ZPL] Enviando ZPL a impresora: SOL-20251016-0001
  zplBytes: 2456
[2025-10-16 14:31:01.123] [SUCCESS] [PRINT-SUCCESS] Impresión exitosa: SOL-20251016-0001 (867ms)
```

**Eventos registrados:**
- `PRINT-ATTEMPT`: Inicio de intento de impresión
- `PRINTER-CONN`: Estado de conexión TCP
- `PRINT-ZPL`: Envío de código ZPL
- `PRINT-SUCCESS`: Impresión completada
- `PRINT-ERROR`: Errores de impresión
- `PRINT-QUEUE`: Cambios en cola de impresión

### 3️⃣ SERVER LOGS (`server.log`)
Registra actividad HTTP y del servidor:

```
[2025-10-16 14:32:10.456] [DEBUG] [HTTP-REQUEST] POST /api/solicitar-etiqueta
  ip: 192.168.1.100
[2025-10-16 14:32:10.567] [DEBUG] [HTTP-RESPONSE] POST /api/solicitar-etiqueta → 200 (111ms)
[2025-10-16 14:32:15.789] [INFO ] [WEBSOCKET] Client connected
[2025-10-16 14:32:20.123] [INFO ] [USER-SESSION] LOGIN: Maria Rodriguez
```

**Eventos registrados:**
- `HTTP-REQUEST`: Peticiones HTTP entrantes
- `HTTP-RESPONSE`: Respuestas HTTP (código, duración)
- `WEBSOCKET`: Eventos de WebSocket
- `USER-SESSION`: Login, logout, cambios de sesión
- `SERVER-START`: Inicio del servidor

### 4️⃣ SECURITY LOGS (`security.log`)
Registra eventos de seguridad:

```
[2025-10-16 14:33:00.123] [INFO ] [LOGIN] Login exitoso: maria@alsimtex.com
  ip: 192.168.1.100
[2025-10-16 14:33:30.456] [WARN ] [LOGIN] Login fallido: hacker@test.com
  ip: 45.123.456.789
[2025-10-16 14:34:00.789] [WARN ] [IP-BLOCKED] IP bloqueada: 45.123.456.789
  reason: Intentos de login excesivos
```

**Eventos registrados:**
- `LOGIN`: Intentos de autenticación
- `SESSION`: Creación/cierre de sesiones
- `ACCESS-DENIED`: Accesos denegados
- `IP-BLOCKED`: Bloqueos de IP

### 5️⃣ ERROR LOGS (`errors.log`)
Consolidado de TODOS los errores del sistema:

```
[2025-10-16 14:35:00.123] [ERROR] [DB-ERROR] Error en query: syntax error at or near "SELEC"
  query: SELEC * FROM usuarios
  stack: Error: syntax error...
[2025-10-16 14:35:30.456] [ERROR] [PRINT-ERROR] Error al imprimir: SOL-20251016-0002
  error: ETIMEDOUT
  stack: Error: connect ETIMEDOUT...
```

### 6️⃣ COMBINED LOG (`combined.log`)
Archivo maestro con TODOS los logs en orden cronológico.

---

## 🛠️ Herramientas de Monitoreo

### 1. Script por Consola: `ver-logs.bat`

```batch
.\ver-logs.bat
```

**Opciones:**
1. DATABASE - Logs de PostgreSQL
2. PRINTER - Logs de impresora
3. SERVER - Logs del servidor
4. ERRORS - Solo errores
5. SECURITY - Seguridad
6. COMBINED - Todos mezclados
7. TODOS - Abre 4 ventanas paralelas

### 2. Monitor Web: `http://localhost:3010/monitor-sistema.html`

**Características:**
- ✅ Dashboard de salud del sistema en tiempo real
- ✅ Estado de PostgreSQL (conexión, latencia)
- ✅ Estado de impresora Zebra (conectada/desconectada)
- ✅ Cola de impresión (trabajos pendientes)
- ✅ Visualización de logs con colores
- ✅ Auto-actualización cada 5 segundos
- ✅ Filtrado por categoría
- ✅ Botones de rotación y limpieza

**Acceso:**
1. Abrir navegador
2. Ir a: `http://localhost:3010/monitor-sistema.html`
3. Requiere login (token JWT)

---

## 📡 API Endpoints de Logs

### GET `/api/logs/:tipo`
Obtener últimas N líneas de un log.

**Parámetros:**
- `:tipo`: `database`, `printer`, `server`, `errors`, `security`, `combined`
- `?lines=100`: Número de líneas (default: 100)

**Ejemplo:**
```javascript
GET /api/logs/printer?lines=50

Response:
{
  "tipo": "printer",
  "total_lines": 1234,
  "returned_lines": 50,
  "logs": [
    "[2025-10-16 14:30:00.123] [INFO] [PRINT-ATTEMPT] ...",
    ...
  ]
}
```

### GET `/api/logs/stats/all`
Obtener estadísticas de todos los logs.

**Response:**
```json
{
  "success": true,
  "stats": {
    "database": {
      "size": "1.23 MB",
      "lines": 5432,
      "modified": "2025-10-16T14:30:00.000Z"
    },
    "printer": { ... },
    "server": { ... }
  },
  "server_uptime": 3600,
  "memory_mb": 128
}
```

### POST `/api/logs/rotate`
Rotar logs manualmente (archivos >10MB se renombran).

### POST `/api/logs/clean`
Limpiar logs antiguos (>7 días).

### GET `/api/system/health`
Estado completo del sistema.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "uptime_seconds": 3600,
  "server": {
    "healthy": true,
    "session_id": "1729098000000_abc123",
    "memory_mb": 128,
    "last_heartbeat": "2025-10-16T14:29:55.000Z"
  },
  "database": {
    "healthy": true,
    "latency_ms": 15,
    "host": "localhost",
    "database": "postgres"
  },
  "printer": {
    "connected": true,
    "ip": "192.168.1.34",
    "port": 9100,
    "model": "ZD230"
  },
  "queue": {
    "print_queue_length": 0,
    "solicitudes_pendientes": 5,
    "solicitudes_proceso": 2
  }
}
```

---

## 🔧 Uso del Logger en Código

### Importar el Logger

```javascript
const logger = require('./logger');
```

### Funciones Disponibles

#### Database
```javascript
logger.dbQuery('SELECT * FROM usuarios', { id: 123 });
logger.dbResult('SELECT', 10, 45); // 10 filas, 45ms
logger.dbError('INSERT INTO...', error);
logger.dbConnect('success', { host: 'localhost' });
logger.dbTransaction('BEGIN', { isolation: 'READ COMMITTED' });
```

#### Printer
```javascript
logger.printAttempt('SOL-20251016-0001', '192.168.1.34:9100');
logger.printerConnection('192.168.1.34', 9100, 'success');
logger.printZPL('SOL-0001', 2456, '192.168.1.34');
logger.printSuccess('SOL-0001', 867);
logger.printError('SOL-0001', error);
logger.printQueue('ADDED', 5, { solicitud: 'SOL-0001' });
```

#### Server
```javascript
logger.serverStart(3010, '192.168.1.50');
logger.httpRequest('POST', '/api/login', '192.168.1.100', 'maria');
logger.httpResponse('POST', '/api/login', 200, 111);
logger.websocket('CLIENT_CONNECTED', { ip: '192.168.1.100' });
logger.userSession('LOGIN', 'Maria Rodriguez', { role: 'costurera' });
```

#### Security
```javascript
logger.loginAttempt('maria@alsimtex.com', '192.168.1.100', true);
logger.ipBlocked('45.123.456.789', 'Intentos excesivos');
logger.accessDenied('maria', '/api/admin', 'Permisos insuficientes');
```

#### Generic
```javascript
logger.error('CUSTOM', 'Error en proceso X', error);
logger.warn('CUSTOM', 'Advertencia en proceso Y', { detail: 'abc' });
logger.info('CUSTOM', 'Información del proceso Z');
logger.debug('CUSTOM', 'Debug info', { data: {...} });
logger.success('CUSTOM', 'Proceso completado exitosamente');
```

---

## 🎨 Niveles de Log y Colores

| Nivel   | Color  | Uso                                    |
|---------|--------|----------------------------------------|
| DEBUG   | Gris   | Información detallada para debugging   |
| INFO    | Cyan   | Eventos normales del sistema           |
| SUCCESS | Verde  | Operaciones completadas exitosamente   |
| WARN    | Amarillo | Advertencias (no bloquean operación)  |
| ERROR   | Rojo   | Errores que requieren atención         |

---

## 📊 Ejemplo de Flujo Completo

### Solicitud de Etiqueta: PostgreSQL → Node.js → Impresora

```
[14:30:00.100] [INFO ] [HTTP-REQUEST] POST /api/solicitar-etiqueta | ip: 192.168.1.100
[14:30:00.150] [DEBUG] [DB-QUERY] INSERT INTO solicitudes_etiquetas ...
[14:30:00.180] [INFO ] [DB-RESULT] Query exitosa: 1 filas (30ms)
[14:30:00.200] [INFO ] [PRINT-QUEUE] Cola de impresión ADDED: 1 elementos
[14:30:00.250] [INFO ] [PRINT-ATTEMPT] Intentando imprimir: SOL-20251016-0001
[14:30:00.280] [SUCCESS] [PRINTER-CONN] Conexión exitosa a 192.168.1.34:9100
[14:30:00.300] [INFO ] [PRINT-ZPL] Enviando ZPL: SOL-20251016-0001 (2456 bytes)
[14:30:00.350] [DEBUG] [PRINTER-TCP] Socket TCP conectado
[14:30:00.400] [DEBUG] [PRINTER-TCP] ZPL escrito en socket
[14:30:01.200] [SUCCESS] [PRINTER-TCP] Socket cerrado - Impresión completada
[14:30:01.250] [SUCCESS] [PRINT-SUCCESS] Impresión exitosa: SOL-20251016-0001 (950ms)
[14:30:01.300] [INFO ] [DB-TRANSACTION] UPDATE solicitud → completada
[14:30:01.320] [INFO ] [DB-RESULT] Query exitosa: 1 filas (20ms)
[14:30:01.350] [SUCCESS] [SOLICITUD-UPDATE] Solicitud SOL-20251016-0001 → COMPLETADA
[14:30:01.400] [INFO ] [PRINT-QUEUE] Cola de impresión REMOVED: 0 elementos
[14:30:01.450] [DEBUG] [HTTP-RESPONSE] POST /api/solicitar-etiqueta → 200 (1350ms)
```

**Trazabilidad Total:** Cada paso queda registrado con timestamp preciso.

---

## 🚨 Debugging con Logs

### Problema: "Nada se imprime, se queda en proceso"

**Paso 1:** Ver logs de impresora
```batch
.\ver-logs.bat
# Seleccionar opción [2] PRINTER
```

**Buscar en logs:**
- ❌ `[ERROR] [PRINTER-CONN]` → Impresora desconectada
- ❌ `[ERROR] [PRINT-ERROR]` → Error al enviar ZPL
- ✅ `[SUCCESS] [PRINT-SUCCESS]` → Impresión OK

**Paso 2:** Ver logs de database
```batch
.\ver-logs.bat
# Seleccionar opción [1] DATABASE
```

**Buscar:**
- ❌ `[ERROR] [DB-ERROR]` → Error en query
- ✅ `UPDATE solicitudes_etiquetas SET estado='completada'` → Estado actualizado

**Paso 3:** Verificar cola de impresión
```sql
SELECT * FROM cola_impresion WHERE estado='pendiente';
```

---

## 🎯 Mantenimiento

### Rotación Manual
```batch
# Desde línea de comandos
curl -X POST http://localhost:3010/api/logs/rotate
```

### Limpieza Manual
```batch
curl -X POST http://localhost:3010/api/logs/clean
```

### Ver Tamaño de Logs
```bash
dir logs
```

### Eliminar Todos los Logs (CUIDADO!)
```batch
del logs\*.log
```

---

## 📋 Checklist de Integración

- [✅] Logger importado en server.js
- [✅] Logging en addToPrintQueue()
- [✅] Logging en processPrintQueue()
- [✅] Logging en sendZPLToPrinter()
- [✅] Logging en pool.query() (database)
- [✅] Logging en endpoints HTTP
- [✅] Logging en login/autenticación
- [✅] Middleware HTTP logging
- [✅] Logging en errores globales
- [✅] API endpoints de logs
- [✅] Monitor web (monitor-sistema.html)
- [✅] Script de consola (ver-logs.bat)
- [✅] Rotación automática (10MB)
- [✅] Limpieza automática (7 días)

---

## 🎓 Mejores Prácticas

1. **Siempre loguear:**
   - Inicio y fin de funciones críticas
   - Queries a base de datos
   - Comunicación con impresora
   - Errores (con stack trace)
   - Cambios de estado

2. **No loguear:**
   - Passwords o datos sensibles
   - Datos personales (GDPR)
   - Tokens JWT completos

3. **Niveles apropiados:**
   - `DEBUG`: Solo en desarrollo
   - `INFO`: Eventos normales
   - `SUCCESS`: Operaciones completadas
   - `WARN`: Problemas no críticos
   - `ERROR`: Problemas que requieren acción

4. **Incluir contexto:**
   ```javascript
   // ❌ Mal
   logger.error('ERROR', 'Error', error);
   
   // ✅ Bien
   logger.error('PRINT-QUEUE', `Error procesando solicitud ${numero}`, error);
   ```

---

## 🔐 Seguridad

- ✅ Logs protegidos con autenticación JWT
- ✅ No se exponen passwords
- ✅ Rotación automática previene logs gigantes
- ✅ Limpieza automática cumple con retención de datos
- ✅ Logs de seguridad separados para auditorías

---

## 📞 Soporte

Si encuentras errores en el sistema de logging:

1. Verificar que existe directorio `logs/`
2. Verificar permisos de escritura
3. Ver console.log para errores del logger
4. Revisar `errors.log` para fallos internos

---

**Última actualización:** 16 de octubre de 2025  
**Versión:** 1.0.0  
**Autor:** Sistema de Etiquetas QR Alsimtex
