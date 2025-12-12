// ============================================
// CAPTURADOR FORZADO - PUERTO 9100
// Mata procesos en puerto 9100 y captura comandos
// ============================================

const net = require('net');
const fs = require('fs');
const { exec } = require('child_process');

console.log('CAPTURADOR FORZADO - PUERTO 9100');
console.log('===================================');
console.log('');

// Función para matar procesos en puerto 9100
function liberarPuerto9100() {
    return new Promise((resolve) => {
        console.log('Liberando puerto 9100...');
        
        exec('netstat -ano | findstr :9100', (error, stdout, stderr) => {
            if (stdout) {
                const lines = stdout.split('\n');
                const pids = [];
                
                lines.forEach(line => {
                    const match = line.match(/LISTENING\s+(\d+)/);
                    if (match) {
                        pids.push(match[1]);
                    }
                });
                
                if (pids.length > 0) {
                    console.log(`   📋 Procesos encontrados: ${pids.join(', ')}`);
                    
                    pids.forEach(pid => {
                        exec(`taskkill /PID ${pid} /F`, (err) => {
                            if (!err) {
                                console.log(`   ✅ Proceso ${pid} terminado`);
                            }
                        });
                    });
                    
                    setTimeout(resolve, 2000);
                } else {
                    console.log('   ✅ Puerto 9100 ya está libre');
                    resolve();
                }
            } else {
                console.log('   ✅ Puerto 9100 disponible');
                resolve();
            }
        });
    });
}

// Función principal del capturador
async function iniciarCapturador() {
    await liberarPuerto9100();
    
    console.log('');
    console.log('📡 Iniciando capturador en puerto 9100...');
    console.log('');
    
    const server = net.createServer((socket) => {
        console.log('🎉 ¡GOLABEL CONECTADO!');
        console.log('📥 Capturando comandos de corte...');
        console.log('');
        
        let data = '';
        let chunkCount = 0;
        const startTime = Date.now();
        
        socket.on('data', (chunk) => {
            chunkCount++;
            data += chunk.toString();
            
            const chunkStr = chunk.toString();
            console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes`);
            
            // Buscar comandos de corte en tiempo real
            const comandosCorte = ['~C', '^S,CUT', '^MC', 'CUT', 'BATCH', '~CUT', 'E\\r\\n', 'E\\n'];
            
            let comandosEncontrados = [];
            comandosCorte.forEach(cmd => {
                if (chunkStr.includes(cmd) || chunkStr.includes(cmd.replace('\\r\\n', '\r\n').replace('\\n', '\n'))) {
                    comandosEncontrados.push(cmd);
                }
            });
            
            if (comandosEncontrados.length > 0) {
                console.log(`🔥 COMANDOS DE CORTE: ${comandosEncontrados.join(', ')}`);
            }
            
            // Mostrar contenido legible
            const preview = chunkStr.replace(/\r/g, '↵').replace(/\n/g, '⏎').substring(0, 80);
            console.log(`   📄 Contenido: "${preview}"`);
        });
        
        socket.on('end', () => {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log('');
            console.log('✅ CAPTURA COMPLETADA!');
            console.log(`📊 Duración: ${duration}s`);
            console.log(`📊 Total: ${data.length} caracteres en ${chunkCount} chunks`);
            console.log('');
            
            // Análisis completo
            console.log('🔍 ANÁLISIS COMPLETO DE COMANDOS:');
            console.log('='.repeat(50));
            
            // Guardar archivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `captura_golabel_${timestamp}.txt`;
            fs.writeFileSync(filename, data);
            console.log(`💾 Guardado en: ${filename}`);
            console.log('');
            
            // Análisis línea por línea
            const lines = data.split(/[\r\n]+/).filter(line => line.trim());
            console.log('📋 COMANDOS CAPTURADOS (línea por línea):');
            console.log('-'.repeat(50));
            
            lines.forEach((line, index) => {
                if (line.trim()) {
                    console.log(`${String(index + 1).padStart(3)}: ${line}`);
                }
            });
            
            console.log('-'.repeat(50));
            console.log('');
            
            // Buscar comandos específicos de corte
            let comandosCorteEncontrados = [];
            const textCompleto = data.toString();
            
            if (textCompleto.includes('~C')) comandosCorteEncontrados.push('~C (Corte EZPL)');
            if (textCompleto.includes('^S,CUT')) comandosCorteEncontrados.push('^S,CUT (Config corte)');
            if (textCompleto.includes('^MC')) comandosCorteEncontrados.push('^MC (Media Cut ZPL)');
            if (textCompleto.match(/E[\r\n]/)) comandosCorteEncontrados.push('E (Fin formato EZPL)');
            
            if (comandosCorteEncontrados.length > 0) {
                console.log('🎉 ¡COMANDOS DE CORTE DETECTADOS!');
                comandosCorteEncontrados.forEach(cmd => {
                    console.log(`   ✅ ${cmd}`);
                });
                console.log('');
                console.log('📝 PRÓXIMO PASO: Integrar estos comandos en el sistema');
            } else {
                console.log('⚠️  No se detectaron comandos de corte específicos');
                console.log('📝 Revisar configuración "Batch Cut" en GoLabel');
            }
            
            console.log('');
            console.log('🔄 Capturador sigue activo para más pruebas...');
        });
        
        socket.on('error', (err) => {
            console.error('❌ Error de socket:', err.message);
        });
    });
    
    server.listen(9100, '0.0.0.0', () => {
        console.log('🚀 CAPTURADOR ACTIVO EN PUERTO 9100');
        console.log('');
        console.log('📍 Configurar en GoLabel:');
        console.log('   IP: 192.168.1.22');
        console.log('   Puerto: 9100');
        console.log('');
        console.log('⏳ Esperando datos de GoLabel...');
        console.log('   (Presiona Ctrl+C cuando termines)');
        console.log('');
    });
    
    server.on('error', (err) => {
        console.error('❌ Error del servidor:', err.message);
        if (err.code === 'EADDRINUSE') {
            console.error('🔧 El puerto aún está ocupado. Reintentando...');
            setTimeout(() => iniciarCapturador(), 3000);
        }
    });
}

iniciarCapturador();