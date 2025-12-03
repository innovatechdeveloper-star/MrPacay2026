# ⭐ NUEVA FUNCIONALIDAD: Solicitudes Especiales

## 📦 Implementación Completada

### 1. **Tarjeta Dorada en Dashboard de Supervisor**

Se ha agregado una nueva tarjeta dorada en `supervisor-dashboard.html` para acceder a las solicitudes de productos especiales.

#### **Ubicación Visual:**
```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│    🌐   │   ⏳    │   🔄    │   ✅    │   ⭐    │
│  Todas  │Pendiente│ Proceso │Complete │ESPECIAL │
│    3    │    0    │    2    │    1    │    0    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

#### **Características de la Tarjeta:**
- ✅ **Color:** Fondo dorado degradado (#fef3c7 → #fbbf24)
- ✅ **Icono:** ⭐ Estrella dorada
- ✅ **Borde:** Borde dorado (#f59e0b)
- ✅ **Hover:** Degradado más intenso (#fde68a → #f59e0b)
- ✅ **Activo:** Degradado oscuro (#f59e0b → #d97706) con sombra
- ✅ **Dark Mode:** Adaptado automáticamente

---

### 2. **Endpoint del Backend**

#### **Ruta:** `GET /api/solicitudes-especiales`

**Funcionalidad:**
- Consulta todas las solicitudes que tienen productos especiales asociados
- Muestra TODOS los estados: pendiente, proceso, completada, cancelada
- Incluye información de los componentes del producto especial
- Ordena por estado (pendientes primero) y luego por fecha

**Query SQL:**
```sql
SELECT 
    se.id_solicitud,
    se.numero_solicitud,
    se.cantidad_solicitada,
    se.fecha_solicitud,
    se.prioridad,
    se.observaciones,
    se.estado,
    se.id_producto_especial,
    pe.nombre_producto,
    pe.codigo_producto,
    pe.tipo_combo,
    u.nombre_completo as costurera,
    u.auto_services,
    -- Componentes concatenados: "Producto1 (2), Producto2 (1), ..."
    CONCAT_WS(', ',
        CASE WHEN pe.id_producto_1 IS NOT NULL THEN ... END,
        CASE WHEN pe.id_producto_2 IS NOT NULL THEN ... END,
        CASE WHEN pe.id_producto_3 IS NOT NULL THEN ... END,
        CASE WHEN pe.id_producto_4 IS NOT NULL THEN ... END
    ) as componentes
FROM solicitudes_etiquetas se
JOIN productos_especiales pe ON se.id_producto_especial = pe.id_producto_especial
LEFT JOIN usuarios u ON se.id_usuario = u.id_usuario
WHERE se.id_producto_especial IS NOT NULL
ORDER BY estado, fecha_solicitud DESC
LIMIT 200
```

**Response JSON:**
```json
[
  {
    "id_solicitud": 123,
    "numero_solicitud": "SOL-20251016-0001",
    "cantidad_solicitada": 10,
    "fecha_solicitud": "2025-10-16T14:30:00",
    "prioridad": "normal",
    "observaciones": "Urgente para cliente X",
    "estado": "pendiente",
    "id_producto_especial": 1,
    "nombre_producto": "JUEGO COMPLETO SABANA",
    "codigo_producto": "JCS-001",
    "tipo_combo": "JUEGO",
    "costurera": "Maria Lopez",
    "auto_services": true,
    "componentes": "SABANA BP 1.5P (1), FUNDA ALMOHADA (2)"
  }
]
```

**Logging:**
```
⭐ Obteniendo solicitudes de productos especiales...
✅ Encontradas 15 solicitudes de productos especiales
   - Pendientes: 3
   - En proceso: 5
   - Completadas: 7
```

---

### 3. **Función JavaScript**

#### **Función:** `mostrarSolicitudesEspeciales()`

**Ubicación:** `supervisor-dashboard.html` (línea ~4500)

**Funcionalidad:**
1. Marca la tarjeta "Especiales" como activa
2. Muestra spinner de carga
3. Consulta el endpoint `/api/solicitudes-especiales`
4. Actualiza el contador de solicitudes especiales
5. Renderiza las solicitudes con diseño especial

**Características del Diseño:**
- ✅ Badge dorado "⭐ ESPECIAL"
- ✅ Borde izquierdo dorado (4px solid #f59e0b)
- ✅ Sección de componentes con fondo dorado claro
- ✅ Estados: Pendiente, Proceso, Completada, Cancelada
- ✅ Tiempo transcurrido desde creación
- ✅ Botones de aprobar/rechazar para pendientes
- ✅ Auto-services badge si aplica

**Ejemplo de Solicitud Renderizada:**
```
┌─────────────────────────────────────────────────────────┐
│ Maria Lopez - JUEGO COMPLETO SABANA                     │
│ ⭐ ESPECIAL  ⏳ PENDIENTE  🤖 AUTO  normal               │
│ Cantidad: 10 | Solicitud: SOL-20251016-0001 | 15 min   │
│ ┌─────────────────────────────────────────────────┐     │
│ │ Componentes: SABANA BP 1.5P (1), FUNDA (2)     │     │
│ └─────────────────────────────────────────────────┘     │
│ Observaciones: Urgente para cliente X                   │
│ [✅ Aprobar]  [❌ Rechazar]                              │
└─────────────────────────────────────────────────────────┘
```

---

### 4. **Estilos CSS Agregados**

```css
/* Tarjeta dorada para Solicitudes Especiales */
.tab-btn.especiales {
    background: linear-gradient(135deg, #fef3c7, #fbbf24);
    color: #92400e;
    border: 2px solid #f59e0b;
}

.tab-btn.especiales:hover {
    background: linear-gradient(135deg, #fde68a, #f59e0b);
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
}

.tab-btn.especiales.active {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    box-shadow: 0 6px 15px rgba(245, 158, 11, 0.5);
}

/* Dark Mode */
body.dark-mode .tab-btn.especiales {
    background: linear-gradient(135deg, #92400e, #78350f);
    color: #fde68a;
    border-color: #d97706;
}

body.dark-mode .tab-btn.especiales.active {
    background: linear-gradient(135deg, #d97706, #b45309);
    color: white;
}
```

---

## 🎯 Flujo de Uso

### **Paso 1:** Acceder al Dashboard de Supervisor
```
http://localhost:3010/supervisor-dashboard.html
```

### **Paso 2:** Click en tarjeta "⭐ Especiales"
La tarjeta dorada con icono de estrella.

### **Paso 3:** Ver Solicitudes
Se muestran TODAS las solicitudes de productos especiales:
- Pendientes de aprobación
- En proceso de impresión
- Completadas
- Canceladas (si existen)

### **Paso 4:** Acciones Disponibles
- ✅ Aprobar solicitudes pendientes
- ❌ Rechazar solicitudes pendientes
- 👁️ Ver componentes del producto especial
- 📊 Ver estado actual

---

## 📊 Datos Mostrados

Para cada solicitud especial se muestra:

| Campo | Descripción |
|-------|-------------|
| **Costurera** | Nombre de quien creó la solicitud |
| **Producto** | Nombre del producto especial |
| **⭐ Badge** | "ESPECIAL" con fondo dorado |
| **Estado** | Pendiente/Proceso/Completada |
| **Auto** | Badge si tiene auto_services |
| **Prioridad** | normal/alta/urgente |
| **Cantidad** | Cantidad solicitada |
| **Solicitud** | Número único de solicitud |
| **Tiempo** | Tiempo transcurrido desde creación |
| **Componentes** | Lista de productos que forman el especial |
| **Observaciones** | Notas adicionales (si existen) |

---

## 🔧 Archivos Modificados

### 1. `supervisor-dashboard.html`
- **Línea ~620:** Agregado CSS para tarjeta dorada
- **Línea ~3238:** Agregado botón HTML de tarjeta especiales
- **Línea ~4505:** Agregada función `mostrarSolicitudesEspeciales()`

### 2. `server.js`
- **Línea ~4720:** Agregado endpoint `GET /api/solicitudes-especiales`
- Incluye logging con `logger.info()` y `logger.dbResult()`

---

## ✅ Testing

### **Verificar Endpoint:**
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3010/api/solicitudes-especiales
```

**Response esperado:**
```json
[
  {
    "id_solicitud": 1,
    "numero_solicitud": "SOL-20251016-0001",
    "cantidad_solicitada": 10,
    "estado": "pendiente",
    "nombre_producto": "JUEGO SABANA",
    "componentes": "SABANA (1), FUNDA (2)",
    ...
  }
]
```

### **Verificar UI:**
1. Abrir `http://localhost:3010/supervisor-dashboard.html`
2. Login como supervisor
3. Verificar que aparece tarjeta dorada "⭐ Especiales"
4. Click en la tarjeta
5. Verificar que muestra solicitudes (o mensaje "No hay solicitudes...")

### **Logs Esperados:**
```
⭐ Obteniendo solicitudes de productos especiales...
[INFO ] [SOLICITUDES-ESPECIALES] Obteniendo solicitudes...
[INFO ] [DB-RESULT] Query exitosa: 5 filas (25ms)
✅ Encontradas 5 solicitudes de productos especiales
   - Pendientes: 1
   - En proceso: 2
   - Completadas: 2
```

---

## 🚀 Próximos Pasos

Según mencionaste, ahora puedes:

1. ✅ Ver todas las solicitudes de productos especiales
2. ✅ Filtrar por estado (pendiente/proceso/completada)
3. ✅ Ver componentes de cada producto especial
4. ✅ Aprobar/rechazar solicitudes pendientes

**Pendiente por completar:**
- Sistema completo de productos especiales (creación, edición, etc.)
- Más filtros específicos para solicitudes especiales
- Reportes de solicitudes especiales

---

## 📝 Notas Técnicas

### **Diferencias con Solicitudes Normales:**
- Consulta tabla `productos_especiales` en lugar de `productos`
- JOIN adicional para obtener componentes
- Badge visual dorado para distinguirlas
- Muestra desglose de componentes

### **Performance:**
- LIMIT 200 para evitar sobrecarga
- Índices existentes en `id_producto_especial`
- LEFT JOIN en usuarios (por si no tiene costurera asignada)

### **Seguridad:**
- Requiere autenticación (headers con token)
- Solo supervisores pueden aprobar/rechazar
- Logging completo de accesos

---

**Implementación completada:** 16 de octubre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ FUNCIONAL Y LISTA PARA USAR
