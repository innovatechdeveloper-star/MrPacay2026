# FASE 3: Guía de implementación Frontend
## Fecha: 18 de octubre de 2025

---

## ✅ COMPLETADO EN SERVER.JS:

### 1. Endpoints de entidades creados (línea ~2520):
- GET `/api/entidades` - Obtener todas las entidades activas
- POST `/api/entidades` - Crear nueva entidad
- PUT `/api/entidades/:id` - Actualizar entidad
- DELETE `/api/entidades/:id` - Eliminar entidad (soft delete)

### 2. Campo `empresa` agregado en endpoints:
- `/api/crear-solicitud` - Ahora acepta `empresa` (default: 'HECHO EN PERU')
- `/api/crear-solicitud-especial` - Ahora acepta `empresa`

### 3. Código producto auto-generado:
- `/api/productos-especiales` - `codigo_producto` ahora es opcional (trigger lo genera como ESP-001)

---

## 📋 PENDIENTE EN FRONTEND:

### A. SUPERVISOR-DASHBOARD.HTML - Agregar sección "Entidades"

#### 1. Agregar botón en navegación principal (buscar donde están los otros nav-buttons):

```html
<button class="nav-btn" onclick="switchToEntidades()">
    🏢 Entidades
</button>
```

#### 2. Agregar vista de entidades (después de otras views):

```html
<!-- Vista: Gestión de Entidades -->
<div class="view-container" id="entidades-view" style="display: none;">
    <div class="content-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #333;">🏢 Gestión de Entidades</h2>
            <button class="action-btn" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="abrirModalNuevaEntidad()">
                ➕ Nueva Entidad
            </button>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-value" id="total-entidades">0</div>
                <div class="stat-label">Total Entidades</div>
            </div>
        </div>

        <table class="styled-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody id="entidades-tbody">
                <tr><td colspan="4" class="loading">Cargando entidades...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Modal: Nueva Entidad -->
<div class="modal-overlay" id="modal-nueva-entidad" style="display: none;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>🏢 Nueva Entidad</h3>
            <button class="modal-close" onclick="cerrarModalNuevaEntidad()">✕</button>
        </div>
        <form id="form-nueva-entidad" onsubmit="crearEntidad(event)">
            <div class="form-group">
                <label for="nombre-entidad">Nombre de la Entidad *</label>
                <input type="text" id="nombre-entidad" required 
                       placeholder="Ej: PRODUCTOS AVALON S.A.C"
                       style="text-transform: uppercase;">
                <small style="color: #666;">Se guardará en mayúsculas automáticamente</small>
            </div>
            <div class="modal-actions">
                <button type="button" class="action-btn" style="background: #9ca3af;" onclick="cerrarModalNuevaEntidad()">
                    Cancelar
                </button>
                <button type="submit" class="action-btn" style="background: linear-gradient(135deg, #10b981, #059669);">
                    ✅ Crear Entidad
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Modal: Editar Entidad -->
<div class="modal-overlay" id="modal-editar-entidad" style="display: none;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>✏️ Editar Entidad</h3>
            <button class="modal-close" onclick="cerrarModalEditarEntidad()">✕</button>
        </div>
        <form id="form-editar-entidad" onsubmit="actualizarEntidad(event)">
            <input type="hidden" id="edit-entidad-id">
            <div class="form-group">
                <label for="edit-nombre-entidad">Nombre de la Entidad *</label>
                <input type="text" id="edit-nombre-entidad" required 
                       style="text-transform: uppercase;">
            </div>
            <div class="modal-actions">
                <button type="button" class="action-btn" style="background: #9ca3af;" onclick="cerrarModalEditarEntidad()">
                    Cancelar
                </button>
                <button type="submit" class="action-btn" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                    💾 Guardar Cambios
                </button>
            </div>
        </form>
    </div>
</div>
```

#### 3. Agregar funciones JavaScript (al final del <script>):

```javascript
// ========================================
// GESTIÓN DE ENTIDADES
// ========================================

let entidadesCache = [];

// Cambiar a vista de entidades
function switchToEntidades() {
    document.querySelectorAll('.view-container').forEach(view => view.style.display = 'none');
    document.getElementById('entidades-view').style.display = 'block';
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    cargarEntidades();
}

// Cargar entidades desde API
async function cargarEntidades() {
    try {
        const response = await fetch('/api/entidades', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Error al cargar entidades');
        
        entidadesCache = await response.json();
        console.log(`✅ Cargadas ${entidadesCache.length} entidades`);
        
        document.getElementById('total-entidades').textContent = entidadesCache.length;
        
        const tbody = document.getElementById('entidades-tbody');
        
        if (entidadesCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">No hay entidades registradas</td></tr>';
            return;
        }
        
        tbody.innerHTML = entidadesCache.map(entidad => `
            <tr>
                <td>${entidad.id_entidad}</td>
                <td><strong>${entidad.nombre_entidad}</strong></td>
                <td>${new Date(entidad.fecha_creacion).toLocaleDateString('es-PE')}</td>
                <td>
                    <button class="action-btn" style="background: #3b82f6; padding: 8px 12px; font-size: 13px;" 
                            onclick="abrirModalEditarEntidad(${entidad.id_entidad}, '${entidad.nombre_entidad}')">
                        ✏️ Editar
                    </button>
                    <button class="action-btn reject-btn" style="padding: 8px 12px; font-size: 13px;" 
                            onclick="eliminarEntidad(${entidad.id_entidad}, '${entidad.nombre_entidad}')">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error cargando entidades:', error);
        document.getElementById('entidades-tbody').innerHTML = 
            '<tr><td colspan="4" style="text-align: center; color: #ef4444;">❌ Error cargando entidades</td></tr>';
    }
}

// Abrir modal nueva entidad
function abrirModalNuevaEntidad() {
    document.getElementById('modal-nueva-entidad').style.display = 'flex';
    document.getElementById('nombre-entidad').value = '';
    document.getElementById('nombre-entidad').focus();
}

// Cerrar modal nueva entidad
function cerrarModalNuevaEntidad() {
    document.getElementById('modal-nueva-entidad').style.display = 'none';
}

// Crear entidad
async function crearEntidad(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre-entidad').value.trim().toUpperCase();
    
    if (!nombre) {
        alert('El nombre de la entidad es requerido');
        return;
    }
    
    try {
        const response = await fetch('/api/entidades', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre_entidad: nombre })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al crear entidad');
        }
        
        console.log('✅ Entidad creada:', data);
        alert('✅ Entidad creada exitosamente');
        cerrarModalNuevaEntidad();
        cargarEntidades();
        
    } catch (error) {
        console.error('❌ Error creando entidad:', error);
        alert('❌ ' + error.message);
    }
}

// Abrir modal editar entidad
function abrirModalEditarEntidad(id, nombreActual) {
    document.getElementById('modal-editar-entidad').style.display = 'flex';
    document.getElementById('edit-entidad-id').value = id;
    document.getElementById('edit-nombre-entidad').value = nombreActual;
    document.getElementById('edit-nombre-entidad').focus();
}

// Cerrar modal editar entidad
function cerrarModalEditarEntidad() {
    document.getElementById('modal-editar-entidad').style.display = 'none';
}

// Actualizar entidad
async function actualizarEntidad(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-entidad-id').value;
    const nombre = document.getElementById('edit-nombre-entidad').value.trim().toUpperCase();
    
    if (!nombre) {
        alert('El nombre de la entidad es requerido');
        return;
    }
    
    try {
        const response = await fetch(`/api/entidades/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre_entidad: nombre })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al actualizar entidad');
        }
        
        console.log('✅ Entidad actualizada:', data);
        alert('✅ Entidad actualizada exitosamente');
        cerrarModalEditarEntidad();
        cargarEntidades();
        
    } catch (error) {
        console.error('❌ Error actualizando entidad:', error);
        alert('❌ ' + error.message);
    }
}

// Eliminar entidad
async function eliminarEntidad(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar la entidad "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/entidades/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al eliminar entidad');
        }
        
        console.log('✅ Entidad eliminada:', data);
        alert('✅ Entidad eliminada exitosamente');
        cargarEntidades();
        
    } catch (error) {
        console.error('❌ Error eliminando entidad:', error);
        alert('❌ ' + error.message);
    }
}
```

---

### B. COSTURERA-DASHBOARD.HTML - Agregar campo "Empresa"

#### 1. En el formulario de crear solicitud (buscar el form con id="nuevo-registro-form"):

Después del campo de observaciones, agregar:

```html
<div class="form-group">
    <label class="form-label" for="empresa">Empresa 🏢</label>
    <select class="form-input" id="empresa">
        <option value="HECHO EN PERU" selected>HECHO EN PERU</option>
        <!-- Se cargarán más opciones dinámicamente desde /api/entidades -->
    </select>
    <small style="color: #666; font-size: 12px;">
        💡 Selecciona la empresa para la etiqueta
    </small>
</div>
```

#### 2. Cargar entidades al iniciar (dentro de function loadData()):

```javascript
// Cargar entidades para dropdown
async function cargarEntidadesDropdown() {
    try {
        const response = await fetch('/api/entidades', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const entidades = await response.json();
            const select = document.getElementById('empresa');
            
            // Agregar entidades al select (mantener "HECHO EN PERU" como primera opción)
            entidades.forEach(ent => {
                if (ent.nombre_entidad !== 'HECHO EN PERU') {
                    const option = document.createElement('option');
                    option.value = ent.nombre_entidad;
                    option.textContent = ent.nombre_entidad;
                    select.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Error cargando entidades:', error);
    }
}

// Llamar en loadData()
await cargarEntidadesDropdown();
```

#### 3. Enviar empresa al crear solicitud (en el submit del form):

Buscar donde se hace el fetch a `/api/crear-solicitud` y agregar:

```javascript
const empresa = document.getElementById('empresa').value;

// En el body del fetch:
body: JSON.stringify({
    id_producto: productoSeleccionado.id_producto,
    cantidad_productos: parseInt(cantidadInput.value),
    prioridad: prioridadInput.value,
    observaciones: observacionesInput.value,
    empresa: empresa // AGREGAR ESTA LÍNEA
})
```

---

### C. OCULTAR CAMPO CÓDIGO EN PRODUCTOS ESPECIALES

En supervisor-dashboard.html, buscar el formulario de crear producto especial y:

```html
<!-- ELIMINAR o comentar este div -->
<!--
<div class="form-group">
    <label for="codigo-producto-especial">Código Producto *</label>
    <input type="text" id="codigo-producto-especial" required>
</div>
-->

<!-- Agregar mensaje informativo -->
<div class="alert-info" style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 15px; border-radius: 6px;">
    ℹ️ El código del producto especial se generará automáticamente (ESP-001, ESP-002, etc.)
</div>
```

Y en el JavaScript del submit, remover o comentar la línea que envía `codigo_producto`.

---

## 🎯 RESUMEN:

1. ✅ **Backend completado** - Endpoints listos
2. ⚠️ **Frontend pendiente** - Copiar código HTML/JS de esta guía
3. 📝 **Siguiente paso**: Aplicar los cambios en supervisor-dashboard.html y costurera-dashboard.html

---

## 🚀 TESTING:

Después de aplicar los cambios:

1. Reiniciar servidor: `node server.js`
2. Abrir supervisor-dashboard.html
3. Ir a sección "🏢 Entidades"
4. Crear entidades de prueba:
   - HECHO EN PERU (ya existe por default)
   - PRODUCTOS AVALON S.A.C
5. Ir a costurera-dashboard.html
6. Crear solicitud y verificar que aparece dropdown de empresa
7. Crear producto especial y verificar que código se genera automáticamente

---

Fecha: 18 de octubre de 2025
Versión: 1.0
