const net = require('net');

console.log('🔧 Configurando Godex G530 (300 DPI) para etiquetas 30mm × 50mm\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// Comandos de configuración para 30mm × 50mm @ 300 DPI
// 30mm = 354 dots @ 300 DPI
// 50mm = 590 dots @ 300 DPI
const configuracion = `~R
^XA
^MNN
^PW354
^LL590
^LH0,0
^LS0
^XZ
`;

console.log(`📋 Comandos de configuración:`);
console.log(configuracion);
console.log(`\n📤 Enviando a ${GODEX_IP}:${GODEX_PORT}...`);

const socket = new net.Socket();
socket.setTimeout(15000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado`);
    console.log(`📝 Configurando:`);
    console.log(`   - Ancho: 30mm (354 dots @ 300 DPI)`);
    console.log(`   - Alto: 50mm (590 dots @ 300 DPI)`);
    console.log(`   - Modo: Tear-off (arranque manual)`);
    console.log(`   - DPI: 300`);
    
    socket.write(configuracion);
    
    setTimeout(() => {
        socket.end();
        console.log(`\n✅ Configuración enviada`);
        console.log(`⏳ Espera mientras calibra el nuevo tamaño...`);
        console.log(`\n💡 Ahora prueba: node test-godex-solo-texto.js\n`);
        process.exit(0);
    }, 3000);
});

socket.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    console.error(`\n⚠️  Verifica:`);
    console.error(`   1. La impresora está encendida`);
    console.error(`   2. Cable de red conectado`);
    console.error(`   3. IP correcta: ${GODEX_IP}`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`⏱️ Timeout - La impresora no responde`);
    socket.destroy();
    process.exit(1);
});
