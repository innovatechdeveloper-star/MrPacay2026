const net = require('net');

console.log('🔪 TEST GUILLOTINA - Opción 3: ^MMC al final\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// ZPL con comando de corte AL FINAL
const testZPL = `^XA
^PW354
^LL590
^CF0,40
^FO50,100^FDTEST CORTE 3^FS
^CF0,30
^FO50,150^FDCON GUILLOTINA^FS
^FO50,200^FD^MMC AL FINAL^FS
^MMC
^XZ`;

console.log(`📄 ZPL con ^MMC al final:`);
console.log(testZPL);
console.log(`\n📤 Enviando a ${GODEX_IP}:${GODEX_PORT}...`);
console.log(`⏳ Observa si corta después de imprimir\n`);

const socket = new net.Socket();
socket.setTimeout(15000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado`);
    socket.write(testZPL);
    socket.end();
});

socket.on('close', () => {
    console.log(`✅ Enviado - Verifica:`);
    console.log(`   1. ¿Imprimió la etiqueta completa?`);
    console.log(`   2. ¿Cortó automáticamente?`);
    console.log(`   3. ¿Avanzó y quedó lista para la siguiente?`);
    console.log(`   4. ¿Luz roja o error?\n`);
    process.exit(0);
});

socket.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
});
