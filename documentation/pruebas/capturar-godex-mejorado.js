// ============================================
// CAPTURADOR MEJORADO - COMANDOS DE CORTE GODEX
// Intercepta comandos de GoLabel y analiza corte
// ============================================

const net = require('net');
const fs = require('fs');

console.log('🎯 CAPTURADOR MEJORADO - COMANDOS DE CORTE');
console.log('==========================================');
console.log('');
console.log('📡 Servidor TCP escuchando en puerto 9100...');
console.log('');
console.log('INSTRUCCIONES ESPECÍFICAS PARA CORTE:');
console.log('1. En GoLabel → Configurar impresora');
console.log('2. Cambiar "Etiquetas por corte" → "Batch Cut"');
console.log('3. Configurar "Double Cut Setup" → 1 etiqueta');
console.log('4. Cambiar IP impresora en GoLabel a: 192.168.1.22 (esta PC)');
console.log('5. Diseñar una etiqueta simple');
console.log('6. IMPRIMIR desde GoLabel');
console.log('7. Este script analizará los comandos de corte');
console.log('');
console.log('⏳ Esperando conexión de GoLabel...');
console.log('');

const server = net.createServer((socket) => {
    console.log('✅ GoLabel conectado!');
    console.log('📥 Capturando datos con análisis de corte...');
    console.log('');
    
    let data = '';
    let chunkCount = 0;
    
    socket.on('data', (chunk) => {
        chunkCount++;
        data += chunk.toString();
        
        console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes`);
        
        // Analizar en tiempo real si contiene comandos de corte
        const chunkStr = chunk.toString();
        
        // Buscar comandos de corte específicos
        const comandosCorte = [
            '~C',           // Comando básico de corte EZPL
            '^S,CUT',       // Configuración de corte
            '^MC',          // Media Cut (ZPL)
            '^MMC',         // Media Mode Cut (ZPL)
            'CUT',          // Cualquier referencia a CUT
            'BATCH',        // Configuración batch
            '~CUT',         // Variante de comando de corte
        ];
        
        let comandosEncontrados = [];
        comandosCorte.forEach(cmd => {
            if (chunkStr.includes(cmd)) {
                comandosEncontrados.push(cmd);
            }
        });
        
        if (comandosEncontrados.length > 0) {
            console.log(`🔥 COMANDOS DE CORTE DETECTADOS: ${comandosEncontrados.join(', ')}`);
            console.log(`   Contenido del chunk: "${chunkStr.substring(0, 200)}..."`);
        }
        
        // Mostrar primeros caracteres de cada chunk
        const preview = chunkStr.substring(0, 50).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
        console.log(`   Vista previa: "${preview}"`);
    });
    
    socket.on('end', () => {
        console.log('');
        console.log('✅ Captura completada!');
        console.log(`📊 Total capturado: ${data.length} caracteres en ${chunkCount} chunks`);
        console.log('');
        
        // Análisis detallado de comandos de corte
        console.log('🔍 ANÁLISIS DETALLADO DE COMANDOS DE CORTE:');
        console.log('==========================================');
        
        const lines = data.split(/[\r\n]+/).filter(line => line.trim());
        let cortesEncontrados = 0;
        
        lines.forEach((line, index) => {
            const lineTrimmed = line.trim();
            
            // Analizar líneas que contienen comandos de corte
            if (lineTrimmed.includes('~C') || 
                lineTrimmed.includes('^S,CUT') || 
                lineTrimmed.includes('^MC') || 
                lineTrimmed.includes('CUT') ||
                lineTrimmed.includes('BATCH')) {
                
                cortesEncontrados++;
                console.log(`   Línea ${index + 1}: ${lineTrimmed}`);
            }
        });
        
        console.log('');
        console.log(`📋 Total de líneas con comandos de corte: ${cortesEncontrados}`);
        console.log('');
        
        // Guardar archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `godex_captura_corte_${timestamp}.txt`;
        fs.writeFileSync(filename, data);
        
        console.log(`💾 Guardado completo en: ${filename}`);
        console.log('');
        
        // Análisis de estructura
        console.log('📋 ANÁLISIS DE ESTRUCTURA:');
        console.log('─'.repeat(60));
        
        // Mostrar primeras 20 líneas
        const primerasLineas = lines.slice(0, 20);
        primerasLineas.forEach((line, index) => {
            const preview = line.length > 60 ? line.substring(0, 60) + '...' : line;
            console.log(`${String(index + 1).padStart(2)}: ${preview}`);
        });
        
        if (lines.length > 20) {
            console.log(`... (${lines.length - 20} líneas más)`);
        }
        
        console.log('─'.repeat(60));
        console.log('');
        
        // Recomendaciones basadas en el análisis
        if (cortesEncontrados > 0) {
            console.log('🎉 ¡COMANDOS DE CORTE DETECTADOS!');
            console.log('');
            console.log('📝 PRÓXIMOS PASOS:');
            console.log('1. Revisar el archivo guardado para comandos específicos');
            console.log('2. Integrar estos comandos en el sistema principal');
            console.log('3. Probar los comandos directamente con la impresora');
            console.log('');
        } else {
            console.log('⚠️  NO se detectaron comandos de corte específicos');
            console.log('');
            console.log('🔧 POSIBLES CAUSAS:');
            console.log('• GoLabel no está configurado para usar corte');
            console.log('• Los comandos están en formato binario/hexadecimal');
            console.log('• La configuración de corte no está activada');
            console.log('');
            console.log('📝 SOLUCIONES:');
            console.log('1. Verificar configuración "Batch Cut" en GoLabel');
            console.log('2. Revisar "Double Cut Setup"');
            console.log('3. Intentar con otro diseño de etiqueta');
            console.log('');
        }
    });
    
    socket.on('error', (err) => {
        console.error('❌ Error:', err.message);
    });
});

server.listen(9101, '0.0.0.0', () => {
    console.log('🚀 Capturador mejorado listo en puerto 9101!');
    console.log('');
    console.log('📍 IP para configurar en GoLabel: 192.168.1.22');
    console.log('📍 Puerto: 9101');
    console.log('');
    console.log('⏰ Esperando que GoLabel envíe datos...');
    console.log('   (Presiona Ctrl+C para salir cuando termines)');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('❌ ERROR: Puerto 9101 ya está en uso');
        console.error('');
        console.error('🔧 SOLUCIONES:');
        console.error('1. Cierra cualquier programa que use puerto 9101');
        console.error('2. O ejecuta: netstat -ano | findstr :9101');
        console.error('3. Mata el proceso con: taskkill /PID <numero> /F');
        process.exit(1);
    } else {
        console.error('❌ Error del servidor:', err.message);
        process.exit(1);
    }
});