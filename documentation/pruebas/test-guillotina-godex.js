// ============================================
// TEST DE GUILLOTINA GODEX G530
// Verificar que el cortador automático funciona
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 TEST DE GUILLOTINA GODEX G530');
console.log('================================');
console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);
console.log('');

// Comandos para probar la guillotina
const testCommands = [
    // 1. Limpiar buffer
    '^XA',
    '^XZ',
    
    // 2. Comando específico de guillotina
    // ~C = Cortar ahora (comando inmediato)
    '~C',
    
    // 3. Etiqueta de prueba con corte automático
    '^XA',
    '^FO50,50^ADN,36,20^FDTEST GUILLOTINA^FS',
    '^FO50,100^ADN,24,12^FD' + new Date().toLocaleString() + '^FS',
    '^FO50,150^ADN,18,10^FDSI VES ESTO, LA GUILLOTINA FUNCIONA^FS',
    '^XZ'
].join('\n') + '\n';

const socket = new net.Socket();
socket.setTimeout(15000);

let responseData = '';

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando comandos de test...');
    console.log('');
    console.log('Comandos enviados:');
    console.log('1. Comando de corte inmediato (~C)');
    console.log('2. Etiqueta de prueba con texto');
    console.log('3. La etiqueta debería imprimirse Y cortarse automáticamente');
    console.log('');
    
    socket.write(testCommands);
    
    setTimeout(() => {
        console.log('✅ Comandos enviados exitosamente');
        console.log('');
        console.log('==========================================');
        console.log('  VERIFICA FÍSICAMENTE:');
        console.log('==========================================');
        console.log('');
        console.log('✅ ¿Se imprimió una etiqueta con texto "TEST GUILLOTINA"?');
        console.log('✅ ¿La etiqueta se cortó automáticamente?');
        console.log('✅ ¿Escuchaste el sonido de la guillotina cortando?');
        console.log('');
        console.log('Si SÍ a las 3 preguntas: ¡GUILLOTINA FUNCIONANDO! 🎉');
        console.log('Si NO: Revisa conexiones del cable blanco y configuración.');
        console.log('');
        
        socket.end();
    }, 3000);
});

socket.on('data', (data) => {
    responseData += data.toString();
    console.log('📥 Respuesta de impresora:', data.toString().trim());
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  RESULTADO DEL TEST');
    console.log('==========================================');
    console.log('');
    
    if (responseData.length > 0) {
        console.log('📊 Datos recibidos de la impresora:');
        console.log(responseData);
        console.log('');
    }
    
    console.log('PRÓXIMO PASO:');
    console.log('Si la guillotina NO funcionó, ejecuta:');
    console.log('   node configurar-guillotina-godex.js');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('SOLUCIÓN:');
    console.log('1. Verifica que la impresora esté encendida');
    console.log('2. Verifica la IP: 192.168.1.35');
    console.log('3. Verifica que el cable de red esté conectado');
    console.log('4. Prueba hacer ping: ping 192.168.1.35');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout de conexión');
    console.log('La impresora no respondió en 15 segundos');
    socket.destroy();
    process.exit(1);
});