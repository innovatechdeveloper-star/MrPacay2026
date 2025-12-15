// =====================================================
// VERIFICAR QUE GODEX NO TENGA CONFIG GUARDADA
// =====================================================

const net = require('net');

const GODEX_IP = '192.168.15.35';
const GODEX_PORT = 9100;

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  DIAGNÓSTICO: Verificar Godex Limpia             ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log(`🔍 Verificando: ${GODEX_IP}:${GODEX_PORT}\n`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado\n');
    console.log('📤 Solicitando estado de configuración...\n');
    
    // Comando de diagnóstico
    socket.write('~HS\n');
    
    setTimeout(() => {
        socket.end();
    }, 3000);
});

socket.on('data', (data) => {
    const response = data.toString();
    console.log('📨 Respuesta de Godex:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));
    console.log('');
    
    // Análisis de respuesta
    console.log('🔍 ANÁLISIS:\n');
    
    if (response.includes('ZPL') || response.includes('EMULATION: ZPL')) {
        console.log('✅ Modo ZPL: ACTIVO');
    } else if (response.includes('EZPL')) {
        console.log('❌ Modo EZPL: La impresora está en modo nativo');
        console.log('   Ejecutar: node forzar-zpl-godex.js');
    } else {
        console.log('⚠️  No se pudo determinar el modo');
    }
    
    // Verificar configuración guardada
    if (response.includes('STORED') && !response.includes('NONE')) {
        console.log('❌ Configuración guardada: DETECTADA');
        console.log('   La impresora tiene config en memoria flash');
        console.log('   Ejecutar: node forzar-zpl-godex.js');
    } else {
        console.log('✅ Configuración guardada: NINGUNA');
        console.log('   Impresora limpia, lee solo ZPL que enviamos');
    }
    
    console.log('');
});

socket.on('close', () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('  FIN DEL DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════════\n');
});

socket.on('error', (error) => {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.log('\nPosibles causas:');
    console.log('  • Impresora apagada');
    console.log('  • IP incorrecta (verificar: ping 192.168.15.35)');
    console.log('  • Puerto bloqueado por firewall\n');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('\n⏱️ TIMEOUT: La impresora no respondió\n');
    socket.destroy();
    process.exit(1);
});
