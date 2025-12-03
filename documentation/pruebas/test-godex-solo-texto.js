const net = require('net');

console.log('🧪 Test básico Godex G530 - SOLO TEXTO\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// ZPL MÍNIMO - Solo texto sin gráficos
const testZPL = `^XA
^PW354
^LL590
^CF0,40
^FO50,100^FDTEST GODEX^FS
^CF0,30
^FO50,150^FDSABANA BP^FS
^FO50,190^FDKING SIZE^FS
^CF0,25
^FO50,230^FDHECHO EN PERU^FS
^XZ`;

console.log(`📄 ZPL de prueba (${testZPL.length} caracteres):`);
console.log(testZPL);
console.log(`\n📤 Enviando a ${GODEX_IP}:${GODEX_PORT}...`);

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado`);
    socket.write(testZPL);
    socket.end();
});

socket.on('close', () => {
    console.log(`✅ Test enviado - Verifica si imprime`);
    process.exit(0);
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
