// ============================================
// INTEGRACIÓN GUILLOTINA CON SISTEMA PRINCIPAL
// Modificar el server.js para incluir corte automático
// ============================================

const net = require('net');

console.log('🔧 INTEGRACIÓN DE GUILLOTINA AL SISTEMA');
console.log('======================================');
console.log('');
console.log('Este script te ayuda a integrar la guillotina con el sistema principal.');
console.log('');

// Función para Godex con guillotina
function enviarComandoGodexConCorte(comando, callback) {
    const GODEX_IP = '192.168.1.35';
    const GODEX_PORT = 9100;
    
    console.log(`📡 Enviando a Godex (${GODEX_IP}:${GODEX_PORT}) con corte automático...`);
    
    const socket = new net.Socket();
    socket.setTimeout(10000);
    
    socket.connect(GODEX_PORT, GODEX_IP, () => {
        console.log('✅ Conectado a Godex G530');
        
        // Agregar comando de corte al final
        const comandoConCorte = comando + '\n~C\n'; // ~C = cortar inmediatamente
        
        socket.write(comandoConCorte);
        
        setTimeout(() => {
            socket.end();
        }, 2000);
    });
    
    socket.on('data', (data) => {
        console.log('📥 Respuesta:', data.toString().trim());
    });
    
    socket.on('close', () => {
        console.log('🔌 Conexión cerrada - Etiqueta enviada con corte automático');
        if (callback) callback(null, 'success');
    });
    
    socket.on('error', (error) => {
        console.error('❌ Error:', error.message);
        if (callback) callback(error, null);
    });
    
    socket.on('timeout', () => {
        console.error('⏱️ Timeout');
        socket.destroy();
        if (callback) callback(new Error('Timeout'), null);
    });
}

// Test de la función
console.log('🧪 PROBANDO FUNCIÓN DE INTEGRACIÓN...');
console.log('');

const comandoPrueba = `
^XA
^FO50,50^ADN,36,20^FDTEST INTEGRACIÓN^FS
^FO50,100^ADN,24,12^FD${new Date().toLocaleString()}^FS
^FO50,150^ADN,18,10^FDGUILLOTINA INTEGRADA OK^FS
^XZ`;

enviarComandoGodexConCorte(comandoPrueba, (error, result) => {
    if (error) {
        console.log('❌ Error en integración:', error.message);
    } else {
        console.log('✅ Integración exitosa!');
        console.log('');
        console.log('==========================================');
        console.log('  CÓDIGO PARA INTEGRAR EN SERVER.JS');
        console.log('==========================================');
        console.log('');
        console.log('Busca la función que envía comandos a Godex en server.js');
        console.log('y agrega esto al final del comando ZPL:');
        console.log('');
        console.log('// Agregar corte automático para Godex');
        console.log('if (printerIP === "192.168.1.35") {');
        console.log('    comandoZPL += "\\n~C\\n"; // Comando de corte');
        console.log('}');
        console.log('');
        console.log('Esto hará que TODAS las etiquetas de Godex se corten automáticamente.');
        console.log('');
    }
});

// Exportar función para usar en server.js
module.exports = {
    enviarComandoGodexConCorte
};