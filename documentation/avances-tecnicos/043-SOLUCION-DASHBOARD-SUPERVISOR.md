# 🔧 SOLUCIÓN: Dashboard Supervisor No Se Actualiza

**Fecha**: 15 de octubre de 2025 - 20:15  
**Problema**: Las solicitudes con `auto_services=true` se crean y completan correctamente en el dashboard de costurera, pero **NO aparecen en el dashboard de supervisor**.

---

## ❌ Problema Identificado

### Flujo del Problema:
```
1. Costurera crea solicitud (con auto_services=true)
   ↓
2. Backend crea solicitud con estado='proceso' (NO 'pendiente')
   ↓
3. Se imprime automáticamente
   ↓
4. Estado cambia a 'completada'
   ↓
5. ✅ Dashboard costurera muestra "COMPLETADA"
   ↓
6. ❌ Dashboard supervisor NO muestra NADA
```

### Causa Raíz:
El dashboard de supervisor **SOLO consultaba solicitudes con estado `'pendiente'`**:

```javascript
// ANTES (server.js línea 3593)
WHERE se.estado = 'pendiente'  // ❌ Solo pendientes
```

**Resultado**: Las solicitudes con `auto_services=true`:
- ✅ Se crean con estado `'proceso'` (no 'pendiente')
- ✅ Se imprimen automáticamente
- ✅ Se completan automáticamente
- ❌ **NUNCA aparecen en dashboard supervisor porque NUNCA tienen estado 'pendiente'**

---

## ✅ Solución Implementada

### 1. Nuevo Endpoint: `/api/supervisor/solicitudes-recientes`

**Ubicación**: `server.js` línea ~3625

```javascript
app.get('/api/supervisor/solicitudes-recientes', async (req, res) => {
    try {
        console.log('📋 Obteniendo solicitudes recientes para supervisor...');
        
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada as cantidad_productos,
                se.fecha_solicitud as fecha_creacion,
                se.prioridad,
                se.observaciones,
                se.estado,                          // ✅ Incluye TODOS los estados
                p.nombre_producto,
                u.nombre_completo as costurera,
                u.auto_services,                    // ✅ Muestra si es auto-servicio
                EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/60 as minutos_desde_creacion
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.fecha_solicitud >= NOW() - INTERVAL '24 hours'  // ✅ Últimas 24 horas
            ORDER BY se.fecha_solicitud DESC
            LIMIT 100
        `);
        
        console.log(`✅ Encontradas ${result.rows.length} solicitudes recientes`);
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo solicitudes recientes:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

**Características**:
- ✅ Trae solicitudes de **TODOS los estados** (pendiente, proceso, completada, cancelada)
- ✅ Incluye bandera `auto_services` para identificar solicitudes automáticas
- ✅ Últimas 24 horas
- ✅ Calcula tiempo transcurrido desde creación

---

### 2. Nueva Sección en Dashboard Supervisor

**Ubicación**: `supervisor-dashboard.html` línea ~2455

#### A. Interfaz con Pestañas de Filtro

```html
<!-- Sección TODAS LAS SOLICITUDES RECIENTES (últimas 24 horas) -->
<div class="section-card">
    <div class="section-header">
        <div class="section-icon">📋</div>
        <h2 class="section-title">Solicitudes Recientes (24h)</h2>
        <button class="refresh-btn" onclick="refreshTodasSolicitudes()">
            🔄 Actualizar
        </button>
    </div>
    
    <!-- Pestañas de filtro -->
    <div class="solicitudes-tabs">
        <button class="tab-btn active" onclick="filtrarSolicitudesPorEstado('todas')">
            🌐 Todas (<span id="count-todas">0</span>)
        </button>
        <button class="tab-btn" onclick="filtrarSolicitudesPorEstado('pendiente')">
            ⏳ Pendientes (<span id="count-pendiente">0</span>)
        </button>
        <button class="tab-btn" onclick="filtrarSolicitudesPorEstado('proceso')">
            🔄 En Proceso (<span id="count-proceso">0</span>)
        </button>
        <button class="tab-btn" onclick="filtrarSolicitudesPorEstado('completada')">
            ✅ Completadas (<span id="count-completada">0</span>)
        </button>
    </div>
    
    <!-- Lista de solicitudes -->
    <div class="pending-list" id="todas-solicitudes-list">
        <!-- Se llena dinámicamente -->
    </div>
</div>
```

#### B. Estilos CSS para Pestañas

**Ubicación**: `supervisor-dashboard.html` línea ~530

```css
/* Estilos para las pestañas de filtro de solicitudes */
.solicitudes-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    background: rgba(255, 255, 255, 0.6);
    padding: 10px;
    border-radius: 10px;
}

.tab-btn {
    flex: 1;
    min-width: 120px;
    padding: 12px 16px;
    border: 2px solid rgba(236, 72, 153, 0.3);
    background: white;
    color: #666;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab-btn.active {
    background: linear-gradient(135deg, #ec4899, #d946ef);
    color: white;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
}

.tab-btn span {
    background: rgba(255, 255, 255, 0.3);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
}
```

---

### 3. Funciones JavaScript

**Ubicación**: `supervisor-dashboard.html` línea ~3205

#### A. Cargar Todas las Solicitudes

```javascript
// Variables globales
let todasLasSolicitudesCache = [];
let estadoFiltroActual = 'todas';

// Cargar TODAS las solicitudes recientes (últimas 24 horas)
async function loadTodasLasSolicitudes() {
    try {
        console.log('📋 Cargando TODAS las solicitudes recientes...');
        
        const response = await fetch('/api/supervisor/solicitudes-recientes', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar solicitudes');
        }
        
        todasLasSolicitudesCache = await response.json();
        console.log(`✅ Cargadas ${todasLasSolicitudesCache.length} solicitudes recientes`);
        
        // Actualizar contadores
        actualizarContadoresPorEstado();
        
        // Mostrar solicitudes según filtro actual
        mostrarSolicitudesFiltradas();
        
    } catch (error) {
        console.error('Error cargando todas las solicitudes:', error);
    }
}
```

#### B. Actualizar Contadores

```javascript
// Actualizar contadores por estado
function actualizarContadoresPorEstado() {
    const contadores = {
        todas: todasLasSolicitudesCache.length,
        pendiente: todasLasSolicitudesCache.filter(s => s.estado === 'pendiente').length,
        proceso: todasLasSolicitudesCache.filter(s => s.estado === 'proceso').length,
        completada: todasLasSolicitudesCache.filter(s => s.estado === 'completada').length
    };
    
    document.getElementById('count-todas').textContent = contadores.todas;
    document.getElementById('count-pendiente').textContent = contadores.pendiente;
    document.getElementById('count-proceso').textContent = contadores.proceso;
    document.getElementById('count-completada').textContent = contadores.completada;
}
```

#### C. Filtrar por Estado

```javascript
// Filtrar solicitudes por estado
function filtrarSolicitudesPorEstado(estado) {
    estadoFiltroActual = estado;
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.estado === estado) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar solicitudes filtradas
    mostrarSolicitudesFiltradas();
}
```

#### D. Mostrar Solicitudes

```javascript
// Mostrar solicitudes según filtro actual
function mostrarSolicitudesFiltradas() {
    let solicitudesFiltradas = todasLasSolicitudesCache;
    
    if (estadoFiltroActual !== 'todas') {
        solicitudesFiltradas = todasLasSolicitudesCache.filter(
            s => s.estado === estadoFiltroActual
        );
    }
    
    const list = document.getElementById('todas-solicitudes-list');
    
    if (solicitudesFiltradas.length === 0) {
        list.innerHTML = '<div class="empty-state">🎉 No hay solicitudes</div>';
        return;
    }
    
    list.innerHTML = solicitudesFiltradas.map(solicitud => {
        const estadoBadge = getEstadoBadge(solicitud.estado);
        const autoServicesBadge = solicitud.auto_services ? 
            '<span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 600;">🤖 AUTO</span>' : '';
        
        const minutos = Math.floor(solicitud.minutos_desde_creacion);
        const tiempoTexto = minutos < 60 ? 
            `${minutos} min` : 
            `${Math.floor(minutos/60)}h ${minutos%60}min`;
        
        return `
            <div class="pending-item" data-solicitud-id="${solicitud.id_solicitud}">
                <div class="pending-header">
                    <div class="pending-info">
                        <div class="pending-title">
                            ${solicitud.costurera} - ${solicitud.nombre_producto}
                            ${estadoBadge}
                            ${autoServicesBadge}
                        </div>
                        <div class="pending-details">
                            Cantidad: ${solicitud.cantidad_productos} | 
                            Solicitud: ${solicitud.numero_solicitud} |
                            Hace: ${tiempoTexto}
                        </div>
                    </div>
                </div>
                ${solicitud.estado === 'pendiente' ? `
                <div class="pending-actions">
                    <button class="action-btn approve-btn" 
                            onclick="changeSolicitudState(${solicitud.id_solicitud}, 'proceso', 'Aprobada')">
                        ✅ Aprobar
                    </button>
                    <button class="action-btn reject-btn" 
                            onclick="changeSolicitudState(${solicitud.id_solicitud}, 'cancelada')">
                        ❌ Rechazar
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Obtener badge HTML según estado
function getEstadoBadge(estado) {
    const badges = {
        pendiente: '<span style="background: #fbbf24; color: #78350f; padding: 4px 10px; border-radius: 6px;">⏳ PENDIENTE</span>',
        proceso: '<span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px;">🔄 PROCESO</span>',
        completada: '<span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 6px;">✅ COMPLETADA</span>',
        cancelada: '<span style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px;">❌ CANCELADA</span>'
    };
    return badges[estado] || '';
}
```

---

### 4. Auto-Reload Actualizado

**Ubicación**: `supervisor-dashboard.html` línea ~5752

```javascript
// Verificar cambios y recargar automáticamente
async function verificarCambiosSupervisor() {
    try {
        const response = await fetch('/api/stats-rapidas', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) return;
        
        const stats = await response.json();
        
        // Si es la primera vez, solo guardar
        if (lastStatsSupervisor === null) {
            lastStatsSupervisor = stats;
            return;
        }
        
        // Verificar si hay cambios
        const cambiosDetectados = 
            stats.pendientes !== lastStatsSupervisor.pendientes ||
            stats.en_proceso !== lastStatsSupervisor.en_proceso ||
            stats.completadas !== lastStatsSupervisor.completadas;
        
        if (cambiosDetectados) {
            console.log('🔄 Cambios detectados! Recargando...');
            
            // ✅ Recargar TODAS las solicitudes (incluye auto-services)
            await loadTodasLasSolicitudes();
            await loadStats();
            
            lastStatsSupervisor = stats;
            
            mostrarNotificacionSupervisor('Solicitudes actualizadas');
        }
        
    } catch (error) {
        console.error('Error en verificarCambiosSupervisor:', error);
    }
}
```

---

## 🎯 Resultado Final

### Antes:
```
Dashboard Supervisor:
┌────────────────────────────┐
│ Solicitudes Pendientes (0) │  ❌ Vacío (no muestra auto-services)
└────────────────────────────┘
```

### Ahora:
```
Dashboard Supervisor:
┌─────────────────────────────────────────────────────────────┐
│ Solicitudes Recientes (24h)          🔄 Actualizar          │
├─────────────────────────────────────────────────────────────┤
│ [🌐 Todas (5)] [⏳ Pendientes (1)] [🔄 Proceso (1)] [✅ Completadas (3)] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ RUTH CORRALES - SABANA BP 1.5P         🤖 AUTO          │
│    Cantidad: 2 | SOL-1760556355889 | Hace: 5 min           │
│    Estado: ✅ COMPLETADA                                    │
│                                                             │
│ ✅ MARIA LOPEZ - COBERTOR 2P            🤖 AUTO            │
│    Cantidad: 3 | SOL-1760556423156 | Hace: 12 min          │
│    Estado: ✅ COMPLETADA                                    │
│                                                             │
│ ⏳ DORIS MAMANI - FRAZADA 1.5P                             │
│    Cantidad: 1 | SOL-1760556498745 | Hace: 3 min           │
│    Estado: ⏳ PENDIENTE                                     │
│    [✅ Aprobar] [❌ Rechazar]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Características de la Solución

### 1. Visibilidad Completa
- ✅ Muestra **TODAS** las solicitudes de las últimas 24 horas
- ✅ Incluye solicitudes con `auto_services=true` 
- ✅ Badge especial "🤖 AUTO" para identificar auto-servicios
- ✅ Muestra tiempo transcurrido desde creación

### 2. Filtros Interactivos
- 🌐 **Todas**: Ver todas las solicitudes recientes
- ⏳ **Pendientes**: Solo las que requieren aprobación manual
- 🔄 **En Proceso**: Las que fueron aprobadas pero aún no impresas
- ✅ **Completadas**: Las que ya fueron impresas y completadas

### 3. Contadores en Tiempo Real
- Cada pestaña muestra el número de solicitudes en ese estado
- Se actualizan automáticamente cada 10 segundos

### 4. Auto-Reload
- Verifica cambios cada 10 segundos
- Recarga automáticamente cuando detecta nuevas solicitudes
- Notificación visual cuando se actualizan datos

### 5. Acciones Contextuales
- Solicitudes **pendientes**: Mostrar botones "Aprobar" y "Rechazar"
- Solicitudes **proceso/completadas**: Solo mostrar información

---

## 🚀 Próximos Pasos

1. **Reiniciar servidor**: `node server.js`
2. **Abrir dashboard de supervisor**
3. **Verificar sección "Solicitudes Recientes (24h)"**
4. **Crear solicitud con costurera que tiene `auto_services=true`**
5. **Ver que aparece en dashboard supervisor con badge "🤖 AUTO"**
6. **Verificar que cambia de "PROCESO" a "COMPLETADA" automáticamente**

---

## 📊 Diagrama de Flujo Actualizado

```
┌─────────────────────────────────────────────────────────┐
│ Costurera crea solicitud                                │
│ (con auto_services=true)                                │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Backend: estado='proceso' (NO 'pendiente')              │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Imprime automáticamente                                 │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ Estado cambia a 'completada'                            │
└────────────────┬────────────────────────────────────────┘
                 ↓
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
┌──────────────┐  ┌──────────────────────┐
│ Dashboard    │  │ Dashboard Supervisor │
│ Costurera    │  │                      │
│ ✅ Muestra   │  │ ✅ AHORA MUESTRA     │
│ COMPLETADA   │  │ en "Solicitudes      │
│              │  │ Recientes (24h)"     │
│              │  │                      │
│              │  │ 🔄 Pestaña PROCESO   │
│              │  │ ✅ Pestaña COMPLETADA│
│              │  │ 🤖 Badge AUTO        │
└──────────────┘  └──────────────────────┘
```

---

**Estado**: ✅ Dashboard supervisor ahora muestra TODAS las solicitudes  
**Última actualización**: 15 de octubre de 2025 - 20:30
