// ======================================================
// CONFIGURAR GODEX G530 - MODO ZPL
// ======================================================
// Este script envía comandos de configuración a la 
// impresora Godex G530 para cambiarla de EZPL a ZPL
// ======================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('========================================');
console.log('  CONFIGURAR GODEX G530 - MODO ZPL');
console.log('========================================\n');

// Comandos de configuración para Godex G530
// Para cambiar de EZPL a emulación ZPL en Godex
const comandosConfiguracion = [
    // Comando 1: Configuración básica ZPL
    '^XA^CI28^XZ',       // UTF-8 encoding
    
    // Comando 2: Establecer lenguaje a ZPL (comando Godex)
    // En Godex el cambio se hace con ^JL (Set Language)
    '^XA^JLZ^XZ',        // JLZ = ZPL mode, JLE = EZPL mode
    
    // Comando 3: Configurar dimensiones de etiqueta
    '^XA^PW354^LL826^LH0,0^LS0^XZ',
    
    // Comando 4: Configurar modo de corte
    '^XA^MMC^XZ',        // Media Mode Cutter
    
    // Comando 5: Configurar tracking y tipo de media
    '^XA^MNM^MTD^XZ',    // Media tracking + Direct thermal
    
    // Comando 6: Guardar configuración permanente
    '^XA^JUS^XZ'         // Save to permanent memory
];

function enviarConfiguracion(comandos, index = 0) {
    if (index >= comandos.length) {
        console.log('\n✅ CONFIGURACIÓN COMPLETADA');
        console.log('========================================');
        console.log('La impresora Godex G530 debería estar en modo ZPL\n');
        console.log('📋 Próximos pasos OBLIGATORIOS:');
        console.log('  1. ⚡ APAGA Y ENCIENDE LA IMPRESORA (para aplicar cambios)');
        console.log('  2. 🔘 Presiona FEED 3 veces para calibrar');
        console.log('  3. 🟢 Espera luz verde');
        console.log('  4. 🧪 Ejecuta: PROBAR-GODEX-ZPL.bat');
        console.log('========================================\n');
        return;
    }

    const comando = comandos[index];
    console.log(`[${index + 1}/${comandos.length}] Enviando: ${comando.substring(0, 30)}...`);

    const socket = new net.Socket();
    socket.setTimeout(15000);  // 15 segundos para que la impresora procese

    socket.connect(GODEX_PORT, GODEX_IP, () => {
        console.log(`    🔗 Conectado a ${GODEX_IP}:${GODEX_PORT}`);
        
        socket.write(comando, (err) => {
            if (err) {
                console.error(`    ❌ Error: ${err.message}`);
                socket.destroy();
                process.exit(1);
            } else {
                console.log(`    ✅ Comando enviado\n`);
                setTimeout(() => {
                    socket.end();
                }, 500);
            }
        });
    });

    socket.on('close', () => {
        console.log(`    ✅ Conexión cerrada\n`);
        // Esperar 2 segundos antes del siguiente comando
        setTimeout(() => {
            enviarConfiguracion(comandos, index + 1);
        }, 2000);
    });

    socket.on('error', (error) => {
        console.error(`\n❌ ERROR DE CONEXIÓN:`);
        console.error(`   ${error.message}`);
        console.error('\n📋 Verifica:');
        console.error('   1. La impresora está encendida');
        console.error('   2. La IP es correcta: ' + GODEX_IP);
        console.error('   3. El cable de red está conectado');
        console.error('   4. La impresora está en la misma red\n');
        process.exit(1);
    });

    socket.on('timeout', () => {
        console.error(`\n⏱️ TIMEOUT - La impresora no responde`);
        socket.destroy();
        process.exit(1);
    });
}

// Iniciar configuración
console.log(`🖨️  Impresora: Godex G530`);
console.log(`🌐 IP: ${GODEX_IP}`);
console.log(`🔌 Puerto: ${GODEX_PORT}`);
console.log(`\n📡 Enviando configuración para modo ZPL...\n`);

enviarConfiguracion(comandosConfiguracion);
