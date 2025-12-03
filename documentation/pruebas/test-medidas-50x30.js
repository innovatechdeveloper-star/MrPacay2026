// =====================================================
// TEST MEDIDAS CORRECTAS - 50mm x 30mm
// =====================================================

const net = require('net');

function enviarEtiqueta50x30() {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(9100, '192.168.1.35', () => {
            console.log(`🔗 Conectado a Godex`);
            
            // ✂️ COMANDOS DE GOLABEL CON MEDIDAS EXACTAS CAMITEX
            const comandos = `^XSETCUT,DOUBLECUT,0
^Q50,30
^W30
^H8
^P1
^S4
^AD
^C1
^R0
~Q+0
^O0
^Db
^E18
~R255
^C1
^D0
^D1
^L
Dy2-me-dd
Th:m:s
AF,32,54,1,3,0,0E,CAMITEX 50x30mm
AF,32,228,1,3,0,0E,MEDIDAS EXACTAS
AF,32,402,1,3,0,0E,CON CORTE
E
`;

            console.log(`📏 Enviando etiqueta 50mm x 30mm con corte`);
            socket.write(comandos);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Etiqueta enviada`);
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

async function testMedidasCorrectas() {
    console.log('🚀 TEST MEDIDAS CORRECTAS 50mm x 30mm');
    console.log('======================================');
    
    try {
        await enviarEtiqueta50x30();
        
        console.log('');
        console.log('🎯 VERIFICACIÓN:');
        console.log('✅ ¿La etiqueta mide 50mm de largo?');
        console.log('✅ ¿La etiqueta mide 30mm de ancho?');
        console.log('✅ ¿Se cortó automáticamente?');
        console.log('❌ ¿NO imprime 290mm ni medidas raras?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testMedidasCorrectas();