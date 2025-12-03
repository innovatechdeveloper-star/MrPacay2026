const net = require('net');

console.log('🔪 TEST GUILLOTINA - Con área de corte 30mm\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// ZPL con 80mm total (50mm datos + 30mm para corte)
// 30mm = 118 dots @ 300 DPI adicionales
// Total: 590 dots (50mm) + 354 dots (30mm) = 944 dots (80mm)
const testZPL = `^XA
^MMC
^PW354
^LL944
^LH0,0
^LS0
^CF0,40
^FO50,50^FDTEST GUILLOTINA^FS
^CF0,30
^FO50,100^FDCON 30MM EXTRA^FS
^FO50,150^FDSABANA BP^FS
^FO50,200^FDKING SIZE^FS
^CF0,25
^FO50,250^FDHECHO EN PERU^FS
^CF0,20
^FO50,300^FD[AREA DE DATOS: 0-590 dots]^FS
^CF0,18
^FO50,650^FD[AREA DE CORTE: 590-944 dots]^FS
^FO50,700^FD[30MM EN BLANCO]^FS
^XZ`;

console.log(`📐 Configuración:`);
console.log(`   - Área de datos: 50mm (0-590 dots)`);
console.log(`   - Área de corte: 30mm (590-944 dots)`);
console.log(`   - Total: 80mm (944 dots @ 300 DPI)`);
console.log(`\n📄 ZPL generado (${testZPL.length} caracteres)\n`);
console.log(`📤 Enviando a ${GODEX_IP}:${GODEX_PORT}...`);
console.log(`\n⏳ Observa el proceso:`);
console.log(`   1. Imprime 50mm con datos`);
console.log(`   2. Avanza 30mm en blanco`);
console.log(`   3. Corta`);
console.log(`   4. ¿Retrocede automáticamente?\n`);

const socket = new net.Socket();
socket.setTimeout(15000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado`);
    socket.write(testZPL);
    socket.end();
});

socket.on('close', () => {
    console.log(`\n✅ Enviado\n`);
    console.log(`🔍 VERIFICAR:`);
    console.log(`   ✓ ¿Salió la etiqueta con datos (50mm)?`);
    console.log(`   ✓ ¿Avanzó 30mm extra en blanco?`);
    console.log(`   ✓ ¿Cortó correctamente?`);
    console.log(`   ✓ ¿Retrocedió y quedó lista?`);
    console.log(`   ✗ ¿Luz roja o error?\n`);
    
    console.log(`📊 RESULTADO ESPERADO:`);
    console.log(`   Etiqueta cortada de 50mm útiles`);
    console.log(`   Los 30mm extras se descartan después del corte\n`);
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
