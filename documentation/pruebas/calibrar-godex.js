// Script de calibración para impresora Godex G530
const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 Iniciando calibración de Godex G530...');
console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);

// Comandos de calibración ZPL para Godex
const comandosCalibracion = [
    '~C',                           // Clear buffer
    '~S,SENSOR,0,MEDIA,WEB',       // Configurar sensor para detectar espacio entre etiquetas
    '~S,SET,SENSOR,TYPE,TRANS',    // Tipo de sensor: transmisivo (gap)
    '~S,RELOAD'                     // Recargar configuración
].join('\n') + '\n';

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando comandos de calibración...');
    
    socket.write(comandosCalibracion);
    
    setTimeout(() => {
        console.log('✅ Comandos enviados exitosamente');
        socket.end();
    }, 2000);
});

socket.on('data', (data) => {
    console.log('📥 Respuesta de impresora:', data.toString());
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  CALIBRACIÓN COMPLETADA');
    console.log('==========================================');
    console.log('');
    console.log('Si la luz SIGUE EN ROJO:');
    console.log('1. Apaga y enciende la impresora');
    console.log('2. Presiona el botón FEED en la impresora');
    console.log('3. Verifica que las etiquetas estén correctamente colocadas');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('PASOS MANUALES:');
    console.log('1. Verifica que la impresora esté encendida');
    console.log('2. Verifica la IP: 192.168.1.35');
    console.log('3. Presiona el botón FEED en la impresora 3 veces');
    console.log('4. Apaga y enciende la impresora');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout de conexión');
    socket.destroy();
    process.exit(1);
});
