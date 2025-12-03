// =====================================================
// TEST COMANDOS EXACTOS DE GOLABEL - SOLO AJUSTAR MEDIDAS
// =====================================================
// Usar comandos que SÍ funcionaron, solo cambiar medidas

const net = require('net');

function enviarComandosGoLabel() {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(9100, '192.168.1.35', () => {
            console.log(`🔗 [Godex] Conectado`);
            
            // ✂️ COMANDOS EXACTOS DE GOLABEL QUE SÍ CORTARON
            // Solo cambié ^Q50,30 -> ^Q59,35 para etiquetas más grandes
            const comandosOriginales = `^XSETCUT,DOUBLECUT,0
^Q59,35
^W50
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
AF,32,54,1,3,0,0E,CAMITEX ALMOHADA
AF,32,228,1,3,0,0E,TELA: TC
AF,32,402,1,3,0,0E,MODELO: KING
E
`;

            console.log(`✂️ [Godex] Enviando comandos exactos de GoLabel (medidas ajustadas)`);
            console.log(`📋 Comandos (${comandosOriginales.length} chars):`);
            console.log(comandosOriginales);
            
            socket.write(comandosOriginales);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ [Godex] Comandos enviados`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ [Godex] Error:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ [Godex] Timeout`);
            socket.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testComandosOriginales() {
    console.log('🚀 TEST COMANDOS EXACTOS DE GOLABEL');
    console.log('===================================');
    console.log('📋 Usando comandos que SÍ cortaron antes');
    console.log('🔧 Solo ajustando medidas de etiqueta');
    console.log('');
    
    try {
        await enviarComandosGoLabel();
        
        console.log('');
        console.log('🎯 VERIFICACIÓN:');
        console.log('✅ ¿Se imprimió la etiqueta CAMITEX?');
        console.log('✅ ¿Se cortó automáticamente?');
        console.log('✅ ¿Las medidas son más grandes (50mm+)?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testComandosOriginales();