# 🚀 Instrucciones Rápidas - Reiniciar y Probar

## 📋 Checklist Rápido

### 1. Ejecutar Migración SQL (OPCIONAL - para configuración de etiquetas futura)
```sql
-- Abrir pgAdmin
-- Conectar a base de datos: mi_app_etiquetas
-- Abrir Query Tool
-- Copiar y ejecutar:

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS mostrar_qr BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_nombre BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_id BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mostrar_unidad BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_modelo BOOLEAN DEFAULT true;

-- Verificar:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'productos' 
  AND column_name IN ('mostrar_qr', 'mostrar_nombre', 'mostrar_id', 'mostrar_unidad', 'mostrar_modelo');
```

---

### 2. Reiniciar Servidor
```bash
# En terminal CMD:
cd D:\Informacion\DESARROLLO\mi-app-etiquetas\mi-app-etiquetas

# Si el servidor está corriendo, detenerlo con Ctrl+C

# Iniciar servidor:
node server.js

# Esperar mensaje:
# ✅ Servidor corriendo en https://localhost:3010
# ✅ Base de datos PostgreSQL conectada
# ✅ Impresora Zebra ZD230 lista
```

---

### 3. Probar Dashboard Supervisor

#### A. Abrir Dashboard:
```
https://localhost:3010/supervisor-dashboard.html
```

#### B. Verificar Nueva Sección:
✅ Deberías ver:
```
┌─────────────────────────────────────────────────────────────┐
│ Solicitudes Recientes (24h)              🔄 Actualizar      │
├─────────────────────────────────────────────────────────────┤
│ [🌐 Todas (X)] [⏳ Pendientes (X)] [🔄 Proceso (X)] [✅ Completadas (X)] │
└─────────────────────────────────────────────────────────────┘
```

#### C. Probar Filtros:
1. Click en cada pestaña
2. Verificar que muestra solo solicitudes de ese estado
3. Ver que los números se actualizan

---

### 4. Crear Solicitud de Prueba

#### A. Identificar Costurera con auto_services:
```sql
-- En pgAdmin:
SELECT id_usuario, nombre_completo, auto_services
FROM usuarios
WHERE auto_services = true;

-- Debería mostrar:
-- 4 | RUTH CORRALES | true
-- 10 | DORIS MAMANI | true
```

#### B. Abrir Dashboard de Costurera:
```
https://localhost:3010/costurera-dashboard.html
```

#### C. Login como RUTH CORRALES:
- Usuario: RUTH CORRALES (o el que tenga auto_services=true)
- Crear una solicitud de prueba

#### D. Observar el Flujo:
1. **Dashboard Costurera**: 
   - Solicitud aparece inmediatamente
   - Estado: "EN PROCESO" → "COMPLETADA" (en segundos)

2. **Dashboard Supervisor** (actualizar o esperar 10s):
   - Aparece en sección "Solicitudes Recientes (24h)"
   - Badge: "🤖 AUTO"
   - Estado: "🔄 PROCESO" → "✅ COMPLETADA"
   - Pestaña "Proceso" → Pestaña "Completadas"

3. **Consola del Servidor**:
   ```
   🖨️ AUTO-SERVICES ACTIVO: Enviando a cola de impresión...
   📋 Datos a enviar a impresión: {...}
   ✅ Agregado a cola de impresión
   🖨️ Imprimiendo 4 etiquetas para SOL-...
   ✅ Todos los pares impresos
   🎯 Solicitud → Estado cambiado automáticamente a COMPLETADA
   ```

---

### 5. Verificar en Base de Datos

```sql
-- Ver solicitudes recientes:
SELECT 
    se.numero_solicitud,
    se.estado,
    u.nombre_completo,
    u.auto_services,
    se.fecha_solicitud,
    EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/60 as minutos_transcurridos
FROM solicitudes_etiquetas se
JOIN usuarios u ON se.id_usuario = u.id_usuario
WHERE se.fecha_solicitud >= NOW() - INTERVAL '1 hour'
ORDER BY se.fecha_solicitud DESC;
```

---

## 🔍 Qué Buscar

### ✅ Señales de Éxito:

#### Dashboard Supervisor:
- ✅ Sección "Solicitudes Recientes (24h)" visible
- ✅ 4 pestañas con contadores
- ✅ Solicitudes auto-aprobadas aparecen con badge "🤖 AUTO"
- ✅ Filtros funcionan al hacer click
- ✅ Auto-reload cada 10 segundos
- ✅ Notificación "Solicitudes actualizadas" cuando hay cambios

#### Consola Servidor:
- ✅ `📋 Obteniendo solicitudes recientes para supervisor...`
- ✅ `✅ Encontradas X solicitudes recientes`
- ✅ `🖨️ AUTO-SERVICES ACTIVO`
- ✅ `✅ Agregado a cola de impresión`

#### Consola Navegador (F12):
- ✅ `📋 Cargando TODAS las solicitudes recientes...`
- ✅ `✅ Cargadas X solicitudes recientes`
- ✅ Sin errores rojos

---

## ❌ Problemas Comunes

### Problema 1: Sección no aparece
**Causa**: Caché del navegador
**Solución**: 
- Ctrl + Shift + R (hard reload)
- O abrir en ventana incógnito

### Problema 2: Contadores en 0
**Causa**: No hay solicitudes en últimas 24h
**Solución**: 
- Crear nueva solicitud de prueba
- O cambiar intervalo en SQL (de 24 hours a 7 days)

### Problema 3: Badge "🤖 AUTO" no aparece
**Causa**: Usuario no tiene auto_services=true
**Solución**:
```sql
UPDATE usuarios 
SET auto_services = true 
WHERE nombre_completo = 'RUTH CORRALES';
```

### Problema 4: Auto-reload no funciona
**Causa**: Error en endpoint /api/stats-rapidas
**Solución**: 
- Ver consola del servidor
- Verificar que endpoint responde correctamente

---

## 📊 Métricas de Éxito

### Dashboard Supervisor debe mostrar:
- [x] Solicitudes de TODOS los estados
- [x] Badge especial para auto-servicios
- [x] Tiempo transcurrido desde creación
- [x] Filtros interactivos funcionando
- [x] Contadores actualizándose
- [x] Auto-reload cada 10s

### Sistema debe hacer:
- [x] Crear solicitud con auto_services → estado='proceso'
- [x] Imprimir automáticamente
- [x] Cambiar a estado='completada'
- [x] Aparecer en dashboard supervisor
- [x] Actualizar en tiempo real

---

## 🎯 Resultado Esperado

### Vista Final Dashboard Supervisor:
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Solicitudes Recientes (24h)           🔄 Actualizar      │
├─────────────────────────────────────────────────────────────┤
│ [🌐 Todas (3)] [⏳ Pendientes (0)] [🔄 Proceso (0)] [✅ Completadas (3)] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ RUTH CORRALES - SABANA BP 1.5P                          ││
│ │ ✅ COMPLETADA  🤖 AUTO  🔥 alta                         ││
│ │ Cantidad: 2 | SOL-1760556355889 | Hace: 5 min           ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ DORIS MAMANI - COBERTOR 2P                              ││
│ │ ✅ COMPLETADA  🤖 AUTO  ⚡ normal                        ││
│ │ Cantidad: 3 | SOL-1760556423156 | Hace: 12 min          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ MARIA LOPEZ - FRAZADA 1.5P                              ││
│ │ ✅ COMPLETADA  🤖 AUTO  ⚡ normal                        ││
│ │ Cantidad: 1 | SOL-1760556498745 | Hace: 18 min          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆘 Ayuda

Si algo no funciona:

1. **Revisar consola del servidor**:
   - Buscar errores en rojo
   - Verificar que endpoints responden

2. **Revisar consola del navegador** (F12):
   - Pestaña "Console"
   - Buscar errores en rojo
   - Ver logs de carga

3. **Verificar base de datos**:
   - Conexión activa
   - Tablas existen
   - Datos presentes

4. **Reiniciar todo**:
   - Cerrar navegador
   - Detener servidor (Ctrl+C)
   - Reiniciar servidor
   - Abrir navegador en incógnito

---

**Última actualización**: 15 de octubre de 2025 - 20:50  
**Estado**: ✅ Listo para probar
