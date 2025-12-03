// ============================================
// CONFIGURAR GUILLOTINA GODEX G530
// Habilitar cortador automático después de cada etiqueta
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 CONFIGURACIÓN DE GUILLOTINA GODEX G530');
console.log('=========================================');
console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);
console.log('');

// Comandos de configuración de guillotina
const configCommands = [
    // Limpiar buffer
    '~C',
    
    // Configurar guillotina
    '~S,CUTTER,ENABLE',           // Habilitar cortador
    '~S,CUTTER,BATCH,1',          // Cortar después de cada etiqueta (1 = cada una)
    '~S,CUTTER,OFFSET,0',         // Sin offset adicional
    
    // Configurar sensor y media
    '~S,SENSOR,0,MEDIA,WEB',      // Configurar sensor para gaps
    '~S,SET,SENSOR,TYPE,TRANS',   // Sensor transmisivo
    
    // Recargar configuración
    '~S,RELOAD',
    
    // Test inmediato de corte
    '~C'
    
].join('\n') + '\n';

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando configuración de guillotina...');
    console.log('');
    console.log('Configuración aplicada:');
    console.log('• CUTTER,ENABLE     - Guillotina habilitada');
    console.log('• CUTTER,BATCH,1    - Cortar después de cada etiqueta');
    console.log('• CUTTER,OFFSET,0   - Sin desplazamiento');
    console.log('• Sensor configurado para detección de gaps');
    console.log('');
    
    socket.write(configCommands);
    
    setTimeout(() => {
        console.log('✅ Configuración enviada exitosamente');
        console.log('');
        console.log('==========================================');
        console.log('  PRUEBA LA CONFIGURACIÓN:');
        console.log('==========================================');
        console.log('');
        console.log('1. Ejecuta: node test-guillotina-godex.js');
        console.log('2. O imprime una etiqueta desde el sistema');
        console.log('3. Verifica que se corte automáticamente');
        console.log('');
        
        socket.end();
    }, 2000);
});

socket.on('data', (data) => {
    console.log('📥 Respuesta de impresora:', data.toString().trim());
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('');
    console.log('La guillotina debería estar configurada para:');
    console.log('• Cortar automáticamente después de cada etiqueta');
    console.log('• Funcionar con el sistema de etiquetas existente');
    console.log('');
    console.log('Si no funciona, verifica:');
    console.log('• Cable blanco conectado correctamente');
    console.log('• Tornillos bien ajustados');
    console.log('• Guillotina instalada en la posición correcta');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('PASOS PARA SOLUCIONAR:');
    console.log('1. Verifica que la impresora esté encendida');
    console.log('2. Verifica la IP: 192.168.1.35');
    console.log('3. Presiona el botón FEED en la impresora');
    console.log('4. Apaga y enciende la impresora');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout de conexión');
    socket.destroy();
    process.exit(1);
});