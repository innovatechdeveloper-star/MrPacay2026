# 📋 Trabajo Pendiente: Modal Editar Producto con Configuración de Etiquetas

## 🎯 Objetivo
Mejorar el modal de "Editar Producto" en supervisor-dashboard.html agregando botones interactivos para configurar qué campos aparecen en las etiquetas impresas.

---

## 📊 Estado Actual

### ✅ Completado:
- [x] Migración SQL creada (`migrations/add_label_config_columns.sql`)
- [x] 5 columnas agregadas a tabla `productos`:
  - `mostrar_qr` BOOLEAN DEFAULT true
  - `mostrar_nombre` BOOLEAN DEFAULT true
  - `mostrar_id` BOOLEAN DEFAULT false
  - `mostrar_unidad` BOOLEAN DEFAULT true
  - `mostrar_modelo` BOOLEAN DEFAULT true

### ⏳ Pendiente:
- [ ] Modificar HTML del modal
- [ ] Agregar botones toggle interactivos
- [ ] Estilos CSS para botones activo/inactivo
- [ ] JavaScript para manejar clicks
- [ ] Endpoint backend para guardar configuración
- [ ] Actualizar query de carga de producto
- [ ] Generar formatos ZPL personalizados

---

## 🎨 Diseño Propuesto

### Modal Actual:
```
┌─────────────────────────────────────┐
│ ✏️ Editar Producto           ✕     │
├─────────────────────────────────────┤
│ Nombre: [SABANA BP 1.5P]           │
│ Marca:  [PK+C]                     │
│ Modelo: [2 PLAZAS]                 │
│ Categoría: [Productos Terminados]  │
│ Subcategoría: [SABANAS]            │
│ Estado: [Activo ▼]                 │
│                                     │
│ [Cancelar]      [💾 Guardar]       │
└─────────────────────────────────────┘
```

### Modal Mejorado (Propuesta):
```
┌─────────────────────────────────────────────────┐
│ ✏️ Editar Producto                       ✕     │
├─────────────────────────────────────────────────┤
│ Nombre: [SABANA BP 1.5P ESPECIAL 30CM]         │
│ Marca:  [PK+C]                                 │
│ Modelo: [2 PLAZAS]                             │
│ Categoría: [Productos Terminados] (bloqueado)  │
│ Subcategoría: [SABANAS ▼]                      │
│ Estado: [Activo ▼]                             │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                 │
│ 🏷️ Configuración de Etiqueta:                 │
│                                                 │
│ Selecciona qué campos aparecerán al imprimir:  │
│                                                 │
│  ┌─────┐  ┌────────┐  ┌────┐  ┌────────┐     │
│  │ QR  │  │ NOMBRE │  │ ID │  │ UNIDAD │     │
│  │  ✓  │  │   ✓    │  │  ✗ │  │   ✓    │     │
│  └─────┘  └────────┘  └────┘  └────────┘     │
│   Activo    Activo    Inactivo  Activo        │
│                                                 │
│  ┌────────┐                                    │
│  │ MODELO │                                    │
│  │   ✓    │                                    │
│  └────────┘                                    │
│   Activo                                       │
│                                                 │
│ Vista Previa:                                  │
│ ┌─────────────────────────────┐               │
│ │  ██████  SABANA BP 1.5P     │               │
│ │  ██  ██  ESPECIAL 30CM      │               │
│ │  ██████  2 PLAZAS           │               │
│ │          UNIDAD             │               │
│ └─────────────────────────────┘               │
│                                                 │
│ [Cancelar]              [💾 Guardar Cambios]   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### 1. Modificar HTML del Modal

**Archivo**: `supervisor-dashboard.html` línea ~2828

**Agregar después del campo "Estado"**:

```html
<!-- Separador -->
<hr style="margin: 25px 0; border: none; border-top: 2px solid rgba(236, 72, 153, 0.2);">

<!-- Configuración de Etiqueta -->
<div class="form-group">
    <label style="font-size: 16px; font-weight: 700; color: #333; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
        <span style="font-size: 20px;">🏷️</span>
        Configuración de Etiqueta
    </label>
    <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
        Selecciona qué campos aparecerán al imprimir este producto:
    </p>
    
    <!-- Botones Toggle -->
    <div class="label-config-buttons">
        <button type="button" class="config-btn active" data-field="qr" onclick="toggleLabelField(this, 'qr')">
            <span class="config-icon">📱</span>
            <span class="config-label">QR</span>
            <span class="config-status">✓</span>
        </button>
        
        <button type="button" class="config-btn active" data-field="nombre" onclick="toggleLabelField(this, 'nombre')">
            <span class="config-icon">📝</span>
            <span class="config-label">NOMBRE</span>
            <span class="config-status">✓</span>
        </button>
        
        <button type="button" class="config-btn" data-field="id" onclick="toggleLabelField(this, 'id')">
            <span class="config-icon">🔢</span>
            <span class="config-label">ID</span>
            <span class="config-status">✗</span>
        </button>
        
        <button type="button" class="config-btn active" data-field="unidad" onclick="toggleLabelField(this, 'unidad')">
            <span class="config-icon">📦</span>
            <span class="config-label">UNIDAD</span>
            <span class="config-status">✓</span>
        </button>
        
        <button type="button" class="config-btn active" data-field="modelo" onclick="toggleLabelField(this, 'modelo')">
            <span class="config-icon">🏭</span>
            <span class="config-label">MODELO</span>
            <span class="config-status">✓</span>
        </button>
    </div>
    
    <!-- Vista Previa (opcional) -->
    <div class="label-preview" id="label-preview" style="margin-top: 20px; display: none;">
        <p style="font-size: 12px; color: #666; margin-bottom: 8px;">Vista Previa de la Etiqueta:</p>
        <div class="preview-box" id="preview-content">
            <!-- Se genera dinámicamente con JavaScript -->
        </div>
    </div>
</div>

<!-- Campos hidden para enviar al backend -->
<input type="hidden" id="edit-product-mostrar-qr" value="true">
<input type="hidden" id="edit-product-mostrar-nombre" value="true">
<input type="hidden" id="edit-product-mostrar-id" value="false">
<input type="hidden" id="edit-product-mostrar-unidad" value="true">
<input type="hidden" id="edit-product-mostrar-modelo" value="true">
```

---

### 2. Estilos CSS

**Archivo**: `supervisor-dashboard.html` (en sección `<style>`)

```css
/* Contenedor de botones de configuración */
.label-config-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 15px;
}

/* Botón de configuración */
.config-btn {
    flex: 1;
    min-width: 100px;
    padding: 15px 12px;
    border: 3px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
}

.config-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Botón ACTIVO */
.config-btn.active {
    border-color: #ec4899;
    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(236, 72, 153, 0.25);
}

.config-btn.active:hover {
    transform: scale(1.08) translateY(-3px);
}

/* Botón INACTIVO */
.config-btn:not(.active) {
    border-color: #d1d5db;
    background: #e5e7eb;
    opacity: 0.6;
    transform: scale(0.95);
}

.config-btn:not(.active):hover {
    opacity: 0.8;
    transform: scale(0.98) translateY(-3px);
}

/* Icono del botón */
.config-icon {
    font-size: 24px;
    transition: transform 0.3s ease;
}

.config-btn.active .config-icon {
    transform: scale(1.1);
}

/* Texto del botón */
.config-label {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    letter-spacing: 0.5px;
}

.config-btn.active .config-label {
    color: #ec4899;
}

/* Estado (✓ o ✗) */
.config-status {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 16px;
    font-weight: 900;
}

.config-btn.active .config-status {
    color: #10b981;
}

.config-btn:not(.active) .config-status {
    color: #ef4444;
}

/* Vista previa */
.label-preview {
    background: #f9fafb;
    padding: 15px;
    border-radius: 10px;
    border: 2px dashed #d1d5db;
}

.preview-box {
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.8;
    min-height: 100px;
}

/* Modo oscuro */
body.dark-mode .config-btn {
    background: rgba(45, 27, 61, 0.5);
    border-color: rgba(168, 85, 247, 0.2);
}

body.dark-mode .config-btn.active {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.3) 100%);
    border-color: #a855f7;
}

body.dark-mode .config-label {
    color: #e5e7eb;
}

body.dark-mode .config-btn.active .config-label {
    color: #a855f7;
}

body.dark-mode .label-preview {
    background: rgba(45, 27, 61, 0.5);
    border-color: rgba(168, 85, 247, 0.3);
}

body.dark-mode .preview-box {
    background: rgba(45, 27, 61, 0.8);
    border-color: rgba(168, 85, 247, 0.2);
    color: #e5e7eb;
}
```

---

### 3. Funciones JavaScript

**Archivo**: `supervisor-dashboard.html` (en sección `<script>`)

```javascript
// Toggle de campos de etiqueta
function toggleLabelField(button, field) {
    // Toggle clase active
    button.classList.toggle('active');
    
    // Obtener estado actual
    const isActive = button.classList.contains('active');
    
    // Actualizar ícono de estado
    const statusIcon = button.querySelector('.config-status');
    statusIcon.textContent = isActive ? '✓' : '✗';
    
    // Actualizar campo hidden
    const hiddenInput = document.getElementById(`edit-product-mostrar-${field}`);
    if (hiddenInput) {
        hiddenInput.value = isActive ? 'true' : 'false';
    }
    
    // Actualizar vista previa (opcional)
    updateLabelPreview();
    
    console.log(`Campo "${field}" ${isActive ? 'activado' : 'desactivado'}`);
}

// Actualizar vista previa de etiqueta
function updateLabelPreview() {
    const preview = document.getElementById('preview-content');
    if (!preview) return;
    
    // Obtener estados de campos
    const mostrarQR = document.getElementById('edit-product-mostrar-qr').value === 'true';
    const mostrarNombre = document.getElementById('edit-product-mostrar-nombre').value === 'true';
    const mostrarID = document.getElementById('edit-product-mostrar-id').value === 'true';
    const mostrarUnidad = document.getElementById('edit-product-mostrar-unidad').value === 'true';
    const mostrarModelo = document.getElementById('edit-product-mostrar-modelo').value === 'true';
    
    // Obtener datos del producto
    const nombre = document.getElementById('edit-product-name').value;
    const modelo = document.getElementById('edit-product-model').value;
    const idProducto = document.getElementById('edit-product-id').value;
    
    // Generar HTML de vista previa
    let html = '';
    
    if (mostrarQR) {
        html += `
            <div style="float: left; margin-right: 15px;">
                <div style="width: 60px; height: 60px; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                    [QR]
                </div>
            </div>
        `;
    }
    
    html += '<div>';
    
    if (mostrarNombre) {
        html += `<div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${nombre || 'NOMBRE PRODUCTO'}</div>`;
    }
    
    if (mostrarModelo && modelo) {
        html += `<div style="font-size: 14px; margin-bottom: 4px;">${modelo}</div>`;
    }
    
    if (mostrarID) {
        html += `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">ID: ${idProducto || '###'}</div>`;
    }
    
    if (mostrarUnidad) {
        html += `<div style="font-size: 12px; color: #666;">UNIDAD</div>`;
    }
    
    html += '</div>';
    html += '<div style="clear: both;"></div>';
    
    preview.innerHTML = html;
}

// Actualizar función editProduct para cargar configuración
async function editProduct(productId) {
    try {
        await loadSubcategoriasForEdit();
        await loadMarcasForEdit();
        await loadModelosForEdit();

        const response = await fetch(`/api/productos/${productId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const producto = await response.json();
        
        // Rellenar campos básicos
        document.getElementById('edit-product-id').value = producto.id_producto;
        document.getElementById('edit-product-name').value = producto.nombre_producto || '';
        document.getElementById('edit-product-brand').value = producto.marca || '';
        document.getElementById('edit-product-model').value = producto.modelo || '';
        document.getElementById('edit-product-categoria').value = 'Productos Terminados';
        document.getElementById('edit-product-subcategoria').value = producto.subcategoria || '';
        document.getElementById('edit-product-status').value = producto.activo ? 'true' : 'false';

        // ✅ NUEVO: Cargar configuración de etiqueta
        const configFields = ['qr', 'nombre', 'id', 'unidad', 'modelo'];
        configFields.forEach(field => {
            const value = producto[`mostrar_${field}`] !== false; // default true si no existe
            const button = document.querySelector(`.config-btn[data-field="${field}"]`);
            const hiddenInput = document.getElementById(`edit-product-mostrar-${field}`);
            
            if (button) {
                if (value) {
                    button.classList.add('active');
                    button.querySelector('.config-status').textContent = '✓';
                } else {
                    button.classList.remove('active');
                    button.querySelector('.config-status').textContent = '✗';
                }
            }
            
            if (hiddenInput) {
                hiddenInput.value = value ? 'true' : 'false';
            }
        });
        
        // Actualizar vista previa
        updateLabelPreview();

        // Mostrar el modal
        document.getElementById('edit-product-modal').style.display = 'flex';

    } catch (error) {
        console.error('Error cargando producto para editar:', error);
        alert('Error al cargar los datos del producto: ' + error.message);
    }
}
```

---

### 4. Actualizar Endpoint Backend

**Archivo**: `server.js`

#### A. Modificar GET `/api/productos/:id`:

```javascript
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                id_producto,
                nombre_producto,
                marca,
                modelo,
                categoria,
                subcategoria,
                activo,
                mostrar_qr,
                mostrar_nombre,
                mostrar_id,
                mostrar_unidad,
                mostrar_modelo
            FROM productos
            WHERE id_producto = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### B. Modificar PUT `/api/productos/:id`:

```javascript
// Dentro del formulario de edición, agregar campos de configuración
const formData = {
    nombre_producto: document.getElementById('edit-product-name').value,
    marca: document.getElementById('edit-product-brand').value,
    modelo: document.getElementById('edit-product-model').value,
    subcategoria: document.getElementById('edit-product-subcategoria').value,
    activo: document.getElementById('edit-product-status').value === 'true',
    // ✅ NUEVO: Configuración de etiqueta
    mostrar_qr: document.getElementById('edit-product-mostrar-qr').value === 'true',
    mostrar_nombre: document.getElementById('edit-product-mostrar-nombre').value === 'true',
    mostrar_id: document.getElementById('edit-product-mostrar-id').value === 'true',
    mostrar_unidad: document.getElementById('edit-product-mostrar-unidad').value === 'true',
    mostrar_modelo: document.getElementById('edit-product-mostrar-modelo').value === 'true'
};

// Backend (server.js):
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombre_producto, 
            marca, 
            modelo, 
            subcategoria, 
            activo,
            mostrar_qr,
            mostrar_nombre,
            mostrar_id,
            mostrar_unidad,
            mostrar_modelo
        } = req.body;
        
        await pool.query(`
            UPDATE productos 
            SET 
                nombre_producto = $1,
                marca = $2,
                modelo = $3,
                subcategoria = $4,
                activo = $5,
                mostrar_qr = $6,
                mostrar_nombre = $7,
                mostrar_id = $8,
                mostrar_unidad = $9,
                mostrar_modelo = $10
            WHERE id_producto = $11
        `, [
            nombre_producto, 
            marca, 
            modelo, 
            subcategoria, 
            activo,
            mostrar_qr,
            mostrar_nombre,
            mostrar_id,
            mostrar_unidad,
            mostrar_modelo,
            id
        ]);
        
        res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

---

### 5. Generar ZPL Personalizado

**Archivo**: `server.js` (función `generateDoubleZPL`)

```javascript
function generateDoubleZPL(solicitud, producto) {
    const { 
        mostrar_qr = true, 
        mostrar_nombre = true,
        mostrar_id = false,
        mostrar_unidad = true,
        mostrar_modelo = true
    } = producto;
    
    let zpl = '^XA\n';
    zpl += '^CI28\n'; // UTF-8
    zpl += '^PW400\n'; // Ancho
    
    let yPos = 20; // Posición Y inicial
    
    // QR Code (izquierda)
    if (mostrar_qr) {
        zpl += `^FO20,${yPos}^BQN,2,4^FDQA,${solicitud.qr_code}^FS\n`;
    }
    
    // Textos (derecha del QR o todo el espacio si no hay QR)
    const xPosTexto = mostrar_qr ? 150 : 20;
    const anchoTexto = mostrar_qr ? 200 : 360;
    
    if (mostrar_nombre) {
        zpl += `^FO${xPosTexto},${yPos}^FB${anchoTexto},2,0,L^A0N,40,30^FD${producto.nombre_producto}^FS\n`;
        yPos += 60;
    }
    
    if (mostrar_modelo && producto.modelo) {
        zpl += `^FO${xPosTexto},${yPos}^FB${anchoTexto},1,0,L^A0N,30,25^FD${producto.modelo}^FS\n`;
        yPos += 40;
    }
    
    if (mostrar_id) {
        zpl += `^FO${xPosTexto},${yPos}^FB${anchoTexto},1,0,L^A0N,25,20^FDID: ${solicitud.id_solicitud}^FS\n`;
        yPos += 35;
    }
    
    if (mostrar_unidad && producto.unidad_medida) {
        zpl += `^FO${xPosTexto},${yPos}^FB${anchoTexto},1,0,L^A0N,25,20^FD${producto.unidad_medida}^FS\n`;
    }
    
    zpl += '^XZ\n';
    
    return zpl;
}
```

---

## 📋 Checklist de Implementación

### Fase 1: Frontend
- [ ] Agregar HTML de botones toggle al modal
- [ ] Agregar estilos CSS para botones activo/inactivo
- [ ] Implementar función `toggleLabelField()`
- [ ] Implementar función `updateLabelPreview()` (opcional)
- [ ] Modificar función `editProduct()` para cargar configuración
- [ ] Modificar submit del formulario para enviar configuración

### Fase 2: Backend
- [ ] Actualizar GET `/api/productos/:id` para incluir columnas `mostrar_*`
- [ ] Actualizar PUT `/api/productos/:id` para guardar configuración
- [ ] Modificar función `generateDoubleZPL()` para formatos personalizados
- [ ] Testing de diferentes combinaciones

### Fase 3: Testing
- [ ] Probar toggle de cada botón
- [ ] Verificar que se guarda en base de datos
- [ ] Probar impresión con QR desactivado
- [ ] Probar impresión con diferentes combinaciones
- [ ] Ajustar tamaños de fuente según espacio disponible

---

## 🎯 Resultado Esperado

### Configuración 1: Todo Activo
```
┌─────────────────────────────────┐
│  ████  SABANA BP 1.5P           │
│  ████  ESPECIAL 30CM            │
│  ████  2 PLAZAS                 │
│        ID: 208                  │
│        UNIDAD                   │
└─────────────────────────────────┘
```

### Configuración 2: Sin QR, Sin ID
```
┌─────────────────────────────────┐
│  SABANA BP 1.5P                 │
│  ESPECIAL 30CM                  │
│                                 │
│  2 PLAZAS                       │
│                                 │
│  UNIDAD                         │
└─────────────────────────────────┘
```

### Configuración 3: Solo Nombre y Modelo (texto grande)
```
┌─────────────────────────────────┐
│                                 │
│  SABANA BP 1.5P                 │
│  ESPECIAL 30CM                  │
│                                 │
│  2 PLAZAS                       │
│                                 │
└─────────────────────────────────┘
```

---

**Estado**: ⏳ Pendiente de implementación  
**Prioridad**: Media (funcionalidad extra)  
**Estimación**: 2-3 horas de trabajo  
**Última actualización**: 15 de octubre de 2025 - 21:00
