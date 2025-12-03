# 🔍 DIAGNÓSTICO: NO SE IMPRIME NADA

## 📋 PROBLEMA REPORTADO
Las solicitudes se quedan en estado "proceso" y no se imprimen en la impresora.

## 🔎 POSIBLES CAUSAS

### 1️⃣ **Tabla de base de datos no existe o está mal configurada**
**Síntoma**: El código intenta insertar en `solicitudes_etiquetas` pero la tabla no existe.

**Solución**:
```bash
# Ejecutar el script de migración
ejecutar-migracion.bat
```

### 2️⃣ **Conexión a la impresora fallando**
**Síntoma**: El código no puede conectar con la impresora Zebra.

**Verificar**:
- IP de la impresora: `192.168.1.34`
- Puerto: `9100`
- Red: Debe estar en la misma red

**Revisar logs del servidor** para ver mensajes como:
```
❌ [checkPrinterConnection] Error de conexión
```

### 3️⃣ **Cola de impresión bloqueada**
**Síntoma**: Hay trabajos pendientes en `cola_impresion` que no se procesan.

**Verificar**:
```bash
# Ver estado de la cola
verificar-bd.bat
```

**Solución manual**:
```sql
-- Resetear trabajos atascados
UPDATE cola_impresion SET estado = 'error' WHERE estado = 'pendiente' AND fecha_creacion < NOW() - INTERVAL 1 HOUR;

-- Limpiar cola
DELETE FROM cola_impresion WHERE estado = 'error';
```

### 4️⃣ **Error en el código de impresión**
**Síntoma**: El código llega a `processPrintQueue()` pero falla al enviar ZPL.

**Revisar logs del servidor** para ver:
```
❌ Error imprimiendo: [mensaje de error]
```

### 5️⃣ **Solicitudes quedando en 'proceso' sin completarse**
**Síntoma**: El estado no cambia de 'proceso' a 'completada' después de imprimir.

**Causa**: El código espera que `processPrintQueue()` actualice el estado, pero algo falla.

## 🛠️ PASOS DE DIAGNÓSTICO

### Paso 1: Verificar Base de Datos
```bash
verificar-bd.bat
```

**Buscar**:
- ¿Existe la tabla `solicitudes_etiquetas`?
- ¿Hay solicitudes en estado 'proceso'?
- ¿Hay trabajos pendientes en `cola_impresion`?

### Paso 2: Ejecutar Migración (si es necesario)
```bash
ejecutar-migracion.bat
```

### Paso 3: Revisar Logs del Servidor
**Buscar en la terminal donde corre `node server.js`**:

✅ **Mensajes buenos**:
```
✅ [checkPrinterConnection] Impresora CONECTADA
🖨️ [processPrintQueue] Procesando trabajo
✅ Par 1 enviado exitosamente
```

❌ **Mensajes malos**:
```
❌ [checkPrinterConnection] Error de conexión
❌ Error imprimiendo:
❌ Error creando solicitud especial:
```

### Paso 4: Prueba Manual de Impresión
**En el dashboard de supervisor**:
1. Ir a "Cola de Impresión"
2. Buscar solicitudes pendientes
3. Click en "Limpiar Errores"
4. Click en "Verificar Impresoras"

### Paso 5: Reiniciar Servidor
```bash
# Detener servidor (Ctrl+C)
# Volver a iniciar
node server.js
```

## 🔧 SOLUCIONES RÁPIDAS

### Si la tabla no existe:
```bash
ejecutar-migracion.bat
```

### Si la impresora no conecta:
1. Verificar que la impresora está encendida
2. Verificar IP: `ping 192.168.1.34`
3. Verificar puerto: `telnet 192.168.1.34 9100`
4. Revisar firewall de Windows

### Si hay trabajos atascados:
```sql
-- Conectar a MySQL
mysql -u root -p1006 etiquetas_qr

-- Ver trabajos pendientes
SELECT * FROM cola_impresion WHERE estado = 'pendiente';

-- Resetear trabajos
UPDATE cola_impresion SET estado = 'error' WHERE estado = 'pendiente';

-- Borrar cola
DELETE FROM cola_impresion WHERE estado IN ('error', 'impresa');
```

### Si las solicitudes no se completan:
```sql
-- Ver solicitudes en proceso
SELECT numero_solicitud, fecha_creacion FROM solicitudes_etiquetas WHERE estado = 'proceso';

-- Completar manualmente (si ya se imprimieron)
UPDATE solicitudes_etiquetas SET estado = 'completada', fecha_completado = NOW() WHERE estado = 'proceso';
```

## 📊 VERIFICACIÓN POST-SOLUCIÓN

### 1. Crear nueva solicitud de prueba
- Crear una solicitud simple (no especial)
- Verificar que pasa a 'proceso'
- Verificar que se imprime
- Verificar que pasa a 'completada'

### 2. Crear solicitud especial de prueba
- Crear un producto especial con 2 componentes
- Solicitar 1 juego
- Verificar que crea 2 solicitudes
- Verificar que ambas se imprimen
- Verificar que ambas pasan a 'completada'

## 🆘 SI NADA FUNCIONA

### Reporte completo para soporte:
1. Salida de `verificar-bd.bat`
2. Últimas 50 líneas de logs del servidor
3. Captura de pantalla del dashboard mostrando solicitudes en 'proceso'
4. Resultado de `ping 192.168.1.34`

### Contacto:
- Revisar archivo `server.js` línea 640-755 (función `processPrintQueue`)
- Revisar archivo `server.js` línea 757-900 (función `addToPrintQueue`)
- Revisar archivo `server.js` línea 4048-4320 (endpoint `/api/crear-solicitud-especial`)

## 📝 NOTAS TÉCNICAS

### Flujo normal de impresión:
1. Se crea solicitud → estado: 'pendiente' o 'proceso' (si auto_services)
2. Si auto_services activo → se llama `addToPrintQueue()`
3. `addToPrintQueue()` → inserta en tabla `cola_impresion`
4. `addToPrintQueue()` → agrega a array `printQueue`
5. `addToPrintQueue()` → llama `processPrintQueue()`
6. `processPrintQueue()` → verifica conexión impresora
7. `processPrintQueue()` → genera ZPL y envía a impresora
8. `processPrintQueue()` → actualiza estado a 'completada'

### Puntos de falla comunes:
- ❌ Tabla `solicitudes_etiquetas` no existe → SQL error
- ❌ Impresora desconectada → no se procesa cola
- ❌ Error en ZPL → impresión falla pero no se reporta
- ❌ Error actualizando estado → queda en 'proceso' forever
