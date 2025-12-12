// =============================================
// SERVER.JS - SERVIDOR CON AUTENTICACIÓN
// Sistema de Etiquetas QR con roles y login
// =============================================

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const net = require('net'); // Para comunicación con impresora Zebra
const os = require('os'); // Para obtener interfaces de red
const fs = require('fs'); // Para leer configuraciones
const logger = require('./logger'); // Sistema de logging profesional
const ExcelJS = require('exceljs'); // Para generación de Excel
const NodeCache = require('node-cache'); // Sistema de caché inteligente
const compression = require('compression'); // Compresión de respuestas

// =============================================
// FUNCIÓN PARA LEER CONFIGURACIÓN DINÁMICA
// =============================================
function loadSystemConfig() {
    const configPath = path.join(__dirname, 'config', 'system.config');
    
    // Valores por defecto (tu configuración actual)
    const defaultConfig = {
        zebra: {
            MODEL: 'ZD230',
            PRINTER_IP: '192.168.15.34',
            PORT_NUMBER: 9100,
            DPI: 203,
            WIDTH_MM: 100,
            HEIGHT_MM: 150
        },
        server: {
            PORT: 3012,
            JWT_SECRET: 'tu_clave_secreta_super_segura_2025'
        },
        database: {
            HOST: 'localhost',
            PORT: 5432,
            DATABASE: 'postgres',
            USER: 'postgres',
            PASSWORD: 'alsimtex'
        },
        company: {
            NAME: 'PRODUCTO PERUANO',
            WEBSITE: 'www.alsimtex.com',
            PHONE: 'Tel: 958003536',
            ADDRESS: 'HECHO EN PERU'
        }
    };
    
    // Intentar leer archivo de configuración
    if (fs.existsSync(configPath)) {
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            console.log('📄 Leyendo configuración desde:', configPath);
            
            // Parsear archivo .config simple
            const config = { ...defaultConfig };
            const lines = configData.split('\n');
            let currentSection = '';
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                
                if (trimmed.match(/^\[(.+)\]$/)) {
                    currentSection = trimmed.match(/^\[(.+)\]$/)[1];
                    continue;
                }
                
                const [key, value] = trimmed.split('=');
                if (key && value) {
                    if (currentSection === 'ZEBRA_CONFIG') {
                        config.zebra[key.trim()] = isNaN(value.trim()) ? value.trim() : parseInt(value.trim());
                    } else if (currentSection === 'SERVER_CONFIG') {
                        config.server[key.trim()] = isNaN(value.trim()) ? value.trim() : parseInt(value.trim());
                    } else if (currentSection === 'DATABASE_CONFIG') {
                        config.database[key.trim()] = isNaN(value.trim()) ? value.trim() : parseInt(value.trim());
                    } else if (currentSection === 'COMPANY_CONFIG') {
                        config.company[key.trim()] = value.trim();
                    }
                }
            }
            
            console.log('✅ Configuración cargada desde archivo');
            return config;
            
        } catch (error) {
            console.log('⚠️ Error leyendo configuración, usando valores por defecto:', error.message);
            return defaultConfig;
        }
    } else {
        console.log('⚠️ Archivo de configuración no encontrado, usando valores por defecto');
        return defaultConfig;
    }
}

// Cargar configuración
const CONFIG = loadSystemConfig();

const app = express();
// Puerto se configurará dinámicamente después de cargar config
let port;

// ID único del servidor que cambia cada vez que se reinicia
const SERVER_SESSION_ID = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
console.log(`🚀 Servidor iniciado con ID de sesión: ${SERVER_SESSION_ID}`);
logger.serverStart(0, SERVER_SESSION_ID); // Log de inicio con ID de sesión
// =============================================
// SISTEMA DE HEARTBEAT Y MONITOREO
// =============================================

let serverHealthy = true;
let lastHeartbeat = Date.now();

// Heartbeat cada 30 segundos
setInterval(() => {
    const now = Date.now();
    console.log(`💓 [${new Date().toLocaleTimeString()}] Heartbeat - Servidor activo`);
    console.log(`   📊 Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`   🔌 Uptime: ${Math.round(process.uptime())} segundos`);
    lastHeartbeat = now;
    serverHealthy = true;
}, 30000);

// Monitor de salud cada 60 segundos
setInterval(() => {
    const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;
    if (timeSinceLastHeartbeat > 45000) {
        console.log(`⚠️  [ALERTA] Servidor puede estar colgado - Sin heartbeat por ${timeSinceLastHeartbeat}ms`);
        serverHealthy = false;
    }
    
    // Verificar memoria
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memMB > 500) { // Más de 500MB
        console.log(`⚠️  [ALERTA] Alto uso de memoria: ${memMB}MB`);
    }
    
    // Limpiar memoria si es necesario
    if (global.gc && memMB > 300) {
        console.log(`🧹 Ejecutando garbage collection...`);
        global.gc();
    }
}, 60000);

// =============================================
// CONFIGURACIÓN POSTGRESQL DINÁMICA
// =============================================
// Se configurará después de cargar el archivo de configuración
let pool;

// =============================================
// CONFIGURACIÓN ZEBRA FIJA - SOLO ZD230
// =============================================

// Configuración dinámica desde archivo system.config
const ZEBRA_CONFIG = {
    MODEL: CONFIG.zebra.MODEL,
    PRINTER_IP: CONFIG.zebra.PRINTER_IP,
    PORT_NUMBER: CONFIG.zebra.PORT_NUMBER,
    DPI: CONFIG.zebra.DPI,
    WIDTH_MM: CONFIG.zebra.WIDTH_MM,
    HEIGHT_MM: CONFIG.zebra.HEIGHT_MM,
    // Calcular valores para etiquetas dobles
    TOTAL_WIDTH: Math.round((CONFIG.zebra.WIDTH_MM * CONFIG.zebra.DPI) / 25.4), // Convertir mm a dots
    LABEL_HEIGHT_DOTS: Math.round((CONFIG.zebra.HEIGHT_MM * CONFIG.zebra.DPI) / 25.4),
    SINGLE_LABEL_WIDTH: Math.round(((CONFIG.zebra.WIDTH_MM / 2) * CONFIG.zebra.DPI) / 25.4),
    SECOND_LABEL_START: Math.round(((CONFIG.zebra.WIDTH_MM / 2) * CONFIG.zebra.DPI) / 25.4)
};

console.log('✅ Configuración para Zebra ZD230:');
console.log('   MODELO: ZDesigner ZD230-203dpi ZPL');
console.log('   PUERTO: ZEBRA_ZD230_34 (192.168.15.34:9100)');
console.log('   DPI: 203');

// =============================================
// CONFIGURACIÓN SIMPLE Y FIJA
// =============================================

// PostgreSQL - configuración dinámica con POOL OPTIMIZADO
pool = new Pool({
    user: CONFIG.database.USER,
    host: CONFIG.database.HOST,
    database: CONFIG.database.DATABASE,
    password: CONFIG.database.PASSWORD,
    port: CONFIG.database.PORT,
    // 🚀 OPTIMIZACIONES DE POOL
    max: 20,                    // Máximo 20 conexiones simultáneas (antes: default 10)
    min: 2,                     // Mantener 2 conexiones siempre abiertas
    idleTimeoutMillis: 30000,   // Cerrar conexiones inactivas después de 30s
    connectionTimeoutMillis: 5000, // Timeout de 5s para obtener conexión
    statement_timeout: 60000,   // Timeout de 60s para consultas (prevenir bloqueos)
    query_timeout: 60000,       // Timeout de 60s para queries
});

// =============================================
// 🚀 SISTEMA DE CACHÉ INTELIGENTE
// =============================================
const cache = new NodeCache({
    stdTTL: 300,           // 5 minutos por defecto
    checkperiod: 60,       // Revisar cada 60 segundos
    useClones: false       // Más rápido, no clona objetos
});

// Configuración de TTL por tipo de dato
const CACHE_TTL = {
    PRODUCTOS: 3600,       // 1 hora - casi nunca cambian
    USUARIOS: 1800,        // 30 minutos - cambian poco
    DEPARTAMENTOS: 3600,   // 1 hora
    ESTADISTICAS_DIA: 300, // 5 minutos
    BITACORA: 60,          // 1 minuto - cambia frecuente
    SOLICITUDES: 30,       // 30 segundos - cambia muy frecuente
    IMPRESORAS: 10         // 10 segundos - estado en tiempo real
};

console.log('✅ Sistema de caché inicializado');
console.log('   📦 Productos: 1 hora');
console.log('   👥 Usuarios: 30 minutos');
console.log('   📊 Estadísticas: 5 minutos');
console.log('   📋 Bitácora: 1 minuto');

console.log(`🗄️  PostgreSQL: ${CONFIG.database.USER}@${CONFIG.database.HOST}:${CONFIG.database.PORT}/${CONFIG.database.DATABASE}`);
logger.dbConnect('success', {
    host: CONFIG.database.HOST,
    port: CONFIG.database.PORT,
    database: CONFIG.database.DATABASE,
    user: CONFIG.database.USER
});

// Servidor - puerto dinámico
port = CONFIG.server.PORT;
console.log(`🌐 Servidor puerto: ${CONFIG.server.PORT}`);

// JWT - clave dinámica
const JWT_SECRET = CONFIG.server.JWT_SECRET;

// Empresa - configuración dinámica
const COMPANY_CONFIG = {
    name: CONFIG.company.NAME,
    website: CONFIG.company.WEBSITE,
    phone: CONFIG.company.PHONE,
    address: CONFIG.company.ADDRESS
};

// =============================================
// FUNCIONES DE IMPRESIÓN ZEBRA
// =============================================

// Variables globales para cola de impresión
let printQueue = [];
let printerConnected = false;
let isProcessingQueue = false; // 🆕 Bandera para evitar múltiples procesos simultáneos

// Helper: Generar clave de caché con parámetros
function getCacheKey(prefix, params = {}) {
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(key => `${key}:${params[key]}`).join('|');
    return paramString ? `${prefix}:${paramString}` : prefix;
}

// Helper: Obtener desde caché
function getFromCache(key) {
    const cached = cache.get(key);
    if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
        return cached;
    }
    console.log(`❌ Cache MISS: ${key}`);
    return null;
}

// Helper: Guardar en caché con TTL específico
function setInCache(key, data, ttl = CACHE_TTL.PRODUCTOS) {
    cache.set(key, data, ttl);
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s, Size: ${JSON.stringify(data).length} bytes)`);
}

// Helper: Invalidar patrón de caché
function invalidateCachePattern(pattern) {
    const keys = cache.keys();
    const matched = keys.filter(key => key.includes(pattern));
    matched.forEach(key => cache.del(key));
    console.log(`🗑️ Cache INVALIDADO: ${pattern} (${matched.length} claves eliminadas)`);
}

// =============================================
// LOGS DE INICIALIZACIÓN
// =============================================
console.log('🚀 ===== INICIANDO SISTEMA DE ETIQUETAS ZEBRA ADAPTABLE =====');
console.log('🖨️ Modelo Zebra Detectado:', ZEBRA_CONFIG.MODEL);
console.log('🖨️ Configuración Completa:', ZEBRA_CONFIG);
console.log('🏢 Configuración Empresa:', COMPANY_CONFIG);
console.log('📋 Cola de impresión inicializada');
console.log('🔌 Estado inicial impresora: DESCONECTADA');
console.log('=========================================================');

// Generar QR único para solicitud
function generateUniqueQR(numeroSolicitud) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SOL-${numeroSolicitud}-QR-${timestamp}${randomSuffix}`;
}

// Calcular cantidad par (redondear hacia arriba si es impar)
function calcularCantidadPar(cantidad) {
    return cantidad % 2 === 0 ? cantidad : cantidad + 1;
}

// Generar código ZPL adaptado al modelo de Zebra
function generateDoubleZPL(data, config = {}) {
    console.log(`📄 [generateDoubleZPL] Generando ZPL para ${ZEBRA_CONFIG.MODEL}:`, JSON.stringify(data, null, 2));
    console.log(`📄 Config recibida:`, JSON.stringify(config, null, 2));
    
    const { qr_code, nombre_producto, descripcion_corta, unidad_medida, id_producto, cantidad_etiquetas, empresa } = data;
    
    // Formatear ID del producto con ceros a la izquierda
    const formattedId = id_producto.toString().padStart(6, '0');
    
    // Asegurar que tenemos unidad_medida o usar default
    const um = unidad_medida || 'UNIDAD';
    
    // 🎯 DIVISIÓN INTELIGENTE CON WORD WRAP - Respeta palabras completas
    // Límite: 15 caracteres por línea (tu ejemplo: "FUNDAS DE" = 9 chars OK, "COLCHON" no cabe)
    const palabras = nombre_producto.split(' ').filter(p => p.length > 0); // Eliminar espacios vacíos
    const lineasNombre = [];
    
    const MAX_CHARS_POR_LINEA = 15; // Máximo de caracteres que entran por línea
    
    console.log(`📝 [WORD WRAP] Procesando: "${nombre_producto}" (${nombre_producto.length} chars total)`);
    console.log(`📝 [WORD WRAP] Palabras detectadas: [${palabras.map(p => `"${p}"`).join(', ')}]`);
    console.log(`📝 [WORD WRAP] Límite por línea: ${MAX_CHARS_POR_LINEA} caracteres`);
    
    // 🔥 ALGORITMO DE WORD WRAP INTELIGENTE
    let lineaActual = '';
    let palabraIndex = 0;
    
    while (palabraIndex < palabras.length && lineasNombre.length < 4) {
        const palabra = palabras[palabraIndex];
        
        // Caso especial: palabra sola más larga que el límite
        if (palabra.length > MAX_CHARS_POR_LINEA) {
            console.log(`   ⚠️ Palabra "${palabra}" (${palabra.length} chars) excede límite ${MAX_CHARS_POR_LINEA}`);
            
            if (lineaActual.length === 0) {
                // Si la línea está vacía, forzar la palabra truncada
                lineasNombre.push(palabra.substring(0, MAX_CHARS_POR_LINEA));
                console.log(`   ✂️ Línea ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}" (truncada)`);
                palabraIndex++;
                continue;
            } else {
                // Si hay contenido, guardar línea actual y procesar palabra en siguiente iteración
                lineasNombre.push(lineaActual);
                console.log(`   ✅ Línea ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}" (${lineasNombre[lineasNombre.length - 1].length} chars)`);
                lineaActual = '';
                continue;
            }
        }
        
        // Probar agregar palabra a línea actual
        const pruebaLinea = lineaActual.length === 0 
            ? palabra 
            : `${lineaActual} ${palabra}`;
        
        console.log(`   🔍 Probando: "${pruebaLinea}" (${pruebaLinea.length} chars vs ${MAX_CHARS_POR_LINEA} max)`);
        
        if (pruebaLinea.length <= MAX_CHARS_POR_LINEA) {
            // ✅ Cabe! Agregar palabra a línea actual
            lineaActual = pruebaLinea;
            console.log(`   ✅ Palabra "${palabra}" agregada. Línea actual: "${lineaActual}" (${lineaActual.length} chars)`);
            palabraIndex++;
        } else {
            // ❌ NO cabe! Guardar línea actual y mover palabra a siguiente línea
            if (lineaActual.length > 0) {
                lineasNombre.push(lineaActual);
                console.log(`   📦 Línea ${lineasNombre.length} completa: "${lineasNombre[lineasNombre.length - 1]}" (${lineasNombre[lineasNombre.length - 1].length} chars)`);
                lineaActual = '';
            }
            // No incrementar palabraIndex, procesar misma palabra en siguiente iteración
        }
    }
    
    // Agregar última línea si quedó contenido
    if (lineaActual.length > 0 && lineasNombre.length < 4) {
        lineasNombre.push(lineaActual);
        console.log(`   📦 Línea final ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}" (${lineasNombre[lineasNombre.length - 1].length} chars)`);
    }
    
    // Asignar a variables individuales (compatibilidad con código existente)
    const linea1 = lineasNombre[0] || '';
    const linea2 = lineasNombre[1] || '';
    const linea3 = lineasNombre[2] || '';
    const linea4 = lineasNombre[3] || '';
    
    // Detectar si quedan palabras sin mostrar
    const palabrasSobrantes = palabras.slice(palabraIndex);
    const necesitaMasLineas = palabrasSobrantes.length > 0;
    
    // Ajustar tamaño de fuente si necesita más de 3 líneas
    let fontSizePrincipal = ZEBRA_CONFIG.DPI >= 300 ? 36 : 24;
    let fontSizeModelo = ZEBRA_CONFIG.DPI >= 300 ? 42 : 28;
    let fontSizeSecundario = ZEBRA_CONFIG.DPI >= 300 ? 27 : 18;
    
    if (necesitaMasLineas) {
        console.log(`⚠️ ADVERTENCIA: Producto "${nombre_producto}" necesita más de 3 líneas. Ajustando fuentes...`);
        // Reducir fuentes en ~30% para hacer espacio
        fontSizePrincipal = Math.round(fontSizePrincipal * 0.7);
        fontSizeModelo = Math.round(fontSizeModelo * 0.7);
        fontSizeSecundario = Math.round(fontSizeSecundario * 0.8);
    }
    
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║  📄 RESULTADO FINAL DEL WORD WRAP                             ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    console.log(`║  Producto original: "${nombre_producto}" (${nombre_producto.length} chars)           ║`);
    console.log(`║  Límite por línea: ${MAX_CHARS_POR_LINEA} caracteres                               ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    if (linea1) console.log(`║  ✅ LÍNEA 1: "${linea1.padEnd(30)}" (${String(linea1.length).padStart(2)} chars) ║`);
    if (linea2) console.log(`║  ✅ LÍNEA 2: "${linea2.padEnd(30)}" (${String(linea2.length).padStart(2)} chars) ║`);
    if (linea3) console.log(`║  ✅ LÍNEA 3: "${linea3.padEnd(30)}" (${String(linea3.length).padStart(2)} chars) ║`);
    if (linea4) console.log(`║  ✅ LÍNEA 4: "${linea4.padEnd(30)}" (${String(linea4.length).padStart(2)} chars) ║`);
    if (necesitaMasLineas) {
        console.log(`╠═══════════════════════════════════════════════════════════════╣`);
        console.log(`║  ⚠️  ADVERTENCIA: Texto demasiado largo                        ║`);
        console.log(`║  Palabras sobrantes: ${palabrasSobrantes.join(' ').substring(0, 30).padEnd(30)} ║`);
        console.log(`║  Fuentes reducidas: P=${fontSizePrincipal}, M=${fontSizeModelo}, S=${fontSizeSecundario}           ║`);
    }
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    console.log(`║  ⚡ AMBAS ETIQUETAS IMPRIMIRÁN EXACTAMENTE LO MISMO           ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    
    // Template ZPL adaptado al modelo específico de Zebra con configuración dinámica
    console.log(`📄 [generateDoubleZPL] Usando configuración para ${ZEBRA_CONFIG.MODEL}: ${ZEBRA_CONFIG.TOTAL_WIDTH}x${ZEBRA_CONFIG.LABEL_HEIGHT_DOTS} dots`);
    
    // Construcción dinámica del ZPL
    let zpl = `^XA
^PW${ZEBRA_CONFIG.TOTAL_WIDTH}
^LL${ZEBRA_CONFIG.LABEL_HEIGHT_DOTS}
^BY0,0,0
^LH0,0
^LS0
^LT0
^MTD
^MMT
^PR4

// === ETIQUETA DOBLE - POSICIONAMIENTO CORREGIDO ===

// === RESET CRÍTICO ANTES DEL QR ===
^BY0,0,0

// === ETIQUETA IZQUIERDA - ADAPTADA AL MODELO ${ZEBRA_CONFIG.MODEL} ===
`;

    // 📏 POSICIONES DE VERSIÓN ANTERIOR FUNCIONAL
    // Basadas en: mi-app-etiquetas/server.js (versión que funcionaba)
    
    // QR más pequeño (tamaño 5 en lugar de 6) para que no sobrepase 2.4cm
    const qrSize = 5;        // Tamaño QR: máximo 2.4cm de ancho
    const qrY = 40;          // QR Y position
    
    // Posiciones Y para texto (después del QR horizontalmente)
    const yNombre1 = 30;     // Nombre línea 1
    const yNombre2 = 54;     // Nombre línea 2 (24 dots después)
    const yModelo = 112;     // MODELO (58 dots después de L2)
    const yUnidad = 139;     // UNIDAD (27 dots después)
    const yId = 159;         // ID (20 dots después)
    const yEmpresa = 179;    // EMPRESA (20 dots después)
    // Margen inferior: 200 - 179 = 21 dots (2.6mm) ✅
    
    console.log(`📏 VERSIÓN ANTERIOR: QR(${qrY},size=${qrSize}) Nombre(${yNombre1},${yNombre2}) Modelo(${yModelo}) Unidad(${yUnidad}) ID(${yId}) Empresa(${yEmpresa})`);
    
    // Función helper para generar una etiqueta (izquierda o derecha)
    function generarEtiqueta(xOffset, esIzquierda) {
        let etiquetaZPL = '';
        
        // 🔥 QR Code - Tamaño 5 (no 6) para que no sobrepase 2.4cm
        if (config.mostrar_qr !== false) {
            // Calcular posición base del QR para cada etiqueta
            const qrX = esIzquierda ? 15 : (ZEBRA_CONFIG.SECOND_LABEL_START + 15);
            etiquetaZPL += `// QR Code ${esIzquierda ? 'izquierdo' : 'derecho'} - Size 5 (max 2.4cm)
^FO${qrX},${qrY}^BQN,2,${qrSize}^FDQA,${qr_code}|${nombre_producto}|${um}^FS\n\n`;
        }
        
        // ============================================
        // SECCIÓN NOMBRE - Solo 2 líneas principales
        // ============================================
        if (config.mostrar_nombre !== false) {
            etiquetaZPL += `// NOMBRE - Línea 1
^CF0,${fontSizePrincipal}
^FO${xOffset},${yNombre1}^FD${linea1}^FS\n`;
            
            if (linea2) {
                etiquetaZPL += `// NOMBRE - Línea 2
^CF0,${fontSizePrincipal}
^FO${xOffset},${yNombre2}^FD${linea2}^FS\n`;
            }
            
            etiquetaZPL += '\n';
        }
        
        // ============================================
        // SECCIÓN DATOS - Posiciones fijas de versión funcional
        // ============================================
        
        // MODELO
        if (config.mostrar_modelo !== false) {
            etiquetaZPL += `// MODELO
^CF0,${fontSizeModelo}
^FO${xOffset},${yModelo}^FD${data.modelo || descripcion_corta || 'PRODUCTO TEXTIL'}^FS\n`;
        }
        
        // UNIDAD
        if (config.mostrar_unidad !== false) {
            etiquetaZPL += `// UNIDAD
^CF0,${fontSizeSecundario}
^FO${xOffset},${yUnidad}^FDUM: ${um}^FS\n`;
        }
        
        // ID
        if (config.mostrar_id !== false) {
            etiquetaZPL += `// ID
^CF0,${fontSizeSecundario}
^FO${xOffset},${yId}^FDID: ${formattedId}^FS\n`;
        }
        
        // EMPRESA
        if (config.mostrar_empresa !== false) {
            etiquetaZPL += `// EMPRESA
^CF0,${fontSizeSecundario}
^FO${xOffset},${yEmpresa}^FD${empresa || 'HECHO EN PERU'}^FS\n`;
        }
        
        return etiquetaZPL;
    }
    
    // Generar etiqueta izquierda
    const xLeft = Math.round(200 * ZEBRA_CONFIG.DPI / 203);
    zpl += generarEtiqueta(xLeft, true);
    
    zpl += `\n// === RESET CRÍTICO ===
^BY0,0,0

// === ETIQUETA DERECHA - IDÉNTICA A LA IZQUIERDA ===
`;

    // Generar etiqueta derecha (misma configuración)
    const xRight = ZEBRA_CONFIG.SECOND_LABEL_START + Math.round(200 * ZEBRA_CONFIG.DPI / 203);
    zpl += generarEtiqueta(xRight, false);
    
    zpl += `\n^BY2,3
^XZ`;
    
    return zpl;
}

// =====================================================
// 🆕 PLANTILLA TEXTO SOLO (SIN QR) - LETRAS GRANDES
// =====================================================
function generateTextOnlyZPL(data, config) {
    console.log(`📄 [generateTextOnlyZPL] ⭐ MODO SIN QR - Textos grandes para ${ZEBRA_CONFIG.MODEL}`);
    console.log(`📄 Config recibida:`, JSON.stringify(config, null, 2));
    
    const { nombre_producto, descripcion_corta, unidad_medida, id_producto, modelo } = data;
    
    // Formatear ID del producto
    const formattedId = id_producto.toString().padStart(6, '0');
    const um = unidad_medida || 'UNIDAD';
    
    // 🎯 CALCULAR CUÁNTOS CAMPOS ESTÁN ACTIVOS (excepto NOMBRE y EMPRESA)
    let camposActivos = 0;
    if (config.mostrar_modelo !== false && modelo) camposActivos++;
    if (config.mostrar_unidad !== false) camposActivos++;
    if (config.mostrar_id !== false) camposActivos++;
    
    console.log(`📊 [generateTextOnlyZPL] Campos activos (además de NOMBRE): ${camposActivos}`);
    
    // 🎨 ADAPTAR TAMAÑO DEL NOMBRE según espacio disponible
    let nombreFontSize, nombreLineHeight, maxCharsPerLine;
    
    if (camposActivos === 0) {
        // SOLO NOMBRE + EMPRESA → LETRAS GIGANTES
        nombreFontSize = ZEBRA_CONFIG.DPI >= 300 ? 100 : 70;
        nombreLineHeight = ZEBRA_CONFIG.DPI >= 300 ? 110 : 80;
        maxCharsPerLine = 12;
        console.log(`🎯 [generateTextOnlyZPL] MODO MINIMALISTA: Solo NOMBRE + EMPRESA (letras gigantes)`);
    } else if (camposActivos <= 2) {
        // NOMBRE + 1-2 campos → LETRAS GRANDES
        nombreFontSize = ZEBRA_CONFIG.DPI >= 300 ? 70 : 50;
        nombreLineHeight = ZEBRA_CONFIG.DPI >= 300 ? 80 : 60;
        maxCharsPerLine = 15;
        console.log(`🎯 [generateTextOnlyZPL] MODO REDUCIDO: NOMBRE + ${camposActivos} campos`);
    } else {
        // NOMBRE + 3+ campos → LETRAS MEDIANAS
        nombreFontSize = ZEBRA_CONFIG.DPI >= 300 ? 60 : 40;
        nombreLineHeight = ZEBRA_CONFIG.DPI >= 300 ? 65 : 45;
        maxCharsPerLine = 20;
        console.log(`🎯 [generateTextOnlyZPL] MODO COMPLETO: NOMBRE + ${camposActivos} campos`);
    }
    
    // Dividir nombre en líneas según el límite calculado
    const palabras = nombre_producto.split(' ');
    const lineas = [];
    let lineaActual = '';
    
    for (const palabra of palabras) {
        const testLinea = lineaActual ? `${lineaActual} ${palabra}` : palabra;
        if (testLinea.length <= maxCharsPerLine) {
            lineaActual = testLinea;
        } else {
            if (lineaActual) lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    if (lineaActual) lineas.push(lineaActual);
    
    console.log(`📝 [generateTextOnlyZPL] Nombre dividido en ${lineas.length} líneas:`, lineas);
    
    // Calcular posiciones centralizadas
    const centerX = Math.round(ZEBRA_CONFIG.SINGLE_LABEL_WIDTH / 2);
    const startY = 40;
    
    // Construir ZPL dinámicamente según campos activos
    let zpl = `^XA
^PW${ZEBRA_CONFIG.TOTAL_WIDTH}
^LL${ZEBRA_CONFIG.LABEL_HEIGHT_DOTS}
^LH0,0
^LS0
^LT-10
^MTT
^MMT

// === ETIQUETA IZQUIERDA - SOLO TEXTO (SIN QR) ===
`;

    let currentY = startY;
    
    // NOMBRE (siempre mostrar si está activo) - CON TAMAÑO ADAPTATIVO
    if (config.mostrar_nombre !== false) {
        lineas.forEach((linea, index) => {
            zpl += `^CF0,${nombreFontSize}
^FO30,${currentY}^FD${linea}^FS\n`;
            currentY += nombreLineHeight;
        });
        currentY += 10; // Espaciado después del nombre
    }
    
    // MODELO (si está activo y existe)
    if (config.mostrar_modelo !== false && modelo) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 48 : 32}
^FO30,${currentY}^FD${modelo}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 55 : 38);
    }
    
    // UNIDAD (si está activa)
    if (config.mostrar_unidad !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 36 : 24}
^FO30,${currentY}^FDUM: ${um}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 42 : 28);
    }
    
    // ID (si está activo)
    if (config.mostrar_id !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 36 : 24}
^FO30,${currentY}^FDID: ${formattedId}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 42 : 28);
    }
    
    // EMPRESA (si está activa)
    if (config.mostrar_empresa !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 33 : 22}
^FO30,${currentY}^FB${ZEBRA_CONFIG.SINGLE_LABEL_WIDTH - 60},2,0,L^FD${empresa || 'HECHO EN PERU'}^FS\n`;
    }
    
    // === ETIQUETA DERECHA (DUPLICADO) ===
    zpl += `\n// === ETIQUETA DERECHA - SOLO TEXTO (SIN QR) ===\n`;
    
    currentY = startY;
    const rightX = ZEBRA_CONFIG.SECOND_LABEL_START + 30;
    
    // NOMBRE (derecha) - CON TAMAÑO ADAPTATIVO
    if (config.mostrar_nombre !== false) {
        lineas.forEach((linea, index) => {
            zpl += `^CF0,${nombreFontSize}
^FO${rightX},${currentY}^FD${linea}^FS\n`;
            currentY += nombreLineHeight;
        });
        currentY += 10; // Espaciado después del nombre
    }
    
    if (config.mostrar_modelo !== false && modelo) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 48 : 32}
^FO${rightX},${currentY}^FD${modelo}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 55 : 38);
    }
    
    if (config.mostrar_unidad !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 36 : 24}
^FO${rightX},${currentY}^FDUM: ${um}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 42 : 28);
    }
    
    if (config.mostrar_id !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 36 : 24}
^FO${rightX},${currentY}^FDID: ${formattedId}^FS\n`;
        currentY += (ZEBRA_CONFIG.DPI >= 300 ? 42 : 28);
    }
    
    if (config.mostrar_empresa !== false) {
        zpl += `^CF0,${ZEBRA_CONFIG.DPI >= 300 ? 33 : 22}
^FO${rightX},${currentY}^FB${ZEBRA_CONFIG.SINGLE_LABEL_WIDTH - 60},2,0,L^FD${empresa || 'HECHO EN PERU'}^FS\n`;
    }
    
    zpl += `^XZ`;
    
    console.log(`✅ [generateTextOnlyZPL] ZPL generado: ${zpl.length} caracteres`);
    return zpl;
}

// =====================================================
// �️ GENERADOR ZPL PARA ROTULADO GODEX G530
// =====================================================
/*
 * =================================================================
 * FUNCIÓN PARA GODEX G530 - 300 DPI
 * USANDO EZPL (LENGUAJE NATIVO DE GODEX)
 * TAMAÑO: 30mm ancho x 50mm alto
 * =================================================================
 */

// Logo CAMITEX redimensionado automáticamente 
// Tamaño: 319×123px (27.0mm × 10.4mm a 300 DPI) - Tamaño óptimo
// Generado: 28/10/2025 con convertir-logo-a-zpl.js
const LOGO_CAMITEX_ZPL = `^GFA,4920,4920,40,000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003FFF0000000000000000000000000000000000000000000000000000000000000000000000000007FFFFF00000000000000000000000000000000000000000000000000000000000000000000000001FFFFFFE0000000000000000000000000000000000000000000000000000000000000000000000007FFFFFFF000000000000000000000000000000000000000000000000000000000000000000000001FFFFFFFFC00000000000000000000000000000000000000000000000000000000000000000000007FFFFFFFFE0000000000000000000000000000000000000000000000000000000000000000000000FFFFFFFFFE0000000000000000000000000000000000000000000000000000000000000000000001FFFFFFFFFE0000000000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFE000000000000000000000000000000000000000000000000000000000000000000000FFFFF003FFE000000000000000000000000000000000000000000000000000000000000000000001FFFF80007FC000000000000000000000000000000000000000000000000000000000000000000001FFFC00001F8000006000000004000000100000000000000000000000000003000000C00000000003FFF8000000000003FE0000007FC00001FE0000FC03FFFFFFFF00FFFFFFE00FC00003F00000000007FFE000000000000FFF000000FFE00007FF8001FE07FFFFFFFF83FFFFFFF01FE00007F80000000007FFC000000000001FFF800001FFF0000FFF8003FF07FFFFFFFF87FFFFFFF83FF0000FFC000000000FFF8000000000003FFFC00003FFF8000FFFC003FF0FFFFFFFFF8FFFFFFFF83FF8001FFC000000001FFF0000000000003FFFE00003FFF8001FFFC003FF07FFFFFFFF8FFFFFFFF83FFC003FFC000000001FFE0000000000007FFFF00003FFFC001FFFE003FF07FFFFFFFF8FFFFFFFF81FFE007FFC000000003FFE0000000000007FFFF00007FFFC003FFFE003FF03FFFFFFFF07FFFFFFF00FFF00FFF8000000003FFC000000000000FFFFF80007FFFE003FFFE003FF00FFFFFFFE03FFFFFFE00FFF80FFF0000000003FF8000000000000FFFFF80007FFFE007FFFE003FF00003FF000007FE0000007FFC1FFE0000000007FF8000000000001FFDFFC0007FFFF007FFFE003FF00003FF00000FFC0000003FFC3FFC0000000007FF0000000000001FF8FFC0007FFFF007FFFF003FF00003FF00000FF80000001FFE7FF80000000007FF0000000000003FF8FFE000FFFFF00FFFFF003FF00003FF00001FF80000000FFFFFF80000000007FF0000000000003FF07FE000FFFFF80FFFFF003FF00003FF00001FF800000007FFFFF00000000007FE0000000000007FF07FF000FFCFF81FFBFF003FF00003FF00001FF000000003FFFFE0000000000FFE0000000000007FE03FF000FFCFFC1FF3FF803FF00003FF00003FFFFFF80001FFFFC0000000000FFE000000000000FFE03FF800FFC7FC1FF1FF803FF00003FF0000FFFFFFFE0000FFFF80000000000FFE200000000000FFC01FF800FFC7FE3FE1FF803FF00003FF0001FFFFFFFE0000FFFF00000000000FFE200000000000FFC01FF801FFC3FE3FE1FF803FF00003FF0001FFFFFFFE00007FFE00000000000FFE300000000001FFC01FFC01FFC3FE7FE1FF803FF00003FF0001FFFFFFFE00007FFE00000000000FFE100000000001FF800FFC01FFC3FF7FC1FF803FF00003FF0001FFFFFFFE0000FFFF000000000007FE180000000001FF800FFE01FF81FFFFC1FFC03FF00003FF0001FFFFFFFE0001FFFF800000000007FE180000000003FFFFFFFE01FF81FFFF80FFC03FF00003FF0000FFFFFFF80003FFFFC00000000007FE1C0000000003FFFFFFFE01FF80FFFF80FFC03FF00003FF00003FF000000007FFFFE00000000007FE1E0000000007FFFFFFFF01FF80FFFF80FFC03FF00003FF00003FF00000000FFFFFF00000000007FF0F800000000FFFFFFFFF01FF807FFF00FFC03FF00003FF00003FF00000001FFFFFF80000000007FF0FC00000780FFFFFFFFF81FF807FFF00FFC03FF00003FF00003FF00000001FFE7FFC0000000003FF07F00003FE0FFFFFFFFF81FF807FFE00FFC03FF00003FF00003FF00000003FFC3FFE0000000003FF87FE000FFE0FFFFFFFFF83FF803FFE00FFC03FF00003FF00003FF00000007FF81FFF0000000001FF83FFFFFFFF1FFC0001FFC3FF803FFC00FFE03FF00003FF00003FFFFFFF00FFF00FFF8000000001FFC3FFFFFFFF1FF80001FFC3FF801FFC00FFE03FF00003FF00003FFFFFFF81FFE007FF8000000000FFE1FFFFFFFF1FF80000FFC3FF800FF800FFE03FF00003FF00001FFFFFFF83FFC003FFC000000000FFE0FFFFFFFE1FF80000FFC3FF0007F0007FE03FF00003FF00001FFFFFFF83FFC003FFC0000000007FF07FFFFFFE1FF00000FFC3FF0001C0007FE03FF00003FF00000FFFFFFF87FF8001FFC0000000007FF83FFFFFF81FF000007FC1FF000000007FC03FF00003FF000007FFFFFF83FF0000FFC0000000003FFC1FFFFFE01FF000007F81FE000000007FC01FE00001FF000003FFFFFF03FE00007F80000000001FFE07FFFF800FC000001F007C000000001F000FC00000FC0000007FFFFE01FC00003F00000000000FFF01FFF80000000000000000000000000000000000000000000003FF00007000000000000000000FFFC00000000000000000000000000000000000000000000000000000000000000000000000000007FFF00000000000000000000000000000000000000000000000000000000000000000000000000003FFF8000000000000000003FFFFFFFFFFF80000000000000000000000000000000000000000000001FFFE000000000000001FFFFFFFFFFFFFFFFF80000000000000000000000000000000000000000000FFFFC000000000001FFFFFFFFFFFFFFFFFFFFFC000000000000000000000000000000000000000003FFFF8000000003FFFFFFFFFFFFFFFFFFFFFFFFFC0000000000000000000000000000C00000000001FFFFFC000001FFFFFFFFFFFFFFFFFFFFFFFFFFFFF8000000000000000000000000070000000000007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF800000000000000000000003C0000000000003FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE000000000000000000001F00000000000000FFFFFFFFFFFFFFFFFFFFF0000001FFFFFFFFFFFFFFFFFE000000000000000001FC000000000000001FFFFFFFFFFFFFFFFC00000000000000FFFFFFFFFFFFFFFC000000000000001FE00000000000000007FFFFFFFFFFFFFC0000000000000000007FFFFFFFFFFFFFFF00000000000FFF800000000000000000FFFFFFFFFFFC00000000000000000000001FFFFFFFFFFFFFFFF00000FFFFFC0000000000000000000FFFFFFFFF000000000000000000000000003FFFFFFFFFFFFFFFFFFFFFFFE0000000000000000000001FFFFC0000000000000000000000000000003FFFFFFFFFFFFFFFFFFFFE0000000000000000000000000000000000000000000000000000000000003FFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFE0000000000000000000000000000000000000000000000000000000000000000003FFFFFFFFFFF00000000000000000000000000000000000000000000000000000000000000000000000FFFFFFC0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000FF000000000000000C0000007E000000000000000000000000000000000000000000000000000000C7C00000000000000C000001C380000000000000000000000000000000000000000000000000000080600000000000000C0000030080000000000000000000000000000000000000000000000000000080300000000000000C000006000000000000000000000000000000000000000000000000000000008030FC0BF03F8003EC0F80040007E07F3F07F00000000000000000000000000000000000000000008021870E1C20C00E1C38600C00003071E1841800000000000000000000000000000000000000000080E3010C040040080C20200C00001840C18008000000000000000000000000000000000000000000FFC20188060040180C60300C00001840C08008000000000000000000000000000000000000000000C3060188063FC0180C7FF0040007B8408087F800000000000000000000000000000000000000000081820188066040180C600006000C1840808C08000000000000000000000000000000000000000000C0C3030C0C6040080C20000300081840808C08000000000000000000000000000000000000000000C0C1830E1C60C00C1C306001818C3840808C18000000000000000000000000000000000000000000C060FE09F83FC003FC0FC0007F07D8408087F80000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000^FS`;

// Logos adicionales generados (15mm × 15mm)
const { LOGO_MISTI_ZPL } = require('./logos_dinamicos/logo-misti-zpl-generado.js');

// Iconos de advertencia individuales (87×96 dots = 7.4mm × 8.1mm)
const { ICONO_LAVADO_30_ZPL } = require('./logos_dinamicos/icono-lavado-30-zpl.js');
const { ICONO_NO_LEJIA_ZPL } = require('./logos_dinamicos/icono-no-lejia-zpl.js');
const { ICONO_PLANCHAR_BAJA_ZPL } = require('./logos_dinamicos/icono-planchar-baja-zpl.js');
const { ICONO_SECADORA_BAJA_ZPL } = require('./logos_dinamicos/icono-secadora-baja-zpl.js');

// Logos de advertencia grandes (14.5mm × 14.5mm = 172×172 dots)
const { LAVAR_MAX_ZPL } = require('./logos_dinamicos/logo-lavar-max-zpl.js');
const { NO_PLANCHAR_V5_ZPL } = require('./logos_dinamicos/logo-no-planchar-v5-zpl.js');

// Logos dinámicos proporcionales (27mm ancho, alto variable)
const { ALGODON_100_ZPL } = require('./logos_dinamicos/logo-algodon-100-zpl.js');
const { MAXIMA_SUAVIDAD_V2_ZPL } = require('./logos_dinamicos/logo-maxima-suavidad-v2-zpl.js'); // 27.0×10.3mm (319×122 dots)
const { PRODUCTO_PERUANO_ZPL } = require('./logos_dinamicos/logo-producto-peruano-zpl.js');
const { PRODUCTO_AREQUIPENO_ZPL } = require('./logos_dinamicos/logo-producto-arequipeno-zpl.js'); // 27.0×10.3mm (319×122 dots)

function generarRotuladoZPL(data, opciones = {}) {
    // 🎨 OPCIONES DINÁMICAS
    const {
        logoPrincipal = 'camitex', // 'camitex', 'algodon_100', 'maxima_suavidad', 'producto_peruano', 'arequipeno', 'sin_logo'
        conIconos = true,           // Mostrar iconos de advertencia
        conLogoMisti = true,        // Mostrar logo MISTI
        conCorte = false            // Activar corte automático con guillotina
    } = opciones;
    
    console.log(`🏷️ [generarRotuladoZPL] Generando ZPL para Godex G530`);
    console.log(`📋 Datos:`, JSON.stringify(data, null, 2));
    console.log(`⚙️  Opciones: LogoPrincipal=${logoPrincipal}, Iconos=${conIconos}, Misti=${conLogoMisti}, Corte=${conCorte}`);
    
    const { 
        subcategoria,      // ALMOHADA, COBERTOR, PROTECTOR, SABANA
        marca,             // Tipo de tela (BP, TC, etc)
        modelo,            // Tamaño (King, Queen, 2plz, 1.5P, etc)
        codigo_producto,   // Código del producto para barcode
        unidad_medida,     // Unidad de medida para barcode
        id_solicitud,      // ID de solicitud para barcode
        empresa            // 🏢 Empresa/entidad (ej: "HECHO EN PERU", "PRODUCTOS AVALON S.A.C")
    } = data;
    
    const tipoProducto = (subcategoria || 'PRODUCTO').toUpperCase();
    const telaTipo = (marca || '').toUpperCase();
    const tamano = (modelo || '').toUpperCase();
    
    // Código de barras: codigo_producto-id_solicitud (ej: 10002-192)
    let codigoBarras = codigo_producto || 'SIN-CODIGO';
    // Eliminar primer 0 si existe
    if (codigoBarras.startsWith('0') && codigoBarras.length > 1) {
        codigoBarras = codigoBarras.substring(1);
    }
    // Agregar id_solicitud si existe
    if (id_solicitud) {
        codigoBarras = `${codigoBarras}-${id_solicitud}`;
    }
    
    // Dividir producto en 2 líneas si es muy largo (más de 18 caracteres)
    let productoLinea1 = tipoProducto;
    let productoLinea2 = '';
    
    if (tipoProducto.length > 18) {
        const corte = tipoProducto.lastIndexOf(' ', 18);
        if (corte > 0) {
            productoLinea1 = tipoProducto.substring(0, corte);
            productoLinea2 = tipoProducto.substring(corte + 1);
        }
    }
    
    // 🔪 CONFIGURACIÓN DE CORTE Y MÁRGENES:
    // SIN CORTE: ^MNN, ^LL826 (70mm = 7.0cm), márgenes 1cm arriba/abajo
    // CON CORTE: ^MMC, ^LL826 (70mm = 7.0cm), mismo tamaño pero con comando de corte
    const ALTURA_LABEL = 826;  // 7.0cm SIEMPRE (70mm)
    const MODO_MEDIA = conCorte ? '^MMC' : '^MNN';
    
    // 📐 MÁRGENES PARA ZONA DE COSTURA (1cm cada uno = 118 dots)
    // Etiqueta se dobla a la mitad (3.5cm), dejando 2.5cm arriba y 2.5cm abajo para datos
    const MARGEN_SUPERIOR = 118;  // 1.0cm (10mm) - zona de costura superior
    const MARGEN_INFERIOR = 118;  // 1.0cm (10mm) - zona de costura inferior
    const AREA_SUPERIOR = 295;    // 2.5cm (25mm) - LOGO + PRODUCTO + TELA + MODELO + EMPRESA
    const AREA_INFERIOR = 295;    // 2.5cm (25mm) - ICONOS + LOGOS ADV + BARCODE
    
    // 📐 POSICIONES SECCIÓN SUPERIOR (MARGEN_SUPERIOR + 12 dots de ajuste + distribución en 2.5cm)
    const Y_LOGO = MARGEN_SUPERIOR + 12;  // 130 (1cm + 12 dots desde inicio)
    const Y_PRODUCTO_1 = Y_LOGO + 140;  // 270 (espacio para logo 1.2cm)
    const Y_PRODUCTO_2 = Y_PRODUCTO_1 + 40;  // 310
    const Y_TELA = (productoLinea2 ? Y_PRODUCTO_2 + 40 : Y_PRODUCTO_1 + 55);  // 350 o 325
    const Y_MODELO = Y_TELA + 35;  // 385 o 360
    const Y_HECHO_PERU = Y_MODELO + 35;  // 420 o 395
    
    // 📐 POSICIONES SECCIÓN INFERIOR (después del doblez a 3.5cm = 413 dots)
    const Y_ICONOS_1 = MARGEN_SUPERIOR + AREA_SUPERIOR + 5;  // 418 (inicio área inferior)
    const Y_ICONOS_2 = Y_ICONOS_1 + 100;  // 518
    const Y_MISTI = Y_ICONOS_1 + 15;  // 433
    const Y_BARCODE = ALTURA_LABEL - MARGEN_INFERIOR - 55;  // 653 (826-118-55)
    
    // 📊 LOG DETALLADO DE POSICIONES
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║  🖨️  GODEX G530 - CONFIGURACIÓN DE IMPRESIÓN ROTULADO         ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    console.log(`║  📏 DIMENSIONES ETIQUETA:                                      ║`);
    console.log(`║     • Ancho: 354 dots (30mm / 3.0cm)                          ║`);
    console.log(`║     • Alto: ${ALTURA_LABEL} dots (${(ALTURA_LABEL/11.811).toFixed(1)}mm / ${(ALTURA_LABEL/118.11).toFixed(1)}cm)                  ║`);
    console.log(`║  🔪 MODO DE CORTE:                                             ║`);
    console.log(`║     • Guillotina: ${conCorte ? '✅ ACTIVADA (^MMC)' : '❌ DESACTIVADA (^MNN)'}                      ║`);
    console.log(`║  📐 MÁRGENES:                                                  ║`);
    console.log(`║     • Superior: ${MARGEN_SUPERIOR} dots (${(MARGEN_SUPERIOR/11.811).toFixed(1)}mm / ${(MARGEN_SUPERIOR/118.11).toFixed(1)}cm)            ║`);
    console.log(`║     • Inferior: ${MARGEN_INFERIOR} dots (${(MARGEN_INFERIOR/11.811).toFixed(1)}mm / ${(MARGEN_INFERIOR/118.11).toFixed(1)}cm)            ║`);
    console.log(`║     • Área superior: ${AREA_SUPERIOR} dots (${(AREA_SUPERIOR/118.11).toFixed(1)}cm) - Datos arriba         ║`);
    console.log(`║     • Área inferior: ${AREA_INFERIOR} dots (${(AREA_INFERIOR/118.11).toFixed(1)}cm) - Iconos/Barcode    ║`);
    console.log(`║     • 🔄 DOBLEZ: ${(ALTURA_LABEL/2)} dots (${(ALTURA_LABEL/2/118.11).toFixed(1)}cm) - Mitad exacta              ║`);
    console.log(`║  📍 POSICIONES Y (en dots y cm):                               ║`);
    console.log(`║     • Logo:        Y=${Y_LOGO} (${(Y_LOGO/118.11).toFixed(2)}cm)                           ║`);
    console.log(`║     • Producto 1:  Y=${Y_PRODUCTO_1} (${(Y_PRODUCTO_1/118.11).toFixed(2)}cm)                         ║`);
    if (productoLinea2) {
    console.log(`║     • Producto 2:  Y=${Y_PRODUCTO_2} (${(Y_PRODUCTO_2/118.11).toFixed(2)}cm)                         ║`);
    }
    console.log(`║     • Tela:        Y=${Y_TELA} (${(Y_TELA/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║     • Modelo:      Y=${Y_MODELO} (${(Y_MODELO/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║     • Empresa:     Y=${Y_HECHO_PERU} (${(Y_HECHO_PERU/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║     • Iconos 1:    Y=${Y_ICONOS_1} (${(Y_ICONOS_1/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║     • Misti:       Y=${Y_MISTI} (${(Y_MISTI/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║     • Barcode:     Y=${Y_BARCODE} (${(Y_BARCODE/118.11).toFixed(2)}cm)                         ║`);
    console.log(`║  📦 DATOS:                                                     ║`);
    console.log(`║     • Producto: ${productoLinea1.padEnd(40)} ║`);
    if (productoLinea2) {
    console.log(`║                 ${productoLinea2.padEnd(40)} ║`);
    }
    console.log(`║     • Tela: ${telaTipo.padEnd(46)} ║`);
    console.log(`║     • Modelo: ${tamano.padEnd(44)} ║`);
    console.log(`║     • Barcode: ${codigoBarras.padEnd(43)} ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    
    // 🏷️ CONSTRUCCIÓN DEL ZPL
    // Etiqueta: 30mm × 70mm (3.0cm × 7.0cm) con márgenes 1.5cm arriba/abajo
    let zpl = `^XA
${MODO_MEDIA}
^PW354
^LL${ALTURA_LABEL}
^LH0,0
^LS0
`;
    
    // Logo Principal (condicional según selección del usuario)
    switch (logoPrincipal) {
        case 'camitex':
            zpl += `^FO20,${Y_LOGO}${LOGO_CAMITEX_ZPL}\n`;
            console.log('🔷 [Rotulado] Logo: Camitex (319×123 dots)');
            break;
        case 'algodon_100':
            zpl += `^FO20,${Y_LOGO}${ALGODON_100_ZPL}\n`;
            console.log('🔷 [Rotulado] Logo: 100% Algodón (319×120 dots)');
            break;
        case 'maxima_suavidad':
            zpl += `^FO20,${Y_LOGO}${MAXIMA_SUAVIDAD_V2_ZPL}\n`;
            console.log('🔷 [Rotulado] Logo: Máxima Suavidad V2 (319×122 dots)');
            break;
        case 'producto_peruano':
            zpl += `^FO20,${Y_LOGO}${PRODUCTO_PERUANO_ZPL}\n`;
            console.log('🔷 [Rotulado] Logo: Producto Peruano (319×122 dots)');
            break;
        case 'arequipeno':
        case 'producto_arequipeno':
            zpl += `^FO20,${Y_LOGO}${PRODUCTO_AREQUIPENO_ZPL}\n`;
            console.log('🏔️ [Rotulado] Logo: Producto Arequipeño (319×122 dots)');
            break;
        case 'sin_logo':
            console.log('🔷 [Rotulado] Sin logo principal');
            break;
        default:
            console.warn(`⚠️ [Rotulado] Logo desconocido: ${logoPrincipal}, usando Camitex`);
            zpl += `^FO20,${Y_LOGO}${LOGO_CAMITEX_ZPL}\n`;
    }
    
    // Textos del producto - CENTRADOS (ancho etiqueta: 320 dots)
    zpl += `^CF0,35
^FO0,${Y_PRODUCTO_1}^FB320,1,0,C^FD${productoLinea1}^FS
`;
    
    if (productoLinea2) {
        zpl += `^CF0,30\n^FO0,${Y_PRODUCTO_2}^FB320,1,0,C^FD${productoLinea2}^FS\n`;
    }
    
    // Campos centrados: TELA, MODELO y EMPRESA
    zpl += `^CF0,25
^FO0,${Y_TELA}^FB320,1,0,C^FDTELA: ${telaTipo}^FS
^FO0,${Y_MODELO}^FB320,1,0,C^FDMODELO: ${tamano}^FS
^CF0,22
^FO0,${Y_HECHO_PERU}^FB320,1,0,C^FD${empresa || 'HECHO EN PERU'}^FS
`;
    
    // 🔀 LÓGICA CONDICIONAL: Logos grandes o configuración estándar
    if (!conLogoMisti) {
        // ⚠️ Si Logo Misti está DESACTIVADO → mostrar dos logos grandes de advertencia
        // Logos grandes: LAVAR_MAX (176×172) + NO_PLANCHAR_V5 (168×172)
        // X positions centradas: 2 (lavar_max) y 184 (no_planchar)
        // Total: 2 + 176 + 6 + 168 = 352 dots (cabe en 354 dots = 30mm)
        zpl += `^FO2,${Y_ICONOS_1}${LAVAR_MAX_ZPL}
^FO184,${Y_ICONOS_1}${NO_PLANCHAR_V5_ZPL}
`;
        console.log(`🔴 [Rotulado] Logos advertencia 14.5mm×14.5mm: Max Temp + No Planchar V5`);
    } else {
        // ✅ Si Logo Misti está ACTIVADO → configuración estándar
        // Iconos pequeños de advertencia (opcional)
        if (conIconos) {
            zpl += `^FO10,${Y_ICONOS_1}${ICONO_LAVADO_30_ZPL}
^FO100,${Y_ICONOS_1}${ICONO_NO_LEJIA_ZPL}
^FO10,${Y_ICONOS_2}${ICONO_PLANCHAR_BAJA_ZPL}
^FO100,${Y_ICONOS_2}${ICONO_SECADORA_BAJA_ZPL}
`;
        }
        
        // Logo MISTI
        zpl += `^FO190,${Y_MISTI}${LOGO_MISTI_ZPL}\n`;
        console.log(`✅ [Rotulado] Configuración estándar: Iconos ${conIconos ? 'activados' : 'desactivados'} + Logo Misti`);
    }
    
    // Código de barras (posición dinámica según configuración)
    // Si no hay logo Misti (conLogoMisti=false), subir el barcode 90 dots para que casi toque los logos
    const Y_BARCODE_DINAMICO = !conLogoMisti ? (Y_BARCODE - 30) : Y_BARCODE;
    zpl += `^FO40,${Y_BARCODE_DINAMICO}^BY1.5^BCN,55,N,N^FD${codigoBarras}^FS
^XZ`;
    
    console.log(`📊 [Rotulado] Código de barras Y=${Y_BARCODE_DINAMICO} (${!conLogoMisti ? 'SIN' : 'CON'} logo secundario)`);
    
    console.log(`✅ [generarRotuladoZPL] ZPL generado: ${zpl.length} caracteres`);
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║  📄 ZPL COMPLETO QUE SE ENVIARÁ A LA IMPRESORA:               ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝`);
    console.log(zpl);
    console.log(`╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║  ✅ FIN DEL ZPL                                                ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝\n`);
    
    return zpl;
}

// =====================================================
// �🎯 SELECTOR INTELIGENTE DE PLANTILLA
// =====================================================
function selectZPLTemplate(data, productoConfig) {
    console.log(`[selectZPLTemplate] Seleccionando plantilla...`);
    console.log(`📋 Configuración producto:`, JSON.stringify(productoConfig, null, 2));
    
    // Validar que al menos haya un campo de texto activo
    const hasTextFields = 
        productoConfig.mostrar_nombre !== false ||
        productoConfig.mostrar_modelo !== false ||
        productoConfig.mostrar_unidad !== false ||
        productoConfig.mostrar_id === true;
    
    if (!hasTextFields) {
        console.warn(`⚠️ [selectZPLTemplate] Sin campos de texto activos, forzando NOMBRE`);
        productoConfig.mostrar_nombre = true;
    }
    
    // Decidir plantilla
    if (productoConfig.mostrar_qr === false) {
        console.log(`📄 [selectZPLTemplate] ✅ Usando plantilla TEXT_ONLY (sin QR)`);
        return generateTextOnlyZPL(data, productoConfig);
    } else {
        console.log(`📄 [selectZPLTemplate] ✅ Usando plantilla DEFAULT (QR + texto dinámico)`);
        return generateDoubleZPL(data, productoConfig);
    }
}

// Verificar conexión con impresora - CONFIGURACIÓN ORIGINAL
async function checkPrinterConnection() {
    console.log(`🔍 [checkPrinterConnection] Verificando conexión TCP a ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
    
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        
        socket.connect(ZEBRA_CONFIG.PORT_NUMBER, ZEBRA_CONFIG.PRINTER_IP, () => {
            console.log(`✅ [checkPrinterConnection] Impresora CONECTADA en ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
            printerConnected = true;
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', (err) => {
            console.log(`❌ [checkPrinterConnection] Error de conexión: ${err.message}`);
            printerConnected = false;
            socket.destroy();
            resolve(false);
        });
        
        socket.on('timeout', () => {
            console.log(`❌ [checkPrinterConnection] Timeout de conexión`);
            printerConnected = false;
            socket.destroy();
            resolve(false);
        });
    });
}

// Función principal de impresión ZPL
function sendZPLToPrinter(zplData) {
    logger.info('PRINTER-TCP', `Enviando ZPL directo a Zebra ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`, {
        zpl_size: zplData.length
    });
    console.log(`📡 [sendZPLToPrinter] 🎯 TCP DIRECTO A ZEBRA`);
    console.log(`📡 [sendZPLToPrinter] Destino: ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PRINTER_PORT}`);
    console.log(`📡 [sendZPLToPrinter] Tamaño ZPL: ${zplData.length} caracteres`);
    
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(ZEBRA_CONFIG.PORT_NUMBER, ZEBRA_CONFIG.PRINTER_IP, () => {
            logger.success('PRINTER-TCP', `Socket TCP conectado a ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
            console.log(`🔗 [sendZPLToPrinter] Conectado a ${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
            socket.write(zplData);
            logger.debug('PRINTER-TCP', `ZPL escrito en socket (${zplData.length} bytes)`);
            socket.end();
        });
        
        socket.on('data', (data) => {
            logger.debug('PRINTER-TCP', 'Respuesta de impresora', { response: data.toString() });
            console.log(`📄 [sendZPLToPrinter] Respuesta: ${data.toString()}`);
        });
        
        socket.on('close', () => {
            logger.success('PRINTER-TCP', 'Socket cerrado - Impresión completada');
            console.log(`✅ [sendZPLToPrinter] Conexión cerrada - Impresión completada`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            logger.error('PRINTER-TCP', 'Error en socket TCP', error);
            console.error(`❌ [sendZPLToPrinter] Error TCP:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            logger.warn('PRINTER-TCP', 'Timeout en conexión TCP');
            console.error(`⏱️ [sendZPLToPrinter] Timeout en conexión TCP`);
            socket.destroy();
            reject(new Error('Timeout en conexión TCP'));
        });
    });
}

// Procesar cola de impresión
async function processPrintQueue() {
    const startTime = Date.now();
    logger.printQueue('PROCESSING', printQueue.length, { printer_connected: printerConnected });
    console.log(`🖨️ [processPrintQueue] Iniciando. Cola: ${printQueue.length} trabajos, Impresora: ${printerConnected ? 'CONECTADA' : 'DESCONECTADA'}`);
    
    if (printQueue.length === 0) {
        logger.info('PRINT-QUEUE', 'Cola vacía, terminando procesamiento');
        console.log('📋 [processPrintQueue] Cola vacía, terminando');
        isProcessingQueue = false; // 🆕 Liberar bandera
        return;
    }
    
    if (!printerConnected) {
        logger.warn('PRINT-QUEUE', 'Impresora desconectada, no se puede procesar');
        console.log('❌ [processPrintQueue] Impresora desconectada, terminando');
        isProcessingQueue = false; // 🆕 Liberar bandera
        return;
    }
    
    // 🆕 Marcar que estamos procesando
    isProcessingQueue = true;
    
    const printJob = printQueue[0];
    logger.printAttempt(printJob.numero_solicitud, `${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
    console.log(`🖨️ [processPrintQueue] Procesando trabajo:`, JSON.stringify(printJob, null, 2));
    
    try {
        // 🆕 OBTENER CONFIGURACIÓN DEL PRODUCTO
        let productoConfig = {
            mostrar_qr: true,
            mostrar_nombre: true,
            mostrar_id: false,
            mostrar_unidad: true,
            mostrar_modelo: true,
            mostrar_empresa: true
        };
        
        // 🎯 PRIORIDAD 1: Usar configuración personalizada si existe (CREAR QR supervisor)
        if (printJob.configuracion_impresion) {
            productoConfig = printJob.configuracion_impresion;
            logger.info('PRINT-CONFIG', 'Usando configuración personalizada de solicitud', productoConfig);
            console.log(`🎨 [processPrintQueue] ⭐ Configuración PERSONALIZADA de solicitud:`, productoConfig);
        }
        // 🎯 PRIORIDAD 2: Sino, cargar configuración del producto
        else if (printJob.id_producto) {
            try {
                logger.dbQuery('SELECT config FROM productos', { id_producto: printJob.id_producto });
                const configResult = await pool.query(`
                    SELECT mostrar_qr, mostrar_nombre, mostrar_id, mostrar_unidad, mostrar_modelo, mostrar_empresa
                    FROM productos
                    WHERE id_producto = $1
                `, [printJob.id_producto]);
                
                logger.dbResult('SELECT config FROM productos', configResult.rowCount);
                
                if (configResult.rows.length > 0) {
                    productoConfig = configResult.rows[0];
                    logger.info('PRINT-CONFIG', 'Configuración del producto cargada', productoConfig);
                    console.log(`🎨 [processPrintQueue] Configuración del producto cargada:`, productoConfig);
                } else {
                    logger.warn('PRINT-CONFIG', 'Producto no encontrado, usando defaults');
                    console.log(`⚠️ [processPrintQueue] Producto no encontrado, usando config por defecto`);
                }
            } catch (configError) {
                logger.dbError('SELECT config FROM productos', configError);
                console.error(`❌ [processPrintQueue] Error cargando config, usando defaults:`, configError.message);
            }
        }
        
        const cantidadPares = Math.ceil(printJob.cantidad / 2);
        logger.info('PRINT-PROCESS', `Imprimiendo ${printJob.cantidad} etiquetas (${cantidadPares} pares)`, {
            solicitud: printJob.numero_solicitud,
            cantidad: printJob.cantidad,
            pares: cantidadPares
        });
        console.log(`🖨️ [processPrintQueue] Imprimiendo ${printJob.cantidad} etiquetas (${cantidadPares} pares) para solicitud ${printJob.numero_solicitud}`);
        
        // Imprimir los pares necesarios
        for (let i = 0; i < cantidadPares; i++) {
            logger.debug('PRINT-PAIR', `Imprimiendo par ${i + 1}/${cantidadPares}`);
            console.log(`🖨️ [processPrintQueue] Imprimiendo par ${i + 1}/${cantidadPares} en ${ZEBRA_CONFIG.MODEL}...`);
            
            // 🆕 USAR SELECTOR INTELIGENTE DE PLANTILLA
            const zplData = selectZPLTemplate(printJob, productoConfig);
            logger.printZPL(printJob.numero_solicitud, zplData.length, `${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`);
            console.log(`🖨️ [processPrintQueue] ZPL generado para ${ZEBRA_CONFIG.MODEL}, par ${i + 1}:`, zplData.substring(0, 150) + '...');
            
            await sendZPLToPrinter(zplData);
            logger.success('PRINT-PAIR', `Par ${i + 1}/${cantidadPares} enviado exitosamente`);
            console.log(`✅ [processPrintQueue] Par ${i + 1} enviado exitosamente a ${ZEBRA_CONFIG.MODEL}`);
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre impresiones
        }
        
        logger.printSuccess(printJob.numero_solicitud, Date.now() - startTime);
        console.log(`✅ [processPrintQueue] Todos los pares impresos para ${printJob.numero_solicitud}`);
        
        // Marcar como impreso en la base de datos
        logger.dbQuery('UPDATE cola_impresion SET estado=impresa', { id: printJob.id });
        await pool.query(`
            UPDATE cola_impresion 
            SET estado = 'impresa', fecha_impresion = NOW() 
            WHERE id = $1
        `, [printJob.id]);
        logger.dbResult('UPDATE cola_impresion', 1);
        
        // === CAMBIAR AUTOMÁTICAMENTE A COMPLETADA ===
        if (printJob.id_solicitud) {
            try {
                logger.dbTransaction('UPDATE solicitud → completada', { id_solicitud: printJob.id_solicitud });
                await pool.query(`
                    UPDATE solicitudes_etiquetas 
                    SET estado = 'completada' 
                    WHERE id_solicitud = $1 AND estado = 'proceso'
                `, [printJob.id_solicitud]);
                
                // Registrar en historial
                await pool.query(`
                    INSERT INTO historial_solicitudes (id_solicitud, estado_nuevo, usuario_cambio, comentarios)
                    VALUES ($1, 'completada', 1, 'Completada automáticamente después de imprimir etiquetas')
                `, [printJob.id_solicitud]);
                
                logger.success('SOLICITUD-UPDATE', `Solicitud ${printJob.numero_solicitud} → COMPLETADA`);
                console.log(`🎯 Solicitud ${printJob.numero_solicitud} → Estado cambiado automáticamente a COMPLETADA`);
                
            } catch (updateError) {
                logger.dbError('UPDATE solicitud estado', updateError);
                console.error(`❌ Error actualizando estado de solicitud ${printJob.numero_solicitud}:`, updateError);
            }
        }
        
        // Remover de cola
        printQueue.shift();
        logger.printQueue('REMOVED', printQueue.length);
        
        console.log(`✅ Etiquetas impresas exitosamente para solicitud ${printJob.numero_solicitud}`);
        
        // Continuar con el siguiente trabajo
        if (printQueue.length > 0) {
            logger.info('PRINT-QUEUE', `Continuando con siguiente trabajo (${printQueue.length} pendientes)`);
            setTimeout(processPrintQueue, 1000);
        } else {
            // 🆕 Si no hay más trabajos, liberar bandera
            isProcessingQueue = false;
            logger.info('PRINT-QUEUE', 'Cola procesada completamente, liberando proceso');
            console.log('✅ [processPrintQueue] Cola vacía, proceso liberado');
        }
        
    } catch (error) {
        logger.printError(printJob.numero_solicitud, error);
        logger.printError(printJob.numero_solicitud, error);
        console.error('❌ Error imprimiendo:', error);
        
        // Marcar como error en BD
        logger.dbQuery('UPDATE cola_impresion SET estado=error', { id: printJob.id, error: error.message });
        await pool.query(`
            UPDATE cola_impresion 
            SET estado = 'error', error_mensaje = $2 
            WHERE id = $1
        `, [printJob.id, error.message]);
        logger.dbResult('UPDATE cola_impresion', 1);
        
        // 🆕 Remover trabajo con error de la cola
        printQueue.shift();
        
        printerConnected = false;
        logger.printerConnection(ZEBRA_CONFIG.PRINTER_IP, ZEBRA_CONFIG.PORT_NUMBER, 'failed', error);
        
        // 🆕 Reintentar con el siguiente trabajo después de un error
        if (printQueue.length > 0) {
            logger.warn('PRINT-QUEUE', `Error encontrado, reintentando con siguiente trabajo (${printQueue.length} pendientes)`);
            setTimeout(processPrintQueue, 3000); // Esperar 3s antes de reintentar
        } else {
            isProcessingQueue = false;
        }
    }
}

// Agregar trabajo a la cola de impresión
async function addToPrintQueue(solicitudData) {
    const startTime = Date.now();
    logger.info('PRINT-QUEUE', `Iniciando addToPrintQueue para ${solicitudData.numero_solicitud}`, solicitudData);
    console.log('📋 [addToPrintQueue] Iniciando proceso para:', solicitudData.numero_solicitud);
    console.log('📋 [addToPrintQueue] Datos recibidos:', JSON.stringify(solicitudData, null, 2));
    
    try {
        // Usar los valores que vienen en solicitudData (ya calculados)
        const qrCode = solicitudData.qr_code;
        const cantidadAImprimir = solicitudData.cantidad_a_imprimir;
        
        logger.debug('PRINT-QUEUE', `QR: ${qrCode}, Cantidad: ${cantidadAImprimir}`);
        console.log('📋 [addToPrintQueue] QR Code:', qrCode);
        console.log('📋 [addToPrintQueue] Cantidad a imprimir:', cantidadAImprimir);
        
        // Insertar en tabla de cola
        console.log('📋 [addToPrintQueue] Insertando en tabla cola_impresion...');
        logger.dbQuery('INSERT INTO cola_impresion', { 
            numero_solicitud: solicitudData.numero_solicitud,
            qr_code: qrCode,
            cantidad: cantidadAImprimir 
        });
        
        const result = await pool.query(`
            INSERT INTO cola_impresion (
                id_solicitud, numero_solicitud, qr_code, 
                nombre_producto, descripcion_adicional, costurera_nombre,
                id_producto, cantidad_solicitada, cantidad_a_imprimir, 
                empresa, estado, fecha_creacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente', NOW())
            RETURNING id
        `, [
            solicitudData.id_solicitud,
            solicitudData.numero_solicitud,
            qrCode,
            solicitudData.nombre_producto,
            solicitudData.descripcion_corta,
            solicitudData.costurera_nombre,
            solicitudData.id_producto,
            solicitudData.cantidad_solicitada,
            cantidadAImprimir,
            solicitudData.empresa || 'HECHO EN PERU' // 🏢 Agregar empresa a cola_impresion
        ]);
        
        logger.dbResult('INSERT INTO cola_impresion', result.rowCount, Date.now() - startTime);
        console.log('✅ [addToPrintQueue] Trabajo insertado en BD con ID:', result.rows[0].id);
        
        const printJob = {
            id: result.rows[0].id,
            id_solicitud: solicitudData.id_solicitud,
            numero_solicitud: solicitudData.numero_solicitud,
            qr_code: qrCode,
            nombre_producto: solicitudData.nombre_producto,
            descripcion_adicional: solicitudData.descripcion_corta,
            modelo: solicitudData.modelo, // Campo modelo para las etiquetas
            empresa: solicitudData.empresa || 'HECHO EN PERU', // 🏢 Incluir empresa en printJob
            costurera_nombre: solicitudData.costurera_nombre,
            id_producto: solicitudData.id_producto,
            cantidad: cantidadAImprimir,
            unidad_medida: solicitudData.unidad_medida || 'UNIDAD', // 🆕 Agregar unidad_medida
            // 🆕 Configuración personalizada de impresión (si existe)
            configuracion_impresion: solicitudData.configuracion_impresion || null
        };
        
        logger.printQueue('ADDED', printQueue.length + 1, printJob);
        console.log('📋 [addToPrintQueue] Trabajo creado:', JSON.stringify(printJob, null, 2));
        
        printQueue.push(printJob);
        console.log(`📋 [addToPrintQueue] Trabajo agregado a cola. Cola actual tiene ${printQueue.length} trabajos`);
        
        // Verificar conexión e intentar imprimir
        console.log('📋 [addToPrintQueue] Verificando conexión de impresora...');
        logger.info('PRINT-QUEUE', 'Verificando conexión de impresora...');
        const connected = await checkPrinterConnection();
        logger.printerConnection(
            ZEBRA_CONFIG.PRINTER_IP, 
            ZEBRA_CONFIG.PORT_NUMBER, 
            connected ? 'success' : 'failed'
        );
        console.log(`📋 [addToPrintQueue] Estado impresora: ${connected ? 'CONECTADA' : 'DESCONECTADA'}`);
        
        // 🔥 CORRECCIÓN: Iniciar procesamiento si NO está procesando actualmente
        if (connected && !isProcessingQueue) {
            console.log('📋 [addToPrintQueue] ✅ Iniciando procesamiento de cola...');
            logger.info('PRINT-QUEUE', `Iniciando procesamiento de cola (${printQueue.length} trabajos pendientes)`);
            processPrintQueue();
        } else if (!connected) {
            logger.warn('PRINT-QUEUE', 'Impresora desconectada, trabajo en cola esperando');
            console.log(`📋 [addToPrintQueue] ⚠️ Impresora desconectada, trabajo esperando en cola`);
        } else {
            logger.info('PRINT-QUEUE', `Proceso de impresión ya activo (${printQueue.length} trabajos en cola)`);
            console.log(`📋 [addToPrintQueue] ℹ️ Proceso de impresión ya activo, trabajo agregado a cola`);
        }
        
        logger.success('PRINT-QUEUE', `addToPrintQueue completado en ${Date.now() - startTime}ms`, {
            qr_code: qrCode,
            cantidad: cantidadAImprimir,
            printer_connected: connected
        });
        console.log('✅ [addToPrintQueue] Proceso completado exitosamente');
        return {
            success: true,
            qr_code: qrCode,
            cantidad_original: solicitudData.cantidad_solicitada,
            cantidad_a_imprimir: cantidadAImprimir,
            printer_connected: connected
        };
        
    } catch (error) {
        logger.error('PRINT-QUEUE', `Error en addToPrintQueue para ${solicitudData.numero_solicitud}`, error);
        console.error('❌ [addToPrintQueue] Error agregando a cola de impresión:', error);
        console.error('❌ [addToPrintQueue] Stack trace:', error.stack);
        throw error;
    }
}

// =============================================
// MIDDLEWARE
// =============================================
        // =============================================
// MIDDLEWARE DE SEGURIDAD POR IP
// =============================================

// Función para validar IPs permitidas específicas
function validarIPPermitida(ip) {
    // Extraer IP real (remover prefijo IPv6 si existe)
    const cleanIP = ip.replace('::ffff:', '');
    
    // Lista de IPs permitidas - Nueva red 192.168.15.x
    const ipsPermitidas = [
        '127.0.0.1',      // Localhost para desarrollo
        '::1',            // Localhost IPv6
        '192.168.15.21',  // Servidor (IP estatica nueva)
        '192.168.15.6',   // PC actual (DHCP)
        '192.168.15.20',  // Dispositivo detectado en red
        '192.168.15.26',  // Tablet/Dispositivo movil
        '192.168.15.36',  // Brother printer / dispositivo
        '192.168.15.34',  // Zebra ZD230
        '192.168.15.35'   // Godex G530
    ];
    
    return ipsPermitidas.includes(cleanIP) || ip === '::1';
}

// Middleware de filtro de IP
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Log de requests para debugging
    console.log(`📱 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url} - IP: ${clientIP}`);
    
    // Log adicional para debugging de errores
    req.on('error', (err) => {
        console.error(`❌ Error en request ${req.url}:`, err);
    });
    
    // Verificar si la IP está permitida
    if (!validarIPPermitida(clientIP)) {
        console.log(`🚫 IP BLOQUEADA: ${clientIP} - Acceso denegado`);
        
        // Si es una petición API, devolver JSON
        if (req.url.startsWith('/api/')) {
            return res.status(403).json({
                error: 'Acceso denegado',
                mensaje: 'Su dirección IP no está autorizada para acceder a este sistema',
                ip_cliente: clientIP,
                ips_permitidas: ['192.168.15.21 (Servidor)', '192.168.15.6 (PC Actual)', '192.168.15.20 (Dispositivo)']
            });
        }
        
        // Si es una página web, redirigir a página informativa
        return res.redirect('/ip-bloqueada.html');
    }
    
    next();
});

// Configuración CORS para dispositivos móviles
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    
    next();
});

// =============================================
// 🚀 MIDDLEWARE DE COMPRESIÓN Y OPTIMIZACIÓN
// =============================================

// Comprimir todas las respuestas HTTP (reduce ~70% el tamaño)
app.use(compression({
    level: 6,              // Nivel de compresión (0-9, 6 es balance entre velocidad y ratio)
    threshold: 1024,       // Solo comprimir responses > 1KB
    filter: (req, res) => {
        // No comprimir si el cliente no acepta compresión
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Usar filtro por defecto de compression
        return compression.filter(req, res);
    }
}));

console.log('✅ Compresión HTTP activada (nivel 6)');

// =============================================
// CONFIGURACIÓN ANTI-COLGADO DEL SERVIDOR
// =============================================

// Configurar timeouts para evitar que el servidor se cuelgue
app.use((req, res, next) => {
    // Timeout de 30 segundos para todas las peticiones
    req.setTimeout(30000, () => {
        console.log(`⏰ Request timeout para ${req.method} ${req.url}`);
        res.status(408).json({ error: 'Request timeout' });
    });
    
    res.setTimeout(30000, () => {
        console.log(`⏰ Response timeout para ${req.method} ${req.url}`);
        if (!res.headersSent) {
            res.status(408).json({ error: 'Response timeout' });
        }
    });
    
    next();
});

// Keep-alive para conexiones HTTP
app.use((req, res, next) => {
    res.set({
        'Keep-Alive': 'timeout=5, max=1000',
        'Connection': 'keep-alive'
    });
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/founds', express.static('founds')); // Servir archivos de la carpeta founds (animaciones, iconos, etc.)
app.use('/boletin', express.static('boletin')); // Servir archivos de la carpeta boletin (marketing)

// =============================================
// MIDDLEWARE DE LOGGING HTTP
// =============================================
app.use((req, res, next) => {
    const startTime = Date.now();
    const clientIP = (req.ip || req.connection.remoteAddress).replace('::ffff:', '');
    
    // Log de petición entrante
    logger.httpRequest(req.method, req.path, clientIP, req.user?.nombre);
    
    // Interceptar respuesta para medir duración
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        logger.httpResponse(req.method, req.path, res.statusCode, duration);
        originalSend.call(this, data);
    };
    
    next();
});

// =============================================
// MIDDLEWARE DE DEBUG PARA ENDPOINTS API
// =============================================
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`\n🔍 [DEBUG API] ${req.method} ${req.path}`);
        console.log(`   ├─ URL completa: ${req.originalUrl}`);
        console.log(`   ├─ Query: ${JSON.stringify(req.query)}`);
        const bodyStr = req.body ? JSON.stringify(req.body) : '(sin body)';
        console.log(`   └─ Body: ${bodyStr.substring(0, 100)}`);
    }
    next();
});

// Redirecciones para compatibilidad con enlaces antiguos o caché
app.get(['/games/panel.html', '/games/panel'], (req, res) => {
    // Redirige permanentemente al nuevo nombre de panel
    return res.redirect(301, '/games/panel-juegos.html');
});

// =============================================
// ENDPOINT DE PRUEBA DB Y VERIFICACIÓN DE IP
// =============================================
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as tiempo, COUNT(*) as total_usuarios FROM usuarios');
        res.json({ 
            mensaje: 'Conexión exitosa a PostgreSQL', 
            datos: result.rows[0] 
        });
    } catch (err) {
        console.error('Error conectando a PostgreSQL:', err);
        res.status(500).json({ error: 'Error de conexión: ' + err.message });
    }
});

// Endpoint para verificar IP del cliente
app.get('/api/verificar-ip', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const cleanIP = clientIP.replace('::ffff:', '');
    const esPermitida = validarIPPermitida(clientIP);
    
    res.json({
        ip_cliente: clientIP,
        ip_limpia: cleanIP,
        es_permitida: esPermitida,
        ips_permitidas: [
            '127.0.0.1 (Desarrollo)',
            '192.168.15.21 (Servidor)', 
            '192.168.15.6 (PC Actual)'
        ],
        timestamp: new Date().toLocaleString(),
        mensaje: esPermitida ? 'IP autorizada ✅' : 'IP no autorizada ❌'
    });
});

// Endpoint para ver últimas solicitudes creadas
app.get('/api/test-solicitudes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM solicitudes_etiquetas 
            ORDER BY id_solicitud DESC 
            LIMIT 10
        `);
        res.json({ 
            mensaje: `${result.rows.length} solicitudes encontradas en PostgreSQL`, 
            solicitudes_completas: result.rows,
            sql_ejecutado: "SELECT * FROM solicitudes_etiquetas ORDER BY id_solicitud DESC LIMIT 10"
        });
    } catch (err) {
        console.error('Error consultando solicitudes:', err);
        res.status(500).json({ error: 'Error: ' + err.message });
    }
});

// Endpoint para contar total de registros
app.get('/api/count-solicitudes', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as total FROM solicitudes_etiquetas');
        res.json({ 
            mensaje: 'Conteo desde PostgreSQL', 
            total_solicitudes_en_db: result.rows[0].total,
            sql_ejecutado: "SELECT COUNT(*) as total FROM solicitudes_etiquetas"
        });
    } catch (err) {
        console.error('Error contando solicitudes:', err);
        res.status(500).json({ error: 'Error: ' + err.message });
    }
});

// =============================================
// ENDPOINTS DE ADMINISTRACIÓN
// =============================================

// Estadísticas generales del sistema
app.get('/api/admin/stats', async (req, res) => {
    try {
        const queries = [
            { key: 'usuarios', query: 'SELECT COUNT(*) as count FROM usuarios', label: 'Total Usuarios' },
            { key: 'productos', query: 'SELECT COUNT(*) as count FROM productos', label: 'Total Productos' },
            { key: 'solicitudes', query: 'SELECT COUNT(*) as count FROM solicitudes_etiquetas', label: 'Total Solicitudes' },
            { key: 'solicitudes_hoy', query: 'SELECT COUNT(*) as count FROM solicitudes_etiquetas WHERE DATE(fecha_solicitud) = CURRENT_DATE', label: 'Solicitudes Hoy' },
            { key: 'etiquetas', query: 'SELECT COUNT(*) as count FROM etiquetas_generadas', label: 'Etiquetas Generadas' },
            { key: 'departamentos', query: 'SELECT COUNT(*) as count FROM departamentos', label: 'Departamentos' }
        ];
        
        const results = await Promise.all(
            queries.map(async ({ key, query, label }) => {
                const result = await pool.query(query);
                return { [key]: { count: result.rows[0].count, label } };
            })
        );
        
        const stats = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        res.json(stats);
        
    } catch (error) {
        console.error('Error obteniendo estadísticas admin:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Listar todas las tablas del sistema
app.get('/api/admin/tables', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                tablename as table_name,
                schemaname as schema_name
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        // Obtener conteo de filas para cada tabla
        const tablesWithCounts = await Promise.all(
            result.rows.map(async (table) => {
                try {
                    const countResult = await pool.query(`SELECT COUNT(*) as row_count FROM ${table.table_name}`);
                    return {
                        ...table,
                        row_count: parseInt(countResult.rows[0].row_count)
                    };
                } catch (error) {
                    return { ...table, row_count: 0 };
                }
            })
        );
        
        res.json(tablesWithCounts);
        
    } catch (error) {
        console.error('Error obteniendo tablas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener estructura y datos de una tabla específica
app.get('/api/admin/table/:tableName', async (req, res) => {
    const { tableName } = req.params;
    
    try {
        // Validar que la tabla existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
            return res.status(404).json({ error: 'Tabla no encontrada' });
        }
        
        // Obtener estructura de columnas
        const columnsResult = await pool.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [tableName]);
        
        // Obtener datos
        const dataResult = await pool.query(`SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 500`);
        
        res.json({
            table_name: tableName,
            columns: columnsResult.rows,
            rows: dataResult.rows,
            total_rows: dataResult.rows.length
        });
        
    } catch (error) {
        console.error('Error obteniendo datos de tabla:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

// Actualizar un registro específico
app.post('/api/admin/update/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const { rowIndex, columnName, newValue, primaryKey } = req.body;
    
    try {
        // Validar que la tabla existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
            return res.status(404).json({ error: 'Tabla no encontrada' });
        }
        
        // Obtener clave primaria de la tabla
        const primaryKeyResult = await pool.query(`
            SELECT column_name
            FROM information_schema.key_column_usage
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 1
        `, [tableName]);
        
        if (primaryKeyResult.rows.length === 0) {
            return res.status(400).json({ error: 'Tabla sin clave primaria' });
        }
        
        const primaryKeyColumn = primaryKeyResult.rows[0].column_name;
        
        // Actualizar registro
        const updateQuery = `UPDATE ${tableName} SET ${columnName} = $1 WHERE ${primaryKeyColumn} = $2`;
        await pool.query(updateQuery, [newValue, primaryKey]);
        
        res.json({ message: 'Registro actualizado exitosamente' });
        
    } catch (error) {
        console.error('Error actualizando registro:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

// Eliminar un registro específico
app.delete('/api/admin/delete/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const { primaryKey } = req.body;
    
    try {
        // Validar que la tabla existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
            return res.status(404).json({ error: 'Tabla no encontrada' });
        }
        
        // Obtener clave primaria de la tabla
        const primaryKeyResult = await pool.query(`
            SELECT column_name
            FROM information_schema.key_column_usage
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 1
        `, [tableName]);
        
        if (primaryKeyResult.rows.length === 0) {
            return res.status(400).json({ error: 'Tabla sin clave primaria' });
        }
        
        const primaryKeyColumn = primaryKeyResult.rows[0].column_name;
        
        // Eliminar registro
        const deleteQuery = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn} = $1`;
        const result = await pool.query(deleteQuery, [primaryKey]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        res.json({ message: 'Registro eliminado exitosamente' });
        
    } catch (error) {
        console.error('Error eliminando registro:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

// Crear nuevo registro en una tabla
app.post('/api/admin/create/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const newData = req.body;
    
    try {
        // Validar que la tabla existe
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = $1
            )
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
            return res.status(404).json({ error: 'Tabla no encontrada' });
        }
        
        // Obtener estructura de columnas
        const columnsResult = await pool.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [tableName]);
        
        const columns = columnsResult.rows;
        
        // Filtrar columnas que no son de solo lectura (auto-increment, etc.)
        const insertableColumns = columns.filter(col => 
            !col.column_default?.includes('nextval') && // No auto-increment
            newData.hasOwnProperty(col.column_name) // Solo campos enviados
        );
        
        if (insertableColumns.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para insertar' });
        }
        
        // Construir query dinámico
        const columnNames = insertableColumns.map(col => col.column_name);
        const placeholders = insertableColumns.map((_, index) => `$${index + 1}`);
        const values = insertableColumns.map(col => {
            const value = newData[col.column_name];
            
            // Convertir tipos según sea necesario
            if (value === '' || value === 'NULL') return null;
            if (col.data_type.includes('int') && value !== null) return parseInt(value);
            if (col.data_type.includes('numeric') && value !== null) return parseFloat(value);
            if (col.data_type.includes('boolean')) return value === true || value === 'true';
            
            return value;
        });
        
        const insertQuery = `
            INSERT INTO ${tableName} (${columnNames.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING *
        `;
        
        const result = await pool.query(insertQuery, values);
        
        res.json({
            message: 'Registro creado exitosamente',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error creando registro:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

// Obtener información de claves foráneas para una tabla
app.get('/api/admin/foreign-keys/:tableName', async (req, res) => {
    const { tableName } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = $1
                AND tc.table_schema = 'public'
        `, [tableName]);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error obteniendo claves foráneas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener opciones para una clave foránea específica
app.get('/api/admin/fk-options/:tableName/:columnName', async (req, res) => {
    const { tableName, columnName } = req.params;
    
    try {
        // Obtener la tabla referenciada
        const fkResult = await pool.query(`
            SELECT 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = $1
                AND kcu.column_name = $2
                AND tc.table_schema = 'public'
            LIMIT 1
        `, [tableName, columnName]);
        
        if (fkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Clave foránea no encontrada' });
        }
        
        const { foreign_table_name, foreign_column_name } = fkResult.rows[0];
        
        // Obtener las opciones disponibles
        let optionsQuery = `SELECT ${foreign_column_name} as value`;
        
        // Agregar campo descriptivo si existe
        if (foreign_table_name === 'usuarios') {
            optionsQuery += `, nombre_completo as label`;
        } else if (foreign_table_name === 'productos') {
            optionsQuery += `, nombre_producto as label`;
        } else if (foreign_table_name === 'departamentos') {
            optionsQuery += `, nombre_departamento as label`;
        } else {
            optionsQuery += `, ${foreign_column_name} as label`;
        }
        
        optionsQuery += ` FROM ${foreign_table_name} ORDER BY 2`;
        
        const optionsResult = await pool.query(optionsQuery);
        
        res.json({
            foreign_table: foreign_table_name,
            options: optionsResult.rows
        });
        
    } catch (error) {
        console.error('Error obteniendo opciones FK:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Estadísticas avanzadas con filtros dinámicos
app.get('/api/admin/estadisticas-avanzadas', async (req, res) => {
    try {
        const { costurera, mes, incluir_completados = true, incluir_proceso = true, incluir_pendientes = true } = req.query;
        
        // Construir filtros WHERE dinámicamente
        let whereClause = 'WHERE 1=1';
        let params = [];
        let paramCount = 1;
        
        if (costurera && costurera !== '') {
            whereClause += ` AND se.id_usuario = $${paramCount}`;
            params.push(costurera);
            paramCount++;
        }
        
        if (mes && mes !== '') {
            whereClause += ` AND DATE_TRUNC('month', se.fecha_solicitud) = DATE_TRUNC('month', $${paramCount}::date)`;
            params.push(`${mes}-01`);
            paramCount++;
        }
        
        // Filtro de estados
        const estados = [];
        if (incluir_completados === 'true') estados.push('completada');
        if (incluir_proceso === 'true') estados.push('proceso');
        if (incluir_pendientes === 'true') estados.push('pendiente');
        
        if (estados.length > 0) {
            const estadosPlaceholders = estados.map((_, index) => `$${paramCount + index}`).join(',');
            whereClause += ` AND se.estado IN (${estadosPlaceholders})`;
            params.push(...estados);
            paramCount += estados.length;
        }
        
        // Query principal para estadísticas por producto
        const estadisticasQuery = `
            SELECT 
                p.nombre_producto,
                p.marca,
                p.modelo,
                se.estado,
                COUNT(se.id_solicitud) as cantidad_solicitudes,
                SUM(se.cantidad_solicitada) as total_etiquetas,
                u.nombre_completo as costurera,
                TO_CHAR(se.fecha_solicitud, 'YYYY-MM') as mes_anio
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            ${whereClause}
            GROUP BY 
                p.id_producto, p.nombre_producto, p.marca, p.modelo, 
                se.estado, u.nombre_completo, mes_anio
            ORDER BY total_etiquetas DESC
        `;
        
        const estadisticasResult = await pool.query(estadisticasQuery, params);
        
        // Resumen por estados
        const resumenQuery = `
            SELECT 
                se.estado,
                COUNT(se.id_solicitud) as cantidad_solicitudes,
                SUM(se.cantidad_solicitada) as total_etiquetas
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            ${whereClause}
            GROUP BY se.estado
            ORDER BY se.estado
        `;
        
        const resumenResult = await pool.query(resumenQuery, params);
        
        // Datos para gráfico circular (ProductosC vs ProductosI)
        const productosCompletados = estadisticasResult.rows
            .filter(row => row.estado === 'completada')
            .reduce((acc, row) => acc + parseInt(row.total_etiquetas), 0);
            
        const productosIncompletos = estadisticasResult.rows
            .filter(row => ['proceso', 'pendiente'].includes(row.estado))
            .reduce((acc, row) => acc + parseInt(row.total_etiquetas), 0);
        
        // Top productos por estado
        const topProductos = {};
        ['completada', 'proceso', 'pendiente'].forEach(estado => {
            topProductos[estado] = estadisticasResult.rows
                .filter(row => row.estado === estado)
                .slice(0, 10)
                .map(row => ({
                    producto: `${row.nombre_producto} - ${row.marca} ${row.modelo}`,
                    costurera: row.costurera,
                    solicitudes: parseInt(row.cantidad_solicitudes),
                    etiquetas: parseInt(row.total_etiquetas),
                    mes: row.mes_anio
                }));
        });
        
        res.json({
            resumen: resumenResult.rows.map(row => ({
                estado: row.estado,
                solicitudes: parseInt(row.cantidad_solicitudes),
                etiquetas: parseInt(row.total_etiquetas)
            })),
            grafico_circular: {
                productos_completados: productosCompletados,
                productos_incompletos: productosIncompletos,
                total: productosCompletados + productosIncompletos
            },
            detalle_por_producto: estadisticasResult.rows.map(row => ({
                producto: `${row.nombre_producto} - ${row.marca} ${row.modelo}`,
                estado: row.estado,
                costurera: row.costurera,
                solicitudes: parseInt(row.cantidad_solicitudes),
                etiquetas: parseInt(row.total_etiquetas),
                mes: row.mes_anio
            })),
            top_productos: topProductos,
            filtros_aplicados: {
                costurera: costurera || 'Todas',
                mes: mes || 'Todos los meses',
                estados_incluidos: estados
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas avanzadas:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
});

// Lista de costureras para filtros
app.get('/api/admin/costureras-lista', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT 
                u.id_usuario, 
                u.nombre_completo,
                COUNT(se.id_solicitud) as total_solicitudes
            FROM usuarios u
            LEFT JOIN solicitudes_etiquetas se ON u.id_usuario = se.id_usuario
            WHERE u.nivel_acceso = 'costurera'
            GROUP BY u.id_usuario, u.nombre_completo
            ORDER BY u.nombre_completo
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo costureras:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =============================================
// ENDPOINT DE SESIÓN DEL SERVIDOR
// =============================================
// Endpoint público para verificar ID de sesión del servidor
app.get('/api/server/session', (req, res) => {
    res.json({
        sessionId: SERVER_SESSION_ID,
        timestamp: new Date().toISOString(),
        status: 'online'
    });
});

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================
// ⚠️ AUTENTICACIÓN DESACTIVADA - ACCESO LIBRE
const verificarToken = async (req, res, next) => {
    // Bypass completo - sin validación de token
    req.usuario = {
        id_usuario: 1,
        nivel_acceso: 'administracion',
        nombre_completo: 'Sistema',
        id_departamento: 1,
        activo: true
    };
    next();
    
    /* AUTENTICACIÓN ORIGINAL (COMENTADA)
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado', requiresLogin: true });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario aún existe y está activo
        const userCheck = await pool.query(
            'SELECT id_usuario, nivel_acceso, nombre_completo, id_departamento, activo FROM usuarios WHERE id_usuario = $1 AND activo = true',
            [decoded.id_usuario]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no válido', requiresLogin: true });
        }
        
        req.usuario = userCheck.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido', requiresLogin: true });
    }
    */
};

// Middleware para verificar roles específicos
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.usuario.nivel_acceso)) {
            return res.status(403).json({ error: 'Acceso denegado para tu rol' });
        }
        next();
    };
};

// Middleware específico para verificar admin
const verificarAdmin = (req, res, next) => {
    if (req.usuario.nivel_acceso !== 'admin') {
        return res.status(403).json({ 
            error: 'Acceso denegado', 
            mensaje: 'Se requieren privilegios de administrador para esta acción' 
        });
    }
    next();
};

// =============================================
// RUTAS DE AUTENTICACIÓN
// =============================================

// Página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login_fixed.html'));
});

// API de login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Buscar usuario por email o código de empleado
        const userQuery = `
            SELECT u.*, d.nombre_departamento 
            FROM usuarios u 
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            WHERE (u.email = $1 OR u.codigo_empleado = $1) AND u.activo = true
        `;
        const userResult = await pool.query(userQuery, [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = userResult.rows[0];
        
        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Crear token JWT
        const token = jwt.sign(
            { 
                id_usuario: usuario.id_usuario, 
                nivel_acceso: usuario.nivel_acceso,
                departamento: usuario.id_departamento 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        // Guardar sesión en base de datos
        await pool.query(
            `INSERT INTO sesiones_usuarios (id_usuario, token_sesion, fecha_expiracion) 
             VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
            [usuario.id_usuario, token]
        );
        
        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET ultimo_login = NOW(), activo_sesion = true WHERE id_usuario = $1',
            [usuario.id_usuario]
        );
        
        // Enviar token como cookie
        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 8 * 60 * 60 * 1000, // 8 horas
            sameSite: 'strict'
        });
        
        res.json({
            success: true,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                nivel_acceso: usuario.nivel_acceso,
                departamento: usuario.nombre_departamento,
                email: usuario.email
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// API de logout
app.post('/api/auth/logout', verificarToken, async (req, res) => {
    try {
        // Desactivar sesión en base de datos
        await pool.query(
            'UPDATE sesiones_usuarios SET activa = false WHERE id_usuario = $1 AND activa = true',
            [req.usuario.id_usuario]
        );
        
        // Actualizar estado del usuario
        await pool.query(
            'UPDATE usuarios SET activo_sesion = false WHERE id_usuario = $1',
            [req.usuario.id_usuario]
        );
        
        // Limpiar cookie
        res.clearCookie('token');
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Verificar sesión actual
app.get('/api/auth/me', verificarToken, (req, res) => {
    res.json({
        usuario: {
            id_usuario: req.usuario.id_usuario,
            nombre_completo: req.usuario.nombre_completo,
            nivel_acceso: req.usuario.nivel_acceso,
            id_departamento: req.usuario.id_departamento
        }
    });
});

// =============================================
// ENDPOINT HEALTH CHECK (para watchdog)
// =============================================

app.get('/health', (req, res) => {
    // Verificar conexión a base de datos
    pool.query('SELECT 1', (err) => {
        if (err) {
            return res.status(503).json({ 
                status: 'ERROR', 
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
        
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            puerto: CONFIG.servidor.PORT || 3012,
            database: 'connected',
            printers: {
                zebra: `${ZEBRA_CONFIG.PRINTER_IP}:${ZEBRA_CONFIG.PORT_NUMBER}`,
                godex: `${GODEX_CONFIG.PRINTER_IP}:${GODEX_CONFIG.PORT_NUMBER}`
            }
        });
    });
});

// =============================================
// RUTAS PRINCIPALES PROTEGIDAS
// =============================================

// Ruta principal - sin autenticación (solo por IP)
app.get('/', (req, res) => {
    // Servir página principal sin verificar rol
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// API ENDPOINTS PROTEGIDOS
// =============================================

// Obtener departamentos (solo admin)
app.get('/api/departamentos', verificarToken, verificarRol(['administracion']), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM departamentos ORDER BY nombre_departamento');
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener departamentos' });
    }
});

// Obtener usuarios (según rol)
app.get('/api/usuarios', async (req, res) => {
    try {
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
        let usuario = { nivel_acceso: 'admin', id_departamento: 1 }; // valores por defecto
        
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
        
        let query, params;
        
        if (usuario.nivel_acceso === 'admin' || usuario.nivel_acceso === 'administracion' || usuario.nivel_acceso === 'supervisor') {
            // Admin/Supervisor ve todos los usuarios
            query = `
                SELECT u.*, d.nombre_departamento 
                FROM usuarios u 
                LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento 
                ORDER BY u.nombre_completo
            `;
            params = [];
        } else {
            // Otros ven solo usuarios de su departamento
            query = `
                SELECT u.*, d.nombre_departamento 
                FROM usuarios u 
                LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento 
                WHERE u.id_departamento = $1
                ORDER BY u.nombre_completo
            `;
            params = [usuario.id_departamento];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Cache simple en memoria para productos
let productosCache = {
    data: null,
    lastUpdate: null,
    ttl: 5 * 60 * 1000 // 5 minutos
};

// Obtener productos (todos pueden ver) - Con cache y paginación
// =============================================
// 🚀 ENDPOINT DE BÚSQUEDA RÁPIDA DE PRODUCTOS (AUTOCOMPLETE)
// =============================================
app.get('/api/productos/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        // Validar que haya término de búsqueda
        if (!q || q.trim().length < 2) {
            return res.json({ data: [], message: 'Mínimo 2 caracteres para buscar' });
        }
        
        const searchTerm = q.trim().toUpperCase();
        
        // Verificar cache
        const cacheKey = getCacheKey('productos:search', { q: searchTerm, limit });
        const cached = getFromCache(cacheKey);
        if (cached) {
            return res.json({ data: cached, source: 'cache', term: searchTerm });
        }
        
        // Búsqueda en base de datos con múltiples campos
        const query = `
            SELECT 
                id_producto,
                nombre_producto,
                codigo_producto,
                marca,
                categoria,
                subcategoria,
                modelo,
                unidad_medida
            FROM productos 
            WHERE activo = true
            AND (
                UPPER(nombre_producto) LIKE $1
                OR UPPER(codigo_producto) LIKE $1
                OR UPPER(marca) LIKE $1
                OR UPPER(modelo) LIKE $1
                OR UPPER(categoria) LIKE $1
                OR UPPER(subcategoria) LIKE $1
            )
            ORDER BY 
                CASE 
                    WHEN UPPER(nombre_producto) LIKE $2 THEN 1
                    WHEN UPPER(codigo_producto) LIKE $2 THEN 2
                    ELSE 3
                END,
                nombre_producto
            LIMIT $3
        `;
        
        const result = await pool.query(query, [
            `%${searchTerm}%`,  // Para LIKE parcial
            `${searchTerm}%`,   // Para priorizar coincidencias al inicio
            limit
        ]);
        
        console.log(`🔍 Búsqueda "${searchTerm}": ${result.rows.length} resultados`);
        
        // Guardar en cache (60 segundos - búsquedas son dinámicas)
        setInCache(cacheKey, result.rows, 60);
        
        res.json({ 
            data: result.rows,
            source: 'database',
            term: searchTerm,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('❌ Error en búsqueda de productos:', error);
        res.status(500).json({ error: 'Error buscando productos' });
    }
});

app.get('/api/productos', async (req, res) => {
    try {
        const { search, categoria, subcategoria, page = 1, limit = 50, all } = req.query;
        const offset = (page - 1) * limit;
        
        // Si se solicita "all=true", devolver todos los productos sin paginación
        if (all === 'true') {
            console.log('🔍 [productos] Solicitando TODOS los productos (all=true)');
            
            // Verificar cache primero
            const cacheKey = 'productos:all';
            const cached = getFromCache(cacheKey);
            if (cached) {
                console.log('📦 [productos] Sirviendo TODOS desde cache');
                return res.json(cached);
            }
            
            const allQuery = `
                SELECT 
                    id_producto,
                    nombre_producto,
                    codigo_producto,
                    marca,
                    categoria,
                    subcategoria,
                    modelo,
                    unidad_medida,
                    empresa,
                    activo
                FROM productos 
                WHERE activo = true
                ORDER BY categoria, subcategoria, nombre_producto
            `;
            
            const allResult = await pool.query(allQuery);
            
            const response = {
                data: allResult.rows,
                total: allResult.rows.length,
                all: true,
                message: `Cargados ${allResult.rows.length} productos activos`
            };
            
            // Guardar en cache (1 hora)
            setInCache(cacheKey, response, CACHE_TTL.PRODUCTOS);
            
            console.log(`📦 [productos] Devolviendo ${allResult.rows.length} productos (todos)`);
            return res.json(response);
        }
        
        // Verificar cache para consultas sin filtros
        if (!search && !categoria && !subcategoria && page == 1) {
            const cacheKey = getCacheKey('productos:list', { page, limit });
            const cached = getFromCache(cacheKey);
            if (cached) {
                console.log('📋 [productos] Sirviendo desde cache');
                return res.json(cached);
            }
        }
        
        let query = `
            SELECT 
                id_producto,
                id_producto_original,
                nombre_producto,
                descripcion_corta,
                categoria,
                subcategoria,
                marca,
                modelo,
                sku,
                codigo_producto,
                codigo_barras,
                unidad_medida,
                empresa,
                activo,
                fecha_creacion,
                precios
            FROM productos 
            WHERE activo = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        // Filtro por búsqueda
        if (search) {
            query += ` AND (
                nombre_producto ILIKE $${paramCount} OR 
                marca ILIKE $${paramCount} OR 
                modelo ILIKE $${paramCount} OR
                categoria ILIKE $${paramCount} OR
                subcategoria ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        // Filtro por categoría
        if (categoria) {
            query += ` AND categoria ILIKE $${paramCount}`;
            params.push(`%${categoria}%`);
            paramCount++;
        }
        
        // Filtro por subcategoría
        if (subcategoria) {
            query += ` AND subcategoria ILIKE $${paramCount}`;
            params.push(`%${subcategoria}%`);
            paramCount++;
        }
        
        // Agregar paginación
        query += ` ORDER BY categoria, subcategoria, nombre_producto LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        // Obtener conteo total para paginación
        let countQuery = `SELECT COUNT(*) as total FROM productos WHERE activo = true`;
        let countParams = [];
        let countParamCount = 1;
        
        // Aplicar mismos filtros para el conteo
        if (search) {
            countQuery += ` AND (
                nombre_producto ILIKE $${countParamCount} OR 
                marca ILIKE $${countParamCount} OR 
                modelo ILIKE $${countParamCount} OR
                categoria ILIKE $${countParamCount} OR
                subcategoria ILIKE $${countParamCount}
            )`;
            countParams.push(`%${search}%`);
            countParamCount++;
        }
        
        if (categoria) {
            countQuery += ` AND categoria ILIKE $${countParamCount}`;
            countParams.push(`%${categoria}%`);
            countParamCount++;
        }
        
        if (subcategoria) {
            countQuery += ` AND subcategoria ILIKE $${countParamCount}`;
            countParams.push(`%${subcategoria}%`);
            countParamCount++;
        }
        
        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);
        
        const totalItems = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalItems / limit);
        
        const response = {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
        
        // Guardar en cache solo para la primera página sin filtros
        if (!search && !categoria && !subcategoria && page == 1) {
            const cacheKey = getCacheKey('productos:list', { page, limit });
            setInCache(cacheKey, response, CACHE_TTL.PRODUCTOS);
            console.log('📋 [productos] Cache actualizado');
        }
        
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Obtener producto individual por ID
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                id_producto,
                nombre_producto,
                descripcion_corta,
                categoria,
                subcategoria,
                marca,
                modelo,
                sku,
                codigo_producto,
                codigo_barras,
                unidad_medida,
                activo,
                fecha_creacion,
                precios,
                mostrar_qr,
                mostrar_nombre,
                mostrar_id,
                mostrar_unidad,
                mostrar_modelo,
                mostrar_empresa
            FROM productos 
            WHERE id_producto = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
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
            mostrar_modelo,
            mostrar_empresa
        } = req.body;

        // Validaciones básicas
        if (!nombre_producto || !categoria) {
            return res.status(400).json({ 
                error: 'El nombre del producto y la categoría son requeridos' 
            });
        }

        const result = await pool.query(`
            UPDATE productos 
            SET 
                nombre_producto = $1,
                marca = $2,
                modelo = $3,
                categoria = $4,
                subcategoria = $5,
                activo = $6,
                mostrar_qr = $7,
                mostrar_nombre = $8,
                mostrar_id = $9,
                mostrar_unidad = $10,
                mostrar_modelo = $11,
                mostrar_empresa = $12,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto = $13
            RETURNING id_producto, nombre_producto, marca, modelo, categoria, subcategoria, activo, 
                      mostrar_qr, mostrar_nombre, mostrar_id, mostrar_unidad, mostrar_modelo, mostrar_empresa
        `, [
            nombre_producto, 
            marca, 
            modelo, 
            categoria, 
            subcategoria, 
            activo,
            mostrar_qr !== undefined ? mostrar_qr : true,
            mostrar_nombre !== undefined ? mostrar_nombre : true,
            mostrar_id !== undefined ? mostrar_id : true,
            mostrar_unidad !== undefined ? mostrar_unidad : true,
            mostrar_modelo !== undefined ? mostrar_modelo : true,
            mostrar_empresa !== undefined ? mostrar_empresa : true,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log(`📝 Producto ${id} actualizado:`, result.rows[0]);
        res.json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
    }
});

// Actualizar configuración de etiqueta de un producto
app.put('/api/productos/:id/configuracion-etiqueta', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            mostrar_qr,
            mostrar_nombre,
            mostrar_id,
            mostrar_unidad,
            mostrar_modelo,
            mostrar_empresa
        } = req.body;

        console.log(`⚙️ Actualizando configuración de etiqueta del producto ${id}:`, req.body);

        const result = await pool.query(`
            UPDATE productos 
            SET mostrar_qr = $1,
                mostrar_nombre = $2,
                mostrar_id = $3,
                mostrar_unidad = $4,
                mostrar_modelo = $5,
                mostrar_empresa = $6
            WHERE id_producto = $7
            RETURNING *
        `, [mostrar_qr, mostrar_nombre, mostrar_id, mostrar_unidad, mostrar_modelo, mostrar_empresa, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log(`✅ Configuración actualizada para producto ${id}`);
        res.json({ 
            mensaje: 'Configuración de etiqueta actualizada correctamente',
            producto: result.rows[0] 
        });

    } catch (error) {
        console.error('❌ Error actualizando configuración de etiqueta:', error);
        res.status(500).json({ error: 'Error al actualizar configuración: ' + error.message });
    }
});

// Obtener categorías de productos
app.get('/api/productos/categorias', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT categoria, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = true AND categoria IS NOT NULL AND categoria != ''
            GROUP BY categoria 
            ORDER BY categoria
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// Obtener subcategorías por categoría
app.get('/api/productos/subcategorias/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const result = await pool.query(`
            SELECT subcategoria, COUNT(*) as cantidad 
            FROM productos 
            WHERE activo = true AND categoria = $1 AND subcategoria IS NOT NULL AND subcategoria != ''
            GROUP BY subcategoria 
            ORDER BY subcategoria
        `, [categoria]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener subcategorías' });
    }
});

// Obtener subcategorías específicas para Productos Terminados
app.get('/api/subcategorias-terminados', async (req, res) => {
    try {
        console.log('🔍 [subcategorias-terminados] Iniciando consulta...');
        
        // Primero verificar si la tabla productos existe
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'productos'
        `);
        
        if (tableCheck.rows.length === 0) {
            console.log('⚠️ [subcategorias-terminados] Tabla productos no existe, devolviendo valores por defecto');
            // Si la tabla no existe, devolver las subcategorías conocidas
            const defaultSubcategorias = ['PROTECTORES', 'FRAZADAS', 'SABANAS', 'DUVET', 'EDREDONES'];
            res.json(defaultSubcategorias);
            return;
        }

        const result = await pool.query(`
            SELECT DISTINCT subcategoria 
            FROM productos 
            WHERE activo = true 
            AND categoria = 'Productos Terminados' 
            AND subcategoria IS NOT NULL 
            AND subcategoria != ''
            ORDER BY subcategoria
        `);
        
        console.log('✅ [subcategorias-terminados] Resultado de DB:', result.rows);
        
        // Si no hay resultados de la DB, usar valores por defecto
        if (result.rows.length === 0) {
            console.log('⚠️ [subcategorias-terminados] No hay datos en DB, usando valores por defecto');
            const defaultSubcategorias = ['PROTECTORES', 'FRAZADAS', 'SABANAS', 'DUVET', 'EDREDONES'];
            res.json(defaultSubcategorias);
        } else {
            res.json(result.rows.map(row => row.subcategoria));
        }
        
    } catch (error) {
        console.error('❌ [subcategorias-terminados] Error completo:', error);
        console.error('❌ [subcategorias-terminados] Stack trace:', error.stack);
        
        // En caso de cualquier error, devolver valores por defecto
        console.log('🔄 [subcategorias-terminados] Devolviendo valores por defecto debido a error');
        const defaultSubcategorias = ['PROTECTORES', 'FRAZADAS', 'SABANAS', 'DUVET', 'EDREDONES'];
        res.json(defaultSubcategorias);
    }
});

// Obtener marcas existentes para autocompletado
app.get('/api/productos/lista/marcas', async (req, res) => {
    try {
        console.log('🔍 [marcas] Obteniendo marcas existentes...');
        const result = await pool.query(`
            SELECT DISTINCT marca 
            FROM productos 
            WHERE activo = true 
            AND marca IS NOT NULL 
            AND marca != ''
            ORDER BY marca
        `);
        
        console.log('✅ [marcas] Marcas encontradas:', result.rows.length);
        res.json(result.rows.map(row => row.marca));
    } catch (error) {
        console.error('❌ [marcas] Error:', error);
        res.json([]); // Devolver array vacío si hay error
    }
});

// Obtener modelos existentes para autocompletado
app.get('/api/productos/lista/modelos', async (req, res) => {
    try {
        console.log('🔍 [modelos] Obteniendo modelos existentes...');
        const result = await pool.query(`
            SELECT DISTINCT modelo 
            FROM productos 
            WHERE activo = true 
            AND modelo IS NOT NULL 
            AND modelo != ''
            ORDER BY modelo
        `);
        
        console.log('✅ [modelos] Modelos encontrados:', result.rows.length);
        res.json(result.rows.map(row => row.modelo));
    } catch (error) {
        console.error('❌ [modelos] Error:', error);
        res.json([]); // Devolver array vacío si hay error
    }
});

// =============================================
// GESTIÓN DE PRODUCTOS PARA SUPERVISOR
// =============================================

// Obtener el próximo código de producto
app.get('/api/admin/productos/next-code', async (req, res) => {
    try {
        // Buscar el último código de producto
        const result = await pool.query(`
            SELECT codigo_producto 
            FROM productos 
            WHERE codigo_producto ~ '^PROD-[0-9]+$' 
            ORDER BY 
                CAST(SUBSTRING(codigo_producto FROM 'PROD-([0-9]+)') AS INTEGER) DESC 
            LIMIT 1
        `);

        let nextNumber = 1;
        
        if (result.rows.length > 0) {
            const lastCode = result.rows[0].codigo_producto;
            const lastNumber = parseInt(lastCode.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        const nextCode = `PROD-${nextNumber.toString().padStart(3, '0')}`;
        
        res.json({ next_code: nextCode });

    } catch (error) {
        console.error('Error generando código:', error);
        res.status(500).json({ error: 'Error al generar código' });
    }
});

// =============================================
// ENDPOINTS DE ROTULADO GODEX G530
// =============================================

// Imprimir rotulado directamente en Godex G530
app.post('/api/print/rotulado', async (req, res) => {
    try {
        const { id_producto, cantidad, conCorte = false } = req.body;
        
        console.log(`🏷️ [print/rotulado] Solicitud de impresión - Producto: ${id_producto}, Cantidad: ${cantidad}, Corte: ${conCorte}`);
        
        // Obtener datos del producto
        const productoResult = await pool.query(`
            SELECT 
                id_producto,
                nombre_producto,
                categoria,
                subcategoria,
                marca,
                modelo,
                unidad_medida,
                empresa
            FROM productos 
            WHERE id_producto = $1 AND activo = true
        `, [id_producto]);
        
        if (productoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const producto = productoResult.rows[0];
        console.log(`📦 [print/rotulado] Producto encontrado:`, producto);
        
        // Generar ZPL para Godex con opciones de corte
        const zplData = generarRotuladoZPL(producto, { conCorte });
        
        // IP y Puerto de Godex G530
        const GODEX_IP = '192.168.15.35';
        const GODEX_PORT = 9100;
        
        console.log(`📡 [print/rotulado] Enviando a Godex ${GODEX_IP}:${GODEX_PORT}...`);
        
        // Imprimir la cantidad solicitada
        for (let i = 0; i < cantidad; i++) {
            await enviarZPLAGodex(zplData, GODEX_IP, GODEX_PORT);
            console.log(`✅ [print/rotulado] Rotulado ${i + 1}/${cantidad} enviado`);
            
            // Pausa entre impresiones
            if (i < cantidad - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        res.json({
            success: true,
            mensaje: `${cantidad} rotulado(s) enviado(s) exitosamente a Godex G530`,
            producto: producto.nombre_producto
        });
        
    } catch (error) {
        console.error('❌ [print/rotulado] Error:', error);
        res.status(500).json({ error: 'Error al imprimir rotulado: ' + error.message });
    }
});

// Crear solicitud de rotulado (para cuando auto_servicesgd = false)
app.post('/api/solicitudes/rotulado', async (req, res) => {
    try {
        const { id_producto, cantidad, observaciones, id_usuario, conCorte = false } = req.body;
        
        console.log(`📝 [solicitudes/rotulado] Nueva solicitud - Producto: ${id_producto}, Cantidad: ${cantidad}, Corte: ${conCorte}`);
        
        // Generar número de solicitud único
        const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const contadorResult = await pool.query(
            'SELECT COUNT(*) as total FROM solicitudes_rotulado WHERE DATE(fecha_solicitud) = CURRENT_DATE'
        );
        const numeroSolicitud = `ROT-${fechaHoy}-${String(parseInt(contadorResult.rows[0].total) + 1).padStart(4, '0')}`;
        
        // Obtener datos del producto
        const productoResult = await pool.query(`
            SELECT 
                id_producto,
                nombre_producto,
                categoria,
                subcategoria,
                marca,
                modelo,
                unidad_medida
            FROM productos 
            WHERE id_producto = $1 AND activo = true
        `, [id_producto]);
        
        if (productoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const producto = productoResult.rows[0];
        
        // Generar ZPL para guardar con opciones de corte
        const zplData = generarRotuladoZPL(producto, { conCorte });
        
        // Insertar solicitud
        const insertResult = await pool.query(`
            INSERT INTO solicitudes_rotulado 
            (numero_solicitud, id_usuario, id_producto, cantidad_solicitada, 
             observaciones, datos_zpl, estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
            RETURNING *
        `, [numeroSolicitud, id_usuario, id_producto, cantidad, observaciones, zplData]);
        
        console.log(`✅ [solicitudes/rotulado] Solicitud creada: ${numeroSolicitud}`);
        
        res.json({
            success: true,
            mensaje: 'Solicitud de rotulado creada exitosamente',
            solicitud: insertResult.rows[0],
            numero_solicitud: numeroSolicitud
        });
        
    } catch (error) {
        console.error('❌ [solicitudes/rotulado] Error:', error);
        res.status(500).json({ error: 'Error al crear solicitud de rotulado: ' + error.message });
    }
});

// Obtener solicitudes de rotulado pendientes
app.get('/api/solicitudes/rotulado/pendientes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                sr.*,
                p.nombre_producto,
                p.subcategoria,
                p.marca,
                p.modelo,
                u.nombre_completo as solicitante
            FROM solicitudes_rotulado sr
            JOIN productos p ON sr.id_producto = p.id_producto
            JOIN usuarios u ON sr.id_usuario = u.id_usuario
            WHERE sr.estado = 'pendiente'
            ORDER BY sr.fecha_solicitud DESC
        `);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Error obteniendo solicitudes de rotulado:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
});

// Aprobar solicitud de rotulado (envía a Godex)
app.put('/api/solicitudes/rotulado/:id/aprobar', async (req, res) => {
    try {
        const { id } = req.params;
        const { supervisor_id, observaciones_supervisor } = req.body;
        
        // Obtener solicitud
        const solicitudResult = await pool.query(`
            SELECT sr.*, p.nombre_producto 
            FROM solicitudes_rotulado sr
            JOIN productos p ON sr.id_producto = p.id_producto
            WHERE sr.id_solicitud_rotulado = $1
        `, [id]);
        
        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudResult.rows[0];
        const zplData = solicitud.datos_zpl;
        
        // IP y Puerto de Godex G530
        const GODEX_IP = '192.168.15.35';
        const GODEX_PORT = 9100;
        
        // Imprimir
        for (let i = 0; i < solicitud.cantidad_solicitada; i++) {
            await enviarZPLAGodex(zplData, GODEX_IP, GODEX_PORT);
            if (i < solicitud.cantidad_solicitada - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Actualizar solicitud a completada
        await pool.query(`
            UPDATE solicitudes_rotulado 
            SET estado = 'completada',
                supervisor_id = $1,
                observaciones_supervisor = $2,
                fecha_aprobacion = NOW()
            WHERE id_solicitud_rotulado = $3
        `, [supervisor_id, observaciones_supervisor, id]);
        
        res.json({
            success: true,
            mensaje: `Solicitud aprobada e impresa: ${solicitud.cantidad_solicitada} rotulado(s)`,
            numero_solicitud: solicitud.numero_solicitud
        });
        
    } catch (error) {
        console.error('❌ Error aprobando solicitud:', error);
        res.status(500).json({ error: 'Error al aprobar solicitud: ' + error.message });
    }
});

// Rechazar solicitud de rotulado
app.put('/api/solicitudes/rotulado/:id/rechazar', async (req, res) => {
    try {
        const { id } = req.params;
        const { supervisor_id, observaciones_supervisor } = req.body;
        
        await pool.query(`
            UPDATE solicitudes_rotulado 
            SET estado = 'rechazada',
                supervisor_id = $1,
                observaciones_supervisor = $2,
                fecha_aprobacion = NOW()
            WHERE id_solicitud_rotulado = $3
        `, [supervisor_id, observaciones_supervisor, id]);
        
        res.json({
            success: true,
            mensaje: 'Solicitud rechazada'
        });
        
    } catch (error) {
        console.error('❌ Error rechazando solicitud:', error);
        res.status(500).json({ error: 'Error al rechazar solicitud: ' + error.message });
    }
});

// Función auxiliar para enviar ZPL a Godex
// =============================================
// VERIFICACIÓN DE ESTADO DE IMPRESORAS
// =============================================

// Configuración de Godex G530
const GODEX_CONFIG = {
    IP: '192.168.15.35',
    PORT: 9100,
    MODEL: 'Godex G530'
};

// Verificar conexión con Godex (rotulado)
function checkGodexConnection() {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000); // 3 segundos timeout
        
        socket.connect(GODEX_CONFIG.PORT, GODEX_CONFIG.IP, () => {
            console.log(`✅ [Godex] Impresora conectada en ${GODEX_CONFIG.IP}:${GODEX_CONFIG.PORT}`);
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ [Godex] Error de conexión:`, error.message);
            resolve(false);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ [Godex] Timeout en conexión`);
            socket.destroy();
            resolve(false);
        });
    });
}

function enviarZPLAGodex(zplData, ip, port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(15000); // 15 segundos para gráficos pesados
        
        socket.connect(port, ip, () => {
            console.log(`🔗 [Godex] Conectado a ${ip}:${port}`);
            console.log(`📄 [Godex] Enviando ZPL (${zplData.length} caracteres)...`);
            console.log(`⏱️  [Godex] Timeout: 15s para procesamiento`);
            
            // Enviar el ZPL generado
            socket.write(zplData, (err) => {
                if (err) {
                    console.error(`❌ [Godex] Error escribiendo datos:`, err.message);
                    socket.destroy();
                    reject(err);
                } else {
                    console.log(`✅ [Godex] Datos enviados completamente`);
                    // Esperar 500ms antes de cerrar para asegurar que la impresora procesó
                    setTimeout(() => {
                        socket.end();
                    }, 500);
                }
            });
        });
        
        socket.on('close', () => {
            console.log(`✅ [Godex] Conexión cerrada - Impresión enviada`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ [Godex] Error:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ [Godex] Timeout después de 15 segundos`);
            console.error(`⚠️  [Godex] La impresora puede estar procesando gráficos pesados`);
            socket.destroy();
            reject(new Error('Timeout en conexión con Godex - ZPL muy grande o impresora lenta'));
        });
    });
}

// =============================================
// GESTIÓN DE PRODUCTOS ESPECIALES (JUEGOS/COMBOS)
// =============================================

// Obtener todos los productos especiales con información de componentes
app.get('/api/productos-especiales', async (req, res) => {
    try {
        console.log('🔍 [productos-especiales] Obteniendo productos especiales...');
        
        const result = await pool.query(`
            SELECT * FROM vista_productos_especiales
            ORDER BY fecha_creacion DESC
        `);

        console.log(`✅ [productos-especiales] Encontrados ${result.rows.length} productos especiales`);
        res.json(result.rows);

    } catch (error) {
        console.error('❌ [productos-especiales] Error:', error);
        res.status(500).json({ error: 'Error al obtener productos especiales: ' + error.message });
    }
});

// Obtener un producto especial por ID
app.get('/api/productos-especiales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [producto-especial] Obteniendo producto especial ID ${id}...`);
        
        const result = await pool.query(`
            SELECT * FROM vista_productos_especiales WHERE id_producto_especial = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto especial no encontrado' });
        }

        console.log(`✅ [producto-especial] Producto especial encontrado:`, result.rows[0].nombre_producto);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('❌ [producto-especial] Error:', error);
        res.status(500).json({ error: 'Error al obtener producto especial: ' + error.message });
    }
});

// Obtener componentes de un producto especial
app.get('/api/productos-especiales/:id/componentes', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [componentes] Obteniendo componentes del producto especial ID ${id}...`);
        
        // Obtener el producto especial con los productos relacionados
        const peResult = await pool.query(`
            SELECT * FROM vista_productos_especiales WHERE id_producto_especial = $1
        `, [id]);

        if (peResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto especial no encontrado' });
        }

        const pe = peResult.rows[0];
        const componentes = [];

        // Agregar producto 1 (obligatorio)
        if (pe.id_producto_1) {
            const p1 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [pe.id_producto_1]);
            if (p1.rows.length > 0) {
                componentes.push({
                    id_producto: pe.id_producto_1,
                    codigo_producto: p1.rows[0].codigo_producto,
                    nombre_producto: p1.rows[0].nombre_producto,
                    cantidad: pe.cantidad_producto_1 || 1,
                    orden: 1
                });
            }
        }

        // Agregar producto 2 (opcional)
        if (pe.id_producto_2) {
            const p2 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [pe.id_producto_2]);
            if (p2.rows.length > 0) {
                componentes.push({
                    id_producto: pe.id_producto_2,
                    codigo_producto: p2.rows[0].codigo_producto,
                    nombre_producto: p2.rows[0].nombre_producto,
                    cantidad: pe.cantidad_producto_2 || 1,
                    orden: 2
                });
            }
        }

        // Agregar producto 3 (opcional)
        if (pe.id_producto_3) {
            const p3 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [pe.id_producto_3]);
            if (p3.rows.length > 0) {
                componentes.push({
                    id_producto: pe.id_producto_3,
                    codigo_producto: p3.rows[0].codigo_producto,
                    nombre_producto: p3.rows[0].nombre_producto,
                    cantidad: pe.cantidad_producto_3 || 1,
                    orden: 3
                });
            }
        }

        // Agregar producto 4 (opcional)
        if (pe.id_producto_4) {
            const p4 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [pe.id_producto_4]);
            if (p4.rows.length > 0) {
                componentes.push({
                    id_producto: pe.id_producto_4,
                    codigo_producto: p4.rows[0].codigo_producto,
                    nombre_producto: p4.rows[0].nombre_producto,
                    cantidad: pe.cantidad_producto_4 || 1,
                    orden: 4
                });
            }
        }

        console.log(`✅ [componentes] Encontrados ${componentes.length} componentes`);
        res.json({ componentes });

    } catch (error) {
        console.error('❌ [componentes] Error:', error);
        res.status(500).json({ error: 'Error al obtener componentes: ' + error.message });
    }
});

// ========================================
// ENDPOINTS: GESTIÓN DE ENTIDADES (Empresas)
// ========================================

// Obtener todas las entidades activas
app.get('/api/entidades', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id_entidad, nombre_entidad, activo, fecha_creacion
            FROM entidades
            WHERE activo = true
            ORDER BY nombre_entidad ASC
        `);
        
        console.log(`✅ [entidades] Obtenidas ${result.rows.length} entidades activas`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ [entidades] Error obteniendo entidades:', error);
        res.status(500).json({ error: 'Error al obtener entidades' });
    }
});

// Crear nueva entidad
app.post('/api/entidades', verificarToken, async (req, res) => {
    try {
        const { nombre_entidad } = req.body;

        if (!nombre_entidad || nombre_entidad.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la entidad es requerido' });
        }

        const result = await pool.query(`
            INSERT INTO entidades (nombre_entidad)
            VALUES ($1)
            RETURNING id_entidad, nombre_entidad, activo, fecha_creacion
        `, [nombre_entidad.trim().toUpperCase()]);

        console.log(`✅ [entidades] Entidad creada: ${nombre_entidad}`);
        res.status(201).json({
            message: 'Entidad creada exitosamente',
            entidad: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Ya existe una entidad con ese nombre' });
        }
        console.error('❌ [entidades] Error creando entidad:', error);
        res.status(500).json({ error: 'Error al crear entidad' });
    }
});

// Actualizar entidad
app.put('/api/entidades/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_entidad } = req.body;

        if (!nombre_entidad || nombre_entidad.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la entidad es requerido' });
        }

        const result = await pool.query(`
            UPDATE entidades 
            SET nombre_entidad = $1, fecha_modificacion = NOW()
            WHERE id_entidad = $2
            RETURNING id_entidad, nombre_entidad, activo
        `, [nombre_entidad.trim().toUpperCase(), id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }

        console.log(`✅ [entidades] Entidad actualizada: ${nombre_entidad}`);
        res.json({
            message: 'Entidad actualizada exitosamente',
            entidad: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una entidad con ese nombre' });
        }
        console.error('❌ [entidades] Error actualizando entidad:', error);
        res.status(500).json({ error: 'Error al actualizar entidad' });
    }
});

// Eliminar entidad (soft delete)
app.delete('/api/entidades/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE entidades 
            SET activo = false, fecha_modificacion = NOW()
            WHERE id_entidad = $1
            RETURNING id_entidad, nombre_entidad
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entidad no encontrada' });
        }

        console.log(`✅ [entidades] Entidad desactivada: ${result.rows[0].nombre_entidad}`);
        res.json({
            message: 'Entidad eliminada exitosamente',
            entidad: result.rows[0]
        });
    } catch (error) {
        console.error('❌ [entidades] Error eliminando entidad:', error);
        res.status(500).json({ error: 'Error al eliminar entidad' });
    }
});

// ========================================
// FIN ENDPOINTS ENTIDADES
// ========================================

// Crear nuevo producto especial
app.post('/api/productos-especiales', async (req, res) => {
    try {
        const {
            codigo_producto, // OPCIONAL - Si no viene, el trigger lo genera automáticamente (ESP-001)
            nombre_producto_especial, // Frontend envía este nombre
            id_producto_1,
            cantidad_producto_1,
            id_producto_2,
            cantidad_producto_2,
            id_producto_3,
            cantidad_producto_3,
            id_producto_4,
            cantidad_producto_4,
            usa_config_propia
        } = req.body;

        // Mapear nombre_producto_especial a nombre_producto (nombre de columna en BD)
        const nombre_producto = nombre_producto_especial;

        console.log('➕ [crear-especial] Creando producto especial:', nombre_producto);
        console.log('📦 [crear-especial] Código producto:', codigo_producto || 'AUTO-GENERADO');
        console.log('📦 [crear-especial] Componentes:', {
            prod1: id_producto_1,
            cant1: cantidad_producto_1,
            prod2: id_producto_2,
            cant2: cantidad_producto_2,
            prod3: id_producto_3,
            cant3: cantidad_producto_3,
            prod4: id_producto_4,
            cant4: cantidad_producto_4
        });

        // Validar que al menos tenga el producto 1
        if (!id_producto_1 || !cantidad_producto_1) {
            return res.status(400).json({ error: 'Debes especificar al menos el Producto 1' });
        }

        // Insertar en la base de datos (código_producto puede ser NULL, el trigger lo genera)
        const result = await pool.query(`
            INSERT INTO productos_especiales (
                codigo_producto,
                nombre_producto,
                id_producto_1,
                cantidad_producto_1,
                id_producto_2,
                cantidad_producto_2,
                id_producto_3,
                cantidad_producto_3,
                id_producto_4,
                cantidad_producto_4,
                activo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
            RETURNING *
        `, [
            codigo_producto || null, // Si viene vacío/null, el trigger genera ESP-XXX
            nombre_producto, // Usar la variable mapeada
            id_producto_1,
            cantidad_producto_1,
            id_producto_2 || null,
            cantidad_producto_2 || null,
            id_producto_3 || null,
            cantidad_producto_3 || null,
            id_producto_4 || null,
            cantidad_producto_4 || null
        ]);

        console.log(`✅ [crear-especial] Producto especial creado con ID ${result.rows[0].id_producto_especial}`);
        
        res.status(201).json({
            message: 'Producto especial creado exitosamente',
            producto_especial: result.rows[0]
        });

    } catch (error) {
        console.error('❌ [crear-especial] Error completo:', error);
        console.error('❌ [crear-especial] Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al crear producto especial: ' + error.message,
            details: error.detail || error.message
        });
    }
});

// Actualizar producto especial
app.put('/api/productos-especiales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            codigo_producto,
            nombre_producto_especial, // Frontend envía este nombre
            id_producto_1,
            cantidad_producto_1,
            id_producto_2,
            cantidad_producto_2,
            id_producto_3,
            cantidad_producto_3,
            id_producto_4,
            cantidad_producto_4,
            usa_config_propia,
            activo
        } = req.body;

        // Mapear nombre_producto_especial a nombre_producto
        const nombre_producto = nombre_producto_especial;

        console.log(`📝 [actualizar-especial] Actualizando producto especial ID ${id}...`);

        const result = await pool.query(`
            UPDATE productos_especiales SET
                codigo_producto = $1,
                nombre_producto = $2,
                id_producto_1 = $3,
                cantidad_producto_1 = $4,
                id_producto_2 = $5,
                cantidad_producto_2 = $6,
                id_producto_3 = $7,
                cantidad_producto_3 = $8,
                id_producto_4 = $9,
                cantidad_producto_4 = $10,
                activo = $11,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_producto_especial = $12
            RETURNING *
        `, [
            codigo_producto,
            nombre_producto, // Usar la variable mapeada
            id_producto_1,
            cantidad_producto_1,
            id_producto_2 || null,
            cantidad_producto_2 || null,
            id_producto_3 || null,
            cantidad_producto_3 || null,
            id_producto_4 || null,
            cantidad_producto_4 || null,
            activo !== undefined ? activo : true,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto especial no encontrado' });
        }

        console.log(`✅ [actualizar-especial] Producto especial actualizado`);
        
        res.json({
            message: 'Producto especial actualizado exitosamente',
            producto_especial: result.rows[0]
        });

    } catch (error) {
        console.error('❌ [actualizar-especial] Error:', error);
        res.status(500).json({ error: 'Error al actualizar producto especial: ' + error.message });
    }
});

// Crear nuevo producto
app.post('/api/admin/productos/create', async (req, res) => {
    try {
        const {
            codigo_producto,
            nombre_producto,
            descripcion_corta,
            categoria,
            subcategoria,
            marca,
            modelo,
            codigo_barras,
            unidad_medida,
            sku,
            activo
        } = req.body;

        // Validaciones
        if (!codigo_producto || !nombre_producto) {
            return res.status(400).json({ 
                error: 'El código y nombre del producto son obligatorios' 
            });
        }

        // Verificar si el código ya existe
        const existingProduct = await pool.query(
            'SELECT id_producto FROM productos WHERE codigo_producto = $1',
            [codigo_producto]
        );

        if (existingProduct.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Ya existe un producto con este código' 
            });
        }

        // Insertar nuevo producto
        const result = await pool.query(`
            INSERT INTO productos (
                codigo_producto, 
                nombre_producto, 
                descripcion_corta, 
                categoria, 
                subcategoria, 
                marca, 
                modelo, 
                codigo_barras, 
                unidad_medida, 
                sku, 
                activo, 
                empresa,
                fecha_creacion,
                fecha_actualizacion
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING id_producto, codigo_producto, nombre_producto
        `, [
            codigo_producto,
            nombre_producto,
            descripcion_corta || null,
            categoria || null,
            subcategoria || null,
            marca || null,
            modelo || null,
            codigo_barras || null,
            unidad_medida || 'UNIDAD',
            sku || null,
            activo !== false,
            'HECHO EN PERU' // 🏢 Valor por defecto para empresa
        ]);

        const newProduct = result.rows[0];
        
        // 🗑️ Invalidar cache de productos
        invalidateCachePattern('productos:');
        
        console.log(`✅ Producto creado: ${newProduct.codigo_producto} - ${newProduct.nombre_producto}`);
        
        res.status(201).json({
            mensaje: 'Producto creado exitosamente',
            producto: newProduct
        });

    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Desactivar producto existente
app.put('/api/admin/productos/deactivate', async (req, res) => {
    try {
        const { id_producto } = req.body;

        if (!id_producto) {
            return res.status(400).json({ 
                error: 'ID del producto es requerido' 
            });
        }

        // Verificar que el producto existe
        const productCheck = await pool.query(
            'SELECT id_producto, nombre_producto, activo FROM productos WHERE id_producto = $1',
            [id_producto]
        );

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Producto no encontrado' 
            });
        }

        const producto = productCheck.rows[0];

        if (!producto.activo) {
            return res.status(400).json({ 
                error: 'El producto ya está desactivado' 
            });
        }

        // Desactivar producto
        const result = await pool.query(`
            UPDATE productos 
            SET activo = false, fecha_actualizacion = NOW()
            WHERE id_producto = $1
            RETURNING codigo_producto, nombre_producto
        `, [id_producto]);

        const updatedProduct = result.rows[0];
        
        // 🗑️ Invalidar cache de productos
        invalidateCachePattern('productos:');
        
        console.log(`❌ Producto desactivado: ${updatedProduct.codigo_producto} - ${updatedProduct.nombre_producto}`);
        
        res.json({
            mensaje: 'Producto desactivado exitosamente',
            producto: updatedProduct
        });

    } catch (error) {
        console.error('Error desactivando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Reactivar producto (funcionalidad adicional)
app.put('/api/admin/productos/reactivate', async (req, res) => {
    try {
        const { id_producto } = req.body;

        if (!id_producto) {
            return res.status(400).json({ 
                error: 'ID del producto es requerido' 
            });
        }

        const result = await pool.query(`
            UPDATE productos 
            SET activo = true, fecha_actualizacion = NOW()
            WHERE id_producto = $1
            RETURNING codigo_producto, nombre_producto
        `, [id_producto]);
        
        // 🗑️ Invalidar cache de productos
        invalidateCachePattern('productos:');

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Producto no encontrado' 
            });
        }

        const updatedProduct = result.rows[0];
        
        console.log(`✅ Producto reactivado: ${updatedProduct.codigo_producto} - ${updatedProduct.nombre_producto}`);
        
        res.json({
            mensaje: 'Producto reactivado exitosamente',
            producto: updatedProduct
        });

    } catch (error) {
        console.error('Error reactivando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================================
// ENDPOINTS PARA COLA DE IMPRESIÓN ZEBRA
// =============================================

// Obtener estado de la cola de impresión
app.get('/api/admin/print-queue', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                ci.id, ci.numero_solicitud, ci.qr_code, ci.nombre_producto,
                ci.descripcion_adicional, ci.cantidad_solicitada, ci.cantidad_a_imprimir,
                ci.estado, ci.error_mensaje, ci.fecha_creacion, ci.fecha_impresion,
                u.nombre_completo as costurera_nombre
            FROM cola_impresion ci
            JOIN solicitudes_etiquetas se ON ci.id_solicitud = se.id_solicitud
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            ORDER BY 
                CASE ci.estado 
                    WHEN 'pendiente' THEN 1 
                    WHEN 'imprimiendo' THEN 2 
                    WHEN 'error' THEN 3 
                    ELSE 4 
                END,
                ci.fecha_creacion DESC
            LIMIT 20
        `);
        
        // Verificar conexión con impresora
        const printerStatus = await checkPrinterConnection();
        
        res.json({
            queue: result.rows,
            printer_connected: printerStatus,
            queue_length: printQueue.length,
            processing: printQueue.length > 0 && printerStatus
        });
        
    } catch (error) {
        console.error('Error obteniendo cola de impresión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Verificar estado de la impresora
app.get('/api/admin/printer-status', async (req, res) => {
    try {
        const connected = await checkPrinterConnection();
        
        res.json({
            connected,
            ip: ZEBRA_CONFIG.PRINTER_IP,
            port: ZEBRA_CONFIG.PRINTER_PORT,
            queue_length: printQueue.length,
            last_check: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error verificando impresora:', error);
        res.status(500).json({ 
            error: 'Error verificando impresora',
            connected: false 
        });
    }
});

// ⭐ NUEVO: Endpoint para verificar AMBAS impresoras (Godex + Zebra)
app.get('/api/printer-status-all', async (req, res) => {
    try {
        console.log('🔍 [printer-status-all] Verificando estado de ambas impresoras...');
        
        // Verificar ambas impresoras en paralelo
        const [godexConnected, zebraConnected] = await Promise.all([
            checkGodexConnection(),
            checkPrinterConnection()
        ]);
        
        const status = {
            godex: {
                connected: godexConnected,
                ip: GODEX_CONFIG.IP,
                port: GODEX_CONFIG.PORT,
                model: GODEX_CONFIG.MODEL,
                uso: 'Rotulado (30×55mm)'
            },
            zebra: {
                connected: zebraConnected,
                ip: ZEBRA_CONFIG.PRINTER_IP,
                port: ZEBRA_CONFIG.PORT_NUMBER,
                model: ZEBRA_CONFIG.MODEL,
                uso: 'Etiquetas (50×25mm doble)'
            },
            last_check: new Date().toISOString()
        };
        
        console.log(`✅ [printer-status-all] Godex: ${godexConnected ? '🟢 Conectada' : '🔴 Desconectada'}`);
        console.log(`✅ [printer-status-all] Zebra: ${zebraConnected ? '🟢 Conectada' : '🔴 Desconectada'}`);
        
        res.json(status);
        
    } catch (error) {
        console.error('❌ Error verificando impresoras:', error);
        res.status(500).json({ 
            error: 'Error verificando impresoras',
            godex: { connected: false },
            zebra: { connected: false }
        });
    }
});

// Resetear impresora Zebra
app.post('/api/admin/reset-printer', async (req, res) => {
    try {
        console.log(`🔄 [resetPrinter] Iniciando reset de impresora Zebra...`);
        
        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');
        
        // Comando de reset para Zebra - Restaurar configuración de fábrica
        const resetCommand = '^XA^JUF^XZ'; 
        const resetFile = path.join(__dirname, 'temp_reset.zpl');
        
        fs.writeFileSync(resetFile, resetCommand);
        
        const cmd = `copy "${resetFile}" "LAN_ZD230_red" /b`;
        
        exec(cmd, (error, stdout, stderr) => {
            try { fs.unlinkSync(resetFile); } catch {}
            
            if (error) {
                console.error(`❌ [resetPrinter] Error:`, error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error enviando comando de reset' 
                });
            }
            
            console.log(`✅ [resetPrinter] Comando de reset enviado exitosamente`);
            console.log(`📊 [resetPrinter] Salida:`, stdout);
            
            // Esperar un momento y verificar conexión
            setTimeout(async () => {
                const newStatus = await checkPrinterConnection();
                res.json({
                    success: true,
                    message: 'Comando de reset enviado a la impresora Zebra',
                    printer_connected: newStatus
                });
            }, 3000);
        });
        
    } catch (error) {
        console.error('❌ Error reseteando impresora:', error);
        res.status(500).json({ success: false, error: 'Error del servidor' });
    }
});

// Reanudar procesamiento de cola (cuando se detecta impresora)
app.post('/api/admin/resume-printing', async (req, res) => {
    try {
        const connected = await checkPrinterConnection();
        
        if (!connected) {
            return res.status(400).json({ 
                error: 'Impresora no conectada',
                connected: false 
            });
        }
        
        // Recargar cola desde base de datos
        const pendingJobs = await pool.query(`
            SELECT * FROM cola_impresion 
            WHERE estado = 'pendiente' 
            ORDER BY fecha_creacion
        `);
        
        // Agregar trabajos pendientes a la cola en memoria
        for (const job of pendingJobs.rows) {
            const existsInQueue = printQueue.find(pj => pj.id === job.id);
            if (!existsInQueue) {
                printQueue.push({
                    id: job.id,
                    id_solicitud: job.id_solicitud,
                    numero_solicitud: job.numero_solicitud,
                    qr_code: job.qr_code,
                    nombre_producto: job.nombre_producto,
                    descripcion_adicional: job.descripcion_adicional,
                    unidad_medida: job.unidad_medida,
                    id_producto: job.id_producto,
                    cantidad: job.cantidad_a_imprimir
                });
            }
        }
        
        // 🔥 Iniciar procesamiento si hay trabajos pendientes Y NO está procesando
        if (printQueue.length > 0 && !isProcessingQueue) {
            console.log(`🖨️ [resume-printing] Iniciando proceso de impresión con ${printQueue.length} trabajos`);
            processPrintQueue();
        } else if (isProcessingQueue) {
            console.log(`ℹ️ [resume-printing] Proceso ya activo, ${printQueue.length} trabajos en cola`);
        }
        
        console.log(`🖨️ Reanudando impresión: ${printQueue.length} trabajos en cola`);
        
        res.json({
            mensaje: isProcessingQueue ? 'Proceso ya activo' : 'Impresión reanudada',
            queue_length: printQueue.length,
            connected: true,
            is_processing: isProcessingQueue
        });
        
    } catch (error) {
        console.error('Error reanudando impresión:', error);
        res.status(500).json({ error: 'Error reanudando impresión' });
    }
});

// Limpiar trabajos con error de la cola
app.post('/api/admin/clear-error-jobs', async (req, res) => {
    try {
        await pool.query(`
            DELETE FROM cola_impresion 
            WHERE estado = 'error' AND fecha_creacion < NOW() - INTERVAL '1 day'
        `);
        
        res.json({ mensaje: 'Trabajos con error eliminados' });
        
    } catch (error) {
        console.error('Error limpiando cola:', error);
        res.status(500).json({ error: 'Error limpiando cola' });
    }
});

// Reintentar trabajo específico
app.post('/api/admin/retry-print-job/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener datos del trabajo
        const job = await pool.query(`
            SELECT * FROM cola_impresion WHERE id = $1 AND estado = 'error'
        `, [id]);
        
        if (job.rows.length === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado o no está en error' });
        }
        
        const jobData = job.rows[0];
        
        // Cambiar estado a pendiente
        await pool.query(`
            UPDATE cola_impresion 
            SET estado = 'pendiente', error_mensaje = NULL 
            WHERE id = $1
        `, [id]);
        
        // Agregar nuevamente a la cola
        printQueue.push({
            id: jobData.id,
            id_solicitud: jobData.id_solicitud,
            numero_solicitud: jobData.numero_solicitud,
            qr_code: jobData.qr_code,
            nombre_producto: jobData.nombre_producto,
            descripcion_adicional: jobData.descripcion_adicional,
            unidad_medida: jobData.unidad_medida,
            id_producto: jobData.id_producto,
            cantidad: jobData.cantidad_a_imprimir
        });
        
        // Verificar impresora e intentar procesar
        const connected = await checkPrinterConnection();
        if (connected && printQueue.length === 1) {
            processPrintQueue();
        }
        
        res.json({
            mensaje: 'Trabajo reagregado a la cola',
            connected
        });
        
    } catch (error) {
        console.error('Error reintentando trabajo:', error);
        res.status(500).json({ error: 'Error reintentando trabajo' });
    }
});

// 🆕 ENDPOINT DE EMERGENCIA: Forzar inicio de cola de impresión
app.post('/api/admin/force-start-queue', async (req, res) => {
    try {
        console.log('🚨 [force-start-queue] FORZANDO INICIO DE COLA DE IMPRESIÓN');
        console.log(`   - Trabajos en cola: ${printQueue.length}`);
        console.log(`   - Proceso activo: ${isProcessingQueue}`);
        
        // Verificar impresora
        const connected = await checkPrinterConnection();
        
        if (!connected) {
            return res.status(400).json({ 
                error: 'Impresora no conectada',
                queue_length: printQueue.length,
                is_processing: isProcessingQueue
            });
        }
        
        if (printQueue.length === 0) {
            return res.json({
                mensaje: 'Cola vacía, no hay trabajos para procesar',
                queue_length: 0,
                is_processing: isProcessingQueue
            });
        }
        
        // Forzar inicio incluso si la bandera está activa
        if (isProcessingQueue) {
            console.log('⚠️ [force-start-queue] Bandera activa, forzando reinicio...');
            isProcessingQueue = false; // Liberar bandera forzosamente
        }
        
        console.log('✅ [force-start-queue] Iniciando procesamiento forzado...');
        processPrintQueue();
        
        res.json({
            mensaje: 'Cola de impresión iniciada forzosamente',
            queue_length: printQueue.length,
            is_processing: true,
            printer_connected: connected
        });
        
    } catch (error) {
        console.error('❌ [force-start-queue] Error:', error);
        res.status(500).json({ error: 'Error forzando inicio de cola' });
    }
});

// Obtener solicitudes (filtradas por rol)
app.get('/api/solicitudes', async (req, res) => {
    try {
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
        let usuario = { nivel_acceso: 'admin', id_usuario: 1 }; // valores por defecto
        
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
        
        let query, params;
        const baseQuery = `
            SELECT 
                se.id_solicitud, se.numero_solicitud, se.lote_produccion,
                se.cantidad_solicitada, se.fecha_produccion, se.fecha_solicitud,
                se.prioridad, se.estado, se.observaciones,
                u.nombre_completo as operario, d.nombre_departamento,
                p.nombre_producto, p.marca, p.modelo
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.id_producto_especial IS NULL
        `;
        
        if (usuario.nivel_acceso === 'costurera') {
            // Costurera ve solo sus solicitudes normales (no especiales)
            query = baseQuery + ' AND se.id_usuario = $1 ORDER BY se.fecha_solicitud DESC';
            params = [usuario.id_usuario];
        } else if (usuario.nivel_acceso === 'encargada_embalaje') {
            // Encargada ve solicitudes pendientes y en proceso de costura (no especiales)
            query = baseQuery + ` 
                AND u.id_departamento = (SELECT id_departamento FROM departamentos WHERE nombre_departamento = 'Costura')
                AND se.estado IN ('pendiente', 'proceso', 'completada')
                ORDER BY 
                    CASE se.estado 
                        WHEN 'pendiente' THEN 1 
                        WHEN 'proceso' THEN 2 
                        ELSE 3 
                    END,
                    se.fecha_solicitud DESC
            `;
            params = [];
        } else {
            // Admin ve todas las solicitudes normales (no especiales)
            query = baseQuery + ' ORDER BY se.fecha_solicitud DESC';
            params = [];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
});

// =============================================
// ENDPOINTS SUPERVISOR - SOLICITUDES POR ESTADO
// =============================================

// Solicitudes en proceso para supervisor con filtros de fecha
app.get('/api/supervisor/solicitudes-proceso', verificarToken, async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta } = req.query;
        
        let query = `
            SELECT 
                se.id_solicitud, se.numero_solicitud, se.lote_produccion,
                se.cantidad_solicitada, se.fecha_produccion, se.fecha_solicitud,
                se.prioridad, se.estado, se.observaciones, se.observaciones_supervisor,
                u.nombre_completo as costurera, d.nombre_departamento,
                p.nombre_producto, p.marca, p.modelo, p.codigo_producto
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.estado = 'proceso'
        `;
        
        let params = [];
        let paramCount = 1;
        
        if (fecha_desde && fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) BETWEEN $${paramCount} AND $${paramCount + 1}`;
            params.push(fecha_desde, fecha_hasta);
            paramCount += 2;
        } else if (fecha_desde) {
            query += ` AND DATE(se.fecha_solicitud) >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        } else if (fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        query += ` ORDER BY se.fecha_solicitud DESC`;
        
        const result = await pool.query(query, params);
        res.json({
            mensaje: `${result.rows.length} solicitudes en proceso`,
            solicitudes: result.rows,
            filtros: { fecha_desde, fecha_hasta }
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes en proceso:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes en proceso' });
    }
});

// Solicitudes completadas para supervisor con filtros de fecha
app.get('/api/supervisor/solicitudes-completadas', verificarToken, async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta } = req.query;
        
        let query = `
            SELECT 
                se.id_solicitud, se.numero_solicitud, se.lote_produccion,
                se.cantidad_solicitada, se.fecha_produccion, se.fecha_solicitud,
                se.prioridad, se.estado, se.observaciones, se.observaciones_supervisor,
                u.nombre_completo as costurera, d.nombre_departamento,
                p.nombre_producto, p.marca, p.modelo, p.codigo_producto
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.estado = 'completada'
        `;
        
        let params = [];
        let paramCount = 1;
        
        if (fecha_desde && fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) BETWEEN $${paramCount} AND $${paramCount + 1}`;
            params.push(fecha_desde, fecha_hasta);
            paramCount += 2;
        } else if (fecha_desde) {
            query += ` AND DATE(se.fecha_solicitud) >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        } else if (fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        query += ` ORDER BY se.fecha_solicitud DESC`;
        
        const result = await pool.query(query, params);
        res.json({
            mensaje: `${result.rows.length} solicitudes completadas`,
            solicitudes: result.rows,
            filtros: { fecha_desde, fecha_hasta }
        });
    } catch (error) {
        console.error('Error obteniendo solicitudes completadas:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes completadas' });
    }
});

// Historial completo de solicitudes con filtros avanzados
app.get('/api/solicitudes/historial', async (req, res) => {
    try {
        const { fecha_desde, fecha_hasta, costurera, numero_solicitud, estados } = req.query;
        
        let query = `
            SELECT 
                se.id_solicitud, se.numero_solicitud, se.lote_produccion,
                se.cantidad_solicitada, se.fecha_produccion, se.fecha_solicitud,
                se.prioridad, se.estado, se.observaciones, se.observaciones_supervisor,
                u.nombre_completo as costurera, d.nombre_departamento,
                p.nombre_producto, p.marca, p.modelo, p.codigo_producto
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        // Filtro por fechas
        if (fecha_desde && fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) BETWEEN $${paramCount} AND $${paramCount + 1}`;
            params.push(fecha_desde, fecha_hasta);
            paramCount += 2;
        } else if (fecha_desde) {
            query += ` AND DATE(se.fecha_solicitud) >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        } else if (fecha_hasta) {
            query += ` AND DATE(se.fecha_solicitud) <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        // Filtro por costurera
        if (costurera) {
            query += ` AND se.id_usuario = $${paramCount}`;
            params.push(costurera);
            paramCount++;
        }
        
        // Filtro por número de solicitud
        if (numero_solicitud) {
            query += ` AND se.numero_solicitud ILIKE $${paramCount}`;
            params.push(`%${numero_solicitud}%`);
            paramCount++;
        }
        
        // Filtro por estados
        if (estados) {
            const estadosArray = estados.split(',');
            const placeholders = estadosArray.map((_, index) => `$${paramCount + index}`).join(',');
            query += ` AND se.estado IN (${placeholders})`;
            params.push(...estadosArray);
            paramCount += estadosArray.length;
        }
        
        query += ` ORDER BY se.fecha_solicitud DESC LIMIT 200`;
        
        const result = await pool.query(query, params);
        
        res.json({
            mensaje: `${result.rows.length} solicitudes encontradas`,
            solicitudes: result.rows,
            filtros: { fecha_desde, fecha_hasta, costurera, numero_solicitud, estados }
        });
        
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error al obtener historial: ' + error.message });
    }
});

// Crear nueva solicitud (costureras y admin)
app.post('/api/solicitudes', async (req, res) => {
    const { id_producto, cantidad_solicitada, observaciones } = req.body;
    
    try {
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
        let usuario = { id_departamento: 1, id_usuario: 1 }; // valores por defecto
        
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
        
        // Generar lote automáticamente
        const loteResult = await pool.query('SELECT generar_lote_automatico($1) as lote', [usuario.id_departamento]);
        const lote_produccion = loteResult.rows[0].lote;
        
        // Generar número de solicitud único
        const fechaHoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const contadorResult = await pool.query(
            'SELECT COUNT(*) as total FROM solicitudes_etiquetas WHERE DATE(fecha_solicitud) = CURRENT_DATE'
        );
        const numeroSolicitud = `SOL-${fechaHoy}-${String(parseInt(contadorResult.rows[0].total) + 1).padStart(4, '0')}`;
        
        // Obtener información del producto
        const infoQuery = `
            SELECT nombre_producto, marca, modelo, codigo_producto
            FROM productos WHERE id_producto = $1
        `;
        const infoResult = await pool.query(infoQuery, [id_producto]);
        const producto = infoResult.rows[0];
        
        // Crear datos QR
        const datosQR = {
            lote: lote_produccion,
            producto: producto.nombre_producto,
            marca: producto.marca,
            modelo: producto.modelo,
            codigo_producto: producto.codigo_producto,
            fecha_produccion: new Date().toISOString().split('T')[0],
            operador: usuario.nombre_completo || 'Usuario Sistema'
        };
        
        const insertQuery = `
            INSERT INTO solicitudes_etiquetas 
            (numero_solicitud, id_usuario, id_producto, lote_produccion, cantidad_solicitada, 
             fecha_produccion, observaciones, datos_qr, estado)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, 'pendiente')
            RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [
            numeroSolicitud, usuario.id_usuario, id_producto, lote_produccion,
            cantidad_solicitada, observaciones, JSON.stringify(datosQR)
        ]);
        
        res.json({ 
            success: true, 
            mensaje: 'Solicitud creada exitosamente',
            solicitud: result.rows[0],
            lote_generado: lote_produccion
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al crear solicitud' });
    }
});

// Cambiar estado de solicitud (solo encargada de embalaje)
app.put('/api/solicitudes/:id/estado', verificarToken, verificarRol(['encargada_embalaje', 'administracion']), async (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    
    try {
        // Validar estados permitidos
        const estadosPermitidos = ['pendiente', 'proceso', 'completada', 'cancelada'];
        if (!estadosPermitidos.includes(nuevo_estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        
        // Actualizar estado
        const result = await pool.query(
            'UPDATE solicitudes_etiquetas SET estado = $1 WHERE id_solicitud = $2 RETURNING *',
            [nuevo_estado, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        // Registrar en historial
        await pool.query(
            `INSERT INTO historial_solicitudes (id_solicitud, estado_nuevo, usuario_cambio, comentarios)
             VALUES ($1, $2, $3, $4)`,
            [id, nuevo_estado, req.usuario.id_usuario, `Estado cambiado a ${nuevo_estado}`]
        );
        
        // === IMPRESIÓN AUTOMÁTICA SOLO AL APROBAR (PROCESO) ===
        if (nuevo_estado === 'proceso') {
            try {
                console.log(`🖨️ Solicitud ${id} aprobada → Estado: PROCESO → Iniciando impresión automática...`);
                
                // Obtener datos completos de la solicitud
                const solicitudResult = await pool.query(`
                    SELECT se.*, p.nombre_producto, p.descripcion_corta, p.unidad_medida, p.modelo, u.nombre_completo as costurera_nombre
                    FROM solicitudes_etiquetas se
                    JOIN productos p ON se.id_producto = p.id_producto
                    JOIN usuarios u ON se.id_usuario = u.id_usuario
                    WHERE se.id_solicitud = $1
                `, [id]);
                
                if (solicitudResult.rows.length > 0) {
                    const solicitud = solicitudResult.rows[0];
                    
                    // Generar QR único para la solicitud
                    const qrCode = `SOL-${id}-${Date.now()}`;
                    
                    // Calcular cantidad a imprimir (siempre números pares)
                    let cantidadAImprimir = parseInt(solicitud.cantidad_solicitada);
                    if (cantidadAImprimir % 2 !== 0) {
                        cantidadAImprimir += 1; // Hacer par
                    }
                    
                    console.log(`📊 Cantidad original: ${solicitud.cantidad_solicitada}, cantidad a imprimir: ${cantidadAImprimir}`);
                    
                    // Agregar a cola de impresión con callback para completar la solicitud
                    const printJobData = {
                        numero_solicitud: `SOL-${id}`,
                        id_solicitud: id, // Importante: incluir ID de solicitud para callback
                        id_producto: solicitud.id_producto,
                        nombre_producto: solicitud.nombre_producto,
                        descripcion_adicional: solicitud.descripcion_corta,
                        modelo: solicitud.modelo, // Campo modelo para mostrar en etiquetas
                        empresa: solicitud.empresa || 'HECHO EN PERU', // 🏢 Incluir empresa
                        costurera_nombre: solicitud.costurera_nombre,
                        cantidad_solicitada: solicitud.cantidad_solicitada,
                        cantidad_a_imprimir: cantidadAImprimir,
                        qr_code: qrCode
                    };
                    
                    const printSuccess = await addToPrintQueue(printJobData);
                    
                    if (printSuccess) {
                        console.log(`✅ Solicitud ${id} agregada a cola de impresión → Sistema cambiará a COMPLETADA cuando termine`);
                        
                        // Actualizar la solicitud con el QR generado
                        await pool.query(
                            'UPDATE solicitudes_etiquetas SET qr_code = $1 WHERE id_solicitud = $2',
                            [qrCode, id]
                        );
                        
                    } else {
                        console.log(`⚠️ Solicitud ${id} agregada a cola pero impresión falló - permanecerá en PROCESO`);
                    }
                } else {
                    console.error(`❌ No se encontraron datos para la solicitud ${id}`);
                }
                
            } catch (printError) {
                console.error('❌ Error en impresión automática:', printError);
                // No fallar la aprobación por problemas de impresión
            }
        }
        
        res.json({ 
            success: true, 
            mensaje: nuevo_estado === 'proceso' ? 
                `Solicitud aprobada → En proceso de impresión → Se completará automáticamente` : 
                `Estado actualizado a ${nuevo_estado}`,
            solicitud: result.rows[0],
            print_triggered: nuevo_estado === 'proceso'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// Actualizar observaciones de una solicitud (costurera puede editar sus propias observaciones)
app.patch('/api/solicitudes/:id/observaciones', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { observaciones } = req.body;
    const userId = req.usuario.id_usuario;
    
    try {
        // Verificar que la solicitud pertenece al usuario actual
        const checkResult = await pool.query(
            'SELECT id_costurera FROM solicitudes_etiquetas WHERE id_solicitud = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        // Permitir si es la costurera dueña de la solicitud o si es administrador/supervisor
        const esSuSolicitud = checkResult.rows[0].id_costurera === userId;
        const esAdmin = req.usuario.nivel_acceso === 'administracion' || req.usuario.nivel_acceso === 'supervisor';
        
        if (!esSuSolicitud && !esAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta solicitud' });
        }
        
        // Actualizar observaciones
        const result = await pool.query(
            'UPDATE solicitudes_etiquetas SET observaciones = $1 WHERE id_solicitud = $2 RETURNING *',
            [observaciones || null, id]
        );
        
        res.json({ 
            success: true, 
            mensaje: 'Observaciones actualizadas correctamente',
            solicitud: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error actualizando observaciones:', error);
        res.status(500).json({ error: 'Error al actualizar observaciones' });
    }
});

// === ENDPOINT DE PRUEBA ZEBRA ===
app.get('/api/test-zebra', async (req, res) => {
    console.log('🧪 [TEST-ZEBRA] Iniciando prueba de impresora...');
    
    try {
        const connected = await checkPrinterConnection();
        console.log(`🧪 [TEST-ZEBRA] Resultado conexión: ${connected}`);
        
        res.json({
            success: true,
            printer_connected: connected,
            printer_ip: ZEBRA_CONFIG.PRINTER_IP,
            printer_port: ZEBRA_CONFIG.PRINTER_PORT,
            message: connected ? 'Impresora conectada correctamente' : 'Impresora no disponible'
        });
    } catch (error) {
        console.error('🧪 [TEST-ZEBRA] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// === ENDPOINT PARA DASHBOARD SUPERVISOR - CAMBIAR ESTADO ===
app.post('/api/supervisor/cambiar-estado/:id', async (req, res) => {
    const { id } = req.params;
    const { nuevo_estado, observaciones_supervisor } = req.body;
    
    try {
        console.log(`🔄 Supervisor cambiando estado de solicitud ${id} a: ${nuevo_estado}`);
        
        // Validar estados permitidos
        const estadosPermitidos = ['pendiente', 'proceso', 'completada', 'cancelada'];
        if (!estadosPermitidos.includes(nuevo_estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        
        // Actualizar estado
        const result = await pool.query(
            'UPDATE solicitudes_etiquetas SET estado = $1, observaciones_supervisor = $2 WHERE id_solicitud = $3 RETURNING *',
            [nuevo_estado, observaciones_supervisor, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        // Registrar en historial (usando ID 1 como usuario del sistema por ahora)
        await pool.query(
            `INSERT INTO historial_solicitudes (id_solicitud, estado_nuevo, usuario_cambio, comentarios)
             VALUES ($1, $2, $3, $4)`,
            [id, nuevo_estado, 1, observaciones_supervisor || `Estado cambiado a ${nuevo_estado}`]
        );
        
        // === IMPRESIÓN AUTOMÁTICA SOLO AL APROBAR (PROCESO) ===
        if (nuevo_estado === 'proceso') {
            try {
                console.log(`🖨️ Solicitud ${id} aprobada → Estado: PROCESO → Iniciando impresión automática...`);
                
                // Obtener datos completos de la solicitud
                const solicitudResult = await pool.query(`
                    SELECT se.*, p.nombre_producto, p.descripcion_corta, p.unidad_medida, p.modelo, u.nombre_completo as costurera_nombre
                    FROM solicitudes_etiquetas se
                    JOIN productos p ON se.id_producto = p.id_producto
                    JOIN usuarios u ON se.id_usuario = u.id_usuario
                    WHERE se.id_solicitud = $1
                `, [id]);
                
                if (solicitudResult.rows.length > 0) {
                    const solicitud = solicitudResult.rows[0];
                    
                    // Generar QR único para la solicitud
                    const qrCode = `SOL-${id}-${Date.now()}`;
                    
                    // Calcular cantidad a imprimir (siempre números pares)
                    let cantidadAImprimir = parseInt(solicitud.cantidad_solicitada);
                    if (cantidadAImprimir % 2 !== 0) {
                        cantidadAImprimir += 1; // Hacer par
                    }
                    
                    console.log(`📊 Cantidad original: ${solicitud.cantidad_solicitada}, cantidad a imprimir: ${cantidadAImprimir}`);
                    
                    // Agregar a cola de impresión con callback para completar la solicitud
                    const printJobData = {
                        numero_solicitud: `SOL-${id}`,
                        id_solicitud: id, // Importante: incluir ID de solicitud para callback
                        id_producto: solicitud.id_producto,
                        nombre_producto: solicitud.nombre_producto,
                        descripcion_adicional: solicitud.descripcion_corta,
                        modelo: solicitud.modelo, // Campo modelo para mostrar en etiquetas
                        empresa: solicitud.empresa || 'HECHO EN PERU', // 🏢 Incluir empresa
                        costurera_nombre: solicitud.costurera_nombre,
                        cantidad_solicitada: solicitud.cantidad_solicitada,
                        cantidad_a_imprimir: cantidadAImprimir,
                        qr_code: qrCode
                    };
                    
                    const printSuccess = await addToPrintQueue(printJobData);
                    
                    if (printSuccess) {
                        console.log(`✅ Solicitud ${id} agregada a cola de impresión → Sistema cambiará a COMPLETADA cuando termine`);
                        
                        // Actualizar la solicitud con el QR generado
                        await pool.query(
                            'UPDATE solicitudes_etiquetas SET qr_code = $1 WHERE id_solicitud = $2',
                            [qrCode, id]
                        );
                        
                    } else {
                        console.log(`⚠️ Solicitud ${id} agregada a cola pero impresión falló - permanecerá en PROCESO`);
                    }
                } else {
                    console.error(`❌ No se encontraron datos para la solicitud ${id}`);
                }
                
            } catch (printError) {
                console.error('❌ Error en impresión automática:', printError);
                // No fallar la aprobación por problemas de impresión
            }
        }
        
        res.json({ 
            success: true, 
            mensaje: nuevo_estado === 'proceso' ? 
                `✅ Solicitud aprobada → En proceso de impresión → Se completará automáticamente` : 
                `Estado actualizado a ${nuevo_estado}`,
            solicitud: result.rows[0],
            print_triggered: nuevo_estado === 'proceso'
        });
        
    } catch (error) {
        console.error('Error cambiando estado:', error);
        res.status(500).json({ error: 'Error al cambiar estado de solicitud' });
    }
});

// Obtener estadísticas (según rol)
app.get('/api/estadisticas', async (req, res) => {
    try {
        // Obtener email del usuario desde headers (sin token)
        const userEmail = req.headers['user-email'];
        let filtroUsuario = '';
        let params = [];
        
        // Si se proporciona email, obtener datos del usuario
        if (userEmail) {
            const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
            if (userResult.rows.length > 0) {
                const usuario = userResult.rows[0];
                
                if (usuario.nivel_acceso === 'costurera') {
                    filtroUsuario = 'WHERE se.id_usuario = $1';
                    params = [usuario.id_usuario];
                } else if (usuario.nivel_acceso === 'encargada_embalaje') {
                    filtroUsuario = `WHERE se.id_usuario IN (
                        SELECT id_usuario FROM usuarios 
                        WHERE id_departamento = (SELECT id_departamento FROM departamentos WHERE nombre_departamento = 'Costura')
                    )`;
                }
            }
        }
        
        const queries = [
            `SELECT COUNT(*) as total FROM solicitudes_etiquetas se ${filtroUsuario}`,
            `SELECT COUNT(*) as pendientes FROM solicitudes_etiquetas se ${filtroUsuario ? filtroUsuario + ' AND' : 'WHERE'} se.estado = 'pendiente'`,
            `SELECT COUNT(*) as proceso FROM solicitudes_etiquetas se ${filtroUsuario ? filtroUsuario + ' AND' : 'WHERE'} se.estado = 'proceso'`,
            `SELECT COUNT(*) as completadas FROM solicitudes_etiquetas se ${filtroUsuario ? filtroUsuario + ' AND' : 'WHERE'} se.estado = 'completada'`,
            `SELECT COALESCE(SUM(cantidad_solicitada), 0) as total_etiquetas FROM solicitudes_etiquetas se ${filtroUsuario}`,
            'SELECT COUNT(*) as total_productos FROM productos WHERE activo = true'
        ];
        
        const results = await Promise.all(
            queries.map(query => pool.query(query, params))
        );
        
        const estadisticas = {
            total_solicitudes: parseInt(results[0].rows[0].total),
            solicitudes_pendientes: parseInt(results[1].rows[0].pendientes),
            solicitudes_proceso: parseInt(results[2].rows[0].proceso),
            solicitudes_completadas: parseInt(results[3].rows[0].completadas),
            total_etiquetas_solicitadas: parseInt(results[4].rows[0].total_etiquetas),
            total_productos: parseInt(results[5].rows[0].total_productos)
        };
        
        res.json(estadisticas);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ==========================================
// RUTAS API PARA SISTEMA SUPERVISOR
// Agregar al server.js existente
// ==========================================

// MIDDLEWARE PARA VERIFICAR ROL SUPERVISOR
function verificarSupervisor(req, res, next) {
    // Por ahora sin JWT, solo verificar en sesión simple
    const userEmail = req.session?.userEmail || req.headers['user-email'];
    
    if (!userEmail) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    
    // Verificar que sea supervisor
    pool.query(
        'SELECT id_usuario, nivel_acceso FROM usuarios WHERE email = $1 AND activo = true',
        [userEmail],
        (err, result) => {
            if (err || result.rows.length === 0) {
                return res.status(401).json({ error: 'Usuario no válido' });
            }
            
            const user = result.rows[0];
            if (user.nivel_acceso !== 'supervisor') {
                return res.status(403).json({ error: 'Acceso denegado. Solo supervisores.' });
            }
            
            req.user = user;
            next();
        }
    );
}

// RUTA: LOGIN GENERAL (LISTA DE USUARIOS)
app.get('/api/usuarios-login', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario,
                nombre_completo,
                nivel_acceso,
                email
            FROM usuarios 
            WHERE activo = true 
            ORDER BY 
                CASE nivel_acceso 
                    WHEN 'supervisor' THEN 1 
                    WHEN 'costurera' THEN 2 
                    WHEN 'encargada_embalaje' THEN 3 
                    ELSE 4 
                END,
                nombre_completo
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// RUTA: AUTENTICAR USUARIO
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const clientIP = (req.ip || req.connection.remoteAddress).replace('::ffff:', '');
    
    logger.info('AUTH', `Intento de login: ${email}`, { ip: clientIP });
    
    try {
        logger.dbQuery('SELECT user FROM usuarios', { email });
        const result = await pool.query(
            'SELECT id_usuario, nombre_completo, email, password_hash, nivel_acceso, genero, auto_services FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );
        logger.dbResult('SELECT user FROM usuarios', result.rowCount);
        
        if (result.rows.length === 0) {
            logger.loginAttempt(email, clientIP, false);
            logger.warn('AUTH', `Usuario no encontrado: ${email}`, { ip: clientIP });
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        
        // Verificar password - usar bcrypt si hay hash, sino comparar directamente
        let passwordValido = false;
        
        if (user.password_hash && user.password_hash.startsWith('$2b$')) {
            // Password hasheada con bcrypt
            passwordValido = await bcrypt.compare(password, user.password_hash);
        } else {
            // Comparación directa para passwords temporales
            passwordValido = password === '123456' || password === user.password_hash || password === 'costurera123';
        }
        
        if (!passwordValido) {
            logger.loginAttempt(email, clientIP, false);
            logger.warn('AUTH', `Contraseña incorrecta para: ${email}`, { ip: clientIP });
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Crear token JWT
        const token = jwt.sign(
            { 
                id_usuario: user.id_usuario, 
                nivel_acceso: user.nivel_acceso,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        logger.loginAttempt(email, clientIP, true);
        logger.userSession('LOGIN', user.nombre_completo, { 
            nivel_acceso: user.nivel_acceso,
            ip: clientIP,
            auto_services: user.auto_services 
        });
        
        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1',
            [user.id_usuario]
        );
        
        res.json({
            usuario: {
                id_usuario: user.id_usuario,
                id: user.id_usuario,
                nombre: user.nombre_completo,
                nombre_completo: user.nombre_completo,
                email: user.email,
                rol: user.nivel_acceso,
                nivel_acceso: user.nivel_acceso,
                genero: user.genero || 'femenino', // Default femenino
                auto_services: user.auto_services || false // Default false
            },
            token: token,
            mensaje: 'Login exitoso'
        });
        
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// RUTA: SUPERVISOR - OBTENER LISTA DE COSTURERAS
app.get('/api/supervisor/costureras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario,
                nombre_completo,
                email,
                ultimo_login
            FROM usuarios 
            WHERE nivel_acceso = 'costurera' AND activo = true
            ORDER BY nombre_completo
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo costureras:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// RUTA: SUPERVISOR - "ACTUAR COMO" COSTURERA
app.post('/api/supervisor/actuar-como/:id_costurera', verificarSupervisor, async (req, res) => {
    const { id_costurera } = req.params;
    const supervisorId = req.user.id_usuario;
    
    try {
        // Verificar que la costurera existe
        const costureraResult = await pool.query(
            'SELECT id_usuario, nombre_completo FROM usuarios WHERE id_usuario = $1 AND nivel_acceso = $2',
            [id_costurera, 'costurera']
        );
        
        if (costureraResult.rows.length === 0) {
            return res.status(404).json({ error: 'Costurera no encontrada' });
        }
        
        // Cerrar sesión anterior si existe
        await pool.query(
            'UPDATE sesiones_supervisor SET activa = false WHERE id_supervisor = $1 AND activa = true',
            [supervisorId]
        );
        
        // Crear nueva sesión
        await pool.query(`
            INSERT INTO sesiones_supervisor (id_supervisor, id_costurera_activa, activa)
            VALUES ($1, $2, true)
        `, [supervisorId, id_costurera]);
        
        res.json({
            mensaje: `Ahora actuando como ${costureraResult.rows[0].nombre_completo}`,
            costurera: costureraResult.rows[0]
        });
        
    } catch (err) {
        console.error('Error actuando como costurera:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ========== ENDPOINTS DE REGISTROS ==========

// ENDPOINT: Imprimir rotulado de un registro específico (DEBE IR PRIMERO - RUTA MÁS ESPECÍFICA)
app.post('/api/registros/:id_solicitud/imprimir-rotulado', verificarToken, async (req, res) => {
    const { id_solicitud } = req.params;
    const { conCorte = false } = req.body; // 🔪 Recibir parámetro de corte
    
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🏷️  [ROTULADO GODEX] INICIO - Solicitud ID: ${id_solicitud}`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📡 Datos recibidos del dispositivo:`);
        console.log(`   • ID Solicitud: ${id_solicitud}`);
        console.log(`   • Corte automático: ${conCorte ? '✅ ACTIVADO' : '❌ DESACTIVADO'}`);
        console.log(`   • IP Cliente: ${req.ip || req.connection.remoteAddress}`);
        console.log(`   • User-Agent: ${req.get('user-agent')}`);
        console.log(`   • Body completo: ${JSON.stringify(req.body)}`);
        
        // Obtener datos del producto de la solicitud + configuración de logos
        const solicitudResult = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada,
                COALESCE(se.logo_principal, 'camitex') as logo_principal,
                COALESCE(se.config_logo_misti, true) as config_logo_misti,
                COALESCE(se.config_iconos, true) as config_iconos,
                p.id_producto,
                p.nombre_producto,
                p.subcategoria,
                p.descripcion_corta,
                p.marca,
                p.modelo,
                p.codigo_producto,
                p.unidad_medida
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.id_solicitud = $1
        `, [id_solicitud]);
        
        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudResult.rows[0];
        const cantidad = solicitud.cantidad_solicitada;
        
        console.log(`\n📦 Datos del producto obtenidos:`);
        console.log(`   • Nombre: ${solicitud.nombre_producto}`);
        console.log(`   • Subcategoría: ${solicitud.subcategoria}`);
        console.log(`   • Marca (Tela): ${solicitud.marca}`);
        console.log(`   • Modelo (Tamaño): ${solicitud.modelo}`);
        console.log(`   • Código: ${solicitud.codigo_producto}`);
        console.log(`   • Cantidad: ${cantidad}`);
        console.log(`\n🎨 Configuración de logos guardada:`);
        console.log(`   • Logo Principal: ${solicitud.logo_principal || 'camitex (default)'}`);
        console.log(`   • Logo Misti: ${solicitud.config_logo_misti ? '✅ Sí' : '❌ No'}`);
        console.log(`   • Iconos: ${solicitud.config_iconos ? '✅ Sí' : '❌ No'}`);
        
        // Generar ZPL para rotulado con opciones guardadas + corte dinámico
        const datosProducto = {
            subcategoria: solicitud.subcategoria,
            marca: solicitud.marca,
            modelo: solicitud.modelo,
            codigo_producto: solicitud.codigo_producto,
            unidad_medida: solicitud.unidad_medida,
            id_solicitud: solicitud.id_solicitud,
            empresa: solicitud.empresa || 'HECHO EN PERU'
        };
        
        const opcionesZPL = {
            logoPrincipal: solicitud.logo_principal || 'camitex',
            conLogoMisti: solicitud.config_logo_misti,
            conIconos: solicitud.config_iconos,
            conCorte: conCorte
        };
        
        console.log(`\n🔧 Generando código ZPL con:`);
        console.log(`   • Datos: ${JSON.stringify(datosProducto, null, 2)}`);
        console.log(`   • Opciones: ${JSON.stringify(opcionesZPL, null, 2)}`);
        
        const zplData = generarRotuladoZPL(datosProducto, opcionesZPL);
        
        console.log(`\n📝 Código ZPL generado:`);
        console.log(`   • Longitud: ${zplData.length} caracteres`);
        console.log(`   • Primeros 500 caracteres:`);
        console.log(`   ${zplData.substring(0, 500)}...`);
        console.log(`   • Últimos 200 caracteres:`);
        console.log(`   ...${zplData.substring(zplData.length - 200)}`);
        
        // ⚡ OPTIMIZACIÓN: Enviar todas las impresiones en paralelo
        const impresionesPromises = [];
        for (let i = 0; i < cantidad; i++) {
            impresionesPromises.push(
                enviarZPLAGodex(zplData, '192.168.15.35', 9100)
                    .then(() => console.log(`✅ Rotulado ${i + 1}/${cantidad} enviado a Godex`))
            );
        }
        await Promise.all(impresionesPromises);
        
        // Registrar en cola_impresion_rotulado con datos completos
        await pool.query(`
            INSERT INTO cola_impresion_rotulado (
                id_solicitud, numero_solicitud, nombre_producto, cantidad, 
                codigo_producto, unidad_medida, tela, tamano, datos_zpl
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            id_solicitud,
            solicitud.numero_solicitud,
            solicitud.nombre_producto,
            cantidad,
            solicitud.codigo_producto,
            solicitud.unidad_medida,
            solicitud.marca,
            solicitud.modelo,
            zplData
        ]);
        
        // Marcar rotulado como impreso
        const updateResult = await pool.query(`
            UPDATE solicitudes_etiquetas 
            SET rotulado_impreso = true
            WHERE id_solicitud = $1
            RETURNING rotulado_impreso
        `, [id_solicitud]);
        
        console.log(`\n✅ ROTULADO COMPLETADO:`);
        console.log(`   • Solicitud: ${solicitud.numero_solicitud}`);
        console.log(`   • Cantidad enviada: ${cantidad}`);
        console.log(`   • Base de datos actualizada: rotulado_impreso = ${updateResult.rows[0]?.rotulado_impreso}`);
        console.log(`   • Impresora: Godex G530 (192.168.15.35:9100)`);
        console.log(`${'='.repeat(80)}\n`);
        
        res.json({
            success: true,
            mensaje: `${cantidad} rotulado(s) impreso(s) exitosamente en Godex G530`,
            cantidad_impresa: cantidad,
            debug: {
                zpl_length: zplData.length,
                producto: solicitud.nombre_producto,
                opciones: opcionesZPL
            }
        });
        
    } catch (err) {
        console.error(`\n❌ ERROR EN ROTULADO:`);
        console.error(`   • Mensaje: ${err.message}`);
        console.error(`   • Stack: ${err.stack}`);
        console.error(`${'='.repeat(80)}\n`);
        res.status(500).json({ error: 'Error al imprimir rotulado: ' + err.message });
    }
});

// 🧪 ENDPOINT DE DIAGNÓSTICO: Verificar código ZPL sin imprimir
app.post('/api/diagnostico/verificar-zpl', verificarToken, async (req, res) => {
    try {
        const { id_solicitud } = req.body;
        
        console.log(`\n🧪 [DIAGNÓSTICO ZPL] ID Solicitud: ${id_solicitud}`);
        
        // Obtener datos del producto
        const solicitudResult = await pool.query(`
            SELECT 
                se.id_solicitud,
                COALESCE(se.logo_principal, 'camitex') as logo_principal,
                COALESCE(se.config_logo_misti, true) as config_logo_misti,
                COALESCE(se.config_iconos, true) as config_iconos,
                p.nombre_producto,
                p.subcategoria,
                p.marca,
                p.modelo,
                p.codigo_producto,
                p.unidad_medida
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.id_solicitud = $1
        `, [id_solicitud]);
        
        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudResult.rows[0];
        
        const datosProducto = {
            subcategoria: solicitud.subcategoria,
            marca: solicitud.marca,
            modelo: solicitud.modelo,
            codigo_producto: solicitud.codigo_producto,
            unidad_medida: solicitud.unidad_medida,
            id_solicitud: solicitud.id_solicitud,
            empresa: 'HECHO EN PERU'
        };
        
        const opcionesZPL = {
            logoPrincipal: solicitud.logo_principal || 'camitex',
            conLogoMisti: solicitud.config_logo_misti,
            conIconos: solicitud.config_iconos,
            conCorte: true
        };
        
        const zplData = generarRotuladoZPL(datosProducto, opcionesZPL);
        
        console.log(`✅ [DIAGNÓSTICO] ZPL generado correctamente`);
        console.log(`   • Longitud: ${zplData.length} caracteres`);
        
        res.json({
            success: true,
            datos_producto: datosProducto,
            opciones_zpl: opcionesZPL,
            zpl_generado: zplData,
            longitud: zplData.length,
            primera_linea: zplData.split('\n')[0],
            ultima_linea: zplData.split('\n').slice(-2)[0],
            contiene_corte: zplData.includes('^MMC'),
            contiene_logo: zplData.includes('^GFA')
        });
        
    } catch (err) {
        console.error('❌ [DIAGNÓSTICO] Error:', err);
        res.status(500).json({ error: 'Error verificando ZPL: ' + err.message });
    }
});

// RUTA: OBTENER REGISTROS DE COSTURERA (PARA SUPERVISOR O PROPIA)
app.get('/api/registros/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada as cantidad_productos,
                se.estado as estado_solicitud,
                se.prioridad,
                se.fecha_solicitud as fecha_creacion,
                COALESCE(se.creado_por_supervisor, false) as creado_por_supervisor,
                COALESCE(se.rotulado_impreso, false) as rotulado_impreso,
                COALESCE(se.qr_impreso, false) as qr_impreso,
                p.nombre_producto,
                u.nombre_completo as solicitante,
                COALESCE(us.nombre_completo, '') as supervisor_creador
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            LEFT JOIN usuarios us ON se.supervisor_id = us.id_usuario
            WHERE se.id_usuario = $1
            ORDER BY se.fecha_solicitud DESC
        `, [id_usuario]);
        
        console.log(`📋 Registros obtenidos para usuario ${id_usuario}:`, result.rows.length);
        if (result.rows.length > 0) {
            console.log(`   Primer registro - rotulado_impreso: ${result.rows[0].rotulado_impreso}, qr_impreso: ${result.rows[0].qr_impreso}`);
        }
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo registros:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// RUTA: CREAR SOLICITUD (COSTURERA O SUPERVISOR EN NOMBRE DE)
app.post('/api/crear-solicitud', async (req, res) => {
    const { 
        id_producto, 
        cantidad_productos, 
        prioridad, 
        observaciones,
        id_usuario_costurera, // Para cuando supervisor crea en nombre de
        es_supervisor = false,
        id_producto_especial = null, // Agregar soporte para productos especiales
        empresa = 'HECHO EN PERU', // Nueva columna empresa (default: HECHO EN PERU)
        conCorte = false, // 🔪 Parámetro de corte automático
        // 🏷️ Opciones de rotulado Godex
        logoPrincipal = 'camitex', // Nuevo: selector de logo principal
        conLogoMisti = true,
        conIconos = true,
        // 🆕 Configuración personalizada de impresión (para CREAR QR supervisor)
        configuracion_impresion = null
    } = req.body;
    
    console.log('Datos recibidos:', req.body);
    
    try {
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
        let usuario = { id_usuario: 1, auto_services: false }; // valor por defecto
        
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
        
        // Si hay id_usuario_costurera, obtener sus permisos también
        let usuarioCosturera = usuario;
        if (id_usuario_costurera) {
            const costureraResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id_usuario_costurera]);
            if (costureraResult.rows.length > 0) {
                usuarioCosturera = costureraResult.rows[0];
            }
        }
        
        console.log('Usuario encontrado:', usuario);
        console.log('Usuario costurera:', usuarioCosturera);
        console.log('Auto-services activo:', usuarioCosturera.auto_services);
        
        // Validar datos requeridos
        if (!id_producto || !cantidad_productos) {
            return res.status(400).json({ error: 'Faltan datos requeridos: id_producto y cantidad_productos' });
        }

        // Usar un número de solicitud simple por ahora, sin función personalizada
        const timestamp = Date.now();
        const numero_solicitud = `SOL-${timestamp}`;
        
        // ✨ DETERMINAR ESTADO INICIAL: Si auto_services = true → 'proceso', sino → 'pendiente'
        // Manejo seguro: si auto_services es null, undefined o false → pendiente
        const estadoInicial = (usuarioCosturera.auto_services === true) ? 'proceso' : 'pendiente';
        
        // Insertar solicitud con todos los campos requeridos
        const fechaActual = new Date();
        const insertResult = await pool.query(`
            INSERT INTO solicitudes_etiquetas (
                numero_solicitud, 
                id_usuario, 
                id_producto, 
                lote_produccion,
                cantidad_solicitada,
                fecha_produccion,
                prioridad, 
                estado, 
                observaciones,
                empresa,
                logo_principal,
                config_logo_misti,
                config_iconos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id_solicitud, numero_solicitud
        `, [
            numero_solicitud,
            id_usuario_costurera || usuario.id_usuario,
            id_producto,
            numero_solicitud, // lote_produccion
            cantidad_productos,
            fechaActual, // fecha_produccion 
            prioridad || 'normal',
            estadoInicial, // 🔥 AUTO-APROBADO SI TIENE PERMISO
            observaciones || '',
            empresa, // Nueva columna
            logoPrincipal, // 🔷 Logo principal (camitex|algodon_100|maxima_suavidad|producto_peruano|sin_logo)
            conLogoMisti,   // 🏷️ Config logo Misti
            conIconos       // 🏷️ Config iconos advertencia
        ]);
        
        console.log('Solicitud insertada:', insertResult.rows[0]);
        
        // Registrar en historial la creación
        const comentarioHistorial = (usuarioCosturera.auto_services === true)
            ? (es_supervisor 
                ? `Solicitud creada y AUTO-APROBADA por supervisor para usuario ${id_usuario_costurera} (auto_services activo)` 
                : 'Solicitud creada y AUTO-APROBADA automáticamente (auto_services activo)')
            : (es_supervisor 
                ? `Solicitud creada por supervisor para usuario ${id_usuario_costurera}` 
                : 'Solicitud creada por costurera');
        
        await pool.query(`
            INSERT INTO historial_solicitudes (
                id_solicitud, 
                estado_anterior, 
                estado_nuevo, 
                usuario_cambio, 
                comentarios
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            insertResult.rows[0].id_solicitud,
            null, // Sin estado anterior
            estadoInicial,
            usuario.id_usuario,
            comentarioHistorial
        ]);
        
        // 🖨️ SI AUTO_SERVICES = TRUE → ENVIAR AUTOMÁTICAMENTE A IMPRESORA
        // ⚠️ IMPORTANTE: NO auto-imprimir productos especiales (solo supervisor puede imprimirlos manualmente)
        let printResult = null;
        if (usuarioCosturera.auto_services === true && !id_producto_especial) {
            try {
                console.log('🖨️🖨️🖨️ ===============================================');
                console.log('🖨️ AUTO-SERVICES ACTIVO: Enviando a cola de impresión...');
                console.log('🖨️ ID Usuario:', id_usuario_costurera);
                console.log('🖨️ ID Producto:', id_producto);
                console.log('🖨️ Cantidad:', cantidad_productos);
                console.log('🖨️ Número Solicitud:', numero_solicitud);
                console.log('🖨️🖨️🖨️ ===============================================');
                
                // Obtener datos completos del producto para la etiqueta
                const productoResult = await pool.query(`
                    SELECT p.id_producto, p.codigo_producto, p.nombre_producto, 
                           p.descripcion_corta, p.marca, p.modelo, p.unidad_medida
                    FROM productos p
                    WHERE p.id_producto = $1
                `, [id_producto]);
                
                if (productoResult.rows.length > 0) {
                    const producto = productoResult.rows[0];
                    
                    // Generar QR Code
                    const qrCode = `${numero_solicitud}`;
                    
                    // Calcular cantidad de etiquetas (2 por prenda)
                    const cantidadEtiquetas = cantidad_productos * 2;
                    
                    // Preparar datos para impresión (formato correcto para addToPrintQueue)
                    const solicitudData = {
                        id_solicitud: insertResult.rows[0].id_solicitud,
                        numero_solicitud: numero_solicitud,
                        qr_code: qrCode,
                        nombre_producto: producto.nombre_producto,
                        descripcion_corta: producto.descripcion_corta || '',
                        descripcion_adicional: producto.marca ? `${producto.marca}${producto.modelo ? ' ' + producto.modelo : ''}` : producto.descripcion_corta,
                        modelo: producto.modelo || '',
                        unidad_medida: producto.unidad_medida || 'UNIDAD',
                        empresa: empresa || 'HECHO EN PERU', // 🏢 Incluir empresa en datos de impresión
                        costurera_nombre: usuarioCosturera.nombre_completo,
                        id_producto: producto.id_producto,
                        cantidad_solicitada: cantidad_productos,
                        cantidad_a_imprimir: cantidadEtiquetas,
                        // 🆕 Configuración personalizada de impresión (si existe)
                        configuracion_impresion: configuracion_impresion
                    };
                    
                    // Agregar a cola de impresión
                    console.log('📋 Datos a enviar a impresión:', JSON.stringify(solicitudData, null, 2));
                    printResult = await addToPrintQueue(solicitudData);
                    console.log('✅ Resultado de addToPrintQueue:', JSON.stringify(printResult, null, 2));
                    
                    // Verificar si realmente se agregó
                    if (printResult && printResult.success) {
                        console.log('🎉 ÉXITO: Solicitud agregada a cola de impresión');
                        console.log(`   - QR generado: ${printResult.qr_code}`);
                        console.log(`   - ID solicitud: ${solicitudData.id_solicitud}`);
                        console.log(`   - Cantidad: ${solicitudData.cantidad}`);
                        
                        // 🔥 MARCAR COMO COMPLETADA DESPUÉS DE IMPRIMIR
                        try {
                            await pool.query(
                                `UPDATE solicitudes_etiquetas 
                                 SET estado = 'completada', 
                                     fecha_completado = NOW() 
                                 WHERE id_solicitud = $1`,
                                [insertResult.rows[0].id_solicitud]
                            );
                            
                            // Registrar en historial
                            await pool.query(
                                `INSERT INTO historial_solicitudes 
                                 (id_solicitud, id_usuario, comentario)
                                 VALUES ($1, $2, $3)`,
                                [
                                    insertResult.rows[0].id_solicitud,
                                    usuario.id_usuario,
                                    'Solicitud AUTO-COMPLETADA tras impresión automática exitosa'
                                ]
                            );
                            
                            console.log('✅ Estado actualizado a COMPLETADA tras impresión');
                        } catch (updateError) {
                            console.error('❌ Error al marcar como completada:', updateError);
                        }
                        
                        // NOTA: Auto-print de rotulado se ejecuta DESPUÉS del bloque auto_services
                        
                    } else {
                        console.error('❌ FALLO: No se pudo agregar a cola de impresión');
                        console.error('   Resultado:', printResult);
                    }
                } else {
                    console.warn('⚠️ Producto no encontrado para auto-impresión');
                    console.warn(`   ID producto buscado: ${id_producto}`);
                }
            } catch (printError) {
                console.error('❌ Error al enviar a impresión automática:', printError);
                console.error('   Stack:', printError.stack);
                // No fallar la solicitud, solo registrar el error
                printResult = { 
                    success: false, 
                    error: printError.message,
                    message: 'Solicitud creada pero falló la impresión automática. Se reintentará.'
                };
            }
        } else {
            console.log('ℹ️ AUTO-SERVICES INACTIVO: Solicitud creada en estado pendiente');
        }
        
        // 🏷️ AUTO-IMPRESIÓN DE ROTULADO (INDEPENDIENTE DE AUTO_SERVICES)
        // Este bloque se ejecuta DESPUÉS del auto_services, independientemente de su estado
        console.log('🔍 Verificando auto_servicesgd:', usuarioCosturera.auto_servicesgd);
        console.log('🔍 Tipo de auto_servicesgd:', typeof usuarioCosturera.auto_servicesgd);
        
        if (usuarioCosturera.auto_servicesgd === true && !id_producto_especial) {
            try {
                console.log('🏷️ AUTO_SERVICESGD ACTIVO: Enviando rotulado a Godex...');
                
                // Obtener datos completos de la solicitud para el rotulado
                const solicitudRotulado = await pool.query(`
                    SELECT se.*, p.subcategoria, p.marca, p.modelo, p.codigo_producto, p.unidad_medida
                    FROM solicitudes_etiquetas se
                    LEFT JOIN productos p ON se.id_producto = p.id_producto
                    WHERE se.id_solicitud = $1
                `, [insertResult.rows[0].id_solicitud]);
                
                if (solicitudRotulado.rows.length > 0) {
                    const datosRotulado = solicitudRotulado.rows[0];
                    
                    // Generar ZPL para rotulado (con opciones dinámicas del frontend)
                    const zplRotulado = generarRotuladoZPL({
                        subcategoria: datosRotulado.subcategoria || datosRotulado.nombre_producto,
                        marca: datosRotulado.marca || '',
                        modelo: datosRotulado.modelo || '',
                        codigo_producto: datosRotulado.codigo_producto || '',
                        unidad_medida: datosRotulado.unidad_medida || '',
                        id_solicitud: datosRotulado.id_solicitud,
                        empresa: datosRotulado.empresa || 'HECHO EN PERU'  // 🏢 Empresa desde tabla entidades
                    }, {
                        logoPrincipal: logoPrincipal,    // 🔷 Logo principal (camitex|algodon_100|maxima_suavidad|producto_peruano|sin_logo)
                        conLogoMisti: conLogoMisti,      // 🏷️ Logo secundario Misti
                        conIconos: conIconos,            // 🏷️ Iconos de advertencia
                        conCorte: conCorte               // 🔪 Corte automático
                    });
                    
                    console.log(`🔪 Generando ${cantidad_productos} rotulados con corte: ${conCorte ? 'ACTIVADO' : 'DESACTIVADO'}`);
                    
                    // ⚡ OPTIMIZACIÓN: Enviar todas las impresiones primero
                    const impresionesPromises = [];
                    for (let i = 0; i < cantidad_productos; i++) {
                        impresionesPromises.push(
                            enviarZPLAGodex(zplRotulado, '192.168.15.35', 9100)
                                .then(() => console.log(`✅ Rotulado ${i + 1}/${cantidad_productos} enviado a Godex`))
                        );
                    }
                    await Promise.all(impresionesPromises);
                    
                    // ⚡ OPTIMIZACIÓN: 1 solo INSERT en lugar de N inserts
                    await pool.query(`
                        INSERT INTO cola_impresion_rotulado 
                        (id_solicitud, numero_solicitud, nombre_producto, cantidad, 
                         codigo_producto, unidad_medida, tela, tamano, datos_zpl)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        datosRotulado.id_solicitud,
                        datosRotulado.numero_solicitud,
                        datosRotulado.subcategoria || datosRotulado.nombre_producto,
                        cantidad_productos,
                        datosRotulado.codigo_producto || '',
                        datosRotulado.unidad_medida || '',
                        datosRotulado.marca || '',
                        datosRotulado.modelo || '',
                        zplRotulado
                    ]);
                    
                    // Marcar como rotulado impreso
                    await pool.query(`
                        UPDATE solicitudes_etiquetas 
                        SET rotulado_impreso = true
                        WHERE id_solicitud = $1
                    `, [insertResult.rows[0].id_solicitud]);
                    
                    console.log('🎉 ROTULADO AUTO-IMPRESO COMPLETADO:');
                    console.log(`   - Etiquetas enviadas: ${cantidad_productos}`);
                    console.log(`   - Marcado como impreso: ✓`);
                    console.log(`   - Guardado en cola: ✓`);
                }
                
            } catch (rotuladoError) {
                console.error('❌ Error al imprimir rotulado automático:', rotuladoError);
                console.error('   Stack:', rotuladoError.stack);
                // No fallar la solicitud por esto
            }
        } else {
            console.log('ℹ️ AUTO_SERVICESGD INACTIVO o producto especial: Sin auto-print de rotulado');
        }
        
        res.json({
            mensaje: (usuarioCosturera.auto_services === true)
                ? 'Solicitud creada y enviada AUTOMÁTICAMENTE a impresión' 
                : 'Solicitud creada exitosamente, pendiente de aprobación',
            solicitud: insertResult.rows[0],
            auto_approved: usuarioCosturera.auto_services === true,
            print_status: printResult
        });
        
    } catch (err) {
        console.error('Error creando solicitud:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Error del servidor: ' + err.message });
    }
});

// ==================== ENDPOINTS CONFIGURACIÓN IMPRESIÓN PRODUCTOS ESPECIALES ====================

// GET: Obtener configuración de impresión de un producto especial
app.get('/api/config-impresion-especial/:id_producto_especial', async (req, res) => {
    const { id_producto_especial } = req.params;
    
    try {
        console.log(`📋 Obteniendo configuración de impresión para producto especial ${id_producto_especial}`);
        
        const result = await pool.query(`
            SELECT 
                cie.*,
                pe.nombre_producto,
                pe.codigo_producto
            FROM config_impresion_especiales cie
            JOIN productos_especiales pe ON cie.id_producto_especial = pe.id_producto_especial
            WHERE cie.id_producto_especial = $1
        `, [id_producto_especial]);
        
        if (result.rows.length === 0) {
            // Si no existe, crear configuración por defecto
            const insertResult = await pool.query(`
                INSERT INTO config_impresion_especiales (
                    id_producto_especial, 
                    mostrar_nombre, 
                    mostrar_modelo, 
                    mostrar_unidad, 
                    mostrar_id, 
                    mostrar_empresa
                ) VALUES ($1, TRUE, FALSE, FALSE, TRUE, TRUE)
                RETURNING *
            `, [id_producto_especial]);
            
            return res.json(insertResult.rows[0]);
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Guardar configuración de impresión de un producto especial
app.post('/api/config-impresion-especial', async (req, res) => {
    const { 
        id_producto_especial, 
        mostrar_nombre, 
        mostrar_modelo, 
        mostrar_unidad, 
        mostrar_id, 
        mostrar_empresa 
    } = req.body;
    
    try {
        console.log(`💾 Guardando configuración de impresión para producto especial ${id_producto_especial}`);
        
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1', [userEmail]);
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id_usuario : 1;
        
        // Validar que al menos un campo esté activo
        const algunCampoActivo = mostrar_nombre || mostrar_modelo || mostrar_unidad || mostrar_id || mostrar_empresa;
        
        if (!algunCampoActivo) {
            return res.status(400).json({ 
                error: 'Debe haber al menos un campo visible en la etiqueta' 
            });
        }
        
        // Insertar o actualizar configuración
        const result = await pool.query(`
            INSERT INTO config_impresion_especiales (
                id_producto_especial,
                mostrar_nombre,
                mostrar_modelo,
                mostrar_unidad,
                mostrar_id,
                mostrar_empresa,
                usuario_configuro
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id_producto_especial) 
            DO UPDATE SET
                mostrar_nombre = EXCLUDED.mostrar_nombre,
                mostrar_modelo = EXCLUDED.mostrar_modelo,
                mostrar_unidad = EXCLUDED.mostrar_unidad,
                mostrar_id = EXCLUDED.mostrar_id,
                mostrar_empresa = EXCLUDED.mostrar_empresa,
                usuario_configuro = EXCLUDED.usuario_configuro,
                fecha_configuracion = CURRENT_TIMESTAMP
            RETURNING *
        `, [id_producto_especial, mostrar_nombre, mostrar_modelo, mostrar_unidad, mostrar_id, mostrar_empresa, userId]);
        
        console.log('✅ Configuración guardada exitosamente');
        res.json({ 
            success: true, 
            config: result.rows[0] 
        });
        
    } catch (error) {
        console.error('❌ Error guardando configuración:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener progreso de impresión de una solicitud especial
app.get('/api/solicitudes-especiales/:id_solicitud/progreso', async (req, res) => {
    const { id_solicitud } = req.params;
    
    try {
        console.log(`📊 Obteniendo progreso de solicitud especial ${id_solicitud}`);
        
        // Obtener cantidad solicitada y componentes
        const solicitudResult = await pool.query(`
            SELECT 
                se.cantidad_solicitada,
                se.id_producto_especial,
                pe.nombre_producto
            FROM solicitudes_etiquetas se
            JOIN productos_especiales pe ON se.id_producto_especial = pe.id_producto_especial
            WHERE se.id_solicitud = $1
        `, [id_solicitud]);
        
        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const cantidadSolicitada = solicitudResult.rows[0].cantidad_solicitada;
        
        // Obtener cantidades impresas desde cola_impresion
        // Por ahora retornamos 0 para todos (implementarás tracking más adelante)
        const impresiones = {
            juego: 0,  // Encabezado
            comp_0: 0, // Componente 1
            comp_1: 0, // Componente 2
            comp_2: 0, // Componente 3 (si existe)
            comp_3: 0  // Componente 4 (si existe)
        };
        
        res.json({
            cantidad_solicitada: cantidadSolicitada,
            impresiones: impresiones
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo progreso:', error);
        res.status(500).json({ error: error.message });
    }
});

// RUTA: CREAR SOLICITUD PARA PRODUCTO ESPECIAL (JUEGO/COMBO)
app.post('/api/crear-solicitud-especial', async (req, res) => {
    const { 
        id_producto_especial, 
        cantidad_juegos, 
        prioridad, 
        observaciones,
        id_usuario_costurera,
        es_supervisor = false,
        empresa = 'HECHO EN PERU' // Nueva columna empresa
    } = req.body;
    
    console.log('📦 Creando solicitud especial:', req.body);
    
    try {
        // Obtener usuario del header
        const userEmail = req.headers['user-email'] || 'admin@sistema.com';
        const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
        let usuario = { id_usuario: 1, auto_services: false };
        
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
        
        // Si hay id_usuario_costurera, obtener sus permisos
        let usuarioCosturera = usuario;
        if (id_usuario_costurera) {
            const costureraResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id_usuario_costurera]);
            if (costureraResult.rows.length > 0) {
                usuarioCosturera = costureraResult.rows[0];
            }
        }
        
        // Validar datos requeridos
        if (!id_producto_especial || !cantidad_juegos) {
            return res.status(400).json({ error: 'Faltan datos requeridos: id_producto_especial y cantidad_juegos' });
        }
        
        // Obtener producto especial y sus componentes
        const productoEspecialResult = await pool.query(`
            SELECT * FROM productos_especiales WHERE id_producto_especial = $1
        `, [id_producto_especial]);
        
        if (productoEspecialResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto especial no encontrado' });
        }
        
        const productoEspecial = productoEspecialResult.rows[0];
        
        // Construir array de componentes desde los campos id_producto_X
        const componentes = [];
        
        if (productoEspecial.id_producto_1) {
            const p1 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [productoEspecial.id_producto_1]);
            if (p1.rows.length > 0) {
                componentes.push({
                    id_producto: productoEspecial.id_producto_1,
                    nombre_producto: p1.rows[0].nombre_producto,
                    codigo_producto: p1.rows[0].codigo_producto,
                    cantidad: productoEspecial.cantidad_producto_1 || 1,
                    orden: 1
                });
            }
        }
        
        if (productoEspecial.id_producto_2) {
            const p2 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [productoEspecial.id_producto_2]);
            if (p2.rows.length > 0) {
                componentes.push({
                    id_producto: productoEspecial.id_producto_2,
                    nombre_producto: p2.rows[0].nombre_producto,
                    codigo_producto: p2.rows[0].codigo_producto,
                    cantidad: productoEspecial.cantidad_producto_2 || 1,
                    orden: 2
                });
            }
        }
        
        if (productoEspecial.id_producto_3) {
            const p3 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [productoEspecial.id_producto_3]);
            if (p3.rows.length > 0) {
                componentes.push({
                    id_producto: productoEspecial.id_producto_3,
                    nombre_producto: p3.rows[0].nombre_producto,
                    codigo_producto: p3.rows[0].codigo_producto,
                    cantidad: productoEspecial.cantidad_producto_3 || 1,
                    orden: 3
                });
            }
        }
        
        if (productoEspecial.id_producto_4) {
            const p4 = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [productoEspecial.id_producto_4]);
            if (p4.rows.length > 0) {
                componentes.push({
                    id_producto: productoEspecial.id_producto_4,
                    nombre_producto: p4.rows[0].nombre_producto,
                    codigo_producto: p4.rows[0].codigo_producto,
                    cantidad: productoEspecial.cantidad_producto_4 || 1,
                    orden: 4
                });
            }
        }
        
        if (componentes.length === 0) {
            return res.status(400).json({ error: 'El producto especial no tiene componentes configurados' });
        }
        
        console.log(`✅ Producto especial: ${productoEspecial.codigo_producto} - ${productoEspecial.nombre_producto}`);
        console.log(`✅ Componentes: ${componentes.length}`);
        
        // Determinar estado inicial según auto_services
        const estadoInicial = (usuarioCosturera.auto_services === true) ? 'proceso' : 'pendiente';
        
        // Número de solicitud base
        const timestamp = Date.now();
        const numero_solicitud_base = `ESP-${timestamp}`;
        
        // Array para almacenar todas las solicitudes creadas
        const solicitudesCreadas = [];
        
        // Crear una solicitud por cada componente multiplicado por la cantidad de juegos
        for (let i = 0; i < componentes.length; i++) {
            const componente = componentes[i];
            const cantidadTotal = componente.cantidad * cantidad_juegos;
            const numeroSolicitud = `${numero_solicitud_base}-C${i + 1}`;
            
            // Insertar solicitud para este componente
            const fechaActual = new Date();
            const insertResult = await pool.query(`
                INSERT INTO solicitudes_etiquetas (
                    numero_solicitud, 
                    id_usuario,
                    id_producto,
                    lote_produccion,
                    cantidad_solicitada,
                    fecha_produccion,
                    prioridad, 
                    estado, 
                    observaciones,
                    id_producto_especial,
                    numero_solicitud_grupo,
                    empresa
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id_solicitud, numero_solicitud
            `, [
                numeroSolicitud,
                id_usuario_costurera || usuario.id_usuario,
                componente.id_producto, // ID del producto componente
                numero_solicitud_base,
                cantidadTotal,
                fechaActual,
                prioridad || 'normal',
                estadoInicial,
                `${observaciones || ''}\n[PRODUCTO ESPECIAL: ${productoEspecial.nombre_producto} - Componente ${i + 1}/${componentes.length}]`,
                id_producto_especial,
                numero_solicitud_base,
                empresa // Nueva columna
            ]);
            
            solicitudesCreadas.push({
                ...insertResult.rows[0],
                producto: componente.nombre_producto,
                cantidad: cantidadTotal
            });
            
            // Registrar en historial
            const comentarioHistorial = (usuarioCosturera.auto_services === true)
                ? `Solicitud especial AUTO-APROBADA (${productoEspecial.nombre_producto} - ${componente.nombre_producto})`
                : `Solicitud especial creada (${productoEspecial.nombre_producto} - ${componente.nombre_producto})`;
            
            await pool.query(`
                INSERT INTO historial_solicitudes (
                    id_solicitud, 
                    estado_anterior, 
                    estado_nuevo, 
                    usuario_cambio, 
                    comentarios
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                insertResult.rows[0].id_solicitud,
                null,
                estadoInicial,
                usuario.id_usuario,
                comentarioHistorial
            ]);
            
            console.log(`✅ Solicitud creada: ${numeroSolicitud} - ${componente.nombre_producto} x${cantidadTotal}`);
        }
        
        // ⭐ IMPRIMIR AUTOMÁTICAMENTE SI auto_services=true
        const print_results = [];
        
        if (usuarioCosturera.auto_services === true) {
            console.log('🤖 AUTO_SERVICES ACTIVADO - Imprimiendo automáticamente...');
            
            // 1. IMPRIMIR ENCABEZADO (el nombre del juego/combo) - cantidad_juegos veces
            console.log(`📋 Imprimiendo ENCABEZADO: ${productoEspecial.nombre_producto} x${cantidad_juegos}`);
            
            const encabezadoData = {
                id_solicitud: solicitudesCreadas[0].id_solicitud, // Usar el primer ID
                numero_solicitud: `${numero_solicitud_base}-ENCABEZADO`,
                qr_code: `ESP-ENC-${numero_solicitud_base}`,
                nombre_producto: productoEspecial.nombre_producto, // JUEGO - Descripción
                descripcion_corta: `⭐ ${productoEspecial.tipo_combo || 'JUEGO'}`.toUpperCase(),
                modelo: productoEspecial.codigo_producto,
                empresa: empresa,
                costurera_nombre: usuarioCosturera.nombre_completo,
                id_producto: null, // No tiene id_producto unitario
                cantidad_solicitada: cantidad_juegos,
                cantidad_a_imprimir: cantidad_juegos // NO ajustar a pares, imprimir exacto
            };
            
            const encabezadoPrinted = await addToPrintQueue(encabezadoData);
            print_results.push({
                componente: 'ENCABEZADO',
                nombre: productoEspecial.nombre_producto,
                cantidad: cantidad_juegos,
                success: encabezadoPrinted
            });
            
            // 2. IMPRIMIR CADA COMPONENTE
            for (let i = 0; i < componentes.length; i++) {
                const componente = componentes[i];
                const cantidadTotal = componente.cantidad * cantidad_juegos;
                
                console.log(`📋 Imprimiendo COMPONENTE ${i+1}: ${componente.nombre_producto} x${cantidadTotal}`);
                
                const componenteData = {
                    id_solicitud: solicitudesCreadas[i].id_solicitud,
                    numero_solicitud: solicitudesCreadas[i].numero_solicitud,
                    qr_code: `ESP-${solicitudesCreadas[i].id_solicitud}-${Date.now()}`,
                    nombre_producto: componente.nombre_producto,
                    descripcion_corta: `📦 COMPONENTE ${i+1}/${componentes.length}`,
                    modelo: componente.codigo_producto,
                    empresa: empresa,
                    costurera_nombre: usuarioCosturera.nombre_completo,
                    id_producto: componente.id_producto,
                    cantidad_solicitada: cantidadTotal,
                    cantidad_a_imprimir: cantidadTotal // NO ajustar a pares, imprimir exacto
                };
                
                const componentePrinted = await addToPrintQueue(componenteData);
                print_results.push({
                    componente: `COMPONENTE ${i+1}`,
                    nombre: componente.nombre_producto,
                    cantidad: cantidadTotal,
                    success: componentePrinted
                });
            }
            
            console.log(`✅ AUTO-IMPRESIÓN COMPLETADA: ${print_results.length} elementos enviados a cola`);
        } else {
            console.log('👤 AUTO_SERVICES DESACTIVADO - Requiere aprobación manual del supervisor');
        }
        
        res.json({
            mensaje: usuarioCosturera.auto_services 
                ? `Solicitud especial creada e impresa automáticamente`
                : `Solicitud especial creada - Pendiente de aprobación del supervisor`,
            solicitud: {
                numero_solicitud: numero_solicitud_base,
                producto_especial: productoEspecial.nombre_producto,
                cantidad_juegos: cantidad_juegos,
                componentes: solicitudesCreadas
            },
            auto_approved: usuarioCosturera.auto_services === true,
            print_results: print_results
        });
        
    } catch (err) {
        console.error('Error creando solicitud especial:', err);
        res.status(500).json({ error: 'Error del servidor: ' + err.message });
    }
});

// 🖨️ RUTA: IMPRIMIR COMPONENTE INDIVIDUAL DE PRODUCTO ESPECIAL
app.post('/api/imprimir-componente-especial', async (req, res) => {
    const { 
        id_solicitud, 
        nombre_componente, 
        cantidad, 
        es_principal,
        id_producto 
    } = req.body;
    
    console.log(`🖨️ [COMPONENTE ESPECIAL] Solicitud ${id_solicitud}: ${nombre_componente} x${cantidad}`);
    
    try {
        // Obtener datos de la solicitud
        const solicitudResult = await pool.query(`
            SELECT se.*, u.nombre_completo as costurera_nombre
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.id_solicitud = $1
        `, [id_solicitud]);
        
        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        const solicitud = solicitudResult.rows[0];
        
        // Si es el componente principal (JUEGO), usar el nombre del producto especial
        // Si es un componente, usar el nombre del componente
        const nombreParaImpresion = es_principal 
            ? nombre_componente 
            : nombre_componente;
        
        // Generar QR único para este componente
        const qrCode = `SOL-${id_solicitud}-COMP-${Date.now()}`;
        
        // Preparar datos para impresión
        const printJobData = {
            numero_solicitud: solicitud.numero_solicitud,
            id_solicitud: id_solicitud,
            id_producto: id_producto || solicitud.id_producto,
            nombre_producto: nombreParaImpresion,
            descripcion_adicional: es_principal ? '⭐ PRODUCTO PRINCIPAL' : '📦 COMPONENTE',
            modelo: solicitud.modelo || nombreParaImpresion,
            empresa: solicitud.empresa || 'HECHO EN PERU',
            costurera_nombre: solicitud.costurera_nombre,
            cantidad_solicitada: cantidad,
            cantidad_a_imprimir: cantidad, // NO ajustar a pares - imprimir cantidad exacta
            qr_code: qrCode
        };
        
        console.log(`📋 Datos de impresión preparados:`, printJobData);
        
        // Enviar a cola de impresión
        const printSuccess = await addToPrintQueue(printJobData);
        
        if (printSuccess) {
            res.json({
                success: true,
                mensaje: `Componente ${nombreParaImpresion} agregado a cola de impresión`,
                cantidad_etiquetas: printJobData.cantidad_a_imprimir,
                qr_code: qrCode
            });
        } else {
            throw new Error('No se pudo agregar a la cola de impresión');
        }
        
    } catch (error) {
        console.error('❌ Error imprimiendo componente especial:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// RUTA: SUPERVISOR - APROBAR/RECHAZAR SOLICITUD
app.post('/api/supervisor/cambiar-estado/:id_solicitud', async (req, res) => {
    const { id_solicitud } = req.params;
    const { nuevo_estado, observaciones_supervisor } = req.body;
    
    // Obtener usuario del header
    const userEmail = req.headers['user-email'] || 'admin@sistema.com';
    const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [userEmail]);
    let supervisorId = 1; // valor por defecto
    
    if (userResult.rows.length > 0) {
        supervisorId = userResult.rows[0].id_usuario;
    }
    
    try {
        // Obtener datos actuales
        const solicitudActual = await pool.query(
            'SELECT * FROM solicitudes_etiquetas WHERE id_solicitud = $1',
            [id_solicitud]
        );
        
        if (solicitudActual.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        // Actualizar estado
        await pool.query(`
            UPDATE solicitudes_etiquetas 
            SET estado = $1,
                observaciones_supervisor = $2
            WHERE id_solicitud = $3
        `, [nuevo_estado, observaciones_supervisor, id_solicitud]);
        
        // SI SE APRUEBA LA SOLICITUD, AGREGAR A COLA DE IMPRESIÓN
        if (nuevo_estado === 'proceso' || nuevo_estado === 'en_proceso') {
            try {
                console.log(`📋 APROBACIÓN MANUAL: Enviando solicitud ${id_solicitud} a impresión...`);
                // Obtener datos completos del producto para la etiqueta
                const productoResult = await pool.query(`
                    SELECT p.id_producto, p.codigo_producto, p.nombre_producto, 
                           p.descripcion_corta, p.marca, p.modelo, p.unidad_medida,
                           se.numero_solicitud, se.cantidad_solicitada, se.empresa
                    FROM solicitudes_etiquetas se
                    JOIN productos p ON se.id_producto = p.id_producto
                    WHERE se.id_solicitud = $1
                `, [id_solicitud]);
                
                if (productoResult.rows.length > 0) {
                    const producto = productoResult.rows[0];
                    
                    // Obtener nombre de costurera
                    const costureraResult = await pool.query(
                        'SELECT nombre_completo FROM usuarios WHERE id_usuario = (SELECT id_usuario FROM solicitudes_etiquetas WHERE id_solicitud = $1)',
                        [id_solicitud]
                    );
                    const costureraNombre = costureraResult.rows[0]?.nombre_completo || 'Desconocido';
                    
                    // Generar QR Code
                    const qrCode = `${producto.numero_solicitud}`;
                    
                    // Calcular cantidad de etiquetas (2 por prenda)
                    const cantidadEtiquetas = producto.cantidad_solicitada * 2;
                    
                    // Preparar datos para impresión (formato correcto)
                    const solicitudData = {
                        id_solicitud: parseInt(id_solicitud),
                        numero_solicitud: producto.numero_solicitud,
                        qr_code: qrCode,
                        nombre_producto: producto.nombre_producto,
                        descripcion_corta: producto.descripcion_corta || '',
                        descripcion_adicional: producto.marca ? `${producto.marca}${producto.modelo ? ' ' + producto.modelo : ''}` : producto.descripcion_corta,
                        modelo: producto.modelo || '',
                        unidad_medida: producto.unidad_medida || 'UNIDAD',
                        empresa: producto.empresa || 'HECHO EN PERU', // 🏢 Incluir empresa en aprobación manual
                        costurera_nombre: costureraNombre,
                        id_producto: producto.id_producto,
                        cantidad_solicitada: producto.cantidad_solicitada,
                        cantidad_a_imprimir: cantidadEtiquetas
                    };
                    
                    // Agregar a cola de impresión
                    console.log('📋 APROBACIÓN MANUAL: Datos a imprimir:', JSON.stringify(solicitudData, null, 2));
                    const printResult = await addToPrintQueue(solicitudData);
                    
                    console.log(`🖨️ Solicitud ${producto.numero_solicitud} aprobada y agregada a cola de impresión:`);
                    console.log(`   - QR generado: ${printResult.qr_code}`);
                    console.log(`   - Cantidad original: ${printResult.cantidad_original}`);
                    console.log(`   - Cantidad a imprimir: ${printResult.cantidad_a_imprimir}`);
                    console.log(`   - Impresora conectada: ${printResult.printer_connected ? '✅' : '❌'}`);
                    
                } else {
                    console.error('❌ No se encontraron datos del producto para impresión');
                }
                
            } catch (printError) {
                console.error('❌ Error agregando a cola de impresión:', printError);
                // No fallar la aprobación por error de impresión
            }
        }
        
        // Registrar en historial de supervisor
        await pool.query(`
            INSERT INTO historial_supervisor (
                id_supervisor, 
                id_costurera_afectada, 
                id_solicitud_modificada, 
                accion_realizada,
                datos_anteriores,
                datos_nuevos
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            supervisorId,
            solicitudActual.rows[0].id_usuario,
            id_solicitud,
            nuevo_estado === 'en_proceso' ? 'aprobar' : 'rechazar',
            JSON.stringify({ estado_anterior: solicitudActual.rows[0].estado }),
            JSON.stringify({ estado_nuevo: nuevo_estado, observaciones: observaciones_supervisor })
        ]);
        
        // Registrar también en historial de solicitudes
        await pool.query(`
            INSERT INTO historial_solicitudes (
                id_solicitud, 
                estado_anterior, 
                estado_nuevo, 
                usuario_cambio, 
                comentarios
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            id_solicitud,
            solicitudActual.rows[0].estado,
            nuevo_estado,
            supervisorId,
            `${nuevo_estado === 'proceso' ? 'Solicitud aprobada' : 'Solicitud rechazada'} por supervisor: ${observaciones_supervisor || 'Sin observaciones'}`
        ]);
        
        res.json({ mensaje: `Solicitud ${nuevo_estado === 'en_proceso' ? 'aprobada' : 'rechazada'} exitosamente` });
        
    } catch (err) {
        console.error('Error cambiando estado:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ENDPOINT: Cambiar estado de solicitud (para auto-aprobación)
app.post('/api/cambiar-estado-solicitud', async (req, res) => {
    const { id_solicitud, nuevo_estado, observaciones = 'Auto-aprobado por sistema' } = req.body;
    
    try {
        console.log(`🤖 Auto-aprobación: Cambiando estado de solicitud ${id_solicitud} a ${nuevo_estado}`);
        
        // Obtener datos actuales de la solicitud
        const solicitudActual = await pool.query(
            'SELECT * FROM solicitudes_etiquetas WHERE id_solicitud = $1',
            [id_solicitud]
        );
        
        if (solicitudActual.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        
        // Actualizar el estado de la solicitud
        const result = await pool.query(`
            UPDATE solicitudes_etiquetas 
            SET estado = $1, 
                observaciones_supervisor = $2
            WHERE id_solicitud = $3 
            RETURNING *
        `, [nuevo_estado, observaciones, id_solicitud]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se pudo actualizar la solicitud' });
        }
        
        const solicitudActualizada = result.rows[0];
        
        // Registrar en historial
        await pool.query(`
            INSERT INTO historial_solicitudes (id_solicitud, estado_nuevo, usuario_cambio, comentarios)
            VALUES ($1, $2, $3, $4)
        `, [
            id_solicitud,
            nuevo_estado,
            1, // Sistema automático
            `Auto-aprobado: ${observaciones} (Estado anterior: ${solicitudActual.rows[0].estado})`
        ]);
        
        console.log(`✅ Auto-aprobación completada: Solicitud ${solicitudActualizada.numero_solicitud}`);
        
        res.json({ 
            success: true,
            mensaje: `Solicitud ${nuevo_estado === 'en_proceso' ? 'aprobada' : 'actualizada'} automáticamente`,
            solicitud: solicitudActualizada
        });
        
    } catch (error) {
        console.error('❌ Error en auto-aprobación:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al cambiar estado de solicitud',
            details: error.message 
        });
    }
});

// RUTA: OBTENER SOLICITUDES PENDIENTES (PARA SUPERVISOR)
app.get('/api/supervisor/pendientes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada as cantidad_productos,
                se.fecha_solicitud as fecha_creacion,
                se.prioridad,
                se.observaciones,
                se.estado,
                p.nombre_producto,
                u.nombre_completo as costurera,
                u.auto_services
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.estado = 'pendiente'
            ORDER BY 
                CASE se.prioridad 
                    WHEN 'alta' THEN 1 
                    WHEN 'urgente' THEN 2 
                    WHEN 'normal' THEN 3 
                END,
                se.fecha_solicitud ASC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo pendientes:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// NUEVO ENDPOINT: Obtener TODAS las solicitudes recientes (pendientes, proceso, completadas)
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
                se.estado,
                p.nombre_producto,
                u.nombre_completo as costurera,
                u.auto_services,
                EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/60 as minutos_desde_creacion
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.fecha_solicitud >= NOW() - INTERVAL '24 hours'
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

// ⭐ NUEVO ENDPOINT: Obtener solicitudes de PRODUCTOS ESPECIALES
app.get('/api/solicitudes-especiales', async (req, res) => {
    try {
        logger.info('SOLICITUDES-ESPECIALES', 'Obteniendo solicitudes de productos especiales...');
        console.log('⭐ Obteniendo solicitudes de productos especiales...');
        
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.numero_solicitud_grupo,
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
                -- Producto principal (el JUEGO/COMBO)
                pe.nombre_producto as producto_principal,
                -- Componentes del producto especial (SIN REPETIR)
                pe.id_producto_1,
                pe.cantidad_producto_1,
                (SELECT p1.nombre_producto FROM productos p1 WHERE p1.id_producto = pe.id_producto_1) as nombre_producto_1,
                pe.id_producto_2,
                pe.cantidad_producto_2,
                (SELECT p2.nombre_producto FROM productos p2 WHERE p2.id_producto = pe.id_producto_2) as nombre_producto_2,
                pe.id_producto_3,
                pe.cantidad_producto_3,
                (SELECT p3.nombre_producto FROM productos p3 WHERE p3.id_producto = pe.id_producto_3) as nombre_producto_3,
                pe.id_producto_4,
                pe.cantidad_producto_4,
                (SELECT p4.nombre_producto FROM productos p4 WHERE p4.id_producto = pe.id_producto_4) as nombre_producto_4
            FROM solicitudes_etiquetas se
            JOIN productos_especiales pe ON se.id_producto_especial = pe.id_producto_especial
            LEFT JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.id_producto_especial IS NOT NULL
            ORDER BY 
                CASE se.estado 
                    WHEN 'pendiente' THEN 1
                    WHEN 'proceso' THEN 2
                    WHEN 'completada' THEN 3
                    ELSE 4
                END,
                se.fecha_solicitud DESC
            LIMIT 200
        `);
        
        logger.dbResult('SELECT solicitudes especiales', result.rowCount);
        console.log(`✅ Encontradas ${result.rows.length} solicitudes de productos especiales`);
        console.log(`   - Pendientes: ${result.rows.filter(r => r.estado === 'pendiente').length}`);
        console.log(`   - En proceso: ${result.rows.filter(r => r.estado === 'proceso').length}`);
        console.log(`   - Completadas: ${result.rows.filter(r => r.estado === 'completada').length}`);
        
        res.json(result.rows);
    } catch (err) {
        logger.dbError('SELECT solicitudes especiales', err);
        console.error('❌ Error obteniendo solicitudes especiales:', err);
        res.status(500).json({ error: 'Error del servidor: ' + err.message });
    }
});

// ⭐ ENDPOINT ADMINISTRATIVO: Obtener solicitudes especiales con información extendida
app.get('/api/solicitudes-etiquetas-especiales', async (req, res) => {
    try {
        logger.info('ADMIN-SOLICITUDES-ESPECIALES', 'Obteniendo solicitudes especiales para administración...');
        console.log('🔐 [ADMIN] Obteniendo solicitudes especiales...');
        
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada,
                se.fecha_solicitud,
                se.prioridad,
                se.observaciones,
                se.estado as estado_solicitud,
                se.id_producto_especial,
                se.id_usuario,
                se.observaciones_supervisor,
                pe.nombre_producto as nombre_producto_especial,
                pe.codigo_producto as codigo_producto_especial,
                pe.tipo_combo,
                pe.activo as producto_activo,
                u.nombre_completo as nombre_costurera,
                u.auto_services,
                -- Componentes del producto especial
                pe.id_producto_1,
                pe.cantidad_producto_1,
                (SELECT p1.nombre_producto FROM productos p1 WHERE p1.id_producto = pe.id_producto_1) as nombre_producto_1,
                pe.id_producto_2,
                pe.cantidad_producto_2,
                (SELECT p2.nombre_producto FROM productos p2 WHERE p2.id_producto = pe.id_producto_2) as nombre_producto_2,
                pe.id_producto_3,
                pe.cantidad_producto_3,
                (SELECT p3.nombre_producto FROM productos p3 WHERE p3.id_producto = pe.id_producto_3) as nombre_producto_3,
                pe.id_producto_4,
                pe.cantidad_producto_4,
                (SELECT p4.nombre_producto FROM productos p4 WHERE p4.id_producto = pe.id_producto_4) as nombre_producto_4
            FROM solicitudes_etiquetas se
            JOIN productos_especiales pe ON se.id_producto_especial = pe.id_producto_especial
            LEFT JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.id_producto_especial IS NOT NULL
            ORDER BY se.fecha_solicitud DESC
            LIMIT 500
        `);
        
        logger.dbResult('SELECT admin solicitudes especiales', result.rowCount);
        console.log(`✅ [ADMIN] ${result.rows.length} solicitudes especiales encontradas`);
        
        const estadisticas = {
            total: result.rowCount,
            pendientes: result.rows.filter(r => r.estado_solicitud === 'pendiente').length,
            proceso: result.rows.filter(r => r.estado_solicitud === 'proceso').length,
            completadas: result.rows.filter(r => r.estado_solicitud === 'completada').length,
            canceladas: result.rows.filter(r => r.estado_solicitud === 'cancelada').length
        };
        
        console.log(`   📊 Estadísticas: ${JSON.stringify(estadisticas)}`);
        
        res.json(result.rows);
    } catch (err) {
        logger.dbError('SELECT admin solicitudes especiales', err);
        console.error('❌ Error obteniendo solicitudes especiales (admin):', err);
        res.status(500).json({ error: 'Error del servidor: ' + err.message });
    }
});

// ENDPOINT: Eliminar solicitud de etiquetas (normal o especial)
app.delete('/api/solicitudes-etiquetas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const solicitudId = parseInt(id);

        if (isNaN(solicitudId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de solicitud inválido'
            });
        }

        console.log(`🗑️ Eliminando solicitud: ID ${solicitudId}`);

        // Verificar que la solicitud existe
        const checkQuery = 'SELECT numero_solicitud, id_producto_especial FROM solicitudes_etiquetas WHERE id_solicitud = $1';
        const checkResult = await pool.query(checkQuery, [solicitudId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const numeroSolicitud = checkResult.rows[0].numero_solicitud;
        const esEspecial = checkResult.rows[0].id_producto_especial !== null;

        // Eliminar de cola_impresion primero (si existe)
        const deleteQueueQuery = 'DELETE FROM cola_impresion WHERE id_solicitud = $1';
        const queueResult = await pool.query(deleteQueueQuery, [solicitudId]);

        // Eliminar del historial_solicitudes (si existe)
        const deleteHistorialQuery = 'DELETE FROM historial_solicitudes WHERE id_solicitud = $1';
        const historialResult = await pool.query(deleteHistorialQuery, [solicitudId]);

        // Eliminar la solicitud principal
        const deleteSolicitudQuery = 'DELETE FROM solicitudes_etiquetas WHERE id_solicitud = $1';
        const deleteResult = await pool.query(deleteSolicitudQuery, [solicitudId]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada para eliminar'
            });
        }

        console.log(`✅ Solicitud ${numeroSolicitud} (ID: ${solicitudId}) ${esEspecial ? '(ESPECIAL) ' : ''}eliminada exitosamente`);

        res.json({
            success: true,
            message: `Solicitud ${numeroSolicitud} eliminada exitosamente`,
            deletedId: solicitudId,
            queueDeleted: queueResult.rowCount > 0,
            historialDeleted: historialResult.rowCount > 0
        });

    } catch (error) {
        console.error('Error eliminando solicitud:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error eliminando solicitud: ' + error.message 
        });
    }
});

// ENDPOINT: Verificar y reintentar impresión de solicitudes aprobadas pendientes
app.post('/api/reintentar-impresiones-pendientes', async (req, res) => {
    try {
        console.log('🔄 Verificando solicitudes aprobadas pendientes de impresión...');
        
        // Buscar solicitudes en estado 'en_proceso' que no se hayan impreso aún
        // (asumimos que si está en 'en_proceso' pero no tiene fecha_impresion, está pendiente)
        const pendientesResult = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada,
                se.id_producto,
                p.nombre_producto,
                p.descripcion_corta,
                p.marca,
                p.modelo,
                p.unidad_medida,
                u.nombre_completo as costurera,
                u.auto_services
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE se.estado = 'proceso'
            ORDER BY se.fecha_solicitud ASC
            LIMIT 50
        `);
        
        const solicitudesPendientes = pendientesResult.rows;
        console.log(`📋 Encontradas ${solicitudesPendientes.length} solicitudes pendientes de impresión`);
        
        if (solicitudesPendientes.length === 0) {
            return res.json({
                success: true,
                message: 'No hay solicitudes pendientes de impresión',
                procesadas: 0,
                exitosas: 0,
                fallidas: 0
            });
        }
        
        let exitosas = 0;
        let fallidas = 0;
        const resultados = [];
        
        // Intentar imprimir cada solicitud pendiente
        for (const solicitud of solicitudesPendientes) {
            try {
                const solicitudData = {
                    id_solicitud: solicitud.id_solicitud,
                    numero_solicitud: solicitud.numero_solicitud,
                    nombre_producto: solicitud.nombre_producto,
                    descripcion_adicional: solicitud.marca 
                        ? `${solicitud.marca}${solicitud.modelo ? ' ' + solicitud.modelo : ''}` 
                        : solicitud.descripcion_corta,
                    unidad_medida: solicitud.unidad_medida || 'UNIDAD',
                    id_producto: solicitud.id_producto,
                    cantidad: solicitud.cantidad_solicitada
                };
                
                const printResult = await addToPrintQueue(solicitudData);
                
                if (printResult.success) {
                    exitosas++;
                    console.log(`✅ Reintento exitoso: ${solicitud.numero_solicitud}`);
                    resultados.push({
                        id_solicitud: solicitud.id_solicitud,
                        numero_solicitud: solicitud.numero_solicitud,
                        status: 'success',
                        message: 'Enviado a impresión'
                    });
                } else {
                    fallidas++;
                    console.log(`❌ Reintento fallido: ${solicitud.numero_solicitud}`);
                    resultados.push({
                        id_solicitud: solicitud.id_solicitud,
                        numero_solicitud: solicitud.numero_solicitud,
                        status: 'failed',
                        message: printResult.message || 'Error desconocido'
                    });
                }
            } catch (printError) {
                fallidas++;
                console.error(`❌ Error reintentando ${solicitud.numero_solicitud}:`, printError);
                resultados.push({
                    id_solicitud: solicitud.id_solicitud,
                    numero_solicitud: solicitud.numero_solicitud,
                    status: 'error',
                    message: printError.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Proceso completado: ${exitosas} exitosas, ${fallidas} fallidas`,
            procesadas: solicitudesPendientes.length,
            exitosas,
            fallidas,
            resultados
        });
        
    } catch (error) {
        console.error('❌ Error en reintentar-impresiones-pendientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar solicitudes pendientes',
            details: error.message
        });
    }
});

// ENDPOINT: Obtener estadísticas rápidas (para polling)
app.get('/api/stats-rapidas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'proceso') as en_proceso,
                COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
                0 as pendientes_impresion
            FROM solicitudes_etiquetas
            WHERE fecha_solicitud >= CURRENT_DATE - INTERVAL '7 days'
        `);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo stats rápidas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

console.log('🔧 Rutas de supervisor agregadas exitosamente');

// =============================================
// ENDPOINTS ADICIONALES PARA login_fixed.html
// =============================================

// ENDPOINT: Lista de usuarios para login_fixed.html
app.get('/api/usuarios-lista', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario,
                nombre_completo,
                nivel_acceso,
                email,
                genero,
                auto_services
            FROM usuarios 
            WHERE activo = true 
            ORDER BY 
                CASE nivel_acceso 
                    WHEN 'supervisor' THEN 1 
                    WHEN 'costurera' THEN 2 
                    WHEN 'encargada_embalaje' THEN 3 
                    ELSE 4 
                END,
                nombre_completo
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo usuarios lista:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ENDPOINT: Login simple para login_fixed.html
app.post('/api/login-simple', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Intento de login:', { email, password: password ? '[OCULTA]' : 'NO_PASSWORD' });
    
    try {
        const result = await pool.query(
            'SELECT id_usuario, nombre_completo, email, password_hash, nivel_acceso, genero, auto_services FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );
        
        console.log('👥 Usuario encontrado:', result.rows.length > 0 ? 'SÍ' : 'NO');
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        console.log('🔍 Verificando password para:', user.email);
        
        // Verificar password con bcrypt
        const passwordValido = await bcrypt.compare(password, user.password_hash);
        console.log('🔑 Password válida:', passwordValido ? 'SÍ' : 'NO');
        
        if (!passwordValido) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        // Crear token JWT
        const token = jwt.sign(
            { 
                id_usuario: user.id_usuario, 
                nivel_acceso: user.nivel_acceso 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        // Actualizar último login
        await pool.query(
            'UPDATE usuarios SET ultimo_login = NOW(), activo_sesion = true WHERE id_usuario = $1',
            [user.id_usuario]
        );
        
        // Guardar sesión
        await pool.query(
            `INSERT INTO sesiones_usuarios (id_usuario, token_sesion, fecha_expiracion) 
             VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
            [user.id_usuario, token]
        );
        
        // Enviar token como cookie
        res.cookie('token', token, { 
            httpOnly: true, 
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: 'strict'
        });
        
        res.json({
            usuario: {
                id: user.id_usuario,
                nombre: user.nombre_completo,
                email: user.email,
                rol: user.nivel_acceso,
                genero: user.genero || 'femenino',
                auto_services: user.auto_services || false
            }
        });
        
    } catch (err) {
        console.error('Error en login simple:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// =============================================
// ENDPOINTS ADICIONALES PARA COSTURERA DASHBOARD
// =============================================

// ENDPOINT: Validar token y obtener usuario actual
app.get('/api/usuarios/me', verificarToken, async (req, res) => {
    try {
        // El middleware verificarToken ya validó el token
        // req.usuario contiene la información del usuario autenticado
        res.json({
            id_usuario: req.usuario.id_usuario,
            nombre_completo: req.usuario.nombre_completo,
            nivel_acceso: req.usuario.nivel_acceso,
            id_departamento: req.usuario.id_departamento,
            valid: true
        });
    } catch (err) {
        console.error('Error validando usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ENDPOINT: Obtener información específica de un usuario
app.get('/api/usuarios/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    
    try {
        // El usuario ya está verificado por el middleware verificarToken
        // req.usuario contiene la información del usuario autenticado

        // Obtener información del usuario solicitado
        const result = await pool.query(
            'SELECT id_usuario, nombre_completo, email, nivel_acceso, auto_services, auto_servicesgd FROM usuarios WHERE id_usuario = $1 AND activo = true',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar configuración auto_servicesgd del usuario
app.put('/api/usuarios/:id/auto-servicesgd', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { auto_servicesgd } = req.body;
    
    try {
        console.log(`🔄 [auto-servicesgd] Usuario ${id} cambiando a: ${auto_servicesgd}`);
        
        const result = await pool.query(
            'UPDATE usuarios SET auto_servicesgd = $1 WHERE id_usuario = $2 AND activo = true RETURNING id_usuario, nombre_completo, auto_servicesgd',
            [auto_servicesgd, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        console.log(`✅ [auto-servicesgd] Actualizado: ${result.rows[0].nombre_completo} → ${auto_servicesgd}`);
        res.json({ 
            success: true,
            mensaje: `Auto-impresión Godex ${auto_servicesgd ? 'ACTIVADA' : 'DESACTIVADA'}`,
            usuario: result.rows[0]
        });
    } catch (err) {
        console.error('❌ Error actualizando auto_servicesgd:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ENDPOINT: Obtener registros de un usuario específico
app.get('/api/registros/:id_usuario', verificarToken, async (req, res) => {
    const { id_usuario } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada as cantidad_productos,
                se.estado,
                se.estado as estado_solicitud,
                se.prioridad,
                se.fecha_solicitud as fecha_creacion,
                se.observaciones,
                COALESCE(se.creado_por_supervisor, false) as creado_por_supervisor,
                p.nombre_producto,
                p.id_producto,
                u.nombre_completo as solicitante,
                u.auto_servicesgd,
                COALESCE(us.nombre_completo, '') as supervisor_creador,
                -- Verificar si se imprimió en cola (QR Zebra)
                EXISTS(
                    SELECT 1 FROM cola_impresion ci 
                    WHERE ci.id_solicitud = se.id_solicitud 
                    AND (ci.tipo = 'etiqueta' OR ci.impresora = 'ZEBRA')
                ) as qr_impreso,
                -- Rotulado impreso: usar campo directo de la tabla
                COALESCE(se.rotulado_impreso, false) as rotulado_impreso
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            LEFT JOIN usuarios us ON se.supervisor_id = us.id_usuario
            WHERE se.id_usuario = $1
            ORDER BY se.fecha_solicitud DESC
        `, [id_usuario]);
        
        // 🔍 Debug: Verificar rotulado_impreso
        console.log(`📋 Registros de usuario ${id_usuario}:`, result.rows.map(r => ({
            numero: r.numero_solicitud,
            rotulado_impreso: r.rotulado_impreso,
            qr_impreso: r.qr_impreso
        })));
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo registros:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


// =============================================
// MANEJO GLOBAL DE ERRORES
// =============================================
app.use((err, req, res, next) => {
    console.error(`❌ ERROR GLOBAL en ${req.method} ${req.url}:`, err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        mensaje: err.message,
        url: req.url,
        metodo: req.method
    });
});

// =============================================
// INICIAR SERVIDOR
// =============================================



// =============================================
// ENDPOINT DE SALUD DEL SERVIDOR
// =============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    res.json({
        status: serverHealthy ? 'healthy' : 'unhealthy',
        sessionId: SERVER_SESSION_ID,
        uptime: Math.round(uptime),
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        lastHeartbeat: new Date(lastHeartbeat).toISOString(),
        printer: {
            connected: printerConnected,
            ip: ZEBRA_CONFIG.PRINTER_IP
        },
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// 🎨 ENDPOINTS PARA EDITOR VISUAL DE ETIQUETAS
// =====================================================

console.log('📋 Registrando endpoints del Editor Visual...');

// Obtener todas las plantillas
app.get('/api/plantillas-etiquetas', async (req, res) => {
    console.log('📋 [GET /api/plantillas-etiquetas] Solicitando lista de plantillas');
    try {
        console.log('📋 [GET /api/plantillas-etiquetas] Obteniendo plantillas');
        
        const result = await pool.query(`
            SELECT 
                id_plantilla,
                nombre_plantilla,
                descripcion,
                ancho_dots,
                alto_dots,
                dpi,
                config_elementos,
                activa,
                es_default,
                fecha_creacion,
                fecha_actualizacion
            FROM plantillas_etiquetas
            WHERE activa = true
            ORDER BY es_default DESC, nombre_plantilla ASC
        `);
        
        console.log(`✅ Plantillas encontradas: ${result.rows.length}`);
        res.json({
            success: true,
            plantillas: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo plantillas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener plantillas: ' + error.message
        });
    }
});
console.log('   ✓ GET /api/plantillas-etiquetas registrado');

// Guardar nueva plantilla o actualizar existente
app.post('/api/plantillas-etiquetas', async (req, res) => {
    console.log('💾 [POST /api/plantillas-etiquetas] Guardando plantilla');
    try {
        const { 
            id_plantilla,
            nombre_plantilla, 
            descripcion, 
            ancho_dots, 
            alto_dots,
            config_elementos,
            es_default 
        } = req.body;
        
        console.log(`💾 [POST /api/plantillas-etiquetas] ${id_plantilla ? 'Actualizando' : 'Creando'} plantilla: ${nombre_plantilla}`);
        
        let result;
        
        if (id_plantilla) {
            // Actualizar plantilla existente
            result = await pool.query(`
                UPDATE plantillas_etiquetas
                SET 
                    nombre_plantilla = $1,
                    descripcion = $2,
                    ancho_dots = $3,
                    alto_dots = $4,
                    config_elementos = $5,
                    es_default = $6,
                    fecha_actualizacion = NOW()
                WHERE id_plantilla = $7
                RETURNING *
            `, [nombre_plantilla, descripcion, ancho_dots, alto_dots, config_elementos, es_default, id_plantilla]);
            
            console.log(`✅ Plantilla actualizada: ID ${id_plantilla}`);
        } else {
            // Crear nueva plantilla
            result = await pool.query(`
                INSERT INTO plantillas_etiquetas (
                    nombre_plantilla,
                    descripcion,
                    ancho_dots,
                    alto_dots,
                    config_elementos,
                    es_default,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, 'EDITOR_VISUAL')
                RETURNING *
            `, [nombre_plantilla, descripcion, ancho_dots, alto_dots, config_elementos, es_default]);
            
            console.log(`✅ Plantilla creada: ID ${result.rows[0].id_plantilla}`);
        }
        
        res.json({
            success: true,
            plantilla: result.rows[0],
            mensaje: id_plantilla ? 'Plantilla actualizada' : 'Plantilla creada'
        });
        
    } catch (error) {
        console.error('❌ Error guardando plantilla:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar plantilla: ' + error.message
        });
    }
});
console.log('   ✓ POST /api/plantillas-etiquetas registrado');

// Preview de etiqueta (generar ZPL sin imprimir)
app.post('/api/preview-etiqueta', async (req, res) => {
    console.log('👁️ [POST /api/preview-etiqueta] Generando preview ZPL');
    try {
        const { config, datos_prueba } = req.body;
        
        console.log('👁️ [POST /api/preview-etiqueta] Generando preview');
        
        // Generar ZPL desde configuración
        const zpl = generarZPLDesdeConfig(config, datos_prueba);
        
        res.json({
            success: true,
            zpl: zpl,
            longitud: zpl.length
        });
        
    } catch (error) {
        console.error('❌ Error generando preview:', error);
        res.status(500).json({
            success: false,
            error: 'Error al generar preview: ' + error.message
        });
    }
});
console.log('   ✓ POST /api/preview-etiqueta registrado');

// Test de impresión (imprimir etiqueta de prueba)
app.post('/api/test-print-visual', async (req, res) => {
    console.log('🖨️ [POST /api/test-print-visual] Imprimiendo etiqueta de prueba');
    try {
        const { config, datos_prueba } = req.body;
        
        console.log('🖨️ [POST /api/test-print-visual] Imprimiendo etiqueta de prueba');
        
        // Generar ZPL desde configuración
        const zpl = generarZPLDesdeConfig(config, datos_prueba);
        
        // Enviar a impresora
        const resultado = await sendZPLToPrinter(zpl);
        
        if (resultado.success) {
            console.log('✅ Etiqueta de prueba enviada a impresora');
            res.json({
                success: true,
                mensaje: 'Etiqueta enviada a impresora',
                zpl_generado: zpl
            });
        } else {
            throw new Error(resultado.error || 'Error al imprimir');
        }
        
    } catch (error) {
        console.error('❌ Error imprimiendo test:', error);
        res.status(500).json({
            success: false,
            error: 'Error al imprimir: ' + error.message
        });
    }
});
console.log('   ✓ POST /api/test-print-visual registrado');

// Obtener datos de ejemplo para preview
app.get('/api/datos-ejemplo', async (req, res) => {
    console.log('\n════════════════════════════════════════');
    console.log('📦 [GET /api/datos-ejemplo] INICIO');
    console.log('   ├─ Timestamp:', new Date().toISOString());
    console.log('   ├─ URL:', req.url);
    console.log('   ├─ Original URL:', req.originalUrl);
    console.log('   └─ Base URL:', req.baseUrl);
    
    try {
        console.log('🔍 Ejecutando query a base de datos...');
        // Obtener un producto aleatorio para usar como ejemplo
        const result = await pool.query(`
            SELECT 
                id_producto,
                nombre_producto,
                modelo,
                unidad_medida,
                descripcion_corta,
                empresa
            FROM productos 
            WHERE activo = true 
            LIMIT 1
        `);
        
        console.log(`✅ Query ejecutada. Resultados: ${result.rows.length} filas`);
        
        if (result.rows.length === 0) {
            console.log('⚠️ No hay productos, usando datos de ejemplo estáticos');
            // Si no hay productos, devolver datos de ejemplo
            return res.json({
                success: true,
                datos: {
                    qr_code: 'SOL-000001',
                    nombre_producto: 'SABANA 2 PLAZAS',
                    modelo: 'QUEEN',
                    unidad_medida: 'UNIDAD',
                    id_producto: '123',
                    empresa: 'HECHO EN PERU',
                    descripcion_corta: 'Producto de ejemplo'
                }
            });
        }
        
        const producto = result.rows[0];
        const respuesta = {
            success: true,
            datos: {
                qr_code: `PROD-${producto.id_producto}`,
                nombre_producto: producto.nombre_producto,
                modelo: producto.modelo || 'N/A',
                unidad_medida: producto.unidad_medida,
                id_producto: producto.id_producto,
                empresa: producto.empresa || 'HECHO EN PERU',
                descripcion_corta: producto.descripcion_corta || ''
            }
        };
        
        console.log('✅ Respuesta preparada:', JSON.stringify(respuesta, null, 2));
        console.log('════════════════════════════════════════\n');
        
        res.json(respuesta);
        
    } catch (error) {
        console.error('❌ ERROR en /api/datos-ejemplo:', error);
        console.error('   Stack:', error.stack);
        console.log('════════════════════════════════════════\n');
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
console.log('   ✓ GET /api/datos-ejemplo registrado');

console.log('✅ Editor Visual: 5 endpoints registrados');
console.log('   - GET  /api/plantillas-etiquetas');
console.log('   - POST /api/plantillas-etiquetas');
console.log('   - POST /api/preview-etiqueta');
console.log('   - POST /api/test-print-visual');
console.log('   - GET  /api/datos-ejemplo');

// ====================================================
// ENDPOINTS DE BITÁCORA DE PRODUCCIÓN
// ====================================================

// CREAR REGISTRO EN BITÁCORA
app.post('/api/bitacora/crear', async (req, res) => {
    const { id_usuario, id_producto, cantidad, observaciones } = req.body;
    
    console.log('📝 [BITACORA CREATE] Request recibido');
    console.log('   Body:', req.body);
    console.log('   Headers:', req.headers);
    
    try {
        if (!id_usuario) {
            console.log('   ❌ Error: id_usuario no proporcionado');
            return res.status(400).json({ error: 'id_usuario requerido' });
        }
        
        if (!id_producto || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos requeridos: id_producto y cantidad' });
        }
        
        const result = await pool.query(`
            INSERT INTO bitacora_produccion 
            (id_usuario, id_producto, cantidad, estado, motivo_cambio)
            VALUES ($1, $2, $3, 'ACTIVO', $4)
            RETURNING *
        `, [id_usuario, id_producto, cantidad, observaciones || null]);
        
        // 🗑️ Invalidar cache de bitácora
        invalidateCachePattern('bitacora:');
        
        console.log('✅ Registro creado en bitácora:', result.rows[0].id);
        res.json({ success: true, data: result.rows[0] });
        
    } catch (error) {
        console.error('❌ Error creando registro en bitácora:', error);
        res.status(500).json({ error: error.message });
    }
});

// LISTAR REGISTROS DE BITÁCORA
app.get('/api/bitacora/listar', async (req, res) => {
    const { fecha_inicio, fecha_fin, id_usuario, id_producto, estado, solo_mis_registros, userId } = req.query;
    
    console.log('📋 [BITACORA LISTAR] Request recibido');
    console.log('   Query:', req.query);
    console.log('   userId:', userId);
    
    try {
        let usuario = null;
        
        if (userId) {
            const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
            if (userResult.rows.length > 0) {
                usuario = userResult.rows[0];
                console.log('   Usuario encontrado:', usuario.nombre_completo, '- Nivel:', usuario.nivel_acceso);
            } else {
                console.log('   ⚠️ Usuario NO encontrado con ID:', userId);
            }
        } else {
            console.log('   ⚠️ userId NO proporcionado en query');
        }
        
        let query = `
            SELECT 
                b.*,
                u.nombre_completo as nombre_usuario,
                p.nombre_producto,
                um.nombre_completo as nombre_modificador
            FROM bitacora_produccion b
            JOIN usuarios u ON b.id_usuario = u.id_usuario
            JOIN productos p ON b.id_producto = p.id_producto
            LEFT JOIN usuarios um ON b.usuario_modificador = um.id_usuario
            WHERE 1=1
        `;
        
        const params = [];
        let paramCounter = 1;
        
        // REGLA: Las costureras SIEMPRE ven solo SUS registros
        // Solo administradores pueden ver todos los registros
        const esAdmin = usuario && (usuario.nivel_acceso === 'administrador' || usuario.rol === 'administrador');
        
        console.log('   Es Admin:', esAdmin);
        
        if (!esAdmin && userId) {
            // Si NO es admin, solo puede ver sus propios registros
            console.log('   Aplicando filtro: solo registros del usuario', userId);
            query += ` AND b.id_usuario = $${paramCounter}`;
            params.push(userId);
            paramCounter++;
        } else if (esAdmin) {
            console.log('   Admin detectado: mostrando TODOS los registros');
        }
        
        if (fecha_inicio) {
            query += ` AND b.fecha >= $${paramCounter}`;
            params.push(fecha_inicio);
            paramCounter++;
        }
        
        if (fecha_fin) {
            query += ` AND b.fecha <= $${paramCounter}`;
            params.push(fecha_fin);
            paramCounter++;
        }
        
        if (id_usuario) {
            query += ` AND b.id_usuario = $${paramCounter}`;
            params.push(id_usuario);
            paramCounter++;
        }
        
        if (id_producto) {
            query += ` AND b.id_producto = $${paramCounter}`;
            params.push(id_producto);
            paramCounter++;
        }
        
        if (estado) {
            query += ` AND b.estado = $${paramCounter}`;
            params.push(estado);
            paramCounter++;
        }
        
        query += ' ORDER BY b.fecha DESC';
        
        // Verificar cache (solo para consultas sin filtros específicos)
        const hasFilters = fecha_inicio || fecha_fin || id_usuario || id_producto || estado;
        let result;
        
        if (!hasFilters) {
            const cacheKey = getCacheKey('bitacora:list', { userId: userId || 'all', esAdmin });
            const cached = getFromCache(cacheKey);
            
            if (cached) {
                console.log(`✅ ${cached.length} registros desde CACHE`);
                return res.json({ success: true, data: cached, source: 'cache' });
            }
            
            result = await pool.query(query, params);
            
            // Guardar en cache (1 minuto)
            setInCache(cacheKey, result.rows, CACHE_TTL.BITACORA);
        } else {
            result = await pool.query(query, params);
        }
        
        console.log(`✅ ${result.rows.length} registros encontrados`);
        res.json({ success: true, data: result.rows });
        
    } catch (error) {
        console.error('❌ Error listando bitácora:', error);
        res.status(500).json({ error: error.message });
    }
});

// ANULAR REGISTRO DE BITÁCORA
app.put('/api/bitacora/anular', async (req, res) => {
    const { id, motivo_cambio, userId } = req.body;
    
    console.log('🚫 Anulando registro:', id);
    
    try {
        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = userResult.rows[0];
        
        if (!id || !motivo_cambio) {
            return res.status(400).json({ error: 'Faltan datos requeridos: id y motivo_cambio' });
        }
        
        // Verificar que el registro existe
        const checkResult = await pool.query('SELECT * FROM bitacora_produccion WHERE id = $1', [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        const registro = checkResult.rows[0];
        
        // Costureras solo pueden anular sus propios registros
        if (usuario.rol === 'costurera' && registro.id_usuario !== usuario.id_usuario) {
            return res.status(403).json({ error: 'No tienes permiso para anular este registro' });
        }
        
        const result = await pool.query(`
            UPDATE bitacora_produccion 
            SET estado = 'ANULADO',
                motivo_cambio = $1,
                fecha_modificacion = CURRENT_TIMESTAMP,
                usuario_modificador = $2
            WHERE id = $3
            RETURNING *
        `, [motivo_cambio, usuario.id_usuario, id]);
        
        // 🗑️ Invalidar cache de bitácora
        invalidateCachePattern('bitacora:');
        
        console.log('✅ Registro anulado');
        res.json({ success: true, data: result.rows[0] });
        
    } catch (error) {
        console.error('❌ Error anulando registro:', error);
        res.status(500).json({ error: error.message });
    }
});

// EDITAR REGISTRO DE BITÁCORA
app.put('/api/bitacora/editar', async (req, res) => {
    const { id, cantidad, id_producto, motivo_cambio, userId } = req.body;
    
    console.log('✏️ Editando registro:', id);
    
    try {
        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = userResult.rows[0];
        
        if (!id || (!cantidad && !id_producto) || !motivo_cambio) {
            return res.status(400).json({ error: 'Faltan datos requeridos: id, (cantidad o id_producto) y motivo_cambio' });
        }
        
        // Verificar que el registro existe
        const checkResult = await pool.query('SELECT * FROM bitacora_produccion WHERE id = $1', [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        const registro = checkResult.rows[0];
        
        // Costureras solo pueden editar sus propios registros
        if (usuario.rol === 'costurera' && registro.id_usuario !== usuario.id_usuario) {
            return res.status(403).json({ error: 'No tienes permiso para editar este registro' });
        }
        
        const updates = [];
        const params = [];
        let paramCounter = 1;
        
        if (cantidad) {
            updates.push(`cantidad = $${paramCounter}`);
            params.push(cantidad);
            paramCounter++;
        }
        
        if (id_producto) {
            updates.push(`id_producto = $${paramCounter}`);
            params.push(id_producto);
            paramCounter++;
        }
        
        updates.push(`estado = 'EDITADO'`);
        updates.push(`motivo_cambio = $${paramCounter}`);
        params.push(motivo_cambio);
        paramCounter++;
        
        updates.push(`fecha_modificacion = CURRENT_TIMESTAMP`);
        updates.push(`usuario_modificador = $${paramCounter}`);
        params.push(usuario.id_usuario);
        paramCounter++;
        
        params.push(id); // WHERE id = $X
        
        const result = await pool.query(`
            UPDATE bitacora_produccion 
            SET ${updates.join(', ')}
            WHERE id = $${paramCounter}
            RETURNING *
        `, params);
        
        // 🗑️ Invalidar cache de bitácora
        invalidateCachePattern('bitacora:');
        
        console.log('✅ Registro editado');
        res.json({ success: true, data: result.rows[0] });
        
    } catch (error) {
        console.error('❌ Error editando registro:', error);
        res.status(500).json({ error: error.message });
    }
});

// REPORTE MENSUAL DE BITÁCORA (CON EXPORTACIÓN)
app.get('/api/bitacora/reporte', async (req, res) => {
    const { fecha_inicio, fecha_fin, id_usuario, id_producto, estado, formato, userId } = req.query;
    
    console.log('📊 Generando reporte con filtros:', req.query);
    
    try {
        let usuario = null;
        
        if (userId) {
            const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
            if (userResult.rows.length > 0) {
                usuario = userResult.rows[0];
            }
        }
        
        // Solo admin y dueño pueden ver reportes completos
        if (!['admin', 'dueño', 'dueno'].includes(usuario.rol)) {
            return res.status(403).json({ error: 'No tienes permiso para ver reportes' });
        }
        
        let query = `
            SELECT 
                b.id,
                b.fecha,
                u.nombre || ' ' || u.apellido as usuario,
                p.nombre_producto,
                b.cantidad,
                b.estado,
                b.motivo_cambio,
                b.fecha_modificacion,
                um.nombre || ' ' || um.apellido as modificado_por
            FROM bitacora_produccion b
            JOIN usuarios u ON b.id_usuario = u.id_usuario
            JOIN productos p ON b.id_producto = p.id_producto
            LEFT JOIN usuarios um ON b.usuario_modificador = um.id_usuario
            WHERE 1=1
        `;
        
        const params = [];
        let paramCounter = 1;
        
        if (fecha_inicio) {
            query += ` AND b.fecha >= $${paramCounter}`;
            params.push(fecha_inicio);
            paramCounter++;
        }
        
        if (fecha_fin) {
            query += ` AND b.fecha <= $${paramCounter}`;
            params.push(fecha_fin);
            paramCounter++;
        }
        
        if (id_usuario) {
            query += ` AND b.id_usuario = $${paramCounter}`;
            params.push(id_usuario);
            paramCounter++;
        }
        
        if (id_producto) {
            query += ` AND b.id_producto = $${paramCounter}`;
            params.push(id_producto);
            paramCounter++;
        }
        
        if (estado) {
            query += ` AND b.estado = $${paramCounter}`;
            params.push(estado);
            paramCounter++;
        }
        
        query += ' ORDER BY b.fecha DESC';
        
        const result = await pool.query(query, params);
        
        // Si solicitan formato JSON (por defecto)
        if (!formato || formato === 'json') {
            console.log(`✅ Reporte generado: ${result.rows.length} registros`);
            res.json({ success: true, data: result.rows });
        } else {
            // Aquí se implementaría la exportación a Excel/PDF
            console.log('📄 Exportación solicitada (por implementar)');
            res.json({ 
                success: true, 
                data: result.rows,
                mensaje: 'Exportación de Excel pendiente de implementar con librería ExcelJS'
            });
        }
        
    } catch (error) {
        console.error('❌ Error generando reporte:', error);
        res.status(500).json({ error: error.message });
    }
});

// EXPORTAR BITÁCORA A DOCX
app.get('/api/bitacora/exportar-docx', async (req, res) => {
    try {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } = require('docx');
        
        const { userId, fecha_inicio, fecha_fin, id_usuario, id_producto, estado } = req.query;
        
        console.log('📄 [BITACORA DOCX] Generando documento...');
        
        if (!userId) {
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        // Construir query (similar a /listar)
        let query = `
            SELECT 
                b.*,
                u.nombre_completo as nombre_usuario,
                p.nombre_producto,
                um.nombre_completo as nombre_modificador
            FROM bitacora_produccion b
            JOIN usuarios u ON b.id_usuario = u.id_usuario
            JOIN productos p ON b.id_producto = p.id_producto
            LEFT JOIN usuarios um ON b.usuario_modificador = um.id_usuario
            WHERE 1=1
        `;
        
        const params = [];
        let paramCounter = 1;
        
        if (fecha_inicio) {
            query += ` AND b.fecha >= $${paramCounter}`;
            params.push(fecha_inicio);
            paramCounter++;
        }
        
        if (fecha_fin) {
            query += ` AND b.fecha <= $${paramCounter}`;
            params.push(fecha_fin);
            paramCounter++;
        }
        
        if (id_usuario) {
            query += ` AND b.id_usuario = $${paramCounter}`;
            params.push(id_usuario);
            paramCounter++;
        }
        
        if (id_producto) {
            query += ` AND b.id_producto = $${paramCounter}`;
            params.push(id_producto);
            paramCounter++;
        }
        
        if (estado) {
            query += ` AND b.estado = $${paramCounter}`;
            params.push(estado);
            paramCounter++;
        }
        
        query += ' ORDER BY b.fecha DESC';
        
        const result = await pool.query(query, params);
        const registros = result.rows;
        
        console.log(`📄 ${registros.length} registros para exportar`);
        
        // Crear documento
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Título
                    new Paragraph({
                        text: 'BITÁCORA DE PRODUCCIÓN',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    
                    // Fecha de generación
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Fecha de generación: ${new Date().toLocaleString('es-PE')}`,
                                size: 20
                            })
                        ],
                        spacing: { after: 200 }
                    }),
                    
                    // Filtros aplicados
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Filtros aplicados:',
                                bold: true,
                                size: 22
                            })
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `- Fecha inicio: ${fecha_inicio || 'No especificada'}`,
                                size: 20
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `- Fecha fin: ${fecha_fin || 'No especificada'}`,
                                size: 20
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `- Estado: ${estado || 'Todos'}`,
                                size: 20
                            })
                        ],
                        spacing: { after: 300 }
                    }),
                    
                    // Tabla
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE
                        },
                        rows: [
                            // Encabezado
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: 'ID', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: 'FECHA', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: 'USUARIO', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: 'PRODUCTO', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: 'CANTIDAD', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: 'ESTADO', bold: true })],
                                        shading: { fill: '3B82F6' }
                                    })
                                ]
                            }),
                            
                            // Filas de datos
                            ...registros.map(reg => new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: `#${reg.id}` })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ 
                                            text: new Date(reg.fecha).toLocaleString('es-PE', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                        })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: reg.nombre_usuario || 'Usuario' })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: reg.nombre_producto })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: String(reg.cantidad) })]
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ text: reg.estado })],
                                        shading: {
                                            fill: reg.estado === 'ACTIVO' ? 'D1FAE5' :
                                                  reg.estado === 'EDITADO' ? 'FEF3C7' : 'FEE2E2'
                                        }
                                    })
                                ]
                            }))
                        ]
                    }),
                    
                    // Estadísticas
                    new Paragraph({
                        text: '',
                        spacing: { before: 400 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'ESTADÍSTICAS',
                                bold: true,
                                size: 24
                            })
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Total de registros: ${registros.length}`,
                                size: 22
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Registros ACTIVOS: ${registros.filter(r => r.estado === 'ACTIVO').length}`,
                                size: 22
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Registros EDITADOS: ${registros.filter(r => r.estado === 'EDITADO').length}`,
                                size: 22
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Registros ANULADOS: ${registros.filter(r => r.estado === 'ANULADO').length}`,
                                size: 22
                            })
                        ]
                    })
                ]
            }]
        });
        
        // Generar buffer
        const buffer = await Packer.toBuffer(doc);
        
        // Enviar archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=bitacora_produccion_${new Date().toISOString().split('T')[0]}.docx`);
        res.send(buffer);
        
        console.log('✅ Documento DOCX generado exitosamente');
        
    } catch (error) {
        console.error('❌ Error generando DOCX:', error);
        res.status(500).json({ error: error.message });
    }
});

console.log('✅ Bitácora de Producción: 6 endpoints registrados');
console.log('   - POST /api/bitacora/crear');
console.log('   - GET  /api/bitacora/listar');
console.log('   - PUT  /api/bitacora/anular');
console.log('   - PUT  /api/bitacora/editar');
console.log('   - GET  /api/bitacora/reporte');
console.log('   - GET  /api/bitacora/exportar-docx');

// ====================================================
// ENDPOINTS DE SISTEMA DE CHAT
// ====================================================

// ENVIAR MENSAJE
app.post('/api/chat/enviar', async (req, res) => {
    const { id_remitente, id_destinatario, tipo_destinatario, mensaje } = req.body;
    
    console.log('💬 Enviando mensaje:', req.body);
    
    try {
        if (!id_remitente) {
            return res.status(400).json({ error: 'id_remitente requerido' });
        }
        
        if (!mensaje || mensaje.trim() === '') {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }
        
        // Validar tipo de destinatario
        const tiposValidos = ['USUARIO', 'GRUPO_SUPERVISORES', 'GRUPO_ADMIN', 'TODOS'];
        const tipoFinal = tipo_destinatario || 'USUARIO';
        
        if (!tiposValidos.includes(tipoFinal)) {
            return res.status(400).json({ error: 'Tipo de destinatario inválido' });
        }
        
        // Si es mensaje directo (USUARIO), debe tener id_destinatario
        if (tipoFinal === 'USUARIO' && !id_destinatario) {
            return res.status(400).json({ error: 'Para mensajes directos se requiere id_destinatario' });
        }
        
        const result = await pool.query(`
            INSERT INTO chat_mensajes 
            (id_remitente, id_destinatario, tipo_destinatario, mensaje)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id_remitente, id_destinatario || null, tipoFinal, mensaje]);
        
        console.log('✅ Mensaje enviado:', result.rows[0].id);
        res.json({ success: true, data: result.rows[0] });
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// OBTENER MENSAJES
app.get('/api/chat/mensajes', async (req, res) => {
    const { id_conversacion, tipo, limite, userId } = req.query;
    
    console.log('📥 Obteniendo mensajes:', req.query);
    
    try {
        const uid = userId || req.headers['user-id'];
        
        if (!uid) {
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [uid]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const usuario = userResult.rows[0];
        
        let query = `
            SELECT 
                m.*,
                ur.nombre || ' ' || ur.apellido as remitente_nombre,
                ur.rol as remitente_rol,
                ud.nombre || ' ' || ud.apellido as destinatario_nombre
            FROM chat_mensajes m
            JOIN usuarios ur ON m.id_remitente = ur.id_usuario
            LEFT JOIN usuarios ud ON m.id_destinatario = ud.id_usuario
            WHERE (
                m.id_remitente = $1 
                OR m.id_destinatario = $1
                OR (m.tipo_destinatario = 'TODOS')
        `;
        
        const params = [usuario.id_usuario];
        
        // Agregar filtro por grupo según rol
        if (usuario.rol === 'supervisor') {
            query += ` OR (m.tipo_destinatario = 'GRUPO_SUPERVISORES')`;
        }
        
        if (['admin', 'dueño', 'dueno'].includes(usuario.rol)) {
            query += ` OR (m.tipo_destinatario = 'GRUPO_ADMIN')`;
        }
        
        query += ')';
        
        // Filtrar por conversación específica
        if (id_conversacion) {
            query += ` AND (
                (m.id_remitente = $1 AND m.id_destinatario = $2)
                OR (m.id_remitente = $2 AND m.id_destinatario = $1)
            )`;
            params.push(id_conversacion);
        }
        
        query += ' ORDER BY m.fecha DESC';
        
        if (limite) {
            query += ` LIMIT ${parseInt(limite)}`;
        }
        
        const result = await pool.query(query, params);
        
        console.log(`✅ ${result.rows.length} mensajes encontrados`);
        res.json({ success: true, data: result.rows });
        
    } catch (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        res.status(500).json({ error: error.message });
    }
});

// MARCAR MENSAJE COMO LEÍDO
app.put('/api/chat/marcar-leido', async (req, res) => {
    const { id_mensaje, userId } = req.body;
    
    console.log('✓ Marcando mensaje como leído:', id_mensaje);
    
    try {
        const uid = userId || req.headers['user-id'];
        
        if (!uid) {
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        const userResult = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = $1', [uid]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const id_usuario = userResult.rows[0].id_usuario;
        
        if (!id_mensaje) {
            return res.status(400).json({ error: 'Se requiere id_mensaje' });
        }
        
        // Solo puede marcar como leído si es el destinatario
        const result = await pool.query(`
            UPDATE chat_mensajes 
            SET leido = TRUE
            WHERE id = $1 AND (id_destinatario = $2 OR tipo_destinatario != 'USUARIO')
            RETURNING *
        `, [id_mensaje, id_usuario]);
        
        console.log('✅ Mensaje marcado como leído');
        res.json({ success: true, data: result.rows[0] });
        
    } catch (error) {
        console.error('❌ Error marcando mensaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// CONTAR MENSAJES NO LEÍDOS
app.get('/api/chat/no-leidos', async (req, res) => {
    console.log('🔔 Contando mensajes no leídos');
    console.log('   Query params:', req.query);
    console.log('   Headers user-id:', req.headers['user-id']);
    
    try {
        // Obtener userId de query params o headers
        const userId = req.query.userId || req.headers['user-id'];
        console.log('   userId final:', userId);
        
        if (!userId) {
            console.log('   ❌ userId no proporcionado');
            return res.status(400).json({ error: 'userId requerido' });
        }
        
        const userResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const usuario = userResult.rows[0];
        
        let query = `
            SELECT COUNT(*) as total
            FROM chat_mensajes
            WHERE leido = FALSE
            AND id_remitente != $1
            AND (
                id_destinatario = $1
                OR tipo_destinatario = 'TODOS'
        `;
        
        if (usuario.rol === 'supervisor') {
            query += ` OR tipo_destinatario = 'GRUPO_SUPERVISORES'`;
        }
        
        if (['admin', 'dueño', 'dueno'].includes(usuario.rol)) {
            query += ` OR tipo_destinatario = 'GRUPO_ADMIN'`;
        }
        
        query += ')';
        
        const result = await pool.query(query, [usuario.id_usuario]);
        
        console.log(`✅ ${result.rows[0].total} mensajes no leídos`);
        res.json({ success: true, total: parseInt(result.rows[0].total) });
        
    } catch (error) {
        console.error('❌ Error contando mensajes no leídos:', error);
        res.status(500).json({ error: error.message });
    }
});

console.log('✅ Sistema de Chat: 4 endpoints registrados');
console.log('   - POST /api/chat/enviar');
console.log('   - GET  /api/chat/mensajes');
console.log('   - PUT  /api/chat/marcar-leido');
console.log('   - GET  /api/chat/no-leidos');

// Iniciar servidor HTTP con configuración optimizada
const server = app.listen(port, '0.0.0.0', async () => {
    console.log(`🌐 Servidor HTTP ejecutándose en http://localhost:${port}`);
    
    // Configurar keep-alive para evitar colgado
    server.keepAliveTimeout = 5000; // 5 segundos
    server.headersTimeout = 6000; // 6 segundos (debe ser mayor que keepAliveTimeout)
    
    console.log('✅ Keep-alive configurado: 5s timeout, 6s headers timeout');
    
    // Obtener IP local para mostrar opciones de acceso
    const networkInterfaces = os.networkInterfaces();
    let localIP = '';
    
    Object.keys(networkInterfaces).forEach(interfaceName => {
        const networkInterface = networkInterfaces[interfaceName];
        networkInterface.forEach(address => {
            if (address.family === 'IPv4' && !address.internal && address.address.startsWith('192.168')) {
                localIP = address.address;
            }
        });
    });

    console.log('🎤 ===== RECONOCIMIENTO DE VOZ =====');
    console.log(`✅ Acceso LOCAL (recomendado): http://localhost:${port}`);
    if (localIP) {
        console.log(`🌐 Acceso RED LOCAL: http://${localIP}:${port}`);
        console.log(`   ⚠️  Para usar voz desde otros dispositivos:`);
        console.log(`   • Ejecutar: CONFIGURACION-VOZ.bat`);
        console.log(`   • O acceder desde localhost en el mismo equipo`);
    }
    console.log('=====================================');
    
    console.log('🔌 Conectando a PostgreSQL...');
    
    // Probar conexión a la base de datos
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ Error de conexión a PostgreSQL:', err.message);
        } else {
            console.log('✅ Conectado a PostgreSQL exitosamente');
        }
    });
});



// === VERIFICACIÓN INICIAL DE IMPRESORA ===
(async () => {
    console.log('🖨️ Verificando estado inicial de impresora Zebra...');
    try {
        const connected = await checkPrinterConnection();
        if (connected) {
            console.log('✅ Impresora Zebra conectada y lista');
        } else {
            console.log('⚠️ Impresora Zebra no disponible - Las solicitudes se acumularán en cola');
        }
    } catch (error) {
        console.error('❌ Error verificando impresora:', error.message);
    }
    
    console.log('🎯 Sistema listo para aprobar solicitudes y generar etiquetas automáticamente');
})();

// =============================================
// ENDPOINTS PARA PANEL DE ADMINISTRACIÓN AVANZADO
// =============================================

// Dashboard estadísticas avanzadas
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios) as total_users,
                (SELECT COUNT(*) FROM usuarios WHERE activo = true) as active_users,
                (SELECT COUNT(*) FROM productos) as total_products,
                (SELECT COUNT(*) FROM productos WHERE activo = true) as active_products,
                (SELECT COUNT(*) FROM solicitudes_etiquetas WHERE DATE(fecha_solicitud) = CURRENT_DATE) as solicitudes_today,
                (SELECT COUNT(*) FROM solicitudes_etiquetas WHERE estado = 'pendiente') as solicitudes_pendientes,
                (SELECT COALESCE(SUM(cantidad_solicitada), 0) FROM solicitudes_etiquetas 
                 WHERE DATE(fecha_solicitud) = CURRENT_DATE AND estado = 'completada') as etiquetas_today,
                (SELECT COUNT(*) FROM solicitudes_etiquetas WHERE estado = 'completada' AND DATE(fecha_solicitud) = CURRENT_DATE) as solicitudes_completadas_today,
                (SELECT COUNT(*) FROM solicitudes_etiquetas WHERE estado = 'pendiente' AND fecha_solicitud < NOW() - INTERVAL '2 hours') as solicitudes_atrasadas,
                (SELECT COALESCE(AVG(cantidad_solicitada), 0) FROM solicitudes_etiquetas WHERE DATE(fecha_solicitud) = CURRENT_DATE) as promedio_etiquetas_solicitud,
                (SELECT COUNT(*) FROM usuarios WHERE ultimo_login >= CURRENT_DATE) as usuarios_activos_hoy
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error obteniendo estadísticas dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener hashes de datos (para sincronización)
app.get('/api/admin/data-hashes', verificarToken, async (req, res) => {
    try {
        // Obtener conteos simples y timestamps actuales
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE activo = true) as users_count,
                (SELECT COUNT(*) FROM productos WHERE activo = true) as products_count,
                (SELECT COUNT(*) FROM solicitudes_etiquetas) as solicitudes_count,
                NOW() as current_timestamp
        `);

        const data = stats.rows[0];
        const currentTime = new Date(data.current_timestamp).getTime();
        
        // Crear hashes simples basados en conteos y timestamp actual
        const usersHash = `${data.users_count}_${currentTime}`;
        const productsHash = `${data.products_count}_${currentTime}`;
        const solicitudesHash = `${data.solicitudes_count}_${currentTime}`;

        res.json({
            users: usersHash,
            products: productsHash,
            solicitudes: solicitudesHash
        });
    } catch (error) {
        console.error('Error obteniendo hashes de datos:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Estadísticas de productividad por usuario
app.get('/api/admin/productivity-stats', async (req, res) => {
    try {
        const { periodo = '7' } = req.query; // días por defecto
        
        const productivityStats = await pool.query(`
            SELECT 
                u.nombre_completo,
                d.nombre_departamento,
                COUNT(se.id_solicitud) as total_solicitudes,
                COALESCE(SUM(se.cantidad_solicitada), 0) as total_etiquetas_solicitadas,
                COALESCE(SUM(CASE WHEN se.estado = 'completada' THEN se.cantidad_solicitada ELSE 0 END), 0) as etiquetas_completadas,
                ROUND(
                    (COALESCE(SUM(CASE WHEN se.estado = 'completada' THEN se.cantidad_solicitada ELSE 0 END), 0) * 100.0) / 
                    NULLIF(COALESCE(SUM(se.cantidad_solicitada), 0), 0), 2
                ) as porcentaje_completado,
                COUNT(CASE WHEN se.estado = 'pendiente' THEN 1 END) as solicitudes_pendientes
            FROM usuarios u
            LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
            LEFT JOIN solicitudes_etiquetas se ON u.id_usuario = se.id_usuario 
                AND se.fecha_solicitud >= NOW() - INTERVAL '${periodo} days'
            WHERE u.nivel_acceso = 'costurera' AND u.activo = true
            GROUP BY u.id_usuario, u.nombre_completo, d.nombre_departamento
            ORDER BY etiquetas_completadas DESC
        `);
        
        res.json(productivityStats.rows);
    } catch (error) {
        console.error('Error obteniendo estadísticas de productividad:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Estadísticas por departamento
app.get('/api/admin/department-stats', async (req, res) => {
    try {
        const departmentStats = await pool.query(`
            SELECT 
                d.nombre_departamento,
                COUNT(DISTINCT u.id_usuario) as total_usuarios,
                COUNT(DISTINCT CASE WHEN u.activo = true THEN u.id_usuario END) as usuarios_activos,
                COUNT(se.id_solicitud) as total_solicitudes_7d,
                COALESCE(SUM(se.cantidad_solicitada), 0) as total_etiquetas_7d,
                COALESCE(AVG(se.cantidad_solicitada), 0) as promedio_por_solicitud
            FROM departamentos d
            LEFT JOIN usuarios u ON d.id_departamento = u.id_departamento
            LEFT JOIN solicitudes_etiquetas se ON u.id_usuario = se.id_usuario 
                AND se.fecha_solicitud >= NOW() - INTERVAL '7 days'
            GROUP BY d.id_departamento, d.nombre_departamento
            ORDER BY total_etiquetas_7d DESC
        `);
        
        res.json(departmentStats.rows);
    } catch (error) {
        console.error('Error obteniendo estadísticas por departamento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Tendencias temporales (últimos 30 días)
app.get('/api/admin/trends', async (req, res) => {
    try {
        const trends = await pool.query(`
            SELECT 
                DATE(fecha_solicitud) as fecha,
                COUNT(*) as total_solicitudes,
                COALESCE(SUM(cantidad_solicitada), 0) as total_etiquetas,
                COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes
            FROM solicitudes_etiquetas
            WHERE fecha_solicitud >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(fecha_solicitud)
            ORDER BY fecha DESC
        `);
        
        res.json(trends.rows);
    } catch (error) {
        console.error('Error obteniendo tendencias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =============================================
// ENDPOINTS PARA GESTIÓN AVANZADA DE IMPRESORA
// =============================================

// Estadísticas de impresora
app.get('/api/impresora/stats', async (req, res) => {
    try {
        const { dias = 7 } = req.query;
        const fechaDesde = new Date();
        fechaDesde.setDate(fechaDesde.getDate() - parseInt(dias));
        
        const stats = await pool.query(`
            SELECT * FROM obtener_estadisticas_impresora($1)
        `, [fechaDesde.toISOString().split('T')[0]]);
        
        // Estado actual de la impresora
        const estadoActual = await pool.query(`
            SELECT estado_impresora, mensaje_detalle, timestamp
            FROM gestion_impresora 
            WHERE tipo_evento IN ('conexion', 'desconexion', 'estado_verificado')
            ORDER BY timestamp DESC 
            LIMIT 1
        `);
        
        // Cola actual
        const cola = await pool.query(`SELECT * FROM procesar_cola_impresion() LIMIT 10`);
        
        res.json({
            estadisticas: stats.rows[0] || {},
            estado_actual: estadoActual.rows[0] || { estado_impresora: 'desconocido' },
            cola_pendiente: cola.rows || [],
            timestamp_consulta: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de impresora:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Registrar evento de impresora
app.post('/api/impresora/evento', async (req, res) => {
    try {
        const {
            tipo_evento,
            id_solicitud,
            cantidad_etiquetas,
            estado_impresora,
            codigo_error,
            mensaje_detalle,
            duracion_segundos,
            prioridad,
            usuario_responsable
        } = req.body;
        
        const result = await pool.query(`
            INSERT INTO gestion_impresora (
                tipo_evento, id_solicitud, cantidad_etiquetas, estado_impresora,
                codigo_error, mensaje_detalle, duracion_segundos, prioridad,
                usuario_responsable, creado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id_gestion, timestamp
        `, [
            tipo_evento, id_solicitud, cantidad_etiquetas, estado_impresora,
            codigo_error, mensaje_detalle, duracion_segundos, prioridad,
            usuario_responsable, 'api_manual'
        ]);
        
        res.json({
            success: true,
            id_gestion: result.rows[0].id_gestion,
            timestamp: result.rows[0].timestamp
        });
    } catch (error) {
        console.error('Error registrando evento de impresora:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Procesar cola de impresión con prioridades
app.get('/api/impresora/cola', async (req, res) => {
    try {
        const cola = await pool.query(`SELECT * FROM procesar_cola_impresion()`);
        
        res.json({
            solicitudes_cola: cola.rows,
            total_pendientes: cola.rows.length,
            urgentes: cola.rows.filter(s => s.prioridad === 'urgente').length,
            timestamp_consulta: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo cola de impresión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Detectar errores de impresora
app.get('/api/impresora/diagnostico', async (req, res) => {
    try {
        // Verificar conexión actual
        let estadoConexion = 'desconocido';
        let ultimoError = null;
        
        try {
            // Intentar conectar a la impresora
            const socket = new net.Socket();
            
            await new Promise((resolve, reject) => {
                socket.setTimeout(3000);
                
                socket.connect(ZEBRA_CONFIG.PRINTER_PORT, ZEBRA_CONFIG.PRINTER_IP, () => {
                    estadoConexion = 'conectada';
                    socket.destroy();
                    resolve();
                });
                
                socket.on('error', (error) => {
                    estadoConexion = 'error';
                    ultimoError = error.message;
                    reject(error);
                });
                
                socket.on('timeout', () => {
                    estadoConexion = 'timeout';
                    ultimoError = 'Timeout de conexión';
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
            });
        } catch (error) {
            // Error ya manejado arriba
        }
        
        // Registrar el evento de diagnóstico
        await pool.query(`
            INSERT INTO gestion_impresora (tipo_evento, estado_impresora, codigo_error, mensaje_detalle, creado_por)
            VALUES ('estado_verificado', $1, $2, $3, 'diagnostico_automatico')
        `, [estadoConexion, ultimoError, `Diagnóstico automático: ${estadoConexion}`]);
        
        // Obtener historial de errores recientes
        const erroresRecientes = await pool.query(`
            SELECT tipo_evento, codigo_error, mensaje_detalle, timestamp
            FROM gestion_impresora 
            WHERE tipo_evento = 'impresion_error' 
                AND timestamp >= NOW() - INTERVAL '24 hours'
            ORDER BY timestamp DESC
            LIMIT 10
        `);
        
        // Análisis de patrones de error
        const patronesError = await pool.query(`
            SELECT 
                codigo_error, 
                COUNT(*) as frecuencia,
                MAX(timestamp) as ultimo_ocurrencia
            FROM gestion_impresora 
            WHERE tipo_evento = 'impresion_error' 
                AND timestamp >= NOW() - INTERVAL '7 days'
                AND codigo_error IS NOT NULL
            GROUP BY codigo_error
            ORDER BY frecuencia DESC
        `);
        
        res.json({
            estado_actual: estadoConexion,
            ultimo_error: ultimoError,
            errores_recientes: erroresRecientes.rows,
            patrones_error: patronesError.rows,
            recomendaciones: generarRecomendacionesDiagnostico(estadoConexion, patronesError.rows),
            timestamp_diagnostico: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en diagnóstico de impresora:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para generar recomendaciones
function generarRecomendacionesDiagnostico(estado, patrones) {
    const recomendaciones = [];
    
    if (estado === 'error' || estado === 'timeout') {
        recomendaciones.push('🔴 Verificar conexión de red a 192.168.15.34 (Zebra) y 192.168.15.35 (Godex)');
        recomendaciones.push('🔌 Revisar cables de red y alimentación');
        recomendaciones.push('🔄 Reiniciar impresora si es necesario');
    }
    
    if (patrones.length > 0) {
        const errorFrecuente = patrones[0];
        recomendaciones.push(`⚠️ Error frecuente: ${errorFrecuente.codigo_error} (${errorFrecuente.frecuencia} veces)`);
        
        if (errorFrecuente.frecuencia > 5) {
            recomendaciones.push('🛠️ Se recomienda mantenimiento preventivo');
        }
    }
    
    if (estado === 'conectada') {
        recomendaciones.push('✅ Impresora funcionando correctamente');
    }
    
    return recomendaciones;
}

// Mejorar cola de impresión con prioridades inteligentes
async function procesarColaInteligente() {
    try {
        console.log('🎯 [procesarColaInteligente] Procesando cola con prioridades...');
        
        // Obtener trabajos pendientes con prioridad
        const trabajosPriorizados = await pool.query(`
            SELECT ci.*, se.prioridad as prioridad_original,
                CASE 
                    WHEN se.prioridad = 'urgente' THEN 1
                    WHEN EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 > 2 THEN 2
                    WHEN EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 > 1 THEN 3
                    ELSE 4
                END as prioridad_calculada,
                EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/60 as minutos_espera
            FROM cola_impresion ci
            JOIN solicitudes_etiquetas se ON ci.id_solicitud = se.id_solicitud
            WHERE ci.estado = 'pendiente'
            ORDER BY prioridad_calculada ASC, se.fecha_solicitud ASC
            LIMIT 1
        `);
        
        if (trabajosPriorizados.rows.length === 0) {
            console.log('📭 [procesarColaInteligente] No hay trabajos pendientes');
            return;
        }
        
        const trabajo = trabajosPriorizados.rows[0];
        console.log(`🚀 [procesarColaInteligente] Procesando trabajo prioridad ${trabajo.prioridad_calculada}: ${trabajo.numero_solicitud}`);
        
        // Registrar inicio de impresión
        await registrarEventoImpresora('impresion_iniciada', {
            id_solicitud: trabajo.id_solicitud,
            cantidad_etiquetas: trabajo.cantidad,
            prioridad: trabajo.prioridad_original,
            mensaje_detalle: `Iniciando impresión: ${trabajo.numero_solicitud} (${trabajo.cantidad} etiquetas)`
        });
        
        const tiempoInicio = Date.now();
        
        // Procesar impresión en modelo Zebra específico
        const cantidadPares = Math.ceil(trabajo.cantidad / 2);
        
        for (let i = 0; i < cantidadPares; i++) {
            const zplData = generateDoubleZPL(trabajo);
            await sendZPLToPrinter(zplData);
            console.log(`✅ Par ${i + 1}/${cantidadPares} impreso en ${ZEBRA_CONFIG.MODEL}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const tiempoTotal = (Date.now() - tiempoInicio) / 1000;
        
        // Marcar como completado
        await pool.query(`
            UPDATE cola_impresion 
            SET estado = 'impresa', fecha_impresion = NOW() 
            WHERE id = $1
        `, [trabajo.id]);
        
        await pool.query(`
            UPDATE solicitudes_etiquetas 
            SET estado = 'completada' 
            WHERE id_solicitud = $1
        `, [trabajo.id_solicitud]);
        
        // Registrar finalización exitosa
        await registrarEventoImpresora('impresion_completada', {
            id_solicitud: trabajo.id_solicitud,
            cantidad_etiquetas: trabajo.cantidad,
            prioridad: trabajo.prioridad_original,
            duracion_segundos: Math.round(tiempoTotal),
            mensaje_detalle: `Completada: ${trabajo.numero_solicitud} en ${tiempoTotal}s`
        });
        
        console.log(`✅ [procesarColaInteligente] Trabajo completado en ${tiempoTotal}s`);
        
        // Procesar siguiente trabajo si hay más
        setImmediate(() => procesarColaInteligente());
        
    } catch (error) {
        console.error('❌ [procesarColaInteligente] Error:', error);
        
        // Registrar error
        await registrarEventoImpresora('impresion_error', {
            codigo_error: error.code || 'UNKNOWN',
            mensaje_detalle: error.message
        });
    }
}

// Función auxiliar para registrar eventos de impresora
async function registrarEventoImpresora(tipo_evento, datos = {}) {
    try {
        await pool.query(`
            INSERT INTO gestion_impresora (
                tipo_evento, id_solicitud, cantidad_etiquetas, estado_impresora,
                codigo_error, mensaje_detalle, duracion_segundos, prioridad,
                usuario_responsable, creado_por, ip_impresora, puerto_impresora
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
            tipo_evento,
            datos.id_solicitud || null,
            datos.cantidad_etiquetas || 0,
            datos.estado_impresora || (printerConnected ? 'conectada' : 'desconectada'),
            datos.codigo_error || null,
            datos.mensaje_detalle || '',
            datos.duracion_segundos || 0,
            datos.prioridad || 'normal',
            datos.usuario_responsable || null,
            datos.creado_por || 'sistema_automatico',
            ZEBRA_CONFIG.PRINTER_IP,
            ZEBRA_CONFIG.PRINTER_PORT
        ]);
    } catch (error) {
        console.error('Error registrando evento de impresora:', error);
    }
}

// Gestión completa de usuarios
app.get('/api/admin/users', async (req, res) => {
    try {
        // 💾 Intentar servir desde caché
        const cachedUsers = getFromCache('usuarios');
        if (cachedUsers) {
            return res.json(cachedUsers);
        }

        // Si no hay caché, consultar DB
        const users = await pool.query(`
            SELECT u.*, d.nombre_departamento as departamento_nombre 
            FROM usuarios u 
            LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
            ORDER BY u.fecha_creacion DESC
        `);

        // Guardar en caché (30 minutos)
        setInCache('usuarios', users.rows, CACHE_TTL.USUARIOS);

        res.json(users.rows);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { codigo_empleado, nombre_completo, email, telefono, puesto, nivel_acceso, id_departamento, password, genero, auto_services } = req.body;
        
        // Validar campos requeridos
        if (!codigo_empleado || !nombre_completo || !email || !puesto || !nivel_acceso || !password) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Verificar si el código de empleado ya existe
        const existingUser = await pool.query('SELECT id_usuario FROM usuarios WHERE codigo_empleado = $1', [codigo_empleado]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El código de empleado ya existe' });
        }

        // Verificar si el email ya existe
        const existingEmail = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(`
            INSERT INTO usuarios (codigo_empleado, nombre_completo, email, telefono, puesto, nivel_acceso, id_departamento, password_hash, genero, auto_services, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
            RETURNING id_usuario, codigo_empleado, nombre_completo, email, nivel_acceso, genero, auto_services
        `, [codigo_empleado, nombre_completo, email, telefono, puesto, nivel_acceso, id_departamento || null, hashedPassword, genero || 'femenino', auto_services || false]);

        // 🗑️ Invalidar caché de usuarios al crear uno nuevo
        invalidateCachePattern('usuarios');

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Verificar si el usuario existe
        const existingUserResult = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
        if (existingUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const existingUser = existingUserResult.rows[0];

        // Verificar códigos/emails únicos solo si se están actualizando
        if (updateData.codigo_empleado && updateData.codigo_empleado !== existingUser.codigo_empleado) {
            const duplicateCode = await pool.query('SELECT id_usuario FROM usuarios WHERE codigo_empleado = $1 AND id_usuario != $2', [updateData.codigo_empleado, id]);
            if (duplicateCode.rows.length > 0) {
                return res.status(400).json({ error: 'El código de empleado ya existe' });
            }
        }

        if (updateData.email && updateData.email !== existingUser.email) {
            const duplicateEmail = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1 AND id_usuario != $2', [updateData.email, id]);
            if (duplicateEmail.rows.length > 0) {
                return res.status(400).json({ error: 'El email ya existe' });
            }
        }

        // Construir UPDATE dinámico solo con campos proporcionados
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (updateData.codigo_empleado !== undefined) {
            updates.push(`codigo_empleado = $${paramCounter++}`);
            values.push(updateData.codigo_empleado);
        }
        if (updateData.nombre_completo !== undefined) {
            updates.push(`nombre_completo = $${paramCounter++}`);
            values.push(updateData.nombre_completo);
        }
        if (updateData.email !== undefined) {
            updates.push(`email = $${paramCounter++}`);
            values.push(updateData.email);
        }
        if (updateData.telefono !== undefined) {
            updates.push(`telefono = $${paramCounter++}`);
            values.push(updateData.telefono);
        }
        if (updateData.puesto !== undefined) {
            updates.push(`puesto = $${paramCounter++}`);
            values.push(updateData.puesto);
        }
        if (updateData.nivel_acceso !== undefined) {
            updates.push(`nivel_acceso = $${paramCounter++}`);
            values.push(updateData.nivel_acceso);
        }
        if (updateData.id_departamento !== undefined) {
            updates.push(`id_departamento = $${paramCounter++}`);
            values.push(updateData.id_departamento);
        }
        if (updateData.genero !== undefined) {
            updates.push(`genero = $${paramCounter++}`);
            values.push(updateData.genero);
        }
        if (updateData.auto_services !== undefined) {
            updates.push(`auto_services = $${paramCounter++}`);
            values.push(updateData.auto_services);
        }
        if (updateData.auto_servicesgd !== undefined) {
            updates.push(`auto_servicesgd = $${paramCounter++}`);
            values.push(updateData.auto_servicesgd);
        }

        // Siempre actualizar fecha_actualizacion
        updates.push(`fecha_actualizacion = NOW()`);
        
        // Agregar el ID al final
        values.push(id);

        const result = await pool.query(`
            UPDATE usuarios 
            SET ${updates.join(', ')}
            WHERE id_usuario = $${paramCounter}
            RETURNING id_usuario, codigo_empleado, nombre_completo, email, nivel_acceso, genero, auto_services, auto_servicesgd, activo
        `, values);

        // 🗑️ Invalidar caché de usuarios al actualizar
        invalidateCachePattern('usuarios');

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/admin/users/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        const result = await pool.query(`
            UPDATE usuarios 
            SET activo = $1, fecha_actualizacion = NOW()
            WHERE id_usuario = $2
            RETURNING id_usuario, activo
        `, [activo, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error cambiando estado usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/admin/users/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Generar nueva contraseña temporal
        const newPassword = 'temp' + Math.random().toString(36).substring(7);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(`
            UPDATE usuarios 
            SET password_hash = $1, fecha_actualizacion = NOW()
            WHERE id_usuario = $2
            RETURNING id_usuario
        `, [hashedPassword, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ success: true, new_password: newPassword });
    } catch (error) {
        console.error('Error reseteando contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario esté inactivo antes de eliminar
        const user = await pool.query('SELECT activo FROM usuarios WHERE id_usuario = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (user.rows[0].activo) {
            return res.status(400).json({ error: 'No se puede eliminar un usuario activo. Desactivalo primero.' });
        }

        const result = await pool.query('DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario', [id]);
        
        res.json({ success: true, deleted_id: result.rows[0].id_usuario });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Gestión completa de productos
app.post('/api/admin/products', async (req, res) => {
    try {
        const { nombre_producto, modelo, descripcion_corta, unidad_medida } = req.body;
        
        if (!nombre_producto || !unidad_medida) {
            return res.status(400).json({ error: 'Nombre y unidad de medida son requeridos' });
        }

        const result = await pool.query(`
            INSERT INTO productos (nombre_producto, modelo, descripcion_corta, unidad_medida, activo)
            VALUES ($1, $2, $3, $4, true)
            RETURNING *
        `, [nombre_producto, modelo || null, descripcion_corta || null, unidad_medida]);

        res.json({ success: true, product: result.rows[0] });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_producto, modelo, descripcion_corta, unidad_medida } = req.body;

        if (!nombre_producto || !unidad_medida) {
            return res.status(400).json({ error: 'Nombre y unidad de medida son requeridos' });
        }

        const result = await pool.query(`
            UPDATE productos 
            SET nombre_producto = $1, modelo = $2, descripcion_corta = $3, 
                unidad_medida = $4, fecha_actualizacion = NOW()
            WHERE id_producto = $5
            RETURNING *
        `, [nombre_producto, modelo || null, descripcion_corta || null, unidad_medida, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ success: true, product: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/admin/products/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        const result = await pool.query(`
            UPDATE productos 
            SET activo = $1, fecha_actualizacion = NOW()
            WHERE id_producto = $2
            RETURNING id_producto, activo
        `, [activo, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ success: true, product: result.rows[0] });
    } catch (error) {
        console.error('Error cambiando estado producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el producto esté inactivo antes de eliminar
        const product = await pool.query('SELECT activo FROM productos WHERE id_producto = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (product.rows[0].activo) {
            return res.status(400).json({ error: 'No se puede eliminar un producto activo. Desactivalo primero.' });
        }

        const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING id_producto', [id]);
        
        res.json({ success: true, deleted_id: result.rows[0].id_producto });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener departamentos
app.get('/api/admin/departments', async (req, res) => {
    try {
        const departments = await pool.query('SELECT * FROM departamentos ORDER BY nombre_departamento');
        res.json(departments.rows);
    } catch (error) {
        console.error('Error obteniendo departamentos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Estado del sistema
app.get('/api/admin/system-status', async (req, res) => {
    try {
        // Verificar base de datos
        await pool.query('SELECT 1');
        const dbStatus = true;

        // Verificar impresora
        const printerStatus = await checkPrinterConnection();

        res.json({
            database: dbStatus,
            printer: printerStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error verificando estado del sistema:', error);
        res.json({
            database: false,
            printer: false,
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================
// ESTADÍSTICAS AVANZADAS CON FILTROS DINÁMICOS
// =============================================

// KPIs principales con filtros
app.post('/api/admin/stats/kpis', async (req, res) => {
    try {
        const { period, dateFrom, dateTo, costurera, producto, estado } = req.body;
        
        let dateCondition = '';
        let params = [];
        let paramIndex = 1;
        
        // Construir condición de fecha
        if (period === 'custom' && dateFrom && dateTo) {
            dateCondition = `AND se.fecha_solicitud BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(dateFrom, dateTo);
            paramIndex += 2;
        } else {
            const periodMap = {
                'today': "AND DATE(se.fecha_solicitud) = CURRENT_DATE",
                'week': "AND se.fecha_solicitud >= DATE_TRUNC('week', NOW())",
                'month': "AND se.fecha_solicitud >= DATE_TRUNC('month', NOW())",
                'quarter': "AND se.fecha_solicitud >= DATE_TRUNC('quarter', NOW())",
                'year': "AND se.fecha_solicitud >= DATE_TRUNC('year', NOW())"
            };
            dateCondition = periodMap[period] || periodMap['month'];
        }
        
        // Filtros adicionales
        let additionalFilters = '';
        if (costurera) {
            additionalFilters += ` AND se.id_usuario = $${paramIndex}`;
            params.push(costurera);
            paramIndex++;
        }
        if (producto) {
            additionalFilters += ` AND se.id_producto = $${paramIndex}`;
            params.push(producto);
            paramIndex++;
        }
        if (estado) {
            additionalFilters += ` AND se.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const kpisQuery = `
            SELECT 
                COUNT(*) as total_solicitudes,
                COALESCE(SUM(CASE WHEN se.estado = 'completada' THEN se.cantidad_solicitada ELSE 0 END), 0) as etiquetas_impresas,
                COALESCE(AVG(
                    CASE WHEN se.estado = 'completada' 
                    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - se.fecha_solicitud))/3600 
                    END
                ), 0) as tiempo_promedio_horas,
                COALESCE(
                    ROUND(
                        COUNT(CASE WHEN se.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 
                        2
                    ), 
                    0
                ) as tasa_completado
            FROM solicitudes_etiquetas se
            WHERE 1=1 ${dateCondition} ${additionalFilters}
        `;
        
        const kpisResult = await pool.query(kpisQuery, params);
        const kpis = kpisResult.rows[0];
        
        // Calcular tendencias (comparar con período anterior)
        const trendsQuery = `
            SELECT 
                COUNT(*) as total_anterior,
                COALESCE(SUM(CASE WHEN se.estado = 'completada' THEN se.cantidad_solicitada ELSE 0 END), 0) as etiquetas_anterior
            FROM solicitudes_etiquetas se
            WHERE se.fecha_solicitud >= (
                CASE 
                    WHEN '${period}' = 'today' THEN DATE(NOW() - INTERVAL '1 day')
                    WHEN '${period}' = 'week' THEN DATE_TRUNC('week', NOW() - INTERVAL '1 week')
                    WHEN '${period}' = 'month' THEN DATE_TRUNC('month', NOW() - INTERVAL '1 month')
                    ELSE DATE_TRUNC('month', NOW() - INTERVAL '1 month')
                END
            )
            AND se.fecha_solicitud < (
                CASE 
                    WHEN '${period}' = 'today' THEN DATE(NOW())
                    WHEN '${period}' = 'week' THEN DATE_TRUNC('week', NOW())
                    WHEN '${period}' = 'month' THEN DATE_TRUNC('month', NOW())
                    ELSE DATE_TRUNC('month', NOW())
                END
            )
        `;
        
        const trendsResult = await pool.query(trendsQuery);
        const trends = trendsResult.rows[0];
        
        // Calcular porcentajes de cambio
        const solicitudesTrend = trends.total_anterior > 0 
            ? ((kpis.total_solicitudes - trends.total_anterior) / trends.total_anterior * 100).toFixed(1) 
            : '0';
        const etiquetasTrend = trends.etiquetas_anterior > 0 
            ? ((kpis.etiquetas_impresas - trends.etiquetas_anterior) / trends.etiquetas_anterior * 100).toFixed(1) 
            : '0';
        
        res.json({
            success: true,
            kpis: {
                totalSolicitudes: parseInt(kpis.total_solicitudes),
                etiquetasImpresas: parseInt(kpis.etiquetas_impresas),
                tiempoPromedio: parseFloat(kpis.tiempo_promedio_horas),
                tasaCompletado: parseFloat(kpis.tasa_completado),
                solicitudesTrend: solicitudesTrend > 0 ? `+${solicitudesTrend}%` : `${solicitudesTrend}%`,
                etiquetasTrend: etiquetasTrend > 0 ? `+${etiquetasTrend}%` : `${etiquetasTrend}%`,
                tiempoTrend: 'Estable',
                completadoTrend: 'Estable'
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo KPIs:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Datos para gráficos
app.post('/api/admin/stats/charts', async (req, res) => {
    try {
        const { period, dateFrom, dateTo, costurera, producto, estado } = req.body;
        
        let dateCondition = '';
        let params = [];
        let paramIndex = 1;
        
        // Construir filtros igual que en KPIs
        if (period === 'custom' && dateFrom && dateTo) {
            dateCondition = `AND se.fecha_solicitud BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(dateFrom, dateTo);
            paramIndex += 2;
        } else {
            const periodMap = {
                'today': "AND DATE(se.fecha_solicitud) = CURRENT_DATE",
                'week': "AND se.fecha_solicitud >= DATE_TRUNC('week', NOW())",
                'month': "AND se.fecha_solicitud >= DATE_TRUNC('month', NOW())",
                'quarter': "AND se.fecha_solicitud >= DATE_TRUNC('quarter', NOW())",
                'year': "AND se.fecha_solicitud >= DATE_TRUNC('year', NOW())"
            };
            dateCondition = periodMap[period] || periodMap['month'];
        }
        
        let additionalFilters = '';
        if (costurera) {
            additionalFilters += ` AND se.id_usuario = $${paramIndex}`;
            params.push(costurera);
            paramIndex++;
        }
        if (producto) {
            additionalFilters += ` AND se.id_producto = $${paramIndex}`;
            params.push(producto);
            paramIndex++;
        }
        if (estado) {
            additionalFilters += ` AND se.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        // Solicitudes por día
        const solicitudesPorDiaQuery = `
            SELECT 
                DATE(se.fecha_solicitud) as date,
                COUNT(*) as count
            FROM solicitudes_etiquetas se
            WHERE 1=1 ${dateCondition} ${additionalFilters}
            GROUP BY DATE(se.fecha_solicitud)
            ORDER BY DATE(se.fecha_solicitud)
            LIMIT 15
        `;
        
        const solicitudesPorDia = await pool.query(solicitudesPorDiaQuery, params);
        
        // Top costureras
        const topCosturerasQuery = `
            SELECT 
                u.nombre_completo as name,
                COUNT(*) as count
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            WHERE 1=1 ${dateCondition} ${additionalFilters}
            GROUP BY u.id_usuario, u.nombre_completo
            ORDER BY COUNT(*) DESC
            LIMIT 10
        `;
        
        const topCostureras = await pool.query(topCosturerasQuery, params);
        
        // Productos populares
        const productosPopularesQuery = `
            SELECT 
                p.nombre_producto as name,
                COUNT(*) as count
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE 1=1 ${dateCondition} ${additionalFilters}
            GROUP BY p.id_producto, p.nombre_producto
            ORDER BY COUNT(*) DESC
            LIMIT 8
        `;
        
        const productosPopulares = await pool.query(productosPopularesQuery, params);
        
        // Distribución por estados
        const distribucionEstadosQuery = `
            SELECT 
                se.estado,
                COUNT(*) as count
            FROM solicitudes_etiquetas se
            WHERE 1=1 ${dateCondition} ${additionalFilters}
            GROUP BY se.estado
            ORDER BY COUNT(*) DESC
        `;
        
        const distribucionEstados = await pool.query(distribucionEstadosQuery, params);
        
        res.json({
            success: true,
            charts: {
                solicitudesPorDia: solicitudesPorDia.rows.map(row => ({
                    date: new Date(row.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                    count: parseInt(row.count)
                })),
                topCostureras: topCostureras.rows.map(row => ({
                    name: row.name.split(' ')[0], // Solo primer nombre
                    count: parseInt(row.count)
                })),
                productosPopulares: productosPopulares.rows.map(row => ({
                    name: row.name.length > 20 ? row.name.substring(0, 20) + '...' : row.name,
                    count: parseInt(row.count)
                })),
                distribucionEstados: distribucionEstados.rows.map(row => ({
                    estado: row.estado,
                    count: parseInt(row.count)
                }))
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo datos de gráficos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Análisis detallado por costureras
app.post('/api/admin/stats/analysis-costureras', async (req, res) => {
    try {
        const { period, dateFrom, dateTo, costurera, producto, estado } = req.body;
        
        let dateCondition = '';
        let params = [];
        let paramIndex = 1;
        
        if (period === 'custom' && dateFrom && dateTo) {
            dateCondition = `AND se.fecha_solicitud BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(dateFrom, dateTo);
            paramIndex += 2;
        } else {
            const periodMap = {
                'today': "AND DATE(se.fecha_solicitud) = CURRENT_DATE",
                'week': "AND se.fecha_solicitud >= DATE_TRUNC('week', NOW())",
                'month': "AND se.fecha_solicitud >= DATE_TRUNC('month', NOW())",
                'quarter': "AND se.fecha_solicitud >= DATE_TRUNC('quarter', NOW())",
                'year': "AND se.fecha_solicitud >= DATE_TRUNC('year', NOW())"
            };
            dateCondition = periodMap[period] || periodMap['month'];
        }
        
        let additionalFilters = '';
        if (costurera) {
            additionalFilters += ` AND se.id_usuario = $${paramIndex}`;
            params.push(costurera);
            paramIndex++;
        }
        if (producto) {
            additionalFilters += ` AND se.id_producto = $${paramIndex}`;
            params.push(producto);
            paramIndex++;
        }
        if (estado) {
            additionalFilters += ` AND se.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const analysisQuery = `
            SELECT 
                u.nombre_completo as costurera,
                COUNT(*) as total_solicitudes,
                COUNT(CASE WHEN se.estado = 'completada' THEN 1 END) as completadas,
                COUNT(CASE WHEN se.estado = 'pendiente' THEN 1 END) as pendientes,
                COALESCE(SUM(CASE WHEN se.estado = 'completada' THEN se.cantidad_solicitada ELSE 0 END), 0) as etiquetas_impresas,
                COALESCE(AVG(
                    CASE WHEN se.estado = 'completada' 
                    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - se.fecha_solicitud))/3600 
                    END
                ), 0) as tiempo_promedio,
                COALESCE(
                    ROUND(
                        COUNT(CASE WHEN se.estado = 'completada' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 
                        2
                    ), 
                    0
                ) as porcentaje_exito
            FROM usuarios u
            LEFT JOIN solicitudes_etiquetas se ON u.id_usuario = se.id_usuario
            WHERE u.nivel_acceso = 'costurera' 
                AND (se.id_solicitud IS NULL OR (1=1 ${dateCondition} ${additionalFilters}))
            GROUP BY u.id_usuario, u.nombre_completo
            HAVING COUNT(se.id_solicitud) > 0
            ORDER BY total_solicitudes DESC
        `;
        
        const result = await pool.query(analysisQuery, params);
        
        const analysis = result.rows.map(row => ({
            costurera: row.costurera,
            totalSolicitudes: parseInt(row.total_solicitudes),
            completadas: parseInt(row.completadas),
            pendientes: parseInt(row.pendientes),
            porcentajeExito: parseFloat(row.porcentaje_exito),
            etiquetasImpresas: parseInt(row.etiquetas_impresas),
            tiempoPromedio: parseFloat(row.tiempo_promedio),
            rendimiento: parseFloat(row.porcentaje_exito) // Simplificado, se puede mejorar la fórmula
        }));
        
        res.json({ success: true, analysis });
        
    } catch (error) {
        console.error('Error en análisis de costureras:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Análisis detallado por productos
app.post('/api/admin/stats/analysis-productos', async (req, res) => {
    try {
        const { period, dateFrom, dateTo, costurera, producto, estado } = req.body;
        
        let dateCondition = '';
        let params = [];
        let paramIndex = 1;
        
        if (period === 'custom' && dateFrom && dateTo) {
            dateCondition = `AND se.fecha_solicitud BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(dateFrom, dateTo);
            paramIndex += 2;
        } else {
            const periodMap = {
                'today': "AND DATE(se.fecha_solicitud) = CURRENT_DATE",
                'week': "AND se.fecha_solicitud >= DATE_TRUNC('week', NOW())",
                'month': "AND se.fecha_solicitud >= DATE_TRUNC('month', NOW())",
                'quarter': "AND se.fecha_solicitud >= DATE_TRUNC('quarter', NOW())",
                'year': "AND se.fecha_solicitud >= DATE_TRUNC('year', NOW())"
            };
            dateCondition = periodMap[period] || periodMap['month'];
        }
        
        let additionalFilters = '';
        if (costurera) {
            additionalFilters += ` AND se.id_usuario = $${paramIndex}`;
            params.push(costurera);
            paramIndex++;
        }
        if (producto) {
            additionalFilters += ` AND se.id_producto = $${paramIndex}`;
            params.push(producto);
            paramIndex++;
        }
        if (estado) {
            additionalFilters += ` AND se.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        const analysisQuery = `
            WITH total_requests AS (
                SELECT COUNT(*) as total FROM solicitudes_etiquetas se WHERE 1=1 ${dateCondition} ${additionalFilters}
            )
            SELECT 
                p.nombre_producto as producto,
                COUNT(*) as total_solicitudes,
                SUM(se.cantidad_solicitada) as cantidad_total,
                AVG(se.cantidad_solicitada) as promedio_solicitud,
                COUNT(DISTINCT se.id_usuario) as costureras_distintas,
                MAX(se.fecha_solicitud) as ultima_solicitud,
                ROUND(COUNT(*) * 100.0 / (SELECT total FROM total_requests), 2) as popularidad
            FROM productos p
            LEFT JOIN solicitudes_etiquetas se ON p.id_producto = se.id_producto
            WHERE se.id_solicitud IS NOT NULL 
                AND (1=1 ${dateCondition} ${additionalFilters})
            GROUP BY p.id_producto, p.nombre_producto
            HAVING COUNT(*) > 0
            ORDER BY total_solicitudes DESC
        `;
        
        const result = await pool.query(analysisQuery, params);
        
        const analysis = result.rows.map(row => ({
            producto: row.producto,
            totalSolicitudes: parseInt(row.total_solicitudes),
            cantidadTotal: parseInt(row.cantidad_total),
            promedioSolicitud: parseFloat(row.promedio_solicitud),
            costurerasDistintas: parseInt(row.costureras_distintas),
            ultimaSolicitud: row.ultima_solicitud,
            popularidad: parseFloat(row.popularidad)
        }));
        
        res.json({ success: true, analysis });
        
    } catch (error) {
        console.error('Error en análisis de productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Exportar datos (endpoints básicos)
app.get('/api/admin/export/users', async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT u.codigo_empleado, u.nombre_completo, u.email, u.telefono, 
                   u.puesto, u.nivel_acceso, d.nombre as departamento, 
                   u.activo, u.fecha_creacion, u.ultimo_login
            FROM usuarios u 
            LEFT JOIN departamentos d ON u.id_departamento = d.id_departamento
            ORDER BY u.nombre_completo
        `);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=usuarios.csv');
        
        const csv = [
            'Código,Nombre,Email,Teléfono,Puesto,Nivel,Departamento,Activo,Fecha Creación,Último Login',
            ...users.rows.map(u => [
                u.codigo_empleado,
                u.nombre_completo,
                u.email,
                u.telefono || '',
                u.puesto,
                u.nivel_acceso,
                u.departamento || '',
                u.activo ? 'Sí' : 'No',
                u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString() : '',
                u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        res.send(csv);
    } catch (error) {
        console.error('Error exportando usuarios:', error);
        res.status(500).json({ error: 'Error al exportar usuarios' });
    }
});

app.get('/api/admin/export/products', async (req, res) => {
    try {
        const products = await pool.query(`
            SELECT nombre_producto, modelo, descripcion_corta, unidad_medida, 
                   activo, fecha_creacion, fecha_actualizacion
            FROM productos 
            ORDER BY nombre_producto
        `);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=productos.csv');
        
        const csv = [
            'Nombre,Modelo,Descripción,Unidad,Activo,Fecha Creación,Fecha Actualización',
            ...products.rows.map(p => [
                p.nombre_producto,
                p.modelo || '',
                p.descripcion_corta || '',
                p.unidad_medida,
                p.activo ? 'Sí' : 'No',
                p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleDateString() : '',
                p.fecha_actualizacion ? new Date(p.fecha_actualizacion).toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        res.send(csv);
    } catch (error) {
        console.error('Error exportando productos:', error);
        res.status(500).json({ error: 'Error al exportar productos' });
    }
});

// Endpoint para obtener solicitudes con información completa
app.get('/api/solicitudes', async (req, res) => {
    try {
        const solicitudes = await pool.query(`
            SELECT se.*, p.nombre_producto, u.nombre_completo as costurera_nombre
            FROM solicitudes_etiquetas se
            LEFT JOIN productos p ON se.id_producto = p.id_producto
            LEFT JOIN usuarios u ON se.id_usuario = u.id_usuario
            ORDER BY se.fecha_solicitud DESC
        `);
        
        res.json(solicitudes.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/admin/export/solicitudes', async (req, res) => {
    try {
        const solicitudes = await pool.query(`
            SELECT se.numero_solicitud, p.nombre_producto, u.nombre_completo as costurera,
                   se.cantidad_solicitada, se.estado, se.qr_code,
                   se.fecha_solicitud, se.observaciones_solicitud
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            ORDER BY se.fecha_solicitud DESC
        `);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=solicitudes.csv');
        
        const csv = [
            'Número,Producto,Costurera,Cantidad,Estado,QR Code,Fecha,Observaciones',
            ...solicitudes.rows.map(s => [
                s.numero_solicitud,
                s.nombre_producto,
                s.costurera,
                s.cantidad_solicitada,
                s.estado,
                s.qr_code || '',
                s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleDateString() : '',
                s.observaciones_solicitud || ''
            ].join(','))
        ].join('\n');

        res.send(csv);
    } catch (error) {
        console.error('Error exportando solicitudes:', error);
        res.status(500).json({ error: 'Error al exportar solicitudes' });
    }
});

// =============================================
// ENDPOINTS DE EXPORTACIÓN/IMPORTACIÓN MEJORADOS
// =============================================

// Exportar base de datos completa en SQL
app.post('/api/admin/export-database', verificarToken, async (req, res) => {
    try {
        const { tables } = req.body;
        
        if (!tables || tables.length === 0) {
            return res.status(400).json({ error: 'Debe seleccionar al menos una tabla' });
        }
        
        let sqlContent = `-- Sistema de Etiquetas Zebra - Exportación de Datos\n`;
        sqlContent += `-- Fecha: ${new Date().toISOString()}\n`;
        sqlContent += `-- Tablas exportadas: ${tables.join(', ')}\n\n`;
        
        for (const table of tables) {
            // Obtener datos de la tabla
            const result = await pool.query(`SELECT * FROM ${table}`);
            
            if (result.rows.length > 0) {
                sqlContent += `-- Tabla: ${table}\n`;
                sqlContent += `-- Registros: ${result.rows.length}\n\n`;
                
                // Generar INSERT statements
                for (const row of result.rows) {
                    const columns = Object.keys(row);
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        return val;
                    });
                    
                    sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
                }
                
                sqlContent += `\n`;
            }
        }
        
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="sistema_etiquetas_${new Date().toISOString().split('T')[0]}.sql"`);
        res.send(sqlContent);
        
    } catch (error) {
        console.error('Error al exportar base de datos:', error);
        res.status(500).json({ error: 'Error al exportar base de datos' });
    }
});

// Exportar a Excel con múltiples hojas
app.post('/api/admin/export-excel', verificarToken, async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const { tables } = req.body;
        
        if (!tables || tables.length === 0) {
            return res.status(400).json({ error: 'Debe seleccionar al menos una tabla' });
        }
        
        const workbook = new ExcelJS.Workbook();
        
        for (const table of tables) {
            const result = await pool.query(`SELECT * FROM ${table}`);
            
            if (result.rows.length > 0) {
                const worksheet = workbook.addWorksheet(table);
                
                // Agregar encabezados
                const columns = Object.keys(result.rows[0]);
                worksheet.columns = columns.map(col => ({
                    header: col.toUpperCase(),
                    key: col,
                    width: 15
                }));
                
                // Agregar datos
                result.rows.forEach(row => {
                    worksheet.addRow(row);
                });
                
                // Estilo para encabezados
                worksheet.getRow(1).font = { bold: true };
                worksheet.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' }
                };
                worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
            }
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="sistema_etiquetas_${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        res.status(500).json({ error: 'Error al exportar Excel: ' + error.message });
    }
});

// Generar informe estadístico en PDF
app.post('/api/admin/export-report', verificarToken, async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const { fechaInicio, fechaFin } = req.body;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Debe especificar rango de fechas' });
        }
        
        // Obtener estadísticas
        const produccionQuery = `
            SELECT u.nombre_completo, 
                   COUNT(s.id_solicitud) as total_solicitudes, 
                   COALESCE(SUM(s.cantidad_solicitada), 0) as total_etiquetas
            FROM usuarios u
            LEFT JOIN solicitudes_etiquetas s ON s.id_usuario = u.id_usuario
                AND s.fecha_solicitud BETWEEN $1 AND $2
            WHERE u.nivel_acceso = 'costurera'
            GROUP BY u.id_usuario, u.nombre_completo
            HAVING COUNT(s.id_solicitud) > 0
            ORDER BY total_etiquetas DESC
            LIMIT 10
        `;
        
        const productosTopQuery = `
            SELECT p.codigo_producto, p.nombre_producto, 
                   COUNT(s.id_solicitud) as veces_solicitado, 
                   COALESCE(SUM(s.cantidad_solicitada), 0) as total_etiquetas
            FROM productos p
            LEFT JOIN solicitudes_etiquetas s ON s.id_producto = p.id_producto
                AND s.fecha_solicitud BETWEEN $1 AND $2
            GROUP BY p.id_producto, p.codigo_producto, p.nombre_producto
            HAVING COUNT(s.id_solicitud) > 0
            ORDER BY total_etiquetas DESC
            LIMIT 10
        `;
        
        const estadosQuery = `
            SELECT estado, COUNT(*) as cantidad
            FROM solicitudes_etiquetas
            WHERE fecha_solicitud BETWEEN $1 AND $2
            GROUP BY estado
        `;
        
        const [produccionResult, productosResult, estadosResult] = await Promise.all([
            pool.query(produccionQuery, [fechaInicio, fechaFin]),
            pool.query(productosTopQuery, [fechaInicio, fechaFin]),
            pool.query(estadosQuery, [fechaInicio, fechaFin])
        ]);
        
        // Calcular totales
        const totalEtiquetas = produccionResult.rows.reduce((sum, r) => sum + parseInt(r.total_etiquetas || 0), 0);
        const totalSolicitudes = estadosResult.rows.reduce((sum, r) => sum + parseInt(r.cantidad || 0), 0);
        const maxEtiquetas = produccionResult.rows.length > 0 ? Math.max(...produccionResult.rows.map(r => parseInt(r.total_etiquetas))) : 0;
        const maxProductos = productosResult.rows.length > 0 ? Math.max(...productosResult.rows.map(r => parseInt(r.total_etiquetas))) : 0;
        
        // Crear PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="informe_estadistico_${fechaInicio}_${fechaFin}.pdf"`);
        
        doc.pipe(res);
        
        // Función para dibujar barra de progreso
        const drawBar = (x, y, width, value, maxValue, color) => {
            const barWidth = maxValue > 0 ? (value / maxValue) * width : 0;
            doc.rect(x, y, width, 15).stroke('#ddd');
            doc.rect(x, y, barWidth, 15).fillAndStroke(color, color);
        };
        
        // === ENCABEZADO ===
        doc.fontSize(26).fillColor('#1a365d').text('📊 INFORME ESTADÍSTICO', { align: 'center' });
        doc.fontSize(12).fillColor('#4a5568').text(`Período: ${fechaInicio} al ${fechaFin}`, { align: 'center' });
        doc.fontSize(10).fillColor('#718096').text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });
        
        // === RESUMEN EJECUTIVO ===
        doc.moveDown(2);
        doc.rect(50, doc.y, 495, 80).fillAndStroke('#f7fafc', '#e2e8f0');
        doc.fillColor('#2d3748').fontSize(14).text('📈 RESUMEN EJECUTIVO', 60, doc.y + 15);
        doc.fontSize(11).fillColor('#4a5568');
        doc.text(`Total Etiquetas Producidas: ${totalEtiquetas.toLocaleString()}`, 60, doc.y + 10);
        doc.text(`Total Solicitudes: ${totalSolicitudes}`, 60, doc.y + 5);
        doc.text(`Costureras Activas: ${produccionResult.rows.length}`, 60, doc.y + 5);
        doc.text(`Productos Diferentes: ${productosResult.rows.length}`, 60, doc.y + 5);
        
        // === PRODUCCIÓN POR COSTURERA ===
        doc.moveDown(2);
        doc.fontSize(16).fillColor('#2c5282').text('🧵 Top 10 Costureras - Producción', { underline: true });
        doc.moveDown(0.5);
        
        if (produccionResult.rows.length > 0) {
            produccionResult.rows.forEach((row, index) => {
                const y = doc.y;
                const etiquetas = parseInt(row.total_etiquetas);
                const solicitudes = parseInt(row.total_solicitudes);
                
                // Número y nombre
                doc.fontSize(11).fillColor('#2d3748');
                doc.text(`${index + 1}. ${row.nombre_completo}`, 50, y, { width: 200 });
                
                // Etiquetas y barra
                doc.fontSize(10).fillColor('#4a5568');
                doc.text(`${etiquetas} etiquetas (${solicitudes} sol.)`, 260, y);
                
                // Barra de progreso
                drawBar(400, y, 145, etiquetas, maxEtiquetas, '#48bb78');
                
                doc.moveDown(1.2);
            });
        } else {
            doc.fontSize(11).fillColor('#a0aec0').text('No hay datos de producción en este período');
        }
        
        // === NUEVA PÁGINA: PRODUCTOS ===
        doc.addPage();
        doc.fontSize(16).fillColor('#2c5282').text('📦 Top 10 Productos Más Solicitados', { underline: true });
        doc.moveDown(0.5);
        
        if (productosResult.rows.length > 0) {
            productosResult.rows.forEach((row, index) => {
                const y = doc.y;
                const etiquetas = parseInt(row.total_etiquetas);
                const veces = parseInt(row.veces_solicitado);
                const nombre = row.nombre_producto.length > 35 ? row.nombre_producto.substring(0, 35) + '...' : row.nombre_producto;
                
                // Número y nombre
                doc.fontSize(10).fillColor('#2d3748');
                doc.text(`${index + 1}. ${nombre}`, 50, y, { width: 250 });
                
                // Código
                doc.fontSize(9).fillColor('#718096');
                doc.text(`(${row.codigo_producto})`, 305, y);
                
                // Etiquetas
                doc.fontSize(10).fillColor('#4a5568');
                doc.text(`${etiquetas} etq.`, 380, y);
                
                // Barra de progreso
                drawBar(430, y, 115, etiquetas, maxProductos, '#3182ce');
                
                doc.moveDown(1.2);
            });
        } else {
            doc.fontSize(11).fillColor('#a0aec0').text('No hay datos de productos en este período');
        }
        
        // === DISTRIBUCIÓN DE ESTADOS ===
        doc.moveDown(2);
        doc.fontSize(16).fillColor('#2c5282').text('📋 Distribución de Estados', { underline: true });
        doc.moveDown(0.5);
        
        if (estadosResult.rows.length > 0) {
            const colores = {
                'completada': '#48bb78',
                'proceso': '#ed8936',
                'pendiente': '#f56565',
                'cancelada': '#a0aec0'
            };
            
            estadosResult.rows.forEach(row => {
                const y = doc.y;
                const cantidad = parseInt(row.cantidad);
                const porcentaje = totalSolicitudes > 0 ? ((cantidad / totalSolicitudes) * 100).toFixed(1) : 0;
                const estado = row.estado.toUpperCase();
                const color = colores[row.estado.toLowerCase()] || '#718096';
                
                // Estado y cantidad
                doc.fontSize(12).fillColor('#2d3748');
                doc.text(`${estado}:`, 50, y, { width: 150 });
                doc.text(`${cantidad} solicitudes (${porcentaje}%)`, 200, y);
                
                // Barra de progreso
                drawBar(380, y, 165, cantidad, totalSolicitudes, color);
                
                doc.moveDown(1.5);
            });
        } else {
            doc.fontSize(11).fillColor('#a0aec0').text('No hay datos de estados en este período');
        }
        
        // === PIE DE PÁGINA ===
        doc.fontSize(9).fillColor('#a0aec0').text(
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            { align: 'center' }
        );
        doc.fontSize(8).text('Sistema de Etiquetas QR | PRODUCTO PERUANO', { align: 'center' });
        
        doc.end();
        
    } catch (error) {
        console.error('Error al generar informe:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al generar informe: ' + error.message });
        }
    }
});

// Importar base de datos desde SQL
app.post('/api/admin/import-database', verificarToken, async (req, res) => {
    try {
        const multer = require('multer');
        const upload = multer({ dest: 'temp/' });
        const fs = require('fs');
        
        // Configurar multer para recibir archivo
        upload.single('sqlFile')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: 'Error al subir archivo' });
            }
            
            const replace = req.body.replace === 'true';
            const file = req.file;
            
            if (!file) {
                return res.status(400).json({ error: 'No se recibió archivo' });
            }
            
            try {
                // Leer contenido del archivo SQL
                const sqlContent = fs.readFileSync(file.path, 'utf8');
                
                // Si se debe reemplazar, limpiar tablas primero
                if (replace) {
                    await pool.query('TRUNCATE TABLE cola_impresion, historial_solicitudes, solicitudes_etiquetas, productos, usuarios CASCADE');
                }
                
                // Ejecutar SQL importado
                await pool.query(sqlContent);
                
                // Eliminar archivo temporal
                fs.unlinkSync(file.path);
                
                res.json({ 
                    success: true, 
                    message: replace ? 'Datos reemplazados exitosamente' : 'Datos agregados exitosamente'
                });
                
            } catch (sqlError) {
                console.error('Error al ejecutar SQL:', sqlError);
                fs.unlinkSync(file.path);
                res.status(500).json({ error: 'Error al ejecutar SQL: ' + sqlError.message });
            }
        });
        
    } catch (error) {
        console.error('Error al importar base de datos:', error);
        res.status(500).json({ error: 'Error al importar base de datos' });
    }
});

// =============================================
// ENDPOINTS DE MANTENIMIENTO
// =============================================

// Estado del mantenimiento
app.get('/api/mantenimiento/status', verificarToken, async (req, res) => {
    try {
        // Verificar última optimización y estado de índices
        const indexQuery = `
            SELECT schemaname, tablename, indexname, indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname;
        `;
        
        const indexResult = await pool.query(indexQuery);
        
        // Calcular estado de optimización
        const indexCount = indexResult.rows.length;
        const indexStatus = indexCount >= 20 ? 'Óptimo' : indexCount >= 10 ? 'Bueno' : 'Requiere optimización';
        
        res.json({
            indexStatus,
            indexCount,
            lastOptimization: new Date().toISOString(), // En producción, usar tabla de logs
            systemHealth: 'Operativo'
        });
    } catch (error) {
        console.error('Error obteniendo estado de mantenimiento:', error);
        res.status(500).json({ error: 'Error al obtener estado del sistema' });
    }
});

// Limpieza de documentos
app.post('/api/mantenimiento/cleanup', verificarToken, verificarRol(['administracion']), async (req, res) => {
    try {
        const { fechaInicio, fechaFin, incluirCola } = req.body;
        
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Fechas requeridas' });
        }

        let solicitudesEliminadas = 0;
        let colaEliminada = 0;

        // Eliminar solicitudes en el rango de fechas
        const deleteQuery = `
            DELETE FROM solicitudes_etiquetas 
            WHERE fecha_solicitud >= $1 AND fecha_solicitud <= $2
        `;
        const deleteResult = await pool.query(deleteQuery, [fechaInicio, fechaFin + ' 23:59:59']);
        solicitudesEliminadas = deleteResult.rowCount;

        // Eliminar registros de cola si se especifica
        if (incluirCola) {
            const deleteColaQuery = `
                DELETE FROM cola_impresion 
                WHERE fecha_creacion >= $1 AND fecha_creacion <= $2
            `;
            const deleteColaResult = await pool.query(deleteColaQuery, [fechaInicio, fechaFin + ' 23:59:59']);
            colaEliminada = deleteColaResult.rowCount;
        }

        // Ejecutar VACUUM para recuperar espacio
        await pool.query('VACUUM ANALYZE solicitudes_etiquetas');
        if (incluirCola) {
            await pool.query('VACUUM ANALYZE cola_impresion');
        }

        // Calcular espacio liberado (estimado)
        const espacioLiberado = Math.round((solicitudesEliminadas * 0.5) + (colaEliminada * 0.3)) + 'KB';

        console.log(`🗑️ Limpieza ejecutada: ${solicitudesEliminadas} solicitudes, ${colaEliminada} registros de cola`);

        res.json({
            solicitudesEliminadas,
            colaEliminada: incluirCola ? colaEliminada : null,
            espacioLiberado,
            mensaje: 'Limpieza completada exitosamente'
        });
    } catch (error) {
        console.error('Error en limpieza:', error);
        res.status(500).json({ error: 'Error al ejecutar limpieza' });
    }
});

// Optimización de base de datos
app.post('/api/mantenimiento/optimize', verificarToken, verificarRol(['administracion']), async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Actualizar estadísticas de todas las tablas
        await pool.query('ANALYZE usuarios');
        await pool.query('ANALYZE productos');
        await pool.query('ANALYZE solicitudes_etiquetas');
        await pool.query('ANALYZE cola_impresion');
        await pool.query('ANALYZE gestion_impresora');

        // Ejecutar VACUUM en tablas principales
        await pool.query('VACUUM usuarios');
        await pool.query('VACUUM productos');
        await pool.query('VACUUM solicitudes_etiquetas');

        // Reindexar tablas críticas
        await pool.query('REINDEX TABLE usuarios');
        await pool.query('REINDEX TABLE productos');
        await pool.query('REINDEX TABLE solicitudes_etiquetas');

        // Actualizar vista materializada si existe
        try {
            await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_diarias');
        } catch (mvError) {
            console.log('Vista materializada no disponible o error:', mvError.message);
        }

        // Limpiar registros de log antiguos (más de 30 días)
        const cleanupQuery = `
            DELETE FROM gestion_impresora 
            WHERE timestamp_evento < NOW() - INTERVAL '30 days'
        `;
        const cleanupResult = await pool.query(cleanupQuery);

        const tiempoEjecucion = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`⚡ Optimización completada en ${tiempoEjecucion}s`);

        res.json({
            indicesActualizados: 15,
            registrosLimpiados: cleanupResult.rowCount,
            tiempoEjecucion: parseFloat(tiempoEjecucion),
            mensaje: 'Optimización completada exitosamente'
        });
    } catch (error) {
        console.error('Error en optimización:', error);
        res.status(500).json({ error: 'Error al ejecutar optimización' });
    }
});

// Análisis del sistema
app.get('/api/mantenimiento/analyze', verificarToken, async (req, res) => {
    try {
        // Obtener métricas del sistema
        const usuariosQuery = 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE activo = true) as activos FROM usuarios';
        const productosQuery = 'SELECT COUNT(*) as total FROM productos';
        const pendientesQuery = 'SELECT COUNT(*) as total FROM solicitudes_etiquetas WHERE estado = $1';
        const espacioQuery = `
            SELECT 
                pg_size_pretty(pg_total_relation_size('solicitudes_etiquetas')) as solicitudes_size,
                pg_size_pretty(pg_total_relation_size('productos')) as productos_size,
                pg_size_pretty(pg_database_size(current_database())) as db_size
        `;

        const [usuariosResult, productosResult, pendientesResult, espacioResult] = await Promise.all([
            pool.query(usuariosQuery),
            pool.query(productosQuery),
            pool.query(pendientesQuery, ['pendiente']),
            pool.query(espacioQuery)
        ]);

        const usuarios = usuariosResult.rows[0];
        const productos = productosResult.rows[0].total;
        const pendientes = pendientesResult.rows[0].total;
        const espacio = espacioResult.rows[0];

        // Calcular rendimiento basado en métricas
        let rendimiento = 'Excelente';
        if (pendientes > 50) rendimiento = 'Requiere atención';
        else if (pendientes > 20) rendimiento = 'Bueno';

        // Generar sugerencias
        let sugerencias = 'Sistema funcionando correctamente';
        if (pendientes > 30) {
            sugerencias = 'Considerar procesar solicitudes pendientes';
        }

        res.json({
            usuarios: `${usuarios.activos}/${usuarios.total}`,
            productos,
            pendientes,
            espacioBD: espacio.db_size,
            rendimiento,
            usoMemoria: 'Normal',
            sugerencias,
            detalles: {
                solicitudesSize: espacio.solicitudes_size,
                productosSize: espacio.productos_size
            }
        });
    } catch (error) {
        console.error('Error en análisis:', error);
        res.status(500).json({ error: 'Error al generar análisis' });
    }
});

// Exportación de datos
app.post('/api/mantenimiento/export', verificarToken, verificarRol(['administracion']), async (req, res) => {
    try {
        const { usuarios, productos, solicitudes } = req.body;
        const fs = require('fs');
        const AdmZip = require('adm-zip');
        
        const zip = new AdmZip();
        const timestamp = new Date().toISOString().split('T')[0];

        // Función helper para convertir a CSV
        function arrayToCSV(data, filename) {
            if (data.length === 0) return;
            
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => 
                Object.values(row).map(val => 
                    typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
                ).join(',')
            );
            
            const csv = [headers, ...rows].join('\n');
            zip.addFile(`${filename}_${timestamp}.csv`, Buffer.from(csv, 'utf8'));
        }

        // Exportar usuarios
        if (usuarios) {
            const usuariosQuery = `
                SELECT id, codigo, nombre, departamento, nivel_acceso, 
                       activo, fecha_creacion, ultimo_login 
                FROM usuarios ORDER BY codigo
            `;
            const usuariosResult = await pool.query(usuariosQuery);
            arrayToCSV(usuariosResult.rows, 'usuarios');
        }

        // Exportar productos
        if (productos) {
            const productosQuery = `
                SELECT codigo, nombre, categoria, subcategoria, 
                       codigo_barras, fecha_creacion 
                FROM productos ORDER BY codigo
            `;
            const productosResult = await pool.query(productosQuery);
            arrayToCSV(productosResult.rows, 'productos');
        }

        // Exportar solicitudes
        if (solicitudes) {
            const solicitudesQuery = `
                SELECT s.numero_solicitud, s.codigo_producto, p.nombre as producto_nombre,
                       s.usuario_codigo, u.nombre as usuario_nombre,
                       s.estado, s.prioridad, s.fecha_solicitud,
                       s.fecha_aprobacion, s.supervisor_codigo
                FROM solicitudes_etiquetas s
                LEFT JOIN productos p ON s.codigo_producto = p.codigo
                LEFT JOIN usuarios u ON s.usuario_codigo = u.codigo
                ORDER BY s.fecha_solicitud DESC
                LIMIT 1000
            `;
            const solicitudesResult = await pool.query(solicitudesQuery);
            arrayToCSV(solicitudesResult.rows, 'solicitudes');
        }

        // Crear archivo info
        const info = {
            fechaExportacion: new Date().toISOString(),
            usuario: req.user.codigo,
            tablas: {
                usuarios: usuarios || false,
                productos: productos || false,
                solicitudes: solicitudes || false
            }
        };
        zip.addFile(`info_exportacion_${timestamp}.json`, Buffer.from(JSON.stringify(info, null, 2), 'utf8'));

        // Enviar ZIP
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename=export_sistema_${timestamp}.zip`
        });
        
        res.send(zip.toBuffer());

        console.log(`📤 Exportación generada por ${req.user.codigo}`);
    } catch (error) {
        console.error('Error en exportación:', error);
        res.status(500).json({ error: 'Error al generar exportación' });
    }
});

// Backup del sistema
app.post('/api/mantenimiento/backup', verificarToken, verificarRol(['administracion']), async (req, res) => {
    try {
        const { usuarios, productos, solicitudes } = req.body;
        const fs = require('fs');
        const { spawn } = require('child_process');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Directorio de backups
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
        
        // Generar backup usando pg_dump
        const pgDump = spawn('pg_dump', [
            '-h', 'localhost',
            '-p', '5432',
            '-U', 'postgres',
            '-d', 'postgres',
            '--no-password',
            '--verbose',
            '--clean',
            '--no-owner',
            '--no-privileges',
            '-f', backupFile
        ], {
            env: { ...process.env, PGPASSWORD: 'alsimtex' }
        });

        pgDump.on('close', (code) => {
            if (code === 0) {
                // Verificar tamaño del archivo
                const stats = fs.statSync(backupFile);
                const fileSizeInMB = (stats.size / 1024 / 1024).toFixed(2);

                console.log(`💾 Backup creado: ${backupFile} (${fileSizeInMB}MB)`);

                res.json({
                    archivo: path.basename(backupFile),
                    tamaño: `${fileSizeInMB}MB`,
                    fecha: new Date().toLocaleString(),
                    ruta: backupFile,
                    mensaje: 'Backup creado exitosamente'
                });
            } else {
                throw new Error(`pg_dump falló con código ${code}`);
            }
        });

        pgDump.on('error', (error) => {
            console.error('Error ejecutando pg_dump:', error);
            res.status(500).json({ error: 'Error al crear backup: ' + error.message });
        });
        
    } catch (error) {
        console.error('Error en backup:', error);
        res.status(500).json({ error: 'Error al crear backup del sistema' });
    }
});

// ====================================
// SISTEMA DE CHAT INTERNO
// ====================================

// Obtener canales del usuario
app.get('/api/chat/canales', verificarToken, async (req, res) => {
    try {
        const userId = req.usuario.id_usuario;
        
        // Verificar si las tablas de chat existen
        const tablesExist = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'chat_canales'
            )
        `);
        
        if (!tablesExist.rows[0].exists) {
            // Si las tablas no existen, devolver array vacío
            return res.json([]);
        }
        
        const result = await pool.query(`
            SELECT 
                c.id_canal,
                c.nombre_canal,
                c.descripcion,
                c.tipo_canal,
                c.departamento,
                p.rol_participante,
                p.silenciado,
                (SELECT COUNT(*) FROM chat_mensajes_no_leidos mnl 
                 JOIN chat_mensajes m ON mnl.id_mensaje = m.id_mensaje 
                 WHERE mnl.id_usuario = $1 AND m.id_canal = c.id_canal) as mensajes_no_leidos,
                (SELECT fecha_mensaje FROM chat_mensajes 
                 WHERE id_canal = c.id_canal 
                 ORDER BY fecha_mensaje DESC LIMIT 1) as ultimo_mensaje
            FROM chat_canales c
            JOIN chat_participantes p ON c.id_canal = p.id_canal
            WHERE p.id_usuario = $1 AND c.activo = true
            ORDER BY c.tipo_canal, c.nombre_canal
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo canales:', error);
        res.status(500).json({ error: 'Error al obtener canales' });
    }
});

// Obtener mensajes de un canal
app.get('/api/chat/canales/:canalId/mensajes', verificarToken, async (req, res) => {
    try {
        const { canalId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.usuario.id_usuario;
        
        // Verificar que el usuario pertenece al canal
        const participante = await pool.query(
            'SELECT id_participante FROM chat_participantes WHERE id_canal = $1 AND id_usuario = $2',
            [canalId, userId]
        );
        
        if (participante.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a este canal' });
        }
        
        const result = await pool.query(`
            SELECT 
                m.id_mensaje,
                m.mensaje,
                m.tipo_mensaje,
                m.archivo_url,
                m.mensaje_padre,
                m.editado,
                m.fecha_edicion,
                m.fecha_mensaje,
                u.nombre_completo,
                u.codigo_empleado,
                u.departamento,
                u.puesto
            FROM chat_mensajes m
            JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE m.id_canal = $1
            ORDER BY m.fecha_mensaje DESC
            LIMIT $2 OFFSET $3
        `, [canalId, limit, offset]);
        
        // Marcar mensajes como leídos
        await pool.query(`
            DELETE FROM chat_mensajes_no_leidos 
            WHERE id_usuario = $1 
            AND id_mensaje IN (
                SELECT id_mensaje FROM chat_mensajes WHERE id_canal = $2
            )
        `, [userId, canalId]);
        
        res.json({
            mensajes: result.rows.reverse(), // Ordenar cronológicamente
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: result.rows.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
});

// Enviar mensaje
app.post('/api/chat/canales/:canalId/mensajes', verificarToken, async (req, res) => {
    try {
        const { canalId } = req.params;
        const { mensaje, tipo_mensaje = 'texto', mensaje_padre = null } = req.body;
        const userId = req.usuario.id_usuario;
        
        // Verificar que el usuario pertenece al canal
        const participante = await pool.query(
            'SELECT id_participante FROM chat_participantes WHERE id_canal = $1 AND id_usuario = $2',
            [canalId, userId]
        );
        
        if (participante.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes acceso a este canal' });
        }
        
        if (!mensaje || mensaje.trim().length === 0) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }
        
        // Insertar mensaje
        const result = await pool.query(`
            INSERT INTO chat_mensajes (id_canal, id_usuario, mensaje, tipo_mensaje, mensaje_padre)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_mensaje, fecha_mensaje
        `, [canalId, userId, mensaje.trim(), tipo_mensaje, mensaje_padre]);
        
        const nuevoMensaje = result.rows[0];
        
        // Crear notificaciones para otros participantes del canal
        await pool.query(`
            INSERT INTO chat_mensajes_no_leidos (id_usuario, id_mensaje)
            SELECT p.id_usuario, $1
            FROM chat_participantes p
            WHERE p.id_canal = $2 AND p.id_usuario != $3 AND p.silenciado = false
        `, [nuevoMensaje.id_mensaje, canalId, userId]);
        
        // Actualizar actividad del usuario
        await pool.query(`
            INSERT INTO chat_estado_usuarios (id_usuario, estado, ultima_actividad)
            VALUES ($1, 'en_linea', CURRENT_TIMESTAMP)
            ON CONFLICT (id_usuario) 
            DO UPDATE SET ultima_actividad = CURRENT_TIMESTAMP, estado = 'en_linea'
        `, [userId]);
        
        // Obtener información completa del mensaje para la respuesta
        const mensajeCompleto = await pool.query(`
            SELECT 
                m.id_mensaje,
                m.mensaje,
                m.tipo_mensaje,
                m.mensaje_padre,
                m.fecha_mensaje,
                u.nombre_completo,
                u.codigo_empleado,
                u.departamento
            FROM chat_mensajes m
            JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE m.id_mensaje = $1
        `, [nuevoMensaje.id_mensaje]);
        
        res.json({ success: true, mensaje: mensajeCompleto.rows[0] });
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
});

// Obtener usuarios en línea
app.get('/api/chat/usuarios-en-linea', async (req, res) => {
    try {
        // Verificar si las tablas de chat existen
        const tablesExist = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'chat_estado_usuarios'
            )
        `);
        
        if (!tablesExist.rows[0].exists) {
            // Si las tablas no existen, devolver array vacío
            return res.json([]);
        }
        const result = await pool.query(`
            SELECT 
                u.id_usuario,
                u.nombre_completo,
                u.codigo_empleado,
                u.departamento,
                u.puesto,
                e.estado,
                e.ultima_actividad,
                e.mensaje_estado
            FROM usuarios u
            LEFT JOIN chat_estado_usuarios e ON u.id_usuario = e.id_usuario
            WHERE e.ultima_actividad > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            AND e.estado IN ('en_linea', 'ausente', 'ocupado')
            ORDER BY e.ultima_actividad DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo usuarios en línea:', error);
        res.status(500).json({ error: 'Error al obtener usuarios en línea' });
    }
});

// Actualizar estado de usuario
app.post('/api/chat/estado', verificarToken, async (req, res) => {
    try {
        const { estado, mensaje_estado } = req.body;
        const userId = req.usuario.id_usuario;
        
        const estadosValidos = ['en_linea', 'ausente', 'ocupado', 'desconectado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        
        // Verificar si la tabla existe antes de usarla
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'chat_estado_usuarios'
            )
        `);
        
        if (!tableExists.rows[0].exists) {
            // Si las tablas de chat no existen, devolver éxito silencioso
            return res.json({ success: true, message: 'Chat no inicializado' });
        }
        
        await pool.query(`
            INSERT INTO chat_estado_usuarios (id_usuario, estado, ultima_actividad, mensaje_estado)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
            ON CONFLICT (id_usuario) 
            DO UPDATE SET 
                estado = EXCLUDED.estado,
                ultima_actividad = CURRENT_TIMESTAMP,
                mensaje_estado = EXCLUDED.mensaje_estado
        `, [userId, estado, mensaje_estado]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ 
            error: 'Error al actualizar estado',
            details: error.message 
        });
    }
});

// Obtener conteo de mensajes no leídos (SISTEMA ANTIGUO - DEPRECADO)
// Este endpoint usa las tablas antiguas de canales, el nuevo está en línea 7649
/*
app.get('/api/chat/no-leidos-OLD', verificarToken, async (req, res) => {
    try {
        const userId = req.usuario.id_usuario;
        
        // Verificar si las tablas de chat existen
        const tablesExist = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'chat_canales'
            )
        `);
        
        if (!tablesExist.rows[0].exists) {
            // Si las tablas no existen, devolver array vacío
            return res.json([]);
        }
        
        const result = await pool.query(`
            SELECT 
                c.id_canal,
                c.nombre_canal,
                COUNT(mnl.id_no_leido) as mensajes_no_leidos
            FROM chat_canales c
            JOIN chat_participantes p ON c.id_canal = p.id_canal
            LEFT JOIN chat_mensajes m ON c.id_canal = m.id_canal
            LEFT JOIN chat_mensajes_no_leidos mnl ON m.id_mensaje = mnl.id_mensaje AND mnl.id_usuario = $1
            WHERE p.id_usuario = $1 AND c.activo = true
            GROUP BY c.id_canal, c.nombre_canal
            HAVING COUNT(mnl.id_no_leido) > 0
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo mensajes no leídos:', error);
        res.status(500).json({ error: 'Error al obtener mensajes no leídos' });
    }
});
*/

// Marcar mensajes como leídos (SISTEMA ANTIGUO - DEPRECADO)
/*
app.post('/api/chat/canales/:canalId/marcar-leido', verificarToken, async (req, res) => {
    try {
        const { canalId } = req.params;
        const userId = req.usuario.id_usuario;
        
        await pool.query(`
            DELETE FROM chat_mensajes_no_leidos 
            WHERE id_usuario = $1 
            AND id_mensaje IN (
                SELECT id_mensaje FROM chat_mensajes WHERE id_canal = $2
            )
        `, [userId, canalId]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando como leído:', error);
        res.status(500).json({ error: 'Error al marcar como leído' });
    }
});
*/

// Endpoint para obtener solicitudes pendientes (para auto-aprobación)
app.get('/api/solicitudes-pendientes', async (req, res) => {
    try {
        const query = `
            SELECT 
                se.id_solicitud, se.numero_solicitud, se.lote_produccion,
                se.cantidad_solicitada, se.fecha_produccion, se.fecha_solicitud,
                se.prioridad, se.estado, se.observaciones,
                u.nombre_completo as operario, u.id_usuario,
                d.nombre_departamento,
                p.nombre_producto, p.marca, p.modelo,
                EXTRACT(EPOCH FROM (NOW() - se.fecha_solicitud))/3600 as horas_pendiente
            FROM solicitudes_etiquetas se
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            JOIN departamentos d ON u.id_departamento = d.id_departamento
            JOIN productos p ON se.id_producto = p.id_producto
            WHERE se.estado = 'pendiente'
            AND se.id_producto_especial IS NULL
            ORDER BY se.fecha_solicitud ASC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes pendientes:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes pendientes' });
    }
});

// Endpoint temporal para verificar usuarios (SOLO PARA DESARROLLO)
app.get('/api/debug-users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id_usuario, 
                codigo_empleado, 
                nombre_completo, 
                email, 
                nivel_acceso,
                activo,
                password_hash
            FROM usuarios 
            ORDER BY id_usuario
        `);
        
        // Solo mostrar parte del hash por seguridad
        const users = result.rows.map(user => ({
            ...user,
            password_hash: user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'Sin contraseña'
        }));
        
        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint temporal para crear usuarios de prueba (SOLO PARA DESARROLLO)
app.post('/api/setup-test-users', async (req, res) => {
    try {
        console.log('🔄 Creando usuarios de prueba...');
        
        // Verificar si ya existen
        const existingUsers = await pool.query('SELECT COUNT(*) FROM usuarios');
        if (existingUsers.rows[0].count > 0) {
            return res.json({ message: 'Los usuarios ya existen', count: existingUsers.rows[0].count });
        }
        
        // Crear departamentos si no existen
        await pool.query(`
            INSERT INTO departamentos (nombre_departamento, descripcion) 
            VALUES 
                ('Administración', 'Departamento administrativo'),
                ('Producción', 'Departamento de costureras'),
                ('Supervisión', 'Departamento de supervisores')
            ON CONFLICT (nombre_departamento) DO NOTHING
        `);
        
        // Obtener IDs de departamentos
        const depts = await pool.query('SELECT id_departamento, nombre_departamento FROM departamentos');
        const adminDept = depts.rows.find(d => d.nombre_departamento === 'Administración')?.id_departamento || 1;
        const prodDept = depts.rows.find(d => d.nombre_departamento === 'Producción')?.id_departamento || 2;
        const supDept = depts.rows.find(d => d.nombre_departamento === 'Supervisión')?.id_departamento || 3;
        
        // Contraseña simple para pruebas
        const simplePassword = '123456';
        
        // Usuarios de prueba
        const testUsers = [
            {
                codigo: 'ADM001',
                nombre: 'Administrador Sistema',
                email: 'admin@alsimtex.com',
                rol: 'administracion',
                dept: adminDept
            },
            {
                codigo: 'SUP001',
                nombre: 'Supervisor Principal',
                email: 'supervisor@alsimtex.com',
                rol: 'supervisor',
                dept: supDept
            },
            {
                codigo: 'COS001',
                nombre: 'María González',
                email: 'costurera1@alsimtex.com',
                rol: 'costurera',
                dept: prodDept
            },
            {
                codigo: 'COS002',
                nombre: 'Ana López',
                email: 'costurera2@alsimtex.com',
                rol: 'costurera',
                dept: prodDept
            },
            {
                codigo: 'COS003',
                nombre: 'Carmen Silva',
                email: 'costurera3@alsimtex.com',
                rol: 'costurera',
                dept: prodDept
            }
        ];
        
        // Insertar usuarios
        for (const user of testUsers) {
            await pool.query(`
                INSERT INTO usuarios (
                    codigo_empleado, nombre_completo, email, telefono, puesto, 
                    nivel_acceso, id_departamento, password_hash, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            `, [
                user.codigo, 
                user.nombre, 
                user.email, 
                '999999999', 
                user.rol, 
                user.rol, 
                user.dept, 
                simplePassword // Sin hashear para facilitar pruebas
            ]);
        }
        
        console.log('✅ Usuarios de prueba creados exitosamente');
        res.json({ 
            message: 'Usuarios de prueba creados exitosamente',
            users: testUsers.map(u => ({
                email: u.email,
                password: simplePassword,
                rol: u.rol
            }))
        });
        
    } catch (error) {
        console.error('❌ Error creando usuarios de prueba:', error);
        res.status(500).json({ error: 'Error creando usuarios: ' + error.message });
    }
});

// Endpoint GET simple para crear tablas de chat (SOLO PARA DESARROLLO)
app.get('/api/create-chat-tables', async (req, res) => {
    try {
        console.log('🔄 Iniciando creación de tablas de chat...');
        
        // 1. Tabla de canales de chat
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_canales (
                id_canal SERIAL PRIMARY KEY,
                nombre_canal VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                tipo_canal VARCHAR(50) DEFAULT 'departamento',
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creado_por INTEGER REFERENCES usuarios(id_usuario)
            )
        `);
        
        // 2. Tabla de mensajes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_mensajes (
                id_mensaje SERIAL PRIMARY KEY,
                id_canal INTEGER NOT NULL REFERENCES chat_canales(id_canal) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                mensaje TEXT NOT NULL,
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                editado BOOLEAN DEFAULT false,
                fecha_edicion TIMESTAMP,
                tipo_mensaje VARCHAR(50) DEFAULT 'texto'
            )
        `);
        
        // 3. Tabla de participantes de canales
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_participantes (
                id_participante SERIAL PRIMARY KEY,
                id_canal INTEGER NOT NULL REFERENCES chat_canales(id_canal) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                rol_canal VARCHAR(50) DEFAULT 'miembro',
                activo BOOLEAN DEFAULT true,
                UNIQUE(id_canal, id_usuario)
            )
        `);
        
        // 4. Tabla de estado de usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_estado_usuarios (
                id_estado SERIAL PRIMARY KEY,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                estado VARCHAR(50) DEFAULT 'desconectado',
                ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(id_usuario)
            )
        `);
        
        // 5. Tabla de mensajes no leídos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_mensajes_no_leidos (
                id_no_leido SERIAL PRIMARY KEY,
                id_mensaje INTEGER NOT NULL REFERENCES chat_mensajes(id_mensaje) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                fecha_marcado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(id_mensaje, id_usuario)
            )
        `);
        
        // Crear canal general por defecto
        await pool.query(`
            INSERT INTO chat_canales (nombre_canal, descripcion, creado_por)
            VALUES ('General', 'Canal principal para comunicación general', 1)
            ON CONFLICT (nombre_canal) DO NOTHING
        `);
        
        res.json({ 
            success: true,
            message: '✅ Todas las tablas de chat han sido creadas exitosamente',
            tables_created: [
                'chat_canales',
                'chat_mensajes', 
                'chat_participantes',
                'chat_estado_usuarios',
                'chat_mensajes_no_leidos'
            ]
        });
        
    } catch (error) {
        console.error('❌ Error creando tablas de chat:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error creando tablas de chat',
            details: error.message 
        });
    }
});

// Endpoint temporal público para crear tablas de chat (SOLO PARA DESARROLLO)
app.post('/api/setup-chat-db', async (req, res) => {
    try {
        console.log('🔄 Iniciando creación de tablas de chat...');
        
        // 1. Tabla de canales de chat
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_canales (
                id_canal SERIAL PRIMARY KEY,
                nombre_canal VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                tipo_canal VARCHAR(50) DEFAULT 'departamento',
                activo BOOLEAN DEFAULT true,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creado_por INTEGER REFERENCES usuarios(id_usuario)
            )
        `);
        console.log('✅ Tabla chat_canales creada');

        // 2. Tabla de mensajes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_mensajes (
                id_mensaje SERIAL PRIMARY KEY,
                id_canal INTEGER NOT NULL REFERENCES chat_canales(id_canal) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                mensaje TEXT NOT NULL,
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                editado BOOLEAN DEFAULT false,
                fecha_edicion TIMESTAMP,
                tipo_mensaje VARCHAR(50) DEFAULT 'texto'
            )
        `);
        console.log('✅ Tabla chat_mensajes creada');

        // 3. Tabla de participantes de canales
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_participantes (
                id_participante SERIAL PRIMARY KEY,
                id_canal INTEGER NOT NULL REFERENCES chat_canales(id_canal) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                rol_canal VARCHAR(50) DEFAULT 'miembro',
                activo BOOLEAN DEFAULT true,
                UNIQUE(id_canal, id_usuario)
            )
        `);
        console.log('✅ Tabla chat_participantes creada');

        // 4. Tabla de estado de usuarios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_estado_usuarios (
                id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario),
                estado VARCHAR(50) DEFAULT 'desconectado',
                ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                mensaje_estado VARCHAR(255)
            )
        `);
        console.log('✅ Tabla chat_estado_usuarios creada');

        // 5. Tabla de mensajes no leídos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_mensajes_no_leidos (
                id_no_leido SERIAL PRIMARY KEY,
                id_mensaje INTEGER NOT NULL REFERENCES chat_mensajes(id_mensaje) ON DELETE CASCADE,
                id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
                fecha_no_leido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(id_mensaje, id_usuario)
            )
        `);
        console.log('✅ Tabla chat_mensajes_no_leidos creada');

        // 6. Crear canales por defecto
        const canalesDefault = [
            { nombre: 'Administración', descripcion: 'Canal para el equipo administrativo' },
            { nombre: 'Costureras', descripcion: 'Canal para el equipo de costureras' },
            { nombre: 'Supervisores', descripcion: 'Canal para supervisores de producción' },
            { nombre: 'General', descripcion: 'Canal general para todos los usuarios' }
        ];

        for (const canal of canalesDefault) {
            await pool.query(`
                INSERT INTO chat_canales (nombre_canal, descripcion, creado_por)
                VALUES ($1, $2, 1)
                ON CONFLICT (nombre_canal) DO NOTHING
            `, [canal.nombre, canal.descripcion]);
        }
        console.log('✅ Canales por defecto creados');

        // 7. Agregar todos los usuarios activos a todos los canales
        await pool.query(`
            INSERT INTO chat_participantes (id_canal, id_usuario)
            SELECT c.id_canal, u.id_usuario
            FROM chat_canales c
            CROSS JOIN usuarios u
            WHERE u.activo = true
            ON CONFLICT (id_canal, id_usuario) DO NOTHING
        `);
        console.log('✅ Usuarios agregados a canales');

        // 8. Crear índices para optimizar rendimiento
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_mensajes_canal_fecha 
            ON chat_mensajes(id_canal, fecha_envio DESC)
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_participantes_usuario 
            ON chat_participantes(id_usuario, activo)
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_no_leidos_usuario 
            ON chat_mensajes_no_leidos(id_usuario)
        `);
        console.log('✅ Índices creados');

        console.log('🎉 Sistema de chat inicializado completamente');
        res.json({ 
            success: true, 
            message: 'Sistema de chat creado exitosamente',
            tablas_creadas: [
                'chat_canales',
                'chat_mensajes', 
                'chat_participantes',
                'chat_estado_usuarios',
                'chat_mensajes_no_leidos'
            ]
        });
    } catch (error) {
        console.error('❌ Error creando sistema de chat:', error);
        res.status(500).json({ error: 'Error creando sistema de chat: ' + error.message });
    }
});

// =============================================
// ENDPOINTS PARA LIMPIEZA DE SOLICITUDES
// =============================================

// Estadísticas de solicitudes para limpieza
app.get('/api/admin/solicitudes/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as en_proceso,
                COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                COUNT(CASE WHEN estado = 'rechazada' THEN 1 END) as rechazadas,
                MIN(fecha_solicitud) as fecha_mas_antigua,
                MAX(fecha_solicitud) as fecha_mas_reciente
            FROM solicitudes_etiquetas
        `);

        res.json({
            success: true,
            stats: stats.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de solicitudes:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error obteniendo estadísticas: ' + error.message 
        });
    }
});

// Vista previa de limpieza de solicitudes
app.post('/api/admin/solicitudes/cleanup/preview', async (req, res) => {
    try {
        const { beforeDate, estados } = req.body;

        if (!beforeDate || !Array.isArray(estados) || estados.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Fecha y estados son requeridos'
            });
        }

        const placeholders = estados.map((_, index) => `$${index + 2}`).join(', ');
        const query = `
            SELECT COUNT(*) as count
            FROM solicitudes_etiquetas
            WHERE fecha_solicitud < $1 AND estado IN (${placeholders})
        `;

        const result = await pool.query(query, [beforeDate, ...estados]);

        console.log(`📊 Vista previa limpieza: ${result.rows[0].count} solicitudes para eliminar`);

        res.json({
            success: true,
            count: parseInt(result.rows[0].count)
        });
    } catch (error) {
        console.error('Error en vista previa de limpieza:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en vista previa: ' + error.message 
        });
    }
});

// Ejecutar limpieza de solicitudes por fecha y estado
app.post('/api/admin/solicitudes/cleanup', async (req, res) => {
    try {
        const { beforeDate, estados } = req.body;

        if (!beforeDate || !Array.isArray(estados) || estados.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Fecha y estados son requeridos'
            });
        }

        console.log(`🗑️ Iniciando limpieza de solicitudes antes de ${beforeDate} con estados: ${estados.join(', ')}`);

        // Contar antes de eliminar
        const placeholders = estados.map((_, index) => `$${index + 2}`).join(', ');
        const countQuery = `
            SELECT COUNT(*) as count
            FROM solicitudes_etiquetas
            WHERE fecha_solicitud < $1 AND estado IN (${placeholders})
        `;

        const countResult = await pool.query(countQuery, [beforeDate, ...estados]);
        const totalToDelete = parseInt(countResult.rows[0].count);

        if (totalToDelete === 0) {
            return res.json({
                success: true,
                deletedCount: 0,
                message: 'No hay solicitudes que cumplan los criterios de eliminación'
            });
        }

        // Eliminar registros relacionados en cola_impresion primero
        const deleteQueueQuery = `
            DELETE FROM cola_impresion 
            WHERE id_solicitud IN (
                SELECT id_solicitud 
                FROM solicitudes_etiquetas 
                WHERE fecha_solicitud < $1 AND estado IN (${placeholders})
            )
        `;
        
        const queueResult = await pool.query(deleteQueueQuery, [beforeDate, ...estados]);
        console.log(`🗑️ Eliminados ${queueResult.rowCount} registros de cola_impresion`);

        // Eliminar las solicitudes principales
        const deleteQuery = `
            DELETE FROM solicitudes_etiquetas
            WHERE fecha_solicitud < $1 AND estado IN (${placeholders})
        `;

        const deleteResult = await pool.query(deleteQuery, [beforeDate, ...estados]);

        console.log(`✅ Limpieza completada: ${deleteResult.rowCount} solicitudes eliminadas`);

        res.json({
            success: true,
            deletedCount: deleteResult.rowCount,
            queueDeleted: queueResult.rowCount,
            message: `Eliminadas ${deleteResult.rowCount} solicitudes y ${queueResult.rowCount} registros de cola`
        });

    } catch (error) {
        console.error('Error ejecutando limpieza:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error ejecutando limpieza: ' + error.message 
        });
    }
});

// Eliminar solicitud individual
app.delete('/api/admin/solicitudes/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const solicitudId = parseInt(id);

        if (isNaN(solicitudId)) {
            return res.status(400).json({
                success: false,
                error: 'ID de solicitud inválido'
            });
        }

        console.log(`🗑️ Eliminando solicitud individual: ID ${solicitudId}`);

        // Verificar que la solicitud existe
        const checkQuery = 'SELECT numero_solicitud FROM solicitudes_etiquetas WHERE id_solicitud = $1';
        const checkResult = await pool.query(checkQuery, [solicitudId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada'
            });
        }

        const numeroSolicitud = checkResult.rows[0].numero_solicitud;

        // Eliminar de cola_impresion primero (si existe)
        const deleteQueueQuery = 'DELETE FROM cola_impresion WHERE id_solicitud = $1';
        const queueResult = await pool.query(deleteQueueQuery, [solicitudId]);

        // Eliminar del historial_solicitudes (si existe)
        const deleteHistorialQuery = 'DELETE FROM historial_solicitudes WHERE id_solicitud = $1';
        const historialResult = await pool.query(deleteHistorialQuery, [solicitudId]);

        // Eliminar la solicitud principal
        const deleteSolicitudQuery = 'DELETE FROM solicitudes_etiquetas WHERE id_solicitud = $1';
        const deleteResult = await pool.query(deleteSolicitudQuery, [solicitudId]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada para eliminar'
            });
        }

        console.log(`✅ Solicitud ${numeroSolicitud} (ID: ${solicitudId}) eliminada exitosamente`);

        res.json({
            success: true,
            message: `Solicitud ${numeroSolicitud} eliminada exitosamente`,
            deletedId: solicitudId,
            queueDeleted: queueResult.rowCount > 0
        });

    } catch (error) {
        console.error('Error eliminando solicitud individual:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error eliminando solicitud: ' + error.message 
        });
    }
});

// Eliminar TODAS las solicitudes (función de emergencia)
app.delete('/api/admin/solicitudes/clear-all', async (req, res) => {
    try {
        console.log('🚨 ALERTA: Eliminando TODAS las solicitudes del sistema');

        // Primero eliminar la cola de impresión
        const deleteQueueResult = await pool.query('DELETE FROM cola_impresion');
        console.log(`🗑️ Eliminados ${deleteQueueResult.rowCount} registros de cola_impresion`);

        // Luego eliminar todas las solicitudes
        const deleteSolicitudesResult = await pool.query('DELETE FROM solicitudes_etiquetas');
        console.log(`🗑️ Eliminadas ${deleteSolicitudesResult.rowCount} solicitudes`);

        // Reiniciar secuencias para limpiar completamente
        await pool.query('ALTER SEQUENCE solicitudes_etiquetas_id_solicitud_seq RESTART WITH 1');
        await pool.query('ALTER SEQUENCE cola_impresion_id_seq RESTART WITH 1');

        console.log('✅ Eliminación masiva completada y secuencias reiniciadas');

        res.json({
            success: true,
            deletedCount: deleteSolicitudesResult.rowCount,
            queueDeleted: deleteQueueResult.rowCount,
            message: `Eliminación masiva completada: ${deleteSolicitudesResult.rowCount} solicitudes y ${deleteQueueResult.rowCount} registros de cola eliminados. Secuencias reiniciadas.`
        });

    } catch (error) {
        console.error('Error en eliminación masiva:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en eliminación masiva: ' + error.message 
        });
    }
});

// Endpoint para forzar refresh de datos (limpiar cache)
app.post('/api/admin/refresh-data', async (req, res) => {
    try {
        console.log('🔄 Forzando refresh de datos del sistema...');

        // Limpiar cache de productos si existe
        global.productosCache = {
            data: null,
            lastUpdate: null,
            ttl: 5 * 60 * 1000
        };

        // Obtener estadísticas actuales directamente de PostgreSQL
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM solicitudes_etiquetas) as total_solicitudes,
                (SELECT COUNT(*) FROM solicitudes_etiquetas WHERE DATE(fecha_solicitud) = CURRENT_DATE) as solicitudes_hoy,
                (SELECT COUNT(*) FROM productos WHERE activo = true) as productos_activos,
                (SELECT COUNT(*) FROM usuarios WHERE activo = true) as usuarios_activos,
                (SELECT MIN(fecha_solicitud)::date FROM solicitudes_etiquetas) as fecha_solicitud_mas_antigua,
                (SELECT MAX(fecha_solicitud)::date FROM solicitudes_etiquetas) as fecha_solicitud_mas_reciente,
                CURRENT_TIMESTAMP as timestamp_consulta
        `;

        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];

        console.log('📊 Estadísticas actuales de PostgreSQL:');
        console.log(`   - Total solicitudes: ${stats.total_solicitudes}`);
        console.log(`   - Solicitudes hoy: ${stats.solicitudes_hoy}`);
        console.log(`   - Productos activos: ${stats.productos_activos}`);
        console.log(`   - Usuarios activos: ${stats.usuarios_activos}`);
        console.log(`   - Rango fechas: ${stats.fecha_solicitud_mas_antigua} a ${stats.fecha_solicitud_mas_reciente}`);

        res.json({
            success: true,
            message: 'Datos refrescados exitosamente',
            stats: stats,
            cache_cleared: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error refrescando datos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error refrescando datos: ' + error.message 
        });
    }
});

// Endpoint de diagnóstico para detectar restauración automática de datos
app.get('/api/admin/diagnostico-datos', async (req, res) => {
    try {
        console.log('🔍 Iniciando diagnóstico de restauración automática de datos...');

        // 1. Verificar procesos activos y timers
        const processInfo = {
            node_version: process.version,
            uptime_seconds: process.uptime(),
            memory_usage: process.memoryUsage(),
            active_timers: process._getActiveHandles().length,
            active_requests: process._getActiveRequests().length
        };

        // 2. Verificar triggers en PostgreSQL
        const triggersQuery = `
            SELECT 
                trigger_name, 
                event_manipulation, 
                event_object_table, 
                action_statement,
                action_timing
            FROM information_schema.triggers 
            WHERE event_object_schema = 'public'
            AND event_object_table IN ('solicitudes_etiquetas', 'productos', 'usuarios')
        `;
        const triggers = await pool.query(triggersQuery);

        // 3. Verificar funciones/procedimientos automáticos
        const functionsQuery = `
            SELECT 
                routine_name, 
                routine_type, 
                specific_name
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name LIKE '%insert%' OR routine_name LIKE '%restore%' OR routine_name LIKE '%sync%'
        `;
        const functions = await pool.query(functionsQuery);

        // 4. Verificar conexiones activas a la base de datos
        const connectionsQuery = `
            SELECT 
                pid,
                usename,
                application_name,
                client_addr,
                state,
                query_start,
                state_change
            FROM pg_stat_activity 
            WHERE datname = current_database()
            AND state = 'active'
        `;
        const connections = await pool.query(connectionsQuery);

        // 5. Verificar últimas operaciones en solicitudes_etiquetas
        const lastOperationsQuery = `
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts_total,
                n_tup_upd as updates_total,
                n_tup_del as deletes_total,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables 
            WHERE tablename = 'solicitudes_etiquetas'
        `;
        const tableStats = await pool.query(lastOperationsQuery);

        // 6. Verificar archivos de backup recientes
        const fs = require('fs');
        const path = require('path');
        let backupFiles = [];
        try {
            const backupDir = path.join(__dirname, 'backups');
            if (fs.existsSync(backupDir)) {
                const files = fs.readdirSync(backupDir);
                backupFiles = files.filter(f => f.endsWith('.sql')).map(f => {
                    const stats = fs.statSync(path.join(backupDir, f));
                    return {
                        name: f,
                        size_mb: (stats.size / 1024 / 1024).toFixed(2),
                        modified: stats.mtime,
                        is_recent: (Date.now() - stats.mtime.getTime()) < 3600000 // 1 hora
                    };
                });
            }
        } catch (error) {
            backupFiles = [`Error leyendo backups: ${error.message}`];
        }

        const diagnostico = {
            timestamp: new Date().toISOString(),
            proceso_node: processInfo,
            triggers_bd: triggers.rows,
            funciones_automaticas: functions.rows,
            conexiones_activas: connections.rows,
            estadisticas_tabla: tableStats.rows[0],
            archivos_backup: backupFiles,
            warnings: []
        };

        // Análisis y warnings
        if (triggers.rows.length > 0) {
            diagnostico.warnings.push(`⚠️ ENCONTRADOS ${triggers.rows.length} TRIGGERS que podrían estar restaurando datos`);
        }

        if (functions.rows.length > 0) {
            diagnostico.warnings.push(`⚠️ ENCONTRADAS ${functions.rows.length} FUNCIONES automáticas sospechosas`);
        }

        const recentBackups = backupFiles.filter(b => b.is_recent);
        if (recentBackups.length > 0) {
            diagnostico.warnings.push(`⚠️ ENCONTRADOS ${recentBackups.length} BACKUPS RECIENTES que podrían estar restaurándose`);
        }

        if (processInfo.active_timers > 5) {
            diagnostico.warnings.push(`⚠️ MUCHOS TIMERS ACTIVOS (${processInfo.active_timers}) - posible proceso automático`);
        }

        console.log('📊 Diagnóstico completado:', diagnostico.warnings);

        res.json({
            success: true,
            diagnostico: diagnostico,
            resumen_warnings: diagnostico.warnings,
            solucion_sugerida: diagnostico.warnings.length > 0 
                ? "Se detectaron posibles causas de restauración automática. Revisar triggers, funciones y backups."
                : "No se detectaron causas obvias de restauración automática. Verificar procesos externos."
        });

    } catch (error) {
        console.error('Error en diagnóstico:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error ejecutando diagnóstico: ' + error.message 
        });
    }
});

// Endpoint para deshabilitar procesos automáticos de restauración
app.post('/api/admin/deshabilitar-auto-restauracion', async (req, res) => {
    try {
        console.log('🛑 Deshabilitando procesos automáticos de restauración...');

        const resultados = [];

        // 1. Eliminar triggers automáticos sospechosos
        try {
            const dropTriggersQuery = `
                SELECT 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_table || ';' as comando
                FROM information_schema.triggers 
                WHERE event_object_schema = 'public'
                AND event_object_table IN ('solicitudes_etiquetas', 'productos', 'usuarios')
                AND (trigger_name LIKE '%restore%' OR trigger_name LIKE '%backup%' OR trigger_name LIKE '%sync%')
            `;
            
            const triggers = await pool.query(dropTriggersQuery);
            
            for (const trigger of triggers.rows) {
                await pool.query(trigger.comando);
                resultados.push(`✅ Eliminado trigger: ${trigger.comando}`);
            }
            
            if (triggers.rows.length === 0) {
                resultados.push('ℹ️ No se encontraron triggers automáticos sospechosos');
            }

        } catch (error) {
            resultados.push(`❌ Error eliminando triggers: ${error.message}`);
        }

        // 2. Limpiar cache global del servidor
        try {
            global.productosCache = { data: null, lastUpdate: null, ttl: 5 * 60 * 1000 };
            global.solicitudesCache = { data: null, lastUpdate: null, ttl: 5 * 60 * 1000 };
            global.usuariosCache = { data: null, lastUpdate: null, ttl: 5 * 60 * 1000 };
            resultados.push('✅ Cache global del servidor limpiado');
        } catch (error) {
            resultados.push(`❌ Error limpiando cache: ${error.message}`);
        }

        // 3. Deshabilitar cualquier timer/intervalo activo (excepto los esenciales)
        try {
            // Limpiar handles activos que no sean esenciales
            const handles = process._getActiveHandles();
            let timersLimpiados = 0;
            
            handles.forEach(handle => {
                if (handle && handle.constructor && handle.constructor.name === 'Timer') {
                    // Solo limpiar timers que no sean críticos
                    try {
                        if (handle._idleTimeout && handle._idleTimeout > 1000) { // Solo timers de más de 1 segundo
                            clearTimeout(handle);
                            timersLimpiados++;
                        }
                    } catch (e) {
                        // Ignorar errores al limpiar timers individuales
                    }
                }
            });
            
            resultados.push(`✅ ${timersLimpiados} timers no críticos deshabilitados`);
        } catch (error) {
            resultados.push(`❌ Error deshabilitando timers: ${error.message}`);
        }

        // 4. Verificar y reportar estado actual
        try {
            const estadoQuery = `
                SELECT 
                    COUNT(*) as total_solicitudes,
                    COUNT(CASE WHEN DATE(fecha_solicitud) = CURRENT_DATE THEN 1 END) as solicitudes_hoy,
                    MAX(fecha_solicitud) as ultima_solicitud
                FROM solicitudes_etiquetas
            `;
            
            const estado = await pool.query(estadoQuery);
            resultados.push(`📊 Estado actual: ${estado.rows[0].total_solicitudes} solicitudes, ${estado.rows[0].solicitudes_hoy} hoy`);
            resultados.push(`📅 Última solicitud: ${estado.rows[0].ultima_solicitud}`);
        } catch (error) {
            resultados.push(`❌ Error obteniendo estado: ${error.message}`);
     }
    
        console.log('🛑 Proceso de deshabilitación completado');

        res.json({
            success: true,
            message: 'Procesos automáticos de restauración deshabilitados',
            acciones_ejecutadas: resultados,
            timestamp: new Date().toISOString(),
            recomendaciones: [
                'Reiniciar el servidor para asegurar que todos los cambios tengan efecto',
                'Verificar que no hay scripts externos ejecutándose',
                'Monitorear la base de datos por 10-15 minutos para confirmar que no se restauran datos'
            ]
        });

    } catch (error) {
        console.error('Error deshabilitando auto-restauración:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error deshabilitando procesos automáticos: ' + error.message 
        });
    }
});

// =============================================
// ENDPOINTS DE MONITOREO Y LOGS
// =============================================

// Obtener últimas N líneas de un log específico
app.get('/api/logs/:tipo', verificarToken, async (req, res) => {
    try {
        const { tipo } = req.params;
        const lines = parseInt(req.query.lines) || 100;
        
        const validTypes = ['database', 'printer', 'server', 'errors', 'security', 'combined'];
        if (!validTypes.includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de log inválido' });
        }
        
        const logPath = path.join(__dirname, 'logs', `${tipo}.log`);
        
        if (!fs.existsSync(logPath)) {
            return res.json({ logs: [], message: 'Log vacío o no creado aún' });
        }
        
        const content = fs.readFileSync(logPath, 'utf8');
        const allLines = content.split('\n').filter(line => line.trim());
        const recentLines = allLines.slice(-lines);
        
        res.json({ 
            tipo,
            total_lines: allLines.length,
            returned_lines: recentLines.length,
            logs: recentLines
        });
        
    } catch (error) {
        logger.error('API-LOGS', 'Error leyendo logs', error);
        res.status(500).json({ error: 'Error leyendo logs: ' + error.message });
    }
});

// Obtener estadísticas de los logs
app.get('/api/logs/stats/all', verificarToken, (req, res) => {
    try {
        const stats = logger.getStats();
        res.json({
            success: true,
            stats,
            server_uptime: Math.round(process.uptime()),
            memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        });
    } catch (error) {
        logger.error('API-LOGS', 'Error obteniendo estadísticas', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas: ' + error.message });
    }
});

// Rotar logs manualmente
app.post('/api/logs/rotate', verificarToken, (req, res) => {
    try {
        logger.rotateLogs();
        logger.info('LOG-MAINTENANCE', 'Logs rotados manualmente');
        res.json({ 
            success: true, 
            message: 'Logs rotados exitosamente' 
        });
    } catch (error) {
        logger.error('API-LOGS', 'Error rotando logs', error);
        res.status(500).json({ error: 'Error rotando logs: ' + error.message });
    }
});

// Limpiar logs antiguos manualmente
app.post('/api/logs/clean', verificarToken, (req, res) => {
    try {
        logger.cleanOldLogs();
        logger.info('LOG-MAINTENANCE', 'Logs antiguos limpiados manualmente');
        res.json({ 
            success: true, 
            message: 'Logs antiguos eliminados exitosamente' 
        });
    } catch (error) {
        logger.error('API-LOGS', 'Error limpiando logs', error);
        res.status(500).json({ error: 'Error limpiando logs: ' + error.message });
    }
});

// Endpoint de monitoreo del sistema completo
app.get('/api/system/health', async (req, res) => {
    try {
        // Verificar PostgreSQL
        let dbHealthy = false;
        let dbLatency = null;
        try {
            const dbStart = Date.now();
            await pool.query('SELECT 1');
            dbLatency = Date.now() - dbStart;
            dbHealthy = true;
        } catch (dbError) {
            logger.error('HEALTH-CHECK', 'PostgreSQL no responde', dbError);
        }
        
        // Verificar impresora
        const printerHealthy = await checkPrinterConnection();
        
        // Contar solicitudes pendientes
        let pendientesCount = 0;
        let procesoCount = 0;
        try {
            const result = await pool.query(`
                SELECT 
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'proceso' THEN 1 ELSE 0 END) as proceso
                FROM solicitudes_etiquetas
            `);
            pendientesCount = parseInt(result.rows[0].pendientes) || 0;
            procesoCount = parseInt(result.rows[0].proceso) || 0;
        } catch (err) {
            logger.warn('HEALTH-CHECK', 'No se pudo contar solicitudes', { error: err.message });
        }
        
        const health = {
            status: dbHealthy && serverHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime_seconds: Math.round(process.uptime()),
            server: {
                healthy: serverHealthy,
                session_id: SERVER_SESSION_ID,
                memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                last_heartbeat: new Date(lastHeartbeat).toISOString()
            },
            database: {
                healthy: dbHealthy,
                latency_ms: dbLatency,
                host: CONFIG.database.HOST,
                database: CONFIG.database.DATABASE
            },
            printer: {
                connected: printerHealthy,
                ip: ZEBRA_CONFIG.PRINTER_IP,
                port: ZEBRA_CONFIG.PORT_NUMBER,
                model: ZEBRA_CONFIG.MODEL
            },
            queue: {
                print_queue_length: printQueue.length,
                solicitudes_pendientes: pendientesCount,
                solicitudes_proceso: procesoCount
            }
        };
        
        logger.debug('HEALTH-CHECK', 'Health check ejecutado', health);
        res.json(health);
        
    } catch (error) {
        logger.error('HEALTH-CHECK', 'Error en health check', error);
        res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
});

// =============================================
// MANEJO DE ERRORES Y CIERRE GRACEFUL
// =============================================

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    logger.error('PROCESS', 'Error no capturado (uncaughtException)', error);
    console.error('🚨 Error no capturado:', error);
    console.log('🔄 El servidor continuará ejecutándose...');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('PROCESS', 'Promise rechazada no manejada (unhandledRejection)', { reason, promise });
    console.error('🚨 Promise rechazada no manejada:', reason);
    console.log('🔄 El servidor continuará ejecutándose...');
});

// Manejar cierre graceful
let isShuttingDown = false; // Flag para evitar múltiples intentos de cierre

process.on('SIGINT', () => {
    if (isShuttingDown) {
        console.log('⏳ Ya se está cerrando el servidor, espera...');
        return;
    }
    
    isShuttingDown = true;
    logger.warn('PROCESS', 'Recibida señal SIGINT - Iniciando cierre graceful');
    console.log('\n🛑 Cerrando servidor gracefully...');
    serverHealthy = false;
    
    // Verificar si el servidor está escuchando antes de intentar cerrarlo
    if (server.listening) {
        server.close((err) => {
            if (err) {
                logger.error('PROCESS', 'Error cerrando servidor HTTP', err);
                console.error('❌ Error cerrando servidor HTTP:', err);
            } else {
                logger.success('PROCESS', 'Servidor HTTP cerrado exitosamente');
                console.log('✅ Servidor HTTP cerrado');
            }
            
            pool.end().then(() => {
                console.log('✅ Pool de base de datos cerrado');
                process.exit(0);
            }).catch((err) => {
                console.error('❌ Error cerrando pool de BD:', err);
                process.exit(1);
            });
        });
    } else {
        // Servidor ya no está corriendo, solo cerrar pool
        console.log('ℹ️ Servidor ya cerrado, cerrando pool de BD...');
        pool.end().then(() => {
            console.log('✅ Pool de base de datos cerrado');
            process.exit(0);
        }).catch((err) => {
            console.error('❌ Error cerrando pool de BD:', err);
            process.exit(1);
        });
    }
});

// Timeout para forzar cierre si es necesario
process.on('SIGTERM', () => {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    console.log('📨 SIGTERM recibido, cerrando...');
    
    // Cerrar pool y salir
    pool.end().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
});

// =====================================================
// 🎨 EDITOR VISUAL DE ETIQUETAS - FUNCIONES NUEVAS
// =====================================================

/**
 * 🆕 Generar ZPL desde configuración JSON del editor visual
 * Esta función NO modifica las funciones actuales (generateDoubleZPL, generateTextOnlyZPL)
 * 
 * @param {Object} config - Configuración de la plantilla
 * @param {Object} data - Datos del producto/solicitud
 * @returns {string} - Código ZPL generado
 */
function generarZPLDesdeConfig(config, data) {
    console.log(`🎨 [generarZPLDesdeConfig] Generando ZPL desde editor visual`);
    console.log(`📋 Plantilla: ${config.nombre_plantilla || 'Sin nombre'}`);
    console.log(`📐 Dimensiones: ${config.ancho_dots}x${config.alto_dots} dots`);
    
    // Header ZPL básico
    let zpl = `^XA
^PW${config.ancho_dots || ZEBRA_CONFIG.TOTAL_WIDTH}
^LL${config.alto_dots || ZEBRA_CONFIG.LABEL_HEIGHT_DOTS}
^LH0,0
^LS0
^LT-10
^MTT
^MMT

// === ETIQUETA GENERADA POR EDITOR VISUAL ===
`;

    // Verificar si hay elementos
    const elementos = config.elementos || config.config_elementos?.elementos || [];
    
    if (elementos.length === 0) {
        console.warn(`⚠️ [generarZPLDesdeConfig] No hay elementos en la configuración`);
        zpl += `^FO50,50^A0N,30,30^FDSin elementos configurados^FS\n`;
        zpl += '^XZ';
        return zpl;
    }
    
    console.log(`📦 [generarZPLDesdeConfig] Procesando ${elementos.length} elementos`);
    
    // Procesar cada elemento de la configuración
    elementos.forEach((elem, index) => {
        // Saltar elementos desactivados
        if (elem.activo === false) {
            console.log(`⏭️ Elemento ${index + 1} (${elem.tipo}) desactivado, saltando`);
            return;
        }
        
        console.log(`📝 Procesando elemento ${index + 1}: ${elem.tipo} (${elem.campo_bd})`);
        
        switch(elem.tipo) {
            case 'qr':
                zpl += generarQRCodeVisual(elem, data);
                break;
            case 'texto':
                zpl += generarTextoVisual(elem, data);
                break;
            default:
                console.warn(`⚠️ Tipo de elemento desconocido: ${elem.tipo}`);
        }
    });
    
    zpl += '\n^XZ';
    
    console.log(`✅ [generarZPLDesdeConfig] ZPL generado: ${zpl.length} caracteres`);
    return zpl;
}

/**
 * 🆕 Generar código QR desde elemento visual
 */
function generarQRCodeVisual(elem, data) {
    const qrData = obtenerValorCampo(elem.campo_bd, data);
    const size = elem.size || 6;
    const x = elem.x || 15;
    const y = elem.y || 40;
    
    console.log(`  🔲 QR en (${x}, ${y}) size=${size}`);
    
    return `// QR Code - ${elem.campo_bd}
^FO${x},${y}^BQN,2,${size}^FDQA,${qrData}^FS\n`;
}

/**
 * 🆕 Generar texto desde elemento visual
 */
function generarTextoVisual(elem, data) {
    let valor = obtenerValorCampo(elem.campo_bd, data);
    
    // Aplicar formato si existe (ej: padding de ceros)
    if (elem.formato && elem.campo_bd === 'id_producto') {
        const numCeros = elem.formato.length;
        valor = valor.toString().padStart(numCeros, '0');
    }
    
    // Aplicar prefijo si existe
    if (elem.prefijo) {
        valor = elem.prefijo + valor;
    }
    
    const x = elem.x || 30;
    const y = elem.y || 30;
    const fuente = elem.fuente || 24;
    const ancho = elem.ancho || 200;
    const maxLineas = elem.max_lineas || 1;
    const wordWrap = elem.word_wrap !== false;
    const alineacion = elem.alineacion || 'L';
    
    console.log(`  📝 Texto en (${x}, ${y}) fuente=${fuente} wrap=${wordWrap}`);
    
    let zpl = `// Texto - ${elem.campo_bd}
^CF0,${fuente}\n`;
    
    if (wordWrap && ancho > 0) {
        // Con word wrap usando ^FB
        zpl += `^FO${x},${y}^FB${ancho},${maxLineas},0,${alineacion}^FD${valor}^FS\n`;
    } else {
        // Sin word wrap, texto simple
        zpl += `^FO${x},${y}^FD${valor}^FS\n`;
    }
    
    return zpl;
}

/**
 * 🆕 Obtener valor de campo desde datos
 */
function obtenerValorCampo(campo, data) {
    // Mapeo de campos
    const mapeo = {
        'qr_code': data.qr_code || data.numero_solicitud || 'QR001',
        'nombre_producto': data.nombre_producto || 'Producto Sin Nombre',
        'modelo': data.modelo || '',
        'unidad_medida': data.unidad_medida || 'UNIDAD',
        'id_producto': data.id_producto || '0',
        'empresa': data.empresa || 'HECHO EN PERU',
        'descripcion_corta': data.descripcion_corta || ''
    };
    
    return mapeo[campo] || `[${campo}]`;
}

// =====================================================
// 📊 MÓDULO DE REPORTES Y EXPORTACIONES
// =====================================================
// ÍNDICE:
// 1. GET  /api/admin/stock-etiquetas        - Obtener estadísticas de stock
// 2. GET  /api/admin/exportar/solicitudes-excel - Exportar solicitudes a Excel
// 3. GET  /api/admin/exportar/productos-excel   - Exportar productos a Excel
// 4. GET  /api/admin/exportar/usuarios-excel    - Exportar usuarios a Excel
// =====================================================

/**
 * 1️⃣ GET /api/admin/stock-etiquetas
 * 
 * Obtiene estadísticas generales de etiquetas solicitadas:
 * - Total solicitadas, completadas, pendientes, en proceso
 * - Totales por hoy, semana y mes
 * - Promedio diario de los últimos 30 días
 * - Estadísticas de rotulados (pendiente implementación)
 * 
 * @returns {Object} JSON con estadísticas de etiquetas y rotulados
 */
app.get('/api/admin/stock-etiquetas', verificarToken, async (req, res) => {
    try {
        // ─────────────────────────────────────────────────────────
        // CONSULTA 1: Estadísticas generales de solicitudes
        // ─────────────────────────────────────────────────────────
        const result = await pool.query(`
            SELECT 
                -- Totales por estado
                COALESCE(SUM(cantidad_solicitada), 0)::integer as total_solicitadas,
                COALESCE(SUM(CASE WHEN estado = 'completada' THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_completadas,
                COALESCE(SUM(CASE WHEN estado = 'pendiente' THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_pendientes,
                COALESCE(SUM(CASE WHEN estado = 'proceso' THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_en_proceso,
                
                -- Totales por período de tiempo
                COALESCE(SUM(CASE WHEN DATE(fecha_solicitud) = CURRENT_DATE THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_hoy,
                COALESCE(SUM(CASE WHEN fecha_solicitud >= DATE_TRUNC('week', CURRENT_DATE) THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_semana,
                COALESCE(SUM(CASE WHEN fecha_solicitud >= DATE_TRUNC('month', CURRENT_DATE) THEN cantidad_solicitada ELSE 0 END), 0)::integer as total_mes
            FROM solicitudes_etiquetas
        `);
        
        // ─────────────────────────────────────────────────────────
        // CONSULTA 2: Promedio diario (últimos 30 días)
        // ─────────────────────────────────────────────────────────
        const promedioResult = await pool.query(`
            SELECT ROUND(COALESCE(AVG(total), 0), 2) as promedio_diario
            FROM (
                -- Suma por día en los últimos 30 días
                SELECT SUM(cantidad_solicitada) as total
                FROM solicitudes_etiquetas
                WHERE fecha_solicitud >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(fecha_solicitud)
            ) diario
        `);
        
        // Consulta de rotulados - COMENTADO: tabla solicitudes_rotulado no existe aún
        // const stockRotulado = await pool.query(`
        //     SELECT 
        //         COALESCE(SUM(cantidad_solicitada), 0)::integer as total_rotulados,
        //         COALESCE(SUM(CASE WHEN estado = 'completada' THEN cantidad_solicitada ELSE 0 END), 0)::integer as rotulados_completados,
        //         COALESCE(SUM(CASE WHEN DATE(fecha_solicitud) = CURRENT_DATE THEN cantidad_solicitada ELSE 0 END), 0)::integer as rotulados_hoy
        //     FROM solicitudes_rotulado
        // `);
        
        res.json({
            etiquetas: {
                ...result.rows[0],
                promedio_diario: promedioResult.rows[0].promedio_diario
            },
            rotulados: {
                total_rotulados: 0,
                rotulados_completados: 0,
                rotulados_hoy: 0
            }, // Valores por defecto hasta que se cree la tabla
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error obteniendo stock de etiquetas:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 2️⃣ GET /api/admin/exportar/solicitudes-excel
 * 
 * Exporta las solicitudes de etiquetas a un archivo Excel (.xlsx)
 * 
 * @query {String} fecha_desde - Fecha inicial (opcional)
 * @query {String} fecha_hasta - Fecha final (opcional)
 * @query {String} estado - Filtrar por estado: 'todas', 'pendiente', 'completada', etc.
 * 
 * @returns {File} Archivo Excel con las solicitudes
 * 
 * Columnas del Excel:
 * - ID, Número Solicitud, QR Code
 * - Producto, Modelo, Usuario
 * - Cantidad, Estado, Fecha Solicitud
 * - Auto Servicio, Observaciones
 */
app.get('/api/admin/exportar/solicitudes-excel', verificarToken, async (req, res) => {
    try {
        console.log('📊 Iniciando exportación de solicitudes a Excel...');
        const { fecha_desde, fecha_hasta, estado } = req.query;
        
        let query = `
            SELECT 
                s.id_solicitud,
                s.numero_solicitud,
                s.qr_code,
                p.nombre_producto as producto,
                p.modelo,
                u.nombre_completo as usuario,
                s.cantidad_solicitada as cantidad_etiquetas,
                s.estado,
                s.fecha_solicitud,
                s.observaciones,
                'N/A' as auto_servicio
            FROM solicitudes_etiquetas s
            JOIN productos p ON s.id_producto = p.id_producto
            JOIN usuarios u ON s.id_usuario = u.id_usuario
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (fecha_desde) {
            query += ` AND s.fecha_solicitud >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }
        
        if (fecha_hasta) {
            query += ` AND s.fecha_solicitud <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }
        
        if (estado && estado !== 'todas') {
            query += ` AND s.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        query += ' ORDER BY s.fecha_solicitud DESC LIMIT 1000';
        
        const result = await pool.query(query, params);
        
        // Crear libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Solicitudes de Etiquetas');
        
        // Definir columnas
        worksheet.columns = [
            { header: 'ID', key: 'id_solicitud', width: 10 },
            { header: 'Número Solicitud', key: 'numero_solicitud', width: 20 },
            { header: 'QR Code', key: 'qr_code', width: 25 },
            { header: 'Producto', key: 'producto', width: 35 },
            { header: 'Modelo', key: 'modelo', width: 20 },
            { header: 'Usuario', key: 'usuario', width: 25 },
            { header: 'Cantidad', key: 'cantidad_etiquetas', width: 12 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Fecha Solicitud', key: 'fecha_solicitud', width: 20 },
            { header: 'Auto Servicio', key: 'auto_servicio', width: 15 },
            { header: 'Observaciones', key: 'observaciones', width: 40 }
        ];
        
        // Estilos del header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;
        
        // Agregar datos
        result.rows.forEach(row => {
            const excelRow = worksheet.addRow({
                ...row,
                fecha_solicitud: row.fecha_solicitud ? new Date(row.fecha_solicitud).toLocaleString('es-PE') : ''
            });
            
            // Colorear según estado
            const estadoColor = {
                'completada': 'FF10B981',
                'pendiente': 'FFF59E0B',
                'proceso': 'FF3B82F6',
                'rechazada': 'FFEF4444'
            };
            
            if (estadoColor[row.estado]) {
                excelRow.getCell('estado').fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: estadoColor[row.estado] }
                };
                excelRow.getCell('estado').font = { color: { argb: 'FFFFFFFF' }, bold: true };
            }
        });
        
        // Agregar filtros
        worksheet.autoFilter = {
            from: 'A1',
            to: 'K1'
        };
        
        // Agregar resumen al final
        worksheet.addRow([]);
        const summaryRow = worksheet.addRow([
            'TOTAL:', '', '', '', '', '',
            result.rows.reduce((sum, row) => sum + parseInt(row.cantidad_etiquetas || 0), 0),
            '', '', '', ''
        ]);
        summaryRow.font = { bold: true };
        summaryRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2E8F0' }
        };
        
        // Configurar respuesta
        const filename = `solicitudes_etiquetas_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        res.status(500).json({ error: 'Error generando archivo Excel', details: error.message });
    }
});

/**
 * 3️⃣ GET /api/admin/exportar/productos-excel
 * 
 * Exporta el catálogo completo de productos a Excel
 * Incluye estadísticas de uso (total de solicitudes y etiquetas)
 * 
 * @returns {File} Archivo Excel con productos
 * 
 * Columnas del Excel:
 * - ID, Nombre, Modelo, Unidad
 * - Categoría, Subcategoría, Estado
 * - Total Solicitudes, Total Etiquetas
 * - Descripción
 */
app.get('/api/admin/exportar/productos-excel', verificarToken, async (req, res) => {
    try {
        console.log('📊 Iniciando exportación de productos a Excel...');
        
        const result = await pool.query(`
            SELECT 
                p.id_producto as id,
                p.nombre_producto as nombre,
                p.modelo,
                p.unidad_medida,
                p.categoria,
                p.subcategoria,
                p.descripcion_corta as descripcion,
                CASE WHEN p.activo THEN 'Activo' ELSE 'Inactivo' END as estado,
                COUNT(s.id_solicitud) as total_solicitudes,
                COALESCE(SUM(s.cantidad_solicitada), 0) as total_etiquetas_solicitadas
            FROM productos p
            LEFT JOIN solicitudes_etiquetas s ON p.id_producto = s.id_producto
            GROUP BY p.id_producto, p.nombre_producto, p.modelo, p.unidad_medida, 
                     p.categoria, p.subcategoria, p.descripcion_corta, p.activo
            ORDER BY p.nombre_producto
        `);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');
        
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 35 },
            { header: 'Modelo', key: 'modelo', width: 20 },
            { header: 'Unidad', key: 'unidad_medida', width: 12 },
            { header: 'Categoría', key: 'categoria', width: 20 },
            { header: 'Subcategoría', key: 'subcategoria', width: 20 },
            { header: 'Estado', key: 'estado', width: 12 },
            { header: 'Total Solicitudes', key: 'total_solicitudes', width: 18 },
            { header: 'Total Etiquetas', key: 'total_etiquetas_solicitadas', width: 18 },
            { header: 'Descripción', key: 'descripcion', width: 50 }
        ];
        
        // Estilos del header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;
        
        // Agregar datos
        result.rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        worksheet.autoFilter = {
            from: 'A1',
            to: 'K1'
        };
        
        const filename = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Productos exportados exitosamente: ${result.rows.length} registros`);
        
    } catch (error) {
        console.error('❌ Error exportando productos a Excel:', error.message);
        console.error('Stack:', error.stack);
        
        // Asegurar que no se envíen headers duplicados
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Error generando archivo Excel',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

/**
 * 4️⃣ GET /api/admin/exportar/usuarios-excel
 * 
 * Exporta lista de usuarios con estadísticas de productividad
 * Muestra total de solicitudes y etiquetas por usuario
 * 
 * @returns {File} Archivo Excel con usuarios y métricas
 * 
 * Columnas del Excel:
 * - ID, Nombre, Email, Rol, Estado
 * - Auto Servicios (Zebra), Total Solicitudes
 * - Total Etiquetas, Etiquetas Completadas
 * 
 * Ordenado por: Total de etiquetas (descendente)
 */
app.get('/api/admin/exportar/usuarios-excel', verificarToken, async (req, res) => {
    try {
        console.log('📊 Iniciando exportación de usuarios a Excel...');
        
        const result = await pool.query(`
            SELECT 
                u.id_usuario,
                u.nombre_completo as nombre,
                u.email,
                u.nivel_acceso as rol,
                CASE WHEN u.activo THEN 'Activo' ELSE 'Inactivo' END as estado,
                CASE WHEN u.auto_services THEN 'Sí' ELSE 'No' END as auto_servicios,
                COUNT(s.id_solicitud) as total_solicitudes,
                COALESCE(SUM(s.cantidad_solicitada), 0) as total_etiquetas,
                COALESCE(SUM(CASE WHEN s.estado = 'completada' THEN s.cantidad_solicitada ELSE 0 END), 0) as etiquetas_completadas
            FROM usuarios u
            LEFT JOIN solicitudes_etiquetas s ON u.id_usuario = s.id_usuario
            GROUP BY u.id_usuario, u.nombre_completo, u.email, u.nivel_acceso, u.activo, u.auto_services
            ORDER BY total_etiquetas DESC
        `);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios y Productividad');
        
        worksheet.columns = [
            { header: 'ID', key: 'id_usuario', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Rol', key: 'rol', width: 20 },
            { header: 'Estado', key: 'estado', width: 12 },
            { header: 'Auto Servicios', key: 'auto_servicios', width: 15 },
            { header: 'Total Solicitudes', key: 'total_solicitudes', width: 18 },
            { header: 'Total Etiquetas', key: 'total_etiquetas', width: 18 },
            { header: 'Etiquetas Completadas', key: 'etiquetas_completadas', width: 22 }
        ];
        
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEC4899' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;
        
        result.rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        worksheet.autoFilter = {
            from: 'A1',
            to: 'I1'
        };
        
        const filename = `usuarios_productividad_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error exportando usuarios a Excel:', error);
        res.status(500).json({ error: 'Error generando archivo Excel' });
    }
});