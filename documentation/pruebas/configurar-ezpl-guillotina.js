// ============================================
// CONFIGURACIÓN CORRECTA GUILLOTINA - EZPL NATIVO GODEX
// Usando comandos EZPL nativos de Godex G530
// Etiquetas: 50mm alto x 30mm ancho
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 CONFIGURACIÓN CORRECTA - EZPL NATIVO GODEX');
console.log('==============================================');
console.log('');
console.log('📏 Especificaciones:');
console.log('   • Modelo: Godex G530');
console.log('   • Etiquetas: 50mm alto x 30mm ancho (394x236 dots a 203 DPI)');
console.log('   • Lenguaje: EZPL (nativo Godex)');
console.log('   • Problema detectado: Comandos ZPL no funcionan');
console.log('');
console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);

// Comandos EZPL correctos para Godex G530
const configEZPL = [
    // 1. Reset completo de impresora
    '~R',                           // Reset hardware
    
    // 2. Configuración de etiqueta en EZPL
    // Para 50mm alto x 30mm ancho a 203 DPI:
    // Alto: 50mm = 394 dots (50 * 203 / 25.4)
    // Ancho: 30mm = 236 dots (30 * 203 / 25.4)
    '^Q394,16',                     // Altura etiqueta 394 dots, gap 16 dots (2mm)
    '^W236',                        // Ancho etiqueta 236 dots
    '^H8',                          // Velocidad de impresión (1-13, 8=media)
    '^S4',                          // Velocidad de alimentación
    
    // 3. CONFIGURACIÓN ESPECÍFICA DE GUILLOTINA EN EZPL
    '^S,CUT,1,0',                   // CRÍTICO: Habilitar corte (1 etiqueta, corte total)
    
    // 4. Configuración de sensor
    '^KI8',                         // Sensor gap/web con sensibilidad 8
    '^O0',                          // Offset de impresión 0
    '^R0',                          // Rotación 0 grados
    
    // 5. Test de corte directo
    '~C',                           // Comando de corte inmediato EZPL
    
].join('\r\n') + '\r\n';

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Aplicando configuración EZPL nativa...');
    console.log('');
    console.log('Configuración EZPL aplicada:');
    console.log('• ^Q394,16  - Altura 50mm (394 dots), gap 2mm');
    console.log('• ^W236     - Ancho 30mm (236 dots)');
    console.log('• ^S,CUT,1,0 - GUILLOTINA HABILITADA (1 etiqueta, corte total)');
    console.log('• ~C        - Comando de corte inmediato');
    console.log('');
    
    console.log('📤 Enviando comandos EZPL...');
    socket.write(configEZPL);
    
    setTimeout(() => {
        console.log('✅ Configuración EZPL enviada');
        console.log('');
        console.log('⚠️  ESCUCHA ATENTAMENTE:');
        console.log('   ¿Escuchas sonido de la guillotina cortando AHORA?');
        console.log('   (El comando ~C debería activar el corte inmediatamente)');
        console.log('');
        socket.end();
    }, 2000);
});

socket.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
        console.log('📥 Respuesta EZPL:', response);
    }
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  VERIFICACIÓN CRÍTICA');
    console.log('==========================================');
    console.log('');
    console.log('1. ¿Escuchaste sonido de corte con ~C?');
    console.log('');
    console.log('✅ SI ESCUCHASTE SONIDO:');
    console.log('   • La guillotina funciona correctamente');
    console.log('   • Proceder a test de impresión + corte');
    console.log('   • Ejecutar: node test-impresion-ezpl.js');
    console.log('');
    console.log('❌ SI NO ESCUCHASTE SONIDO:');
    console.log('   • Problema físico de instalación');
    console.log('   • Verificar cable blanco conectado');
    console.log('   • Verificar tornillos apretados');
    console.log('   • Verificar posición de guillotina');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout de conexión');
    socket.destroy();
    process.exit(1);
});