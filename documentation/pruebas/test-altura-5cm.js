// =====================================================
// TEST ALTURA EXACTA 5CM - DIFERENTES CONFIGURACIONES
// =====================================================

const net = require('net');

function enviarConfiguracion(alturaQ, gap, descripcion) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(9100, '192.168.1.35', () => {
            console.log(`🔗 Probando: ${descripcion}`);
            
            const comandos = `^XSETCUT,DOUBLECUT,0
^Q${alturaQ},${gap}
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
AF,32,54,1,2,0,0E,TEST ${descripcion}
AF,32,150,1,2,0,0E,ALTURA: ${alturaQ}mm
AF,32,200,1,2,0,0E,GAP: ${gap}mm
E
`;

            console.log(`📏 ^Q${alturaQ},${gap} - ${descripcion}`);
            socket.write(comandos);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ ${descripcion} enviado`);
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

async function testAlturas() {
    console.log('🚀 TEST ALTURAS PARA 5CM EXACTOS');
    console.log('=================================');
    
    try {
        // Configuración 1: ^Q50,3 (50mm etiqueta + 3mm gap)
        await enviarConfiguracion(50, 3, 'CONFIG A');
        console.log('⏳ Esperando 3 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Configuración 2: ^Q47,3 (47mm etiqueta + 3mm gap = 50mm total)
        await enviarConfiguracion(47, 3, 'CONFIG B');
        console.log('⏳ Esperando 3 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Configuración 3: ^Q45,2 (45mm etiqueta + 2mm gap = 47mm total)
        await enviarConfiguracion(45, 2, 'CONFIG C');
        console.log('⏳ Esperando 3 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Configuración 4: ^Q42,3 (42mm etiqueta + 3mm gap = 45mm total)
        await enviarConfiguracion(42, 3, 'CONFIG D');
        
        console.log('\n🎯 MEDIR CADA ETIQUETA:');
        console.log('📏 CONFIG A: ¿Cuántos cm mide?');
        console.log('📏 CONFIG B: ¿Cuántos cm mide?');
        console.log('📏 CONFIG C: ¿Cuántos cm mide?');
        console.log('📏 CONFIG D: ¿Cuántos cm mide?');
        console.log('\n✂️ ¿Cuál mide exactamente 5cm?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAlturas();