// =====================================================
// TEST SIMPLE CORTE GODEX
// =====================================================

const net = require('net');

function enviarComando(comando) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        
        socket.connect(9100, '192.168.1.35', () => {
            console.log(`🔗 Conectado`);
            socket.write(comando);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Enviado`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ Error:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ Timeout`);
            socket.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testCorte() {
    console.log('🔧 TEST CORTE SIMPLE');
    console.log('====================');
    
    try {
        // Primero enviar una etiqueta simple
        const etiquetaSimple = `^Q50,30\r\n^W50\r\n^H8\r\n^P1\r\n^S4\r\n^AD\r\n^C1\r\n^R0\r\n~Q+0\r\n^O0\r\n^Db\r\n^E18\r\n~R255\r\n^C1\r\n^D0\r\n^D1\r\n^L\r\nAF,32,54,1,3,0,0E,TEST CORTE\r\nE\r\n`;
        
        console.log('📄 1. Enviando etiqueta...');
        await enviarComando(etiquetaSimple);
        
        console.log('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Luego enviar comando de corte
        console.log('✂️ 2. Enviando comando de corte...');
        await enviarComando('^XSETCUT,DOUBLECUT,0\r\n');
        
        console.log('');
        console.log('🎯 ¿Se cortó la etiqueta después del comando de corte?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCorte();