// ======================================================
// CONFIGURAR GODEX G530 - MODO ZPL (Versión Simple)
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  CONFIGURAR GODEX G530 → MODO ZPL');
console.log('========================================\n');
console.log(`🖨️  Godex G530: ${GODEX_IP}:${GODEX_PORT}\n`);

// Todos los comandos juntos (más confiable)
const configuracionCompleta = `^XA
^JLZ
^CI28
^PW354
^LL826
^LH0,0
^LS0
^MMC
^MNM
^MTD
^JUS
^XZ
`;

console.log('📡 Enviando configuración completa...\n');
console.log('Comandos a enviar:');
console.log('  ^JLZ  → Cambiar a modo ZPL');
console.log('  ^CI28 → Encoding UTF-8');
console.log('  ^PW354 → Ancho 354 dots (30mm)');
console.log('  ^LL826 → Alto 826 dots (70mm)');
console.log('  ^MMC  → Modo guillotina');
console.log('  ^JUS  → Guardar en memoria\n');

const socket = new net.Socket();
socket.setTimeout(20000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado exitosamente\n`);
    console.log(`📤 Enviando ${configuracionCompleta.length} bytes...`);
    
    socket.write(configuracionCompleta, (err) => {
        if (err) {
            console.error(`❌ Error: ${err.message}`);
            socket.destroy();
            process.exit(1);
        } else {
            console.log(`✅ Comandos enviados correctamente\n`);
            console.log(`⏳ Esperando que la impresora procese...`);
            
            setTimeout(() => {
                socket.end();
            }, 3000);
        }
    });
});

socket.on('data', (data) => {
    console.log(`📨 Respuesta de la impresora: ${data.toString()}`);
});

socket.on('close', () => {
    console.log(`\n✅ CONFIGURACIÓN ENVIADA`);
    console.log(`========================================`);
    console.log(`\n⚠️  PASOS OBLIGATORIOS AHORA:`);
    console.log(`\n1️⃣  APAGAR y ENCENDER la impresora`);
    console.log(`   (Para aplicar el cambio de EZPL → ZPL)`);
    console.log(`\n2️⃣  Presionar FEED 3 veces`);
    console.log(`   (Para calibrar etiquetas)`);
    console.log(`\n3️⃣  Esperar luz VERDE`);
    console.log(`\n4️⃣  Ejecutar prueba:`);
    console.log(`   → PROBAR-GODEX-ZPL.bat`);
    console.log(`\n========================================`);
    console.log(`\n🔍 Si la prueba sale EN BLANCO:`);
    console.log(`   • Verifica que reiniciaste la impresora`);
    console.log(`   • Intenta cambiar modo desde el panel físico:`);
    console.log(`     MENU → Setup → Language → ZPL`);
    console.log(`========================================\n`);
});

socket.on('error', (error) => {
    console.error(`\n❌ ERROR:`);
    console.error(`   ${error.message}\n`);
    console.error(`📋 Verifica:`);
    console.error(`   1. Impresora encendida`);
    console.error(`   2. Cable de red conectado`);
    console.error(`   3. IP correcta: ${GODEX_IP}`);
    console.error(`   4. Ejecuta: ping ${GODEX_IP}\n`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`\n⏱️ TIMEOUT`);
    console.error(`La impresora no responde después de 20 segundos\n`);
    socket.destroy();
    process.exit(1);
});
