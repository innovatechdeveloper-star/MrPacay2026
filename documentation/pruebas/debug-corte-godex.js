// =====================================================
// DEBUG CORTE AUTOMÁTICO - DIFERENTES CONFIGURACIONES
// =====================================================
// Probar distintas configuraciones para el corte

const net = require('net');

function enviarComandos(comandos, descripcion) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        console.log(`\n🔧 PROBANDO: ${descripcion}`);
        console.log(`📋 Comandos: ${comandos}`);
        
        socket.connect(9100, '192.168.1.35', () => {
            console.log(`🔗 Conectado a Godex`);
            socket.write(comandos);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Comandos enviados`);
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

async function probarConfiguraciones() {
    console.log('🚀 DEBUG CORTE AUTOMÁTICO GODEX G530');
    console.log('=====================================');
    
    try {
        // CONFIGURACIÓN 1: Como GoLabel original
        await enviarComandos(
            '^XSETCUT,DOUBLECUT,0\r\n^Q50,30\r\n^W50\r\n^H8\r\n^P1\r\n^S4\r\n^AD\r\n^C1\r\n^R0\r\n~Q+0\r\n^O0\r\n^Db\r\n^E18\r\n~R255\r\n^C1\r\n^D0\r\n^D1\r\n^L\r\nDy2-me-dd\r\nTh:m:s\r\nAF,32,54,1,3,0,0E,PRUEBA CORTE 1\r\nE\r\n',
            'CONFIG 1: Como GoLabel original'
        );
        
        console.log('\n⏳ Esperando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // CONFIGURACIÓN 2: Corte al final
        await enviarComandos(
            '^Q50,30\r\n^W50\r\n^H8\r\n^P1\r\n^S4\r\n^AD\r\n^C1\r\n^R0\r\n~Q+0\r\n^O0\r\n^Db\r\n^E18\r\n~R255\r\n^C1\r\n^D0\r\n^D1\r\n^L\r\nDy2-me-dd\r\nTh:m:s\r\nAF,32,54,1,3,0,0E,PRUEBA CORTE 2\r\nE\r\n^XSETCUT,DOUBLECUT,0\r\n',
            'CONFIG 2: Corte al final'
        );
        
        console.log('\n⏳ Esperando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // CONFIGURACIÓN 3: Solo comando de corte
        await enviarComandos(
            '^XSETCUT,DOUBLECUT,0\r\n',
            'CONFIG 3: Solo comando de corte'
        );
        
        console.log('\n⏳ Esperando 3 segundos...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // CONFIGURACIÓN 4: Corte simple
        await enviarComandos(
            '^Q50,30\r\n^W50\r\n^H8\r\n^P1\r\n^S4\r\n^AD\r\n^C1\r\n^R0\r\n~Q+0\r\n^O0\r\n^Db\r\n^E18\r\n~R255\r\n^C1\r\n^D0\r\n^D1\r\n^L\r\nDy2-me-dd\r\nTh:m:s\r\nAF,32,54,1,3,0,0E,PRUEBA CORTE 4\r\nE\r\n^XSETCUT,CUT,0\r\n',
            'CONFIG 4: Corte simple (no doble)'
        );
        
        console.log('\n✅ PRUEBAS COMPLETADAS');
        console.log('🎯 VERIFICAR: ¿Cuál de las 4 configuraciones cortó?');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

probarConfiguraciones();