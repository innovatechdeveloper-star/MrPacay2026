const net = require('net');

console.log('📏 TEST GUILLOTINA - Regla de medición\n');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// ZPL con regla numerada para medir dónde corta
// Total: 80mm (944 dots @ 300 DPI) = 50mm datos + 30mm para corte
const testZPL = `^XSETCUT,DOUBLECUT,20,1
^XA
^PW354
^LL944
^LH0,0
^LS0

^CF0,60
^FO50,0^FD590^FS

^CF0,50
^FO50,100^FD500^FS

^CF0,50
^FO50,200^FD400^FS

^CF0,50
^FO50,300^FD300^FS

^CF0,50
^FO50,400^FD200^FS

^CF0,50
^FO50,500^FD100^FS

^CF0,60
^FO50,580^FD1^FS

^CF0,30
^FO50,650^FD[AREA DE CORTE]^FS
^FO50,700^FD[30MM EXTRA]^FS
^FO50,750^FD650 dots^FS
^FO50,800^FD800 dots^FS
^FO50,850^FD850 dots^FS
^FO50,900^FD[FIN: 944]^FS

^XZ
^XSETCUT,DOUBLECUT,0`;

console.log(`📐 Configuración del test:`);
console.log(`   - Total: 80mm (944 dots @ 300 DPI)`);
console.log(`   - Área de datos: 0-590 dots (50mm)`);
console.log(`   - Área de corte: 590-944 dots (30mm)`);
console.log(`   - Comando: ^XSETCUT,DOUBLECUT,20,1`);
console.log(`\n📄 Regla impresa:`);
console.log(`   590 ← Inicio (arriba)`);
console.log(`   500`);
console.log(`   400`);
console.log(`   300`);
console.log(`   200`);
console.log(`   100`);
console.log(`   1   ← Fin de datos útiles`);
console.log(`   [ÁREA DE CORTE: 590-944]`);
console.log(`\n📤 Enviando a ${GODEX_IP}:${GODEX_PORT}...\n`);

const socket = new net.Socket();
socket.setTimeout(20000); // 20 segundos

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado`);
    console.log(`📡 Enviando ZPL con regla de medición...`);
    socket.write(testZPL);
    socket.end();
});

socket.on('close', () => {
    console.log(`\n✅ Test enviado\n`);
    console.log(`🔍 OBSERVA Y ANOTA:`);
    console.log(`   1. ¿Dónde quedó el último número visible? ____`);
    console.log(`   2. ¿Dónde cortó la guillotina? (marca con lápiz)`);
    console.log(`   3. ¿Cuánto avanzó después del "1"? ____mm`);
    console.log(`   4. ¿Retrocedió automáticamente? [SÍ/NO]`);
    console.log(`   5. ¿Cuánto retrocedió? ____mm`);
    console.log(`   6. ¿Quedó lista para la siguiente? [SÍ/NO]`);
    console.log(`\n📊 RESULTADO ESPERADO:`);
    console.log(`   - Ver números: 590, 500, 400, 300, 200, 100, 1`);
    console.log(`   - Corte después del "1" (aprox en 620 dots)`);
    console.log(`   - Retroceso de 30mm para siguiente etiqueta`);
    console.log(`\n💡 Con esta info sabremos el offset exacto a usar\n`);
    process.exit(0);
});

socket.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`⏱️ Timeout después de 20 segundos`);
    socket.destroy();
    process.exit(1);
});
