# 🎯 SISTEMA DE PRODUCTOS ESPECIALES - Plan de Implementación

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Crear sistema para manejar productos tipo "JUEGO" que contienen múltiples productos individuales.

**Ejemplo:**
- Producto: `JUEGO COB 2P + SABANA 2P`
- Contiene: 1 Cobertor 2P + 1 Sábana 2P
- Al solicitar 5 juegos → Se generan 10 registros individuales (5 cobertores + 5 sábanas)

---

## 🗄️ FASE 1: BASE DE DATOS (✅ COMPLETADO)

### Archivos SQL Creados:

1. **`migrations/crear_productos_especiales.sql`**
   - Tabla `productos_especiales` con hasta 4 productos componentes
   - Vista `vista_productos_especiales` con información completa
   - Configuración de etiquetas (igual que productos normales)

2. **`migrations/crear_solicitudes_especiales.sql`**
   - Tabla `solicitudes_especiales` para registros de producción
   - Vista `vista_solicitudes_especiales` con toda la información
   - Control de estados y fechas

### 📊 Estructura `productos_especiales`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_producto_especial | SERIAL | ID único |
| nombre_producto | VARCHAR | Ej: "JUEGO COB 2P + SABANA 2P" |
| tipo_combo | VARCHAR | JUEGO, PACK, KIT |
| id_producto_1 | INTEGER | Producto 1 (obligatorio) |
| cantidad_producto_1 | INTEGER | Cantidad del producto 1 |
| id_producto_2 | INTEGER | Producto 2 (opcional) |
| cantidad_producto_2 | INTEGER | Cantidad del producto 2 |
| id_producto_3 | INTEGER | Producto 3 (opcional) |
| id_producto_4 | INTEGER | Producto 4 (opcional) |
| mostrar_qr/nombre/id... | BOOLEAN | Config de etiqueta |

---

## 🚀 FASE 2: BACKEND (SIGUIENTE)

### Endpoints a Crear:

#### **1. Productos Especiales**

```javascript
// GET /api/productos-especiales
// Lista todos los productos especiales activos

// GET /api/productos-especiales/:id
// Obtiene un producto especial con detalles de componentes

// POST /api/productos-especiales
// Crea nuevo producto especial

// PUT /api/productos-especiales/:id
// Actualiza producto especial (nombre, configuración, componentes)

// DELETE /api/productos-especiales/:id
// Desactiva producto especial
```

#### **2. Solicitudes Especiales**

```javascript
// POST /api/crear-solicitud-especial
// Crea solicitud de producción para producto especial
// - Genera múltiples registros individuales
// - Crea etiquetas para cada producto componente

// GET /api/solicitudes-especiales
// Lista solicitudes especiales

// PUT /api/solicitudes-especiales/:id/aprobar
// Aprueba solicitud especial
// - Genera N registros individuales (uno por producto)
// - Envía a cola de impresión
```

---

## 🎨 FASE 3: FRONTEND (SIGUIENTE)

### 1. **Botón "ESPECIALES" en Supervisor Dashboard**

**Ubicación:** Junto a "Consultar Productos Activos"

**Funcionalidad:**
- Abre modal con lista de productos especiales
- Permite editar, previsualizar configuración
- Igual que productos normales pero apunta a otra tabla

**HTML:**
```html
<button onclick="abrirProductosEspeciales()" class="btn-especiales">
    ⭐ ESPECIALES
</button>
```

---

### 2. **Modal: Añadir Producto (Mejorado)**

**Flujo Actual:**
```
[Añadir Producto] → Formulario directo
```

**Flujo Nuevo:**
```
[Añadir Producto] → Popup con 2 opciones:
    ├─ [Producto Normal] → Formulario actual
    └─ [Producto Especial] → Formulario nuevo
```

**Popup HTML:**
```html
<div id="tipo-producto-modal" class="modal">
    <h3>¿Qué tipo de producto deseas agregar?</h3>
    <div class="opciones-grid">
        <button onclick="abrirFormularioNormal()">
            📦 Producto Normal
        </button>
        <button onclick="abrirFormularioEspecial()">
            ⭐ Producto Especial (JUEGO)
        </button>
    </div>
</div>
```

---

### 3. **Formulario: Añadir Producto Especial**

**Campos:**

```html
<form id="form-producto-especial">
    <!-- Información básica -->
    <input name="nombre_producto" placeholder="Ej: JUEGO COB 2P + SABANA 2P">
    <select name="tipo_combo">
        <option value="JUEGO">JUEGO</option>
        <option value="PACK">PACK</option>
        <option value="KIT">KIT</option>
    </select>
    
    <!-- Producto 1 (Obligatorio) -->
    <h4>📦 Producto 1 (Obligatorio)</h4>
    <select name="id_producto_1">
        <!-- Carga desde /api/productos -->
    </select>
    <input name="cantidad_producto_1" type="number" value="1">
    <div class="producto-preview">
        <!-- Muestra: COBERTOR 2P | Marca: BP+A | Modelo: 2 PLAZAS -->
    </div>
    
    <!-- Producto 2 (Opcional) -->
    <h4>📦 Producto 2 (Opcional)</h4>
    <select name="id_producto_2">
        <option value="">-- Sin producto --</option>
        <!-- Carga desde /api/productos -->
    </select>
    <input name="cantidad_producto_2" type="number" value="1">
    
    <!-- Producto 3 y 4 igual -->
    
    <!-- Configuración de etiqueta (6 botones igual que productos) -->
    <div class="label-config">
        <!-- Toggle buttons: QR, NOMBRE, ID, UNIDAD, MODELO, EMPRESA -->
    </div>
    
    <button type="submit">💾 Guardar Producto Especial</button>
</form>
```

---

### 4. **Dashboard Costurera: Nuevo Botón**

**Layout Actual:**
```
[Mis Registros] [Crear Nuevo Registro] [Chat]
```

**Layout Nuevo:**
```
[Mis Registros] [Crear Registro Normal] [Crear Registro Especial] [Chat]
```

**Funcionalidad "Crear Registro Especial":**
- Abre modal con productos especiales disponibles
- Muestra: "JUEGO COB 2P + SABANA 2P (2 productos)"
- Al seleccionar, muestra preview: "Se generarán 2 registros individuales"
- Input cantidad: "¿Cuántos JUEGOS completos?" → Si pone 5, genera 10 registros

---

## 🔄 FASE 4: LÓGICA DE NEGOCIO

### **Flujo de Solicitud Especial:**

```
1. Costurera crea solicitud especial
   └─ Selecciona: JUEGO COB 2P + SABANA 2P
   └─ Cantidad: 5 juegos

2. Sistema valida:
   └─ Producto especial existe y está activo
   └─ Componentes (COBERTOR, SABANA) existen

3. Sistema calcula:
   └─ Total productos: 2 (componentes del juego)
   └─ Total registros: 5 juegos × 2 productos = 10 registros
   └─ Total etiquetas: 10 × 2 (etiqueta doble) = 20 etiquetas

4. Supervisor aprueba:
   └─ Sistema genera 10 registros individuales:
       ├─ 5 registros de COBERTOR 2P
       └─ 5 registros de SABANA 2P
   └─ Cada registro tiene su propio número de solicitud
   └─ Se envían 10 trabajos a cola de impresión

5. Impresión:
   └─ Cada producto se imprime con su configuración individual
   └─ COBERTOR usa configuración de productos normales
   └─ SABANA usa configuración de productos normales
```

---

## 📝 INSTRUCCIONES DE EJECUCIÓN

### **PASO 1: Ejecutar SQL en pgAdmin**

1. Abre pgAdmin
2. Conecta a: PostgreSQL 18 → Databases → **postgres**
3. Query Tool → Pega contenido de `crear_productos_especiales.sql`
4. Ejecuta (F5)
5. Repite con `crear_solicitudes_especiales.sql`
6. Verifica:
   ```sql
   SELECT * FROM productos_especiales;
   SELECT * FROM solicitudes_especiales;
   SELECT * FROM vista_productos_especiales;
   ```

---

### **PASO 2: Backend Endpoints (YO LO HARÉ)**

Mientras ejecutas el SQL, yo creo los endpoints del backend en `server.js`:

- GET/POST/PUT productos especiales
- POST crear solicitud especial
- Lógica para generar registros individuales
- Integración con cola de impresión

---

### **PASO 3: Frontend UI (YO LO HARÉ)**

Luego creo los elementos de interfaz:

- Botón "ESPECIALES" amarillo
- Popup selección tipo producto
- Formulario productos especiales
- Lista productos especiales
- Botón "Crear Registro Especial" en costurera

---

### **PASO 4: Pruebas Integradas**

1. Crear producto especial: "JUEGO COB 2P + SABANA 2P"
2. Asignar 2 productos componentes
3. Crear solicitud especial (5 juegos)
4. Aprobar y verificar que genera 10 registros
5. Verificar impresión de 20 etiquetas

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

**TÚ (Usuario):**
1. ✅ Ejecuta `crear_productos_especiales.sql` en pgAdmin
2. ✅ Ejecuta `crear_solicitudes_especiales.sql` en pgAdmin
3. ✅ Verifica que las tablas se crearon correctamente
4. ✅ Avísame cuando esté listo

**YO (Copilot):**
1. ⏳ Espero confirmación de que SQL se ejecutó
2. ⏳ Creo endpoints del backend
3. ⏳ Creo UI del frontend
4. ⏳ Integro lógica de negocio

---

## 💡 MEJORAS FUTURAS CONSIDERADAS

- **Historial de cambios:** Auditoría de modificaciones a productos especiales
- **Previsualización 3D:** Ver cómo se verá la etiqueta del juego
- **Exportar/Importar:** Crear productos especiales desde Excel
- **Reportes:** Cuántos juegos se producen por mes
- **Validaciones:** No permitir productos duplicados en un combo
- **Descuentos:** Precio especial para juegos vs productos individuales

---

**¿Ejecutaste los SQL correctamente? ¡Avísame para continuar con el backend!** 🚀
