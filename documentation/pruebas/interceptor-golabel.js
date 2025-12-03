const net = require('net');
const fs = require('fs');

const PUERTO_ESCUCHA = 9100;  // Puerto donde GoLabel enviará
const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9101;  // Puerto REAL de la impresora (cámbialo si es necesario)

let contadorCaptura = 1;

console.log('🕵️ INTERCEPTOR DE COMANDOS GODEX\n');
console.log('📡 Configuración:');
console.log(`   Escuchando en: 0.0.0.0:${PUERTO_ESCUCHA}`);
console.log(`   Reenviando a: ${GODEX_IP}:${GODEX_PORT}\n`);
console.log('⚠️ IMPORTANTE:');
console.log('   1. Configura GoLabel para imprimir a: localhost:9100');
console.log('   2. Imprime una etiqueta CON GRÁFICO desde GoLabel');
console.log('   3. Este script capturará los comandos y los mostrará\n');
console.log('🚀 Servidor iniciado. Esperando conexión de GoLabel...\n');

const server = net.createServer((clientSocket) => {
    console.log(`✅ Conexión recibida de GoLabel (${clientSocket.remoteAddress}:${clientSocket.remotePort})\n`);
    
    let datosCapturados = Buffer.alloc(0);
    
    // Crear socket para reenviar a la impresora real
    const printerSocket = new net.Socket();
    
    // Conectar a la impresora real
    printerSocket.connect(GODEX_PORT, GODEX_IP, () => {
        console.log(`🔗 Conectado a impresora real ${GODEX_IP}:${GODEX_PORT}\n`);
    });
    
    // Capturar datos de GoLabel
    clientSocket.on('data', (data) => {
        console.log(`📥 Datos recibidos (${data.length} bytes):`);
        console.log('─'.repeat(80));
        
        // Acumular datos
        datosCapturados = Buffer.concat([datosCapturados, data]);
        
        // Mostrar como texto
        const textoLegible = data.toString('utf8');
        console.log('📄 Como texto:');
        console.log(textoLegible);
        console.log('\n');
        
        // Mostrar primeros 200 bytes en hexadecimal
        const hexData = data.toString('hex').toUpperCase();
        console.log('🔢 Como hexadecimal (primeros 200 bytes):');
        console.log(hexData.substring(0, 400));
        if (hexData.length > 400) {
            console.log(`... (total: ${hexData.length / 2} bytes)`);
        }
        console.log('\n');
        
        // Reenviar a impresora real
        printerSocket.write(data);
        console.log(`✅ Reenviado a impresora real\n`);
        console.log('═'.repeat(80));
        console.log('\n');
    });
    
    // Cuando GoLabel termine
    clientSocket.on('end', () => {
        console.log('🔚 GoLabel cerró la conexión\n');
        
        // Guardar captura completa
        const nombreArchivo = `captura-golabel-${contadorCaptura}.txt`;
        const nombreHex = `captura-golabel-${contadorCaptura}.hex`;
        const nombreBin = `captura-golabel-${contadorCaptura}.bin`;
        
        fs.writeFileSync(nombreArchivo, datosCapturados.toString('utf8'));
        fs.writeFileSync(nombreHex, datosCapturados.toString('hex').toUpperCase());
        fs.writeFileSync(nombreBin, datosCapturados);
        
        console.log('💾 Captura guardada:');
        console.log(`   - ${nombreArchivo} (texto legible)`);
        console.log(`   - ${nombreHex} (hexadecimal)`);
        console.log(`   - ${nombreBin} (binario raw)`);
        console.log(`   Total: ${datosCapturados.length} bytes\n`);
        
        contadorCaptura++;
        
        printerSocket.end();
        console.log('🎉 ¡Listo! Analiza los archivos capturados\n');
        console.log('💡 Para capturar otra etiqueta, imprime de nuevo desde GoLabel\n');
    });
    
    // Errores
    clientSocket.on('error', (err) => {
        console.error('❌ Error con GoLabel:', err.message);
        printerSocket.end();
    });
    
    printerSocket.on('error', (err) => {
        console.error('❌ Error con impresora:', err.message);
        clientSocket.end();
    });
});

server.listen(PUERTO_ESCUCHA, () => {
    console.log('═'.repeat(80));
    console.log('');
    console.log('   ⏳ Esperando que GoLabel envíe una etiqueta...');
    console.log('');
    console.log('═'.repeat(80));
    console.log('\n');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Puerto ${PUERTO_ESCUCHA} ya está en uso`);
        console.log('\n💡 Soluciones:');
        console.log('   1. Cierra cualquier programa usando el puerto 9100');
        console.log('   2. Cambia PUERTO_ESCUCHA en este script a otro (ej: 9102)');
    } else {
        console.error('❌ Error del servidor:', err);
    }
});
