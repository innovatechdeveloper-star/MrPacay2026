const net = require('net');

console.log('🔧 Calibrando Godex G530...\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// Comando de calibración simple
const calibracion = `~R
`;

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
    console.log(`📤 Enviando comando de calibración (~R)...`);
    socket.write(calibracion);
    
    setTimeout(() => {
        socket.end();
        console.log(`\n✅ Calibración enviada`);
        console.log(`⏳ Espera 5-10 segundos mientras calibra...`);
        console.log(`💡 La impresora debe avanzar varias etiquetas y detenerse\n`);
        process.exit(0);
    }, 2000);
});

socket.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`⏱️ Timeout`);
    socket.destroy();
    process.exit(1);
});
