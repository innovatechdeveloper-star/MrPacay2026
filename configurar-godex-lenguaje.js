// ======================================================
// CONFIGURAR GODEX G530 - CAMBIAR A MODO ZPL
// Comandos nativos Godex para cambiar lenguaje
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  CAMBIAR GODEX DE EZPL A ZPL');
console.log('========================================\n');
console.log(`🖨️  Impresora: Godex G530`);
console.log(`🌐 IP: ${GODEX_IP}:${GODEX_PORT}\n`);

// Comandos nativos Godex (~S comandos de setup)
const comandosGodex = [
    '~C',                              // Limpiar buffer
    '~S,LANGUAGE,ZPL',                 // Cambiar lenguaje a ZPL (el comando clave!)
    '~S,RELOAD',                       // Recargar configuración
    '~C'                               // Limpiar buffer nuevamente
].join('\n') + '\n';

console.log('📋 Comandos a enviar:');
console.log('   ~C                    → Limpiar buffer');
console.log('   ~S,LANGUAGE,ZPL       → CAMBIAR A MODO ZPL');
console.log('   ~S,RELOAD             → Aplicar configuración');
console.log('   ~C                    → Limpiar buffer\n');

const socket = new net.Socket();
socket.setTimeout(15000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log(`✅ Conectado a Godex G530\n`);
    console.log(`📤 Enviando comandos de configuración...`);
    
    socket.write(comandosGodex, (err) => {
        if (err) {
            console.error(`❌ Error: ${err.message}`);
            socket.destroy();
            process.exit(1);
        } else {
            console.log(`✅ Comandos enviados correctamente\n`);
            console.log(`⏳ Esperando respuesta de la impresora...`);
            
            setTimeout(() => {
                socket.end();
            }, 3000);
        }
    });
});

socket.on('data', (data) => {
    console.log(`📨 Respuesta: ${data.toString().trim()}`);
});

socket.on('close', () => {
    console.log(`\n========================================`);
    console.log(`  ✅ CONFIGURACIÓN ENVIADA`);
    console.log(`========================================`);
    console.log(`\n🔄 PASOS OBLIGATORIOS AHORA:\n`);
    console.log(`1️⃣  APAGAR y ENCENDER la impresora Godex`);
    console.log(`   (Es necesario para que los cambios surtan efecto)\n`);
    console.log(`2️⃣  Presionar FEED 3 veces`);
    console.log(`   (Para calibrar el sensor de etiquetas)\n`);
    console.log(`3️⃣  Verificar luz VERDE encendida\n`);
    console.log(`4️⃣  Ejecutar prueba:`);
    console.log(`   node test-godex-zpl.js\n`);
    console.log(`========================================`);
    console.log(`\n📝 Si la etiqueta de prueba sale:`);
    console.log(`   ✅ CON TEXTO  → Configuración exitosa`);
    console.log(`   ❌ EN BLANCO  → Repite los pasos o configura manualmente`);
    console.log(`\n🔧 Configuración manual alternativa:`);
    console.log(`   Panel → Setup → Language → ZPL`);
    console.log(`========================================\n`);
});

socket.on('error', (error) => {
    console.error(`\n❌ ERROR DE CONEXIÓN:`);
    console.error(`   ${error.message}\n`);
    console.error(`📋 Verifica:`);
    console.error(`   1. Impresora encendida`);
    console.error(`   2. Cable de red conectado`);
    console.error(`   3. IP correcta: ${GODEX_IP}`);
    console.error(`   4. Puerto abierto: ${GODEX_PORT}`);
    console.error(`   5. ping ${GODEX_IP}\n`);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error(`\n⏱️ TIMEOUT`);
    console.error(`La impresora no responde\n`);
    socket.destroy();
    process.exit(1);
});
