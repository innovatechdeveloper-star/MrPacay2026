// ======================================================
// RESET TOTAL DE GODEX G530 - LIMPIAR TODA CONFIGURACIÓN
// Elimina CUALQUIER configuración guardada anteriormente
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  RESET TOTAL - GODEX G530');
console.log('========================================\n');

// Comandos para LIMPIAR completamente la memoria
const resetComandos = `~R
~S,RESET_ALL,YES
~S,RELOAD
`;

console.log(`🖨️  Godex G530: ${GODEX_IP}:${GODEX_PORT}\n`);
console.log('📋 Comandos de RESET TOTAL:');
console.log('   1. ~R                 → Reset general');
console.log('   2. ~S,RESET_ALL,YES   → Limpiar TODA configuración permanente');
console.log('   3. ~S,RELOAD          → Recargar configuración limpia\n');

const socket = new net.Socket();
socket.setTimeout(20000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado a Godex\n`);
    console.log(`📤 Enviando RESET TOTAL...`);
    
    socket.write(resetComandos, (err) => {
        if (err) {
            console.error(`❌ Error: ${err.message}`);
            socket.destroy();
            process.exit(1);
        } else {
            console.log(`✅ Comandos enviados\n`);
            console.log(`⏳ Procesando reset (espera 10 segundos)...`);
            
            setTimeout(() => {
                socket.end();
            }, 10000);
        }
    });
});

socket.on('data', (data) => {
    console.log(`📨 Respuesta: ${data.toString().trim()}`);
});

socket.on('close', () => {
    console.log(`\n========================================`);
    console.log(`  RESET COMPLETADO ✅`);
    console.log(`========================================\n`);
    console.log(`⚡ PASOS AHORA:\n`);
    console.log(`1️⃣  APAGAR completamente la impresora`);
    console.log(`   (Desconectar cable 10 segundos)\n`);
    console.log(`2️⃣  ENCENDER la impresora`);
    console.log(`   Mantén FEED presionado al encender\n`);
    console.log(`3️⃣  SOLTAR FEED cuando parpadee la luz\n`);
    console.log(`4️⃣  ESPERAR calibración\n`);
    console.log(`5️⃣  REINICIAR SERVIDOR\n`);
    console.log(`   node server.js\n`);
    console.log(`✅ Ahora Godex aceptará nuestro ZPL completo`);
    console.log(`========================================\n`);
});

socket.on('error', (err) => {
    console.error(`❌ Error de conexión: ${err.message}`);
    console.log(`\n📍 Verifica:`);
    console.log(`   • IP Godex: ${GODEX_IP}`);
    console.log(`   • Puerto: ${GODEX_PORT}`);
    console.log(`   • Impresora encendida y conectada a red`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`⏱️ Timeout - Impresora no responde`);
    socket.destroy();
    process.exit(1);
});
