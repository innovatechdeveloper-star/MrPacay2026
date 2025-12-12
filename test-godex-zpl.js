// ======================================================
// PROBAR IMPRESORA GODEX - ETIQUETA DE PRUEBA
// ======================================================
// Envía una etiqueta de prueba simple para verificar
// que la impresora acepta comandos ZPL correctamente
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  PRUEBA GODEX G530 - ETIQUETA TEST');
console.log('========================================\n');

// ZPL de prueba simple - Etiqueta 30mm x 70mm
const zplPrueba = `^XA
^MMC
^PW354
^LL826
^LH0,0
^LS0

^CF0,50
^FO50,200^FDPRUEBA^FS
^FO50,280^FDZPL MODE^FS

^CF0,30
^FO50,350^FDGODEX G530^FS
^FO50,400^FD30mm x 70mm^FS

^CF0,25
^FO50,500^FDSi ves esto,^FS
^FO50,540^FDla config es OK^FS

^BY2^FO50,600^BCN,80,N,N
^FD123456^FS

^XZ
`;

console.log(`🖨️  Impresora: Godex G530`);
console.log(`🌐 IP: ${GODEX_IP}`);
console.log(`🔌 Puerto: ${GODEX_PORT}`);
console.log(`\n📄 Enviando etiqueta de prueba...`);
console.log(`   (30mm x 70mm con texto y código de barras)\n`);

const socket = new net.Socket();
socket.setTimeout(10000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
    console.log(`📡 Enviando ZPL (${zplPrueba.length} bytes)...\n`);
    
    socket.write(zplPrueba, (err) => {
        if (err) {
            console.error(`❌ Error enviando: ${err.message}`);
            socket.destroy();
            process.exit(1);
        } else {
            console.log(`✅ ZPL enviado correctamente`);
            console.log(`\n⏳ Esperando impresión...`);
            setTimeout(() => {
                socket.end();
            }, 1000);
        }
    });
});

socket.on('close', () => {
    console.log(`\n========================================`);
    console.log(`  IMPRESIÓN COMPLETADA`);
    console.log(`========================================`);
    console.log(`\n📋 Resultado esperado:`);
    console.log(`   • Texto: "PRUEBA ZPL MODE"`);
    console.log(`   • Texto: "GODEX G530"`);
    console.log(`   • Texto: "30mm x 70mm"`);
    console.log(`   • Texto: "Si ves esto, la config es OK"`);
    console.log(`   • Código de barras: 123456`);
    console.log(`\n🔍 Si la etiqueta salió:`);
    console.log(`   ✅ EN BLANCO → La impresora sigue en EZPL`);
    console.log(`      Ejecuta: CONFIGURAR-GODEX-ZPL.bat`);
    console.log(`   ✅ CON TEXTO → Todo funciona correctamente`);
    console.log(`      Ya puedes usar el sistema normalmente`);
    console.log(`\n🔴 Si la luz quedó roja:`);
    console.log(`   1. Presiona FEED 3 veces (botón físico)`);
    console.log(`   2. Espera que avance etiquetas`);
    console.log(`   3. Luz debe cambiar a verde`);
    console.log(`========================================\n`);
});

socket.on('error', (error) => {
    console.error(`\n❌ ERROR DE CONEXIÓN:`);
    console.error(`   ${error.message}`);
    console.error(`\n📋 Verifica:`);
    console.error(`   1. La impresora está encendida`);
    console.error(`   2. La IP es correcta: ${GODEX_IP}`);
    console.error(`   3. El cable de red está conectado`);
    console.error(`   4. Puedes hacer ping: ping ${GODEX_IP}`);
    console.error(`========================================\n`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`\n⏱️ TIMEOUT - La impresora no responde`);
    console.error(`   Verifica que esté encendida y conectada\n`);
    socket.destroy();
    process.exit(1);
});
