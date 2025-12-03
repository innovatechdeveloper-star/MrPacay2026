// =====================================================
// TEST SIMPLE ALTURA 5CM
// =====================================================

const net = require('net');

async function testAltura42mm() {
    console.log('🚀 TEST ALTURA 42mm (para 5cm total)');
    console.log('=====================================');
    
    const socket = new net.Socket();
    
    try {
        await new Promise((resolve, reject) => {
            socket.setTimeout(3000);
            socket.connect(9100, '192.168.1.35', resolve);
            socket.on('error', reject);
            socket.on('timeout', () => reject(new Error('Timeout')));
        });
        
        console.log('🔗 Conectado a Godex');
        
        // Configuración para 5cm exactos
        const comandos = `^XSETCUT,DOUBLECUT,0
^Q42,3
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
AF,32,54,1,2,0,0E,CAMITEX 5CM
AF,32,150,1,2,0,0E,ALTURA: 42mm
AF,32,200,1,2,0,0E,GAP: 3mm
E
`;

        console.log('📏 Enviando configuración ^Q42,3 (42mm + 3mm = 45mm total)');
        socket.write(comandos);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Enviado');
        console.log('');
        console.log('🎯 MEDIR LA ETIQUETA:');
        console.log('📏 ¿Mide exactamente 5cm de largo?');
        console.log('✂️ ¿Se cortó automáticamente?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        socket.destroy();
    }
}

testAltura42mm();