// ============================================
// COMANDOS GOLABEL EXACTOS - CON CORTE
// Usar los comandos capturados de GoLabel
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🎯 COMANDOS GOLABEL EXACTOS - CON CORTE');
console.log('======================================');
console.log('');
console.log('📋 Usando comandos capturados de GoLabel:');
console.log('   • ^XSETCUT,DOUBLECUT,0 - Habilitar corte');
console.log('   • ^Q50,30 - Altura 50mm, gap 30');
console.log('   • ^W30 - Ancho 30mm');
console.log('   • E - Imprimir y cortar');
console.log('');

// Comandos EXACTOS capturados de GoLabel
const comandosGoLabel = [
    // 1. Configuración de corte (CRÍTICO)
    '^XSETCUT,DOUBLECUT,0',        // Habilitar guillotina - COMANDO CLAVE
    
    // 2. Configuración de etiqueta
    '^Q50,30',                     // Altura 50mm, gap 30
    '^W30',                        // Ancho 30mm
    '^H8',                         // Velocidad impresión
    '^P1',                         // Parámetro P1
    '^S4',                         // Velocidad alimentación
    
    // 3. Configuración adicional
    '^AD',                         // Auto density
    '^C1',                         // Configuración C1
    '^R0',                         // Rotación 0
    '~Q+0',                        // Configuración Q
    '^O0',                         // Offset 0
    '^Db',                         // Configuración Db
    '^E18',                        // Configuración E18
    '~R255',                       // Configuración R255
    '^C1',                         // Configuración C1 (repetido)
    '^D0',                         // Configuración D0
    '^D1',                         // Configuración D1
    
    // 4. Inicio de formato
    '^L',                          // Label start
    
    // 5. Fecha y hora (opcional)
    'Dy2-me-dd',                   // Formato fecha
    'Th:m:s',                      // Formato hora
    
    // 6. Contenido de prueba
    'AF,32,54,1,3,0,0E,PRUEBA SISTEMA',      // Texto 1
    'AF,32,228,1,3,0,0E,GUILLOTINA OK',      // Texto 2
    'AF,32,402,1,3,0,0E,CORTE AUTO',         // Texto 3
    
    // 7. COMANDO CRÍTICO: Imprimir y cortar
    'E'                            // End - IMPRIME Y CORTA AUTOMÁTICAMENTE
    
].join('\r\n') + '\r\n';

console.log(`📡 Conectando a Godex G530 (${GODEX_IP}:${GODEX_PORT})...`);

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando comandos EXACTOS de GoLabel...');
    console.log('');
    console.log('⏰ OBSERVA LA IMPRESORA:');
    console.log('   • ¿Se está imprimiendo?');
    console.log('   • ¿Se escucha la guillotina cortando?');
    console.log('   • ¿La etiqueta se separa automáticamente?');
    console.log('');
    
    socket.write(comandosGoLabel);
    
    setTimeout(() => {
        console.log('✅ Comandos GoLabel enviados completamente');
        console.log('');
        console.log('🎯 VERIFICACIÓN:');
        console.log('   ¿Se imprimió la etiqueta con textos:');
        console.log('   • "PRUEBA SISTEMA"');
        console.log('   • "GUILLOTINA OK"'); 
        console.log('   • "CORTE AUTO"');
        console.log('');
        console.log('   ¿Se cortó automáticamente al terminar?');
        console.log('');
        socket.end();
    }, 4000);
});

let datosRecibidos = '';

socket.on('data', (data) => {
    datosRecibidos += data.toString();
    const response = data.toString().trim();
    if (response) {
        console.log('📥 Respuesta Godex:', response);
    }
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  RESULTADO CON COMANDOS GOLABEL');
    console.log('==========================================');
    console.log('');
    
    if (datosRecibidos.length > 0) {
        console.log('📊 Respuesta de la impresora:');
        console.log(datosRecibidos);
        console.log('');
    }
    
    console.log('📋 EVALUACIÓN FINAL:');
    console.log('');
    console.log('✅ SI SE IMPRIMIÓ Y CORTÓ:');
    console.log('   🎉 ¡PROBLEMA RESUELTO!');
    console.log('   • La guillotina funciona con comandos GoLabel');
    console.log('   • Usar ^XSETCUT,DOUBLECUT,0 en el sistema');
    console.log('   • Usar comando E para imprimir y cortar');
    console.log('');
    console.log('⚠️  SI SE IMPRIMIÓ PERO NO CORTÓ:');
    console.log('   • Los comandos llegan pero guillotina no responde');
    console.log('   • Verificar instalación física del hardware');
    console.log('   • Problema de conexión del cable blanco');
    console.log('');
    console.log('❌ SI NO SE IMPRIMIÓ:');
    console.log('   • Verificar estado de papel/ribbon en Godex');
    console.log('   • Verificar que Godex esté lista (luz verde)');
    console.log('');
    console.log('🔧 INTEGRACIÓN AL SISTEMA:');
    console.log('   Si funciona, integrar estos comandos en server.js');
    console.log('   Reemplazar comandos ZPL por comandos EZPL de GoLabel');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 VERIFICAR:');
    console.log('• Godex G530 encendida');
    console.log('• IP 192.168.1.35 correcta');
    console.log('• Cable de red conectado');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout - Godex no responde');
    socket.destroy();
    process.exit(1);
});