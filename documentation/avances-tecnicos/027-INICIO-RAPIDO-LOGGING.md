# 🚀 INICIO RÁPIDO - Sistema de Logging

## ✅ Verificación Previa

```batch
cd mi-app-etiquetas
.\verificar-logging.bat
```

Debe mostrar todos los ✅ verdes.

---

## 🎯 3 Formas de Monitorear el Sistema

### 1️⃣ Dashboard Web (Recomendado)

**Paso 1:** Iniciar servidor
```batch
node server.js
```

**Paso 2:** Abrir navegador
```
http://localhost:3010/monitor-sistema.html
```

**Características:**
- ✅ Estado del sistema en tiempo real
- ✅ Logs con colores automáticos
- ✅ Auto-actualización cada 5 segundos
- ✅ 6 categorías de logs
- ✅ Gráficos de salud

---

### 2️⃣ Visor de Consola

**Paso 1:** Abrir nueva ventana de consola
```batch
cd mi-app-etiquetas
.\ver-logs.bat
```

**Paso 2:** Seleccionar categoría
```
[1] DATABASE   - PostgreSQL
[2] PRINTER    - Zebra
[3] SERVER     - HTTP
[4] ERRORS     - Solo errores
[5] SECURITY   - Login/seguridad
[6] COMBINED   - Todos
[7] TODOS      - 4 ventanas paralelas
```

**Recomendado para producción:** Opción [7] TODOS

---

### 3️⃣ Ver Logs Directamente

**PowerShell (tail -f):**
```powershell
Get-Content logs\printer.log -Wait -Tail 50
```

**Notepad++:**
```
Abrir: logs\combined.log
```

---

## 🔍 Debugging de Problemas Comunes

### ❌ "No se imprime nada"

**Paso 1:** Ver logs de impresora
```batch
.\ver-logs.bat
# Seleccionar [2] PRINTER
```

**Buscar:**
- `[ERROR] [PRINTER-CONN]` → Impresora desconectada
- `[ERROR] [PRINT-ERROR]` → Error al imprimir
- `[SUCCESS] [PRINT-SUCCESS]` → Impresión OK

**Paso 2:** Verificar estado
```
http://localhost:3010/monitor-sistema.html
```

Ver tarjeta "Impresora Zebra":
- 🟢 Conectada → Problema en otro lado
- 🔴 Desconectada → Verificar red/cable

---

### ❌ "Solicitudes se quedan en proceso"

**Paso 1:** Ver logs de database
```batch
.\ver-logs.bat
# Seleccionar [1] DATABASE
```

**Buscar:**
- `UPDATE solicitudes_etiquetas SET estado='completada'`
- Si NO aparece → Problema en código
- Si aparece → Estado se actualiza correctamente

**Paso 2:** Verificar BD directamente
```batch
.\verificacion-rapida.bat
```

---

### ❌ "Error de PostgreSQL"

**Ver logs:**
```batch
.\ver-logs.bat
# Seleccionar [1] DATABASE
```

**Buscar:**
- `[ERROR] [DB-ERROR]`
- Ver mensaje de error completo
- Ver query que falló

---

## 📊 Endpoints Útiles

### Estado del Sistema
```
GET http://localhost:3010/api/system/health
```

**Response:**
```json
{
  "status": "healthy",
  "server": { "healthy": true, "memory_mb": 128 },
  "database": { "healthy": true, "latency_ms": 15 },
  "printer": { "connected": true },
  "queue": { "print_queue_length": 0 }
}
```

### Ver Últimos 100 Logs de Impresora
```
GET http://localhost:3010/api/logs/printer?lines=100
```

### Estadísticas de Logs
```
GET http://localhost:3010/api/logs/stats/all
```

---

## 🛠️ Mantenimiento

### Rotar Logs Manualmente
```bash
curl -X POST http://localhost:3010/api/logs/rotate
```

O desde dashboard web: Botón "📦 Rotar Logs"

### Limpiar Logs Antiguos
```bash
curl -X POST http://localhost:3010/api/logs/clean
```

O desde dashboard web: Botón "🗑️ Limpiar Pantalla"

### Ver Tamaño de Logs
```batch
dir logs
```

---

## 📝 Flujo de Trabajo Recomendado

### Desarrollo Diario

**Terminal 1:**
```batch
node server.js
```

**Terminal 2:**
```batch
.\ver-logs.bat
# Seleccionar [7] TODOS
```

**Navegador:**
```
http://localhost:3010
```

### Debugging de Problema

1. Reproducir el problema
2. Abrir `http://localhost:3010/monitor-sistema.html`
3. Seleccionar categoría de log relevante
4. Buscar `[ERROR]` o `[WARN]`
5. Analizar timestamp y contexto
6. Corregir código
7. Reiniciar servidor
8. Verificar que logs muestran éxito

---

## 🎓 Niveles de Log

| Nivel | Color | Cuándo Aparece |
|-------|-------|----------------|
| DEBUG | Gris | Detalles técnicos (queries, ZPL) |
| INFO | Cyan | Operaciones normales |
| SUCCESS | Verde | Operaciones exitosas |
| WARN | Amarillo | Advertencias (no bloquean) |
| ERROR | Rojo | Errores que requieren acción |

---

## 📋 Checklist Pre-Producción

- [ ] Ejecutar `verificar-logging.bat` → Todo ✅
- [ ] Iniciar servidor → Sin errores
- [ ] Abrir monitor web → Todos los componentes 🟢
- [ ] Probar impresión → Ver logs en tiempo real
- [ ] Verificar logs en disco → Archivos creados
- [ ] Probar dashboard web → Auto-actualización funciona

---

## 🚨 En Caso de Emergencia

### Servidor no inicia

**Ver errores de inicio:**
```batch
node server.js
```

Buscar:
- `Cannot find module './logger'` → Falta logger.js
- `EACCES` → Permisos de carpeta logs/
- `EADDRINUSE` → Puerto 3010 ocupado

### Logs no se crean

**Verificar:**
1. Directorio logs/ existe
2. Permisos de escritura
3. logger.js importado en server.js

**Crear manualmente:**
```batch
mkdir logs
```

### Monitor web no carga

**Verificar:**
1. Servidor corriendo
2. URL correcta: `http://localhost:3010/monitor-sistema.html`
3. Token JWT válido (hacer login primero)

---

## 📞 Soporte Rápido

### Error: "Cannot find module './logger'"
```bash
# Verificar que existe logger.js
dir logger.js
```

### Error: "EACCES: permission denied, mkdir 'logs'"
```bash
# Crear manualmente con permisos
mkdir logs
icacls logs /grant Everyone:F
```

### Logs muy grandes
```bash
# Rotar manualmente
curl -X POST http://localhost:3010/api/logs/rotate

# Eliminar todos (CUIDADO!)
del logs\*.log
```

---

## ✅ Todo Funcionando Correctamente

**Deberías ver:**

### Terminal 1 (Servidor)
```
✅ Servidor iniciado con ID de sesión: 1729098000000_abc123
✅ Directorio de logs creado: D:\...\logs
🗄️  PostgreSQL: postgres@localhost:5432/postgres
🌐 Servidor puerto: 3010
🚀 Servidor HTTPS corriendo en puerto 3010
💓 Heartbeat - Servidor activo
```

### Terminal 2 (Logs)
```
[INFO ] [SERVER-START] Servidor iniciado en puerto 3010
[SUCCESS] [DB-CONNECT] Conectado a PostgreSQL
[INFO ] [HTTP-REQUEST] GET /
[DEBUG] [HTTP-RESPONSE] GET / → 200 (15ms)
```

### Dashboard Web
```
┌─────────────────────┐
│ 🟢 Estado General   │
│ Estado: HEALTHY     │
│ Uptime: 0h 2m       │
│ Memoria: 128 MB     │
└─────────────────────┘

┌─────────────────────┐
│ 🟢 PostgreSQL       │
│ Estado: Conectado   │
│ Latencia: 15ms      │
│ Host: localhost     │
└─────────────────────┘

┌─────────────────────┐
│ 🟢 Impresora Zebra  │
│ Estado: Conectada   │
│ Modelo: ZD230       │
│ IP: 192.168.1.34    │
└─────────────────────┘

┌─────────────────────┐
│ 🟢 Cola Impresión   │
│ En cola: 0          │
│ Pendientes: 0       │
│ En proceso: 0       │
└─────────────────────┘
```

---

## 🎉 ¡Listo!

**Sistema completamente operativo con logging profesional.**

**Ventajas:**
- ✅ Debugging en minutos (no horas)
- ✅ Monitoreo en tiempo real
- ✅ Trazabilidad completa
- ✅ Auditoría de seguridad
- ✅ No más errores silenciosos

**Próximos pasos:**
1. Trabajar normalmente
2. Logs se registran automáticamente
3. Ver monitor cuando haya problemas
4. Analizar logs para optimizar

---

**Última actualización:** 16 de octubre de 2025  
**Versión:** 1.0.0
