// =====================================================
// TEST DIRECTO GUILLOTINA - COMANDOS MINIMOS
// =====================================================

const net = require('net');

async function testDirecto() {
    console.log('🔧 TEST DIRECTO GUILLOTINA');
    console.log('==========================');
    
    const socket = new net.Socket();
    
    try {
        // Conectar
        await new Promise((resolve, reject) => {
            socket.setTimeout(2000);
            socket.connect(9100, '192.168.1.35', resolve);
            socket.on('error', reject);
            socket.on('timeout', () => reject(new Error('Timeout')));
        });
        
        console.log('🔗 Conectado a Godex');
        
        // Enviar comandos uno por uno
        console.log('📋 1. Configurando corte...');
        socket.write('^XSETCUT,DOUBLECUT,0\r\n');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📋 2. Configurando tamaño...');
        socket.write('^Q50,30\r\n^W50\r\n');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📋 3. Configuración básica...');
        socket.write('^H8\r\n^P1\r\n^S4\r\n');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📋 4. Enviando texto...');
        socket.write('AF,32,54,1,3,0,0E,PRUEBA GUILLOTINA\r\n');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📋 5. Finalizando etiqueta...');
        socket.write('E\r\n');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Comandos enviados');
        console.log('🎯 ¿Se imprimió y cortó la etiqueta?');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        socket.destroy();
    }
}

testDirecto();