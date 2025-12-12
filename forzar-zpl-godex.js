// ======================================================
// FORZAR MODO ZPL EN GODEX G530
// Basado en archivos de prueba exitosos
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  FORZAR GODEX A MODO ZPL');
console.log('========================================\n');

// Secuencia completa basada en pruebas exitosas
const comandosCompletos = `~R
~S,LANGUAGE,ZPL
~S,RELOAD
^XA
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

console.log(`🖨️  Godex G530: ${GODEX_IP}:${GODEX_PORT}\n`);
console.log('📋 Secuencia de comandos:');
console.log('   1. ~R              → Reset general');
console.log('   2. ~S,LANGUAGE,ZPL → Cambiar a ZPL');
console.log('   3. ~S,RELOAD       → Recargar config');
console.log('   4. ^XA...^XZ       → Establecer parámetros ZPL');
console.log('   5. ^JUS            → Guardar permanente\n');

const socket = new net.Socket();
socket.setTimeout(20000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado\n`);
    console.log(`📤 Enviando configuración completa...`);
    
    socket.write(comandosCompletos, (err) => {
        if (err) {
            console.error(`❌ Error: ${err.message}`);
            socket.destroy();
            process.exit(1);
        } else {
            console.log(`✅ ${comandosCompletos.split('\n').filter(l => l.trim()).length} comandos enviados\n`);
            console.log(`⏳ Procesando... (puede tardar 10 segundos)`);
            
            setTimeout(() => {
                socket.end();
            }, 5000);
        }
    });
});

socket.on('data', (data) => {
    console.log(`📨 Respuesta: ${data.toString().trim()}`);
});

socket.on('close', () => {
    console.log(`\n========================================`);
    console.log(`  CONFIGURACIÓN COMPLETADA`);
    console.log(`========================================\n`);
    console.log(`⚡ PASOS CRÍTICOS AHORA:\n`);
    console.log(`1️⃣  APAGAR completamente la impresora`);
    console.log(`   (Desconectar y esperar 10 segundos)\n`);
    console.log(`2️⃣  ENCENDER la impresora\n`);
    console.log(`3️⃣  CALIBRAR: Mantén FEED al encender`);
    console.log(`   (Suelta cuando parpadee)\n`);
    console.log(`4️⃣  PROBAR:`);
    console.log(`   node test-godex-zpl.js\n`);
    console.log(`========================================`);
    console.log(`\n🔍 DIAGNÓSTICO:\n`);
    console.log(`Si sale EN BLANCO aún:`);
    console.log(`   → La impresora tiene modo ZPL deshabilitado`);
    console.log(`   → Necesitas actualizar firmware o`);
    console.log(`   → Cambiar manualmente desde panel LCD\n`);
    console.log(`Alternativa manual:`);
    console.log(`   MENU → Setup → Language → ZPL`);
    console.log(`========================================\n`);
});

socket.on('error', (error) => {
    console.error(`\n❌ ERROR: ${error.message}\n`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`\n⏱️ TIMEOUT\n`);
    socket.destroy();
    process.exit(1);
});
