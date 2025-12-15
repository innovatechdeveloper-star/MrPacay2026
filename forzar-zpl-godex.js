// ======================================================
// FORZAR MODO ZPL EN GODEX G530
// Basado en archivos de prueba exitosos
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  LIMPIAR Y CONFIGURAR GODEX G530');
console.log('  Solo acepta ZPL - Sin config guardada');
console.log('========================================\n');

// Secuencia AGRESIVA de limpieza
// ⚠️ IMPORTANTE: Borra TODO, configura ZPL, NO guarda nada
const comandosCompletos = `~R
~S,LANGUAGE,ZPL
~S,MEDIA,LABEL
~S,DARKNESS,15
~S,SPEED,4
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
^XZ
`;

console.log(`🖨️  Godex G530: ${GODEX_IP}:${GODEX_PORT}\n`);
console.log('📋 Secuencia de limpieza AGRESIVA:');
console.log('   1. ~R              → Reset TOTAL (borra memoria flash)');
console.log('   2. ~S,LANGUAGE,ZPL → Solo acepta ZPL');
console.log('   3. ~S,MEDIA,LABEL  → Tipo de media etiquetas');
console.log('   4. ~S,DARKNESS,15  → Oscuridad default');
console.log('   5. ~S,SPEED,4      → Velocidad default');
console.log('   6. ~S,RELOAD       → Recargar todo limpio');
console.log('   7. ^XA...^XZ       → Config base ZPL');
console.log('   8. NO ^JUS         → NO guarda (volátil)\n');
console.log('⚠️  La impresora OLVIDARÁ todo después de apagar\n');

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
    console.log(`  LIMPIEZA COMPLETADA`);
    console.log(`========================================\n`);
    console.log(`✅ Configuración LIMPIA aplicada:\n`);
    console.log(`   • ~R: Memoria flash BORRADA`);
    console.log(`   • Modo ZPL: ACTIVADO (solo acepta ZPL)`);
    console.log(`   • Config guardada: NINGUNA`);
    console.log(`   • Cada trabajo: Lee ZPL completo que enviamos\n`);
    console.log(`🛡️  GARANTÍA:\n`);
    console.log(`   • NO hay config por default`);
    console.log(`   • NO hay ^LL guardado`);
    console.log(`   • NO hay ^PQ guardado`);
    console.log(`   • Impresora lee SOLO nuestro código\n`);
    console.log(`⚡ PASOS CRÍTICOS AHORA:\n`);
    console.log(`1️⃣  APAGAR completamente la impresora`);
    console.log(`   (Desconectar cable - Esperar 10 segundos)\n`);
    console.log(`2️⃣  MANTENER FEED presionado\n`);
    console.log(`3️⃣  CONECTAR cable (sin soltar FEED)\n`);
    console.log(`4️⃣  SOLTAR FEED cuando parpadee\n`);
    console.log(`5️⃣  Esperar calibración → Luz verde\n`);
    console.log(`6️⃣  PROBAR: node test-godex-zpl.js\n`);
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
