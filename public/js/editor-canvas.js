// =====================================================
// 🎨 EDITOR VISUAL DE ETIQUETAS - JavaScript
// =====================================================

// Inicializar canvas de Fabric.js
const canvas = new fabric.Canvas('canvas', {
    backgroundColor: '#ffffff',
    selection: true
});

// Configuración actual (Zebra ZD230 203 DPI)
// Etiquetas dobles lado a lado: 100mm x 25mm = 799 x 200 dots
// Cada etiqueta individual: 50mm x 25mm = 400 x 200 dots
let config = {
    nombre_plantilla: 'Nueva Plantilla',
    ancho_dots: 400,  // Una etiqueta individual
    alto_dots: 200,   // Alto de la etiqueta
    elementos: []
};

// Datos de prueba
let datosPrueba = {
    qr_code: 'SOL-000001',
    nombre_producto: 'SABANA 2 PLAZAS',
    modelo: 'QUEEN',
    unidad_medida: 'UM: UNIDAD',
    id_producto: 'ID: 123',
    empresa: 'HECHO EN PERU'
};

// Elemento seleccionado actualmente
let selectedElement = null;

// Modo actual: 'creacion' o 'visualizacion'
let modoActual = 'creacion';

// Lista de productos disponibles
let productosDisponibles = [];

// =====================================================
// INICIALIZACIÓN
// =====================================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🎨 Editor Visual inicializado');
    
    // Configurar drag & drop PRIMERO
    setupDragAndDrop();
    
    // Cargar datos de ejemplo
    await cargarDatosEjemplo();
    
    // Cargar lista de productos para el selector
    await cargarListaProductos();
    
    // Eventos del canvas
    setupCanvasEvents();
    
    // Mostrar toast de bienvenida
    mostrarToast('✨ Editor Visual listo. Arrastra campos al canvas para empezar.');
    
    console.log('✅ Editor Visual cargado correctamente');
});

// =====================================================
// DRAG & DROP
// =====================================================

function setupDragAndDrop() {
    const fieldItems = document.querySelectorAll('.field-item');
    console.log(`🔧 Configurando drag & drop para ${fieldItems.length} campos`);
    
    fieldItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.dataset.tipo} - ${item.dataset.campo}`);
        
        item.addEventListener('dragstart', (e) => {
            const tipo = e.target.dataset.tipo;
            const campo = e.target.dataset.campo;
            console.log(`🖱️ DRAG START: ${tipo} (${campo})`);
            e.dataTransfer.setData('tipo', tipo);
            e.dataTransfer.setData('campo', campo);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    // Eventos del canvas para drop
    // Usar el wrapper del canvas en lugar del canvas directamente para evitar conflictos con Fabric.js
    const canvasWrapper = canvas.wrapperEl;
    const canvasElement = document.getElementById('canvas');
    
    console.log('🎯 Canvas wrapper:', canvasWrapper ? 'Encontrado' : 'NO ENCONTRADO');
    console.log('🎯 Canvas element:', canvasElement ? 'Encontrado' : 'NO ENCONTRADO');
    
    if (!canvasWrapper) {
        console.error('❌ ERROR: No se encontró el wrapper del canvas');
        return;
    }
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        console.log('📍 DRAGOVER detectado');
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 DROP detectado!');
        
        const tipo = e.dataTransfer.getData('tipo');
        const campo = e.dataTransfer.getData('campo');
        
        console.log(`   → Tipo: ${tipo}, Campo: ${campo}`);
        
        if (!tipo || !campo) {
            console.error('❌ ERROR: No se recibieron datos del drag');
            return;
        }
        
        // Calcular posición relativa al canvas wrapper
        const rect = canvasWrapper.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        console.log(`   → Posición: (${x}, ${y})`);
        
        agregarElemento(tipo, campo, x, y);
    };
    
    // Agregar eventos al wrapper
    canvasWrapper.addEventListener('dragover', handleDragOver);
    canvasWrapper.addEventListener('drop', handleDrop);
    
    console.log('✅ Drag & drop configurado en wrapper del canvas');
}

// =====================================================
// AGREGAR ELEMENTO AL CANVAS
// =====================================================

function agregarElemento(tipo, campo, x, y) {
    console.log(`➕ Agregando elemento: ${tipo} (${campo}) en (${x}, ${y})`);
    
    // Crear ID único
    const id = `${campo}_${Date.now()}`;
    
    // Crear elemento según el tipo
    if (tipo === 'qr') {
        agregarQRCode(id, campo, x, y);
    } else if (tipo === 'texto') {
        agregarTexto(id, campo, x, y);
    }
    
    // Actualizar configuración
    actualizarConfiguracion();
    
    // Generar preview ZPL
    generarPreviewZPL();
}

function agregarQRCode(id, campo, x, y) {
    console.log(`📱 Creando QR Code en (${x}, ${y})`);
    
    // Crear rectángulo para el QR
    const rect = new fabric.Rect({
        width: 80,
        height: 80,
        fill: '#e5e7eb',
        stroke: '#6366f1',
        strokeWidth: 3,
        selectable: false
    });
    
    // Texto "QR"
    const text = new fabric.Text('QR', {
        fontSize: 20,
        fill: '#374151',
        fontWeight: 'bold',
        selectable: false,
        originX: 'center',
        originY: 'center'
    });
    
    // Subtexto con el campo
    const subtext = new fabric.Text(campo.substring(0, 8), {
        fontSize: 10,
        fill: '#6b7280',
        selectable: false,
        originX: 'center',
        originY: 'center',
        top: 15
    });
    
    // Agrupar elementos
    const group = new fabric.Group([rect, text, subtext], {
        left: x,
        top: y,
        selectable: true,
        hasControls: true,  // Habilitar controles
        hasBorders: true,
        borderColor: '#6366f1',
        cornerColor: '#6366f1',
        cornerSize: 10,
        transparentCorners: false,
        lockRotation: true,  // Bloquear rotación
        cornerStyle: 'circle'
    });
    
    // Metadatos del elemento
    group.elementId = id;
    group.elementType = 'qr';
    group.elementCampo = campo;
    group.elementSize = 6;
    
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    
    console.log('✅ QR Code agregado al canvas');
}

function agregarTexto(id, campo, x, y) {
    const valorOriginal = datosPrueba[campo] || `[${campo}]`;
    // Convertir a string para evitar errores con números
    const valor = String(valorOriginal);
    console.log(`📝 Creando texto "${valor}" en (${x}, ${y})`);
    
    // Crear texto con estilo
    const text = new fabric.Text(valor, {
        left: x,
        top: y,
        fontSize: 24,
        fill: '#1f2937',
        fontFamily: 'Arial',
        selectable: true,
        hasControls: true,  // Habilitar controles de escala
        hasBorders: true,
        borderColor: '#6366f1',
        cornerColor: '#6366f1',
        cornerSize: 10,
        transparentCorners: false,
        padding: 5,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        lockRotation: true,  // Bloquear rotación
        cornerStyle: 'circle',
        // Habilitar escalado en todas direcciones
        lockScalingFlip: true,
        centeredScaling: false
    });
    
    // Metadatos del elemento
    text.elementId = id;
    text.elementType = 'texto';
    text.elementCampo = campo;
    text.elementFuente = 24;
    text.elementAncho = 180;
    text.elementMaxLineas = 2;
    text.elementWordWrap = true;
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    console.log('✅ Texto agregado al canvas');
}

// =====================================================
// EVENTOS DEL CANVAS
// =====================================================

function setupCanvasEvents() {
    // Cuando se selecciona un objeto
    canvas.on('selection:created', (e) => {
        mostrarPropiedades(e.selected[0]);
    });
    
    canvas.on('selection:updated', (e) => {
        mostrarPropiedades(e.selected[0]);
    });
    
    // Cuando se deselecciona
    canvas.on('selection:cleared', () => {
        ocultarPropiedades();
    });
    
    // Cuando se mueve un objeto
    canvas.on('object:moving', () => {
        actualizarConfiguracion();
        generarPreviewZPL();
    });
    
    // Cuando se modifica (mover, escalar, etc)
    canvas.on('object:modified', () => {
        actualizarConfiguracion();
        generarPreviewZPL();
    });
    
    // Cuando se escala un objeto
    canvas.on('object:scaling', () => {
        actualizarConfiguracion();
    });
    
    // Actualizar preview al terminar de escalar
    canvas.on('object:scaled', () => {
        actualizarConfiguracion();
        generarPreviewZPL();
    });
}

// =====================================================
// PANEL DE PROPIEDADES
// =====================================================

function mostrarPropiedades(obj) {
    if (!obj) return;
    
    selectedElement = obj;
    
    document.getElementById('no-selection').style.display = 'none';
    document.getElementById('properties-form').style.display = 'block';
    
    // Posición
    document.getElementById('prop-x').value = Math.floor(obj.left);
    document.getElementById('prop-y').value = Math.floor(obj.top);
    
    // Propiedades según tipo
    if (obj.elementType === 'qr') {
        document.getElementById('text-properties').style.display = 'none';
        document.getElementById('qr-properties').style.display = 'block';
        document.getElementById('prop-qr-size').value = obj.elementSize || 6;
    } else if (obj.elementType === 'texto') {
        document.getElementById('text-properties').style.display = 'block';
        document.getElementById('qr-properties').style.display = 'none';
        document.getElementById('prop-fuente').value = obj.elementFuente || 24;
        document.getElementById('prop-ancho').value = obj.elementAncho || 180;
        document.getElementById('prop-maxlineas').value = obj.elementMaxLineas || 2;
        document.getElementById('prop-wordwrap').checked = obj.elementWordWrap !== false;
    }
}

function ocultarPropiedades() {
    selectedElement = null;
    document.getElementById('no-selection').style.display = 'block';
    document.getElementById('properties-form').style.display = 'none';
}

function aplicarPropiedades() {
    if (!selectedElement) return;
    
    // Aplicar posición
    const x = parseInt(document.getElementById('prop-x').value);
    const y = parseInt(document.getElementById('prop-y').value);
    selectedElement.set({ left: x, top: y });
    
    // Aplicar propiedades según tipo
    if (selectedElement.elementType === 'qr') {
        selectedElement.elementSize = parseInt(document.getElementById('prop-qr-size').value);
    } else if (selectedElement.elementType === 'texto') {
        selectedElement.elementFuente = parseInt(document.getElementById('prop-fuente').value);
        selectedElement.elementAncho = parseInt(document.getElementById('prop-ancho').value);
        selectedElement.elementMaxLineas = parseInt(document.getElementById('prop-maxlineas').value);
        selectedElement.elementWordWrap = document.getElementById('prop-wordwrap').checked;
        
        // Actualizar tamaño visual del texto
        selectedElement.set({ fontSize: selectedElement.elementFuente });
    }
    
    canvas.renderAll();
    actualizarConfiguracion();
    generarPreviewZPL();
    
    mostrarToast('✅ Propiedades aplicadas');
}

function eliminarElemento() {
    if (!selectedElement) return;
    
    canvas.remove(selectedElement);
    canvas.renderAll();
    ocultarPropiedades();
    actualizarConfiguracion();
    generarPreviewZPL();
    
    mostrarToast('🗑️ Elemento eliminado');
}

// =====================================================
// ACTUALIZAR CONFIGURACIÓN
// =====================================================

function actualizarConfiguracion() {
    config.elementos = [];
    
    canvas.getObjects().forEach((obj) => {
        if (!obj.elementId) return;
        
        const elemento = {
            id: obj.elementId,
            tipo: obj.elementType,
            campo_bd: obj.elementCampo,
            x: Math.floor(obj.left),
            y: Math.floor(obj.top),
            activo: true
        };
        
        if (obj.elementType === 'qr') {
            elemento.size = obj.elementSize || 6;
        } else if (obj.elementType === 'texto') {
            elemento.fuente = obj.elementFuente || 24;
            elemento.ancho = obj.elementAncho || 180;
            elemento.max_lineas = obj.elementMaxLineas || 2;
            elemento.word_wrap = obj.elementWordWrap !== false;
            elemento.alineacion = 'L';
        }
        
        config.elementos.push(elemento);
    });
    
    console.log('📋 Configuración actualizada:', config);
}

// =====================================================
// GENERAR PREVIEW ZPL
// =====================================================

async function generarPreviewZPL() {
    try {
        const response = await fetch('/api/preview-etiqueta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config: config,
                datos_prueba: datosPrueba
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('zpl-preview').textContent = data.zpl;
        } else {
            document.getElementById('zpl-preview').textContent = 'Error: ' + data.error;
        }
    } catch (error) {
        console.error('Error generando preview:', error);
        document.getElementById('zpl-preview').textContent = 'Error al generar ZPL';
    }
}

// =====================================================
// ACCIONES PRINCIPALES
// =====================================================

function verZPL() {
    const zpl = document.getElementById('zpl-preview').textContent;
    
    // Crear modal o copiar al portapapeles
    if (navigator.clipboard) {
        navigator.clipboard.writeText(zpl);
        mostrarToast('📋 ZPL copiado al portapapeles');
    } else {
        alert(zpl);
    }
}

async function imprimirTest() {
    if (config.elementos.length === 0) {
        mostrarToast('⚠️ Agrega al menos un elemento al canvas', 'warning');
        return;
    }
    
    if (!confirm('¿Imprimir etiqueta de prueba?')) return;
    
    mostrarLoading(true);
    
    try {
        const response = await fetch('/api/test-print-visual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config: config,
                datos_prueba: datosPrueba
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast('✅ Etiqueta enviada a impresora');
        } else {
            mostrarToast('❌ Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error imprimiendo:', error);
        mostrarToast('❌ Error al imprimir', 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function guardarPlantilla() {
    if (config.elementos.length === 0) {
        mostrarToast('⚠️ Agrega al menos un elemento al canvas', 'warning');
        return;
    }
    
    const nombre = prompt('Nombre de la plantilla:', config.nombre_plantilla);
    if (!nombre) return;
    
    config.nombre_plantilla = nombre;
    config.descripcion = `Plantilla creada en Editor Visual - ${new Date().toLocaleDateString()}`;
    
    mostrarLoading(true);
    
    try {
        const response = await fetch('/api/plantillas-etiquetas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre_plantilla: config.nombre_plantilla,
                descripcion: config.descripcion,
                ancho_dots: config.ancho_dots,
                alto_dots: config.alto_dots,
                config_elementos: { elementos: config.elementos },
                es_default: false
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast('✅ Plantilla guardada correctamente');
            console.log('💾 Plantilla guardada:', data.plantilla);
        } else {
            mostrarToast('❌ Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando:', error);
        mostrarToast('❌ Error al guardar plantilla', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// =====================================================
// UTILIDADES
// =====================================================

async function cargarDatosEjemplo() {
    try {
        console.log('🔄 Cargando datos de ejemplo desde /api/datos-ejemplo...');
        const response = await fetch('/api/datos-ejemplo');
        
        if (!response.ok) {
            console.warn(`⚠️ Response not OK: ${response.status} ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        console.log('📦 Respuesta recibida:', data);
        
        if (data.success) {
            datosPrueba = data.datos;
            console.log('✅ Datos de ejemplo cargados:', datosPrueba);
        } else {
            console.warn('⚠️ Respuesta sin success:', data);
        }
    } catch (error) {
        console.warn('⚠️ Error cargando datos de ejemplo:', error);
        console.log('📋 Usando datos por defecto:', datosPrueba);
    }
}

function mostrarToast(mensaje, tipo = 'success') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensaje;
    
    if (tipo === 'error') {
        toast.style.background = '#ef4444';
    } else if (tipo === 'warning') {
        toast.style.background = '#f59e0b';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (mostrar) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// =====================================================
// GESTIÓN DE MODOS Y PRODUCTOS
// =====================================================

async function cargarListaProductos() {
    try {
        console.log('📦 Cargando lista de productos...');
        // Agregar ?all=true para obtener TODOS los productos sin paginación
        const response = await fetch('/api/productos?all=true');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta de /api/productos:', data);
        
        // El endpoint con all=true devuelve {data: [...], total: N}
        const productos = data.data || data.productos || [];
        
        if (productos.length > 0) {
            productosDisponibles = productos;
            console.log(`✅ ${productosDisponibles.length} productos cargados`);
            
            // Llenar el selector
            const selector = document.getElementById('producto-selector');
            selector.innerHTML = '<option value="">Selecciona un producto...</option>';
            
            productosDisponibles.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id_producto;
                option.textContent = `${prod.nombre_producto} - ${prod.modelo || 'N/A'}`;
                selector.appendChild(option);
            });
            
            mostrarToast(`✅ ${productos.length} productos disponibles`);
        } else {
            throw new Error('No se recibieron productos');
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        mostrarToast('❌ Error cargando lista de productos', 'error');
    }
}

function cambiarModo() {
    const selector = document.getElementById('modo-selector');
    modoActual = selector.value;
    
    console.log(`🔄 Cambiando a modo: ${modoActual}`);
    
    const selectorProducto = document.getElementById('selector-producto-container');
    const sidebar = document.querySelector('.sidebar');
    const camposVisiblesConfig = document.getElementById('campos-visibles-config');
    
    if (modoActual === 'visualizacion') {
        // Modo VISUALIZACIÓN: Mostrar cómo se imprime actualmente con la configuración ZPL existente
        // No requiere que haya elementos en el canvas - usa la plantilla por defecto del servidor
        selectorProducto.style.display = 'flex';
        sidebar.style.opacity = '0.5';
        sidebar.style.pointerEvents = 'none';
        camposVisiblesConfig.style.display = 'block'; // Mostrar configuración de campos
        
        // Cargar plantilla por defecto desde el servidor
        cargarPlantillaActual();
        
        mostrarToast('👁️ Modo VISUALIZACIÓN: Muestra cómo se imprime con la configuración actual. Selecciona un producto.');
    } else {
        // Modo CREACIÓN: Diseñar nuevas plantillas arrastrando campos
        selectorProducto.style.display = 'none';
        sidebar.style.opacity = '1';
        sidebar.style.pointerEvents = 'auto';
        camposVisiblesConfig.style.display = 'none'; // Ocultar configuración de campos
        
        // Limpiar canvas y cargar datos de ejemplo
        canvas.clear();
        cargarDatosEjemplo().then(() => {
            generarPreviewZPL();
        });
        
        mostrarToast('🎨 Modo CREACIÓN: Arrastra campos para diseñar una nueva plantilla.');
    }
}

async function cargarProductoSeleccionado() {
    const selector = document.getElementById('producto-selector');
    const idProducto = selector.value;
    
    if (!idProducto) {
        mostrarToast('⚠️ Selecciona un producto primero', 'warning');
        return;
    }
    
    try {
        console.log(`📦 Cargando producto ID: ${idProducto}`);
        
        // Buscar el producto en la lista
        const producto = productosDisponibles.find(p => p.id_producto == idProducto);
        
        if (!producto) {
            throw new Error('Producto no encontrado');
        }
        
        // Actualizar datos de prueba con el producto real
        datosPrueba = {
            qr_code: `PROD-${producto.id_producto}`,
            nombre_producto: producto.nombre_producto,
            modelo: producto.modelo || 'N/A',
            unidad_medida: `UM: ${producto.unidad_medida}`,
            id_producto: `ID: ${producto.id_producto}`,
            empresa: producto.empresa || 'HECHO EN PERU',
            descripcion_corta: producto.descripcion_corta || ''
        };
        
        console.log('✅ Producto cargado:', datosPrueba);
        
        // Actualizar los textos en el canvas
        actualizarTextosCanvas();
        
        // Generar preview ZPL
        generarPreviewZPL();
        
        mostrarToast(`✅ Producto cargado: ${producto.nombre_producto}`);
        
    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        mostrarToast('❌ Error al cargar producto', 'error');
    }
}

function actualizarTextosCanvas() {
    console.log('🔄 Actualizando textos en canvas con nuevos datos');
    
    canvas.getObjects().forEach(obj => {
        if (obj.elementType === 'texto' && obj.elementCampo) {
            const campo = obj.elementCampo;
            const nuevoValor = String(datosPrueba[campo] || `[${campo}]`);
            obj.set('text', nuevoValor);
        }
    });
    
    canvas.renderAll();
    console.log('✅ Textos actualizados');
}

// =====================================================
// 🔄 CARGAR PLANTILLA ACTUAL (Configuración ZPL del servidor)
// =====================================================
async function cargarPlantillaActual() {
    console.log('📥 Cargando plantilla actual desde configuración del servidor...');
    
    // Limpiar canvas
    canvas.clear();
    config.elementos = [];
    
    // Configuración actual de generateDoubleZPL() convertida a formato visual
    // Basado en tu código actual de impresión
    const plantillaActual = {
        elementos: [
            // QR Code (lado izquierdo de la etiqueta doble)
            {
                tipo: 'qr',
                campo: 'qr_code',
                x: 10,
                y: 10,
                width: 180,
                height: 180
            },
            // Nombre del Producto (Y=30 en ZPL, altura ~24px)
            {
                tipo: 'texto',
                campo: 'nombre_producto',
                x: 200,
                y: 30,
                fontSize: 20,
                fontFamily: 'Arial',
                width: 180,
                maxLines: 2
            },
            // Modelo (Y=112 en ZPL, altura ~28px)
            {
                tipo: 'texto',
                campo: 'modelo',
                x: 200,
                y: 80,
                fontSize: 18,
                fontFamily: 'Arial',
                width: 180,
                maxLines: 1
            },
            // Unidad de Medida (Y=139 en ZPL, con prefijo "UM: ")
            {
                tipo: 'texto',
                campo: 'unidad_medida',
                x: 200,
                y: 110,
                fontSize: 16,
                fontFamily: 'Arial',
                width: 180,
                maxLines: 1
            },
            // ID del Producto (Y=159 en ZPL, con prefijo "ID: ")
            {
                tipo: 'texto',
                campo: 'id_producto',
                x: 200,
                y: 130,
                fontSize: 16,
                fontFamily: 'Arial',
                width: 180,
                maxLines: 1
            },
            // Empresa (Y=179 en ZPL, con word wrap)
            {
                tipo: 'texto',
                campo: 'empresa',
                x: 200,
                y: 160,
                fontSize: 14,
                fontFamily: 'Arial',
                width: 180,
                maxLines: 2
            }
        ]
    };
    
    // Crear objetos en el canvas según la configuración
    for (const elem of plantillaActual.elementos) {
        if (elem.tipo === 'qr') {
            // Agregar QR
            const qr = new fabric.Rect({
                left: elem.x,
                top: elem.y,
                width: elem.width,
                height: elem.height,
                fill: '#e3f2fd',
                stroke: '#2196f3',
                strokeWidth: 2,
                selectable: false, // No editable en modo visualización
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                elementType: 'qr',  // Identificar como QR
                elementCampo: 'qr_code'
            });
            
            const qrText = new fabric.Text('QR', {
                left: elem.x + elem.width / 2,
                top: elem.y + elem.height / 2,
                fontSize: 24,
                fill: '#2196f3',
                originX: 'center',
                originY: 'center',
                selectable: false,
                elementType: 'qr-text'  // Texto del QR
            });
            
            canvas.add(qr);
            canvas.add(qrText);
            
            config.elementos.push(elem);
        } else if (elem.tipo === 'texto') {
            // Agregar texto con word wrap automático
            const valor = datosPrueba[elem.campo] || elem.campo;
            
            // Usar Textbox en lugar de Text para word wrap automático
            const texto = new fabric.Textbox(String(valor), {
                left: elem.x,
                top: elem.y,
                width: elem.width,  // Ancho máximo (como ^FB)
                fontSize: elem.fontSize,
                fontFamily: elem.fontFamily,
                fill: '#000000',
                selectable: false, // No editable en modo visualización
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                splitByGrapheme: true,  // Divide por caracteres si es necesario
                elementType: 'texto',
                elementCampo: elem.campo
            });
            
            canvas.add(texto);
            config.elementos.push(elem);
        }
    }
    
    canvas.renderAll();
    generarPreviewZPL();
    
    console.log('✅ Plantilla actual cargada con', plantillaActual.elementos.length, 'elementos');
    mostrarToast(`✅ Plantilla actual cargada (${plantillaActual.elementos.length} elementos)`);
}

// =====================================================
// 👁️ ACTUALIZAR CAMPOS VISIBLES (Modo Visualización)
// =====================================================
function actualizarCamposVisibles() {
    if (modoActual !== 'visualizacion') return;
    
    console.log('🔄 Actualizando campos visibles...');
    
    // Leer estado de los checkboxes
    const mostrarNombre = document.getElementById('config-mostrar-nombre').checked;
    const mostrarModelo = document.getElementById('config-mostrar-modelo').checked;
    const mostrarUnidad = document.getElementById('config-mostrar-unidad').checked;
    const mostrarId = document.getElementById('config-mostrar-id').checked;
    const mostrarEmpresa = document.getElementById('config-mostrar-empresa').checked;
    
    // Validar que al menos un campo esté activo (además del QR)
    const algunCampoActivo = mostrarNombre || mostrarModelo || mostrarUnidad || mostrarId || mostrarEmpresa;
    
    if (!algunCampoActivo) {
        mostrarToast('⚠️ Debes tener al menos un campo visible además del QR', 'warning');
        // Reactivar el nombre automáticamente
        document.getElementById('config-mostrar-nombre').checked = true;
        return;
    }
    
    // Recorrer todos los objetos del canvas y mostrar/ocultar según configuración
    canvas.getObjects().forEach(obj => {
        // El QR siempre visible si hay al menos un campo de texto activo
        if (obj.elementType === 'qr') {
            obj.set('visible', algunCampoActivo);
            return;
        }
        
        if (obj.elementType === 'texto' && obj.elementCampo) {
            const campo = obj.elementCampo;
            
            switch(campo) {
                case 'nombre_producto':
                    obj.set('visible', mostrarNombre);
                    break;
                case 'modelo':
                    obj.set('visible', mostrarModelo);
                    break;
                case 'unidad_medida':
                    obj.set('visible', mostrarUnidad);
                    break;
                case 'id_producto':
                    obj.set('visible', mostrarId);
                    break;
                case 'empresa':
                    obj.set('visible', mostrarEmpresa);
                    break;
            }
        }
    });
    
    canvas.renderAll();
    generarPreviewZPL();
    
    console.log('✅ Campos visibles actualizados');
}

console.log('✅ Editor Visual cargado correctamente');

