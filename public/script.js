// =============================================
// SCRIPT.JS - FUNCIONALIDAD DEL CLIENTE
// JavaScript para la aplicación de etiquetas QR
// =============================================

// Variables globales
let datosUsuarios = [];
let datosProductos = [];
let datosSolicitudes = [];

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de Etiquetas QR');
    
    // Inicializar tabs
    inicializarTabs();
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Configurar formulario
    configurarFormulario();
    
    // Configurar modal
    configurarModal();
    
    // Actualizar fecha por defecto
    document.getElementById('inputFechaProduccion').value = new Date().toISOString().split('T')[0];
});

// =============================================
// SISTEMA DE TABS
// =============================================
function inicializarTabs() {
    const botonesTabs = document.querySelectorAll('.tab-button');
    const contenidoTabs = document.querySelectorAll('.tab-content');
    
    botonesTabs.forEach(boton => {
        boton.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y contenidos
            botonesTabs.forEach(b => b.classList.remove('active'));
            contenidoTabs.forEach(c => c.classList.remove('active'));
            
            // Agregar clase active al botón clickeado y su contenido
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Cargar datos específicos del tab
            switch(tabId) {
                case 'solicitudes':
                    cargarSolicitudes();
                    break;
                case 'productos':
                    cargarProductos();
                    break;
                case 'usuarios':
                    cargarUsuarios();
                    break;
            }
        });
    });
}

// =============================================
// CARGA DE DATOS
// =============================================
async function cargarDatosIniciales() {
    try {
        actualizarEstadoConexion('🟡', 'Conectando...');
        
        // Cargar estadísticas
        await cargarEstadisticas();
        
        // Cargar datos para los selectores
        await cargarUsuarios();
        await cargarProductos();
        
        // Cargar solicitudes por defecto
        await cargarSolicitudes();
        
        actualizarEstadoConexion('🟢', 'Conectado');
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        actualizarEstadoConexion('🔴', 'Error de conexión');
        mostrarModal('Error de Conexión', 'No se pudo conectar con el servidor. Verifique que el servidor esté ejecutándose.');
    }
}

async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        const stats = await response.json();
        
        document.getElementById('totalSolicitudes').textContent = stats.total_solicitudes || 0;
        document.getElementById('solicitudesPendientes').textContent = stats.solicitudes_pendientes || 0;
        document.getElementById('solicitudesProceso').textContent = stats.solicitudes_proceso || 0;
        document.getElementById('solicitudesCompletadas').textContent = stats.solicitudes_completadas || 0;
        document.getElementById('totalEtiquetas').textContent = stats.total_etiquetas_solicitadas || 0;
        document.getElementById('totalProductos').textContent = stats.total_productos || 0;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        datosUsuarios = await response.json();
        
        // Llenar tabla de usuarios
        llenarTablaUsuarios();
        
        // Llenar selector de usuarios en formulario
        llenarSelectorUsuarios();
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        datosProductos = await response.json();
        
        // Llenar tabla de productos
        llenarTablaProductos();
        
        // Llenar selector de productos en formulario
        llenarSelectorProductos();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

async function cargarSolicitudes() {
    try {
        const response = await fetch('/api/solicitudes');
        datosSolicitudes = await response.json();
        
        // Llenar tabla de solicitudes
        llenarTablaSolicitudes();
        
        // Actualizar estadísticas
        await cargarEstadisticas();
        
    } catch (error) {
        console.error('Error cargando solicitudes:', error);
    }
}

// =============================================
// LLENAR TABLAS
// =============================================
function llenarTablaUsuarios() {
    const tbody = document.querySelector('#tablaUsuarios tbody');
    tbody.innerHTML = '';
    
    datosUsuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${usuario.codigo_empleado}</td>
            <td>${usuario.nombre_completo}</td>
            <td>${usuario.nombre_departamento}</td>
            <td>${usuario.puesto || 'No especificado'}</td>
            <td>${usuario.nivel_acceso}</td>
            <td>${formatearFecha(usuario.fecha_ingreso)}</td>
            <td>${usuario.activo ? '✅ Activo' : '❌ Inactivo'}</td>
        `;
        tbody.appendChild(fila);
    });
}

function llenarTablaProductos() {
    const tbody = document.querySelector('#tablaProductos tbody');
    tbody.innerHTML = '';
    
    datosProductos.forEach(producto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${producto.codigo_producto}</strong></td>
            <td>${producto.nombre_producto}</td>
            <td>${producto.categoria || '-'}</td>
            <td>${producto.subcategoria || '-'}</td>
            <td>${producto.marca || '-'}</td>
            <td>${producto.modelo || '-'}</td>
            <td>${producto.activo ? '✅ Activo' : '❌ Inactivo'}</td>
        `;
        tbody.appendChild(fila);
    });
}

function llenarTablaSolicitudes() {
    const tbody = document.querySelector('#tablaSolicitudes tbody');
    tbody.innerHTML = '';
    
    datosSolicitudes.forEach(solicitud => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${solicitud.numero_solicitud}</strong></td>
            <td>${solicitud.operario}</td>
            <td>${solicitud.nombre_departamento}</td>
            <td>${solicitud.nombre_producto}</td>
            <td>${solicitud.lote_produccion}</td>
            <td>${solicitud.cantidad_solicitada}</td>
            <td><span class="prioridad-${solicitud.prioridad}">${capitalizarPrioridad(solicitud.prioridad)}</span></td>
            <td><span class="estado-${solicitud.estado}">${capitalizarEstado(solicitud.estado)}</span></td>
            <td>${formatearFecha(solicitud.fecha_solicitud)}</td>
        `;
        tbody.appendChild(fila);
    });
}

// =============================================
// LLENAR SELECTORES
// =============================================
function llenarSelectorUsuarios() {
    const select = document.getElementById('selectUsuario');
    select.innerHTML = '<option value="">Seleccione un operario...</option>';
    
    datosUsuarios.forEach(usuario => {
        if (usuario.activo) {
            const option = document.createElement('option');
            option.value = usuario.id_usuario;
            option.textContent = `${usuario.nombre_completo} (${usuario.nombre_departamento})`;
            select.appendChild(option);
        }
    });
}

function llenarSelectorProductos() {
    const select = document.getElementById('selectProducto');
    select.innerHTML = '<option value="">Seleccione un producto...</option>';
    
    datosProductos.forEach(producto => {
        if (producto.activo) {
            const option = document.createElement('option');
            option.value = producto.id_producto;
            option.textContent = `${producto.codigo_producto} - ${producto.nombre_producto}`;
            select.appendChild(option);
        }
    });
}

// =============================================
// FORMULARIO
// =============================================
function configurarFormulario() {
    const form = document.getElementById('formNuevaSolicitud');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const datosSolicitud = {
            id_usuario: parseInt(document.getElementById('selectUsuario').value),
            id_producto: parseInt(document.getElementById('selectProducto').value),
            lote_produccion: document.getElementById('inputLote').value,
            cantidad_solicitada: parseInt(document.getElementById('inputCantidad').value),
            fecha_produccion: document.getElementById('inputFechaProduccion').value,
            prioridad: document.getElementById('selectPrioridad').value,
            observaciones: document.getElementById('inputObservaciones').value
        };
        
        // Validaciones
        if (!validarFormulario(datosSolicitud)) {
            return;
        }
        
        try {
            const response = await fetch('/api/solicitudes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosSolicitud)
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                mostrarModal('¡Éxito!', `Solicitud creada exitosamente: ${resultado.solicitud.numero_solicitud}`);
                
                // Limpiar formulario
                form.reset();
                document.getElementById('inputFechaProduccion').value = new Date().toISOString().split('T')[0];
                
                // Recargar datos
                await cargarSolicitudes();
                
                // Cambiar a tab de solicitudes
                document.querySelector('[data-tab="solicitudes"]').click();
                
            } else {
                mostrarModal('Error', resultado.error || 'Error al crear la solicitud');
            }
            
        } catch (error) {
            console.error('Error creando solicitud:', error);
            mostrarModal('Error de Conexión', 'No se pudo crear la solicitud. Verifique la conexión con el servidor.');
        }
    });
}

function validarFormulario(datos) {
    if (!datos.id_usuario) {
        mostrarModal('Error de Validación', 'Debe seleccionar un operario.');
        return false;
    }
    
    if (!datos.id_producto) {
        mostrarModal('Error de Validación', 'Debe seleccionar un producto.');
        return false;
    }
    
    if (!datos.lote_produccion) {
        mostrarModal('Error de Validación', 'Debe ingresar el lote de producción.');
        return false;
    }
    
    if (!datos.cantidad_solicitada || datos.cantidad_solicitada < 1) {
        mostrarModal('Error de Validación', 'La cantidad debe ser mayor a 0.');
        return false;
    }
    
    if (!datos.fecha_produccion) {
        mostrarModal('Error de Validación', 'Debe seleccionar la fecha de producción.');
        return false;
    }
    
    return true;
}

// =============================================
// MODAL
// =============================================
function configurarModal() {
    const modal = document.getElementById('messageModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function mostrarModal(titulo, mensaje) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = mensaje;
    document.getElementById('messageModal').style.display = 'block';
}

// =============================================
// UTILIDADES
// =============================================
function formatearFecha(fechaString) {
    if (!fechaString) return '-';
    
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function capitalizarPrioridad(prioridad) {
    const prioridades = {
        'baja': 'Baja',
        'normal': 'Normal',
        'alta': 'Alta',
        'urgente': 'Urgente'
    };
    return prioridades[prioridad] || prioridad;
}

function capitalizarEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'proceso': 'En Proceso',
        'completada': 'Completada',
        'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
}

function actualizarEstadoConexion(indicador, texto) {
    document.getElementById('statusIndicator').textContent = indicador;
    document.getElementById('statusText').textContent = texto;
}

// =============================================
// FUNCIONES DE RECARGA AUTOMÁTICA
// =============================================

// Recargar estadísticas cada 30 segundos
setInterval(async function() {
    try {
        await cargarEstadisticas();
    } catch (error) {
        console.warn('Error en recarga automática de estadísticas');
    }
}, 30000);

// =============================================
// LOG DE DEBUG
// =============================================
console.log('📊 Script de Etiquetas QR cargado correctamente');

// Exponer funciones globales para debugging
window.app = {
    cargarDatos: cargarDatosIniciales,
    cargarSolicitudes: cargarSolicitudes,
    datosUsuarios: () => datosUsuarios,
    datosProductos: () => datosProductos,
    datosSolicitudes: () => datosSolicitudes
};