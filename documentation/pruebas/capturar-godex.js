const net = require('net');
const fs = require('fs');

console.log('🎯 CAPTURADOR AVANZADO DE COMANDOS GODEX + CORTE');
console.log('=================================================');
console.log('');
console.log('📡 Servidor TCP escuchando en puerto 9100...');
console.log('');
console.log('INSTRUCCIONES PARA CAPTURAR COMANDOS DE CORTE:');
console.log('1. En GoLabel, cambia la IP de la impresora a: 192.168.1.22 (tu PC)');
console.log('2. IMPORTANTE: Configura corte en GoLabel:');
console.log('   • Archivo → Configuración de impresora');
console.log('   • Post-Print Action → Cut/Cutter');
console.log('   • Corte después de: 1 etiqueta');
console.log('3. Imprime tu etiqueta desde GoLabel CON CORTE activado');
console.log('4. Este script analizará comandos de corte específicamente');
console.log('5. Presiona Ctrl+C para salir');
console.log('');
console.log('⏳ Esperando conexión de GoLabel...');
console.log('');

// Crear directorio si no existe
if (!fs.existsSync('godex_code')) {
    fs.mkdirSync('godex_code');
}

const server = net.createServer((socket) => {
    console.log('✅ GoLabel conectado!');
    console.log('📥 Capturando y analizando comandos en tiempo real...');
    console.log('');
    
    let data = '';
    let chunkCount = 0;
    
    socket.on('data', (chunk) => {
        const chunkData = chunk.toString();
        data += chunkData;
        chunkCount++;
        
        console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes`);
        
        // Analizar comandos de corte en tiempo real
        const comandosCorte = [
            '~C', '^S,CUT', '~CUT', '^MC', '~S,CUTTER', 
            'CUT,', ',CUT', 'CUTTER,', ',CUTTER'
        ];
        
        let comandosEncontrados = [];
        comandosCorte.forEach(cmd => {
            if (chunkData.includes(cmd)) {
                comandosEncontrados.push(cmd);
            }
        });
        
        if (comandosEncontrados.length > 0) {
            console.log(`🔍 ¡COMANDOS DE CORTE DETECTADOS!: ${comandosEncontrados.join(', ')}`);
        }
        
        // Mostrar chunk si contiene comandos especiales
        if (chunkData.includes('~') || chunkData.includes('^S') || chunkData.includes('CUT')) {
            console.log(`   📋 Contenido: "${chunkData.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`);
        }
    });
    
    socket.on('end', () => {
        console.log('');
        console.log('✅ Captura completada!');
        console.log(`📊 Total capturado: ${data.length} caracteres en ${chunkCount} chunks`);
        console.log('');
        
        // Análisis detallado de comandos de corte
        console.log('🔍 ANÁLISIS DE COMANDOS DE CORTE:');
        console.log('='.repeat(50));
        
        const comandosCorteDetallados = {
            '~C': 'Corte inmediato EZPL',
            '^S,CUT,': 'Configuración de corte EZPL',
            '~CUT': 'Comando de corte alternativo',
            '^MC': 'Media Cut (ZPL)',
            '~S,CUTTER,': 'Configuración de cortador',
            'CUT,1,0': 'Corte habilitado, 1 etiqueta, corte total',
            'CUT,0,0': 'Corte deshabilitado'
        };
        
        let comandosEncontrados = {};
        Object.keys(comandosCorteDetallados).forEach(cmd => {
            const count = (data.match(new RegExp(cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (count > 0) {
                comandosEncontrados[cmd] = {
                    descripcion: comandosCorteDetallados[cmd],
                    veces: count
                };
            }
        });
        
        if (Object.keys(comandosEncontrados).length > 0) {
            console.log('✅ COMANDOS DE CORTE ENCONTRADOS:');
            Object.keys(comandosEncontrados).forEach(cmd => {
                const info = comandosEncontrados[cmd];
                console.log(`   • ${cmd} → ${info.descripcion} (${info.veces} vez/veces)`);
            });
        } else {
            console.log('❌ NO SE ENCONTRARON COMANDOS DE CORTE');
            console.log('   → GoLabel NO está configurado para cortar');
            console.log('   → Verificar configuración Post-Print Action');
        }
        
        console.log('');
        
        // Guardar archivos
        const timestamp = Date.now();
        const filename = `godex_code/captura_con_corte_${timestamp}.txt`;
        const analysisFilename = `godex_code/analisis_corte_${timestamp}.txt`;
        
        // Archivo principal
        fs.writeFileSync(filename, data);
        
        // Archivo de análisis
        const analisisContent = `ANÁLISIS DE COMANDOS DE CORTE
=============================
Fecha: ${new Date().toLocaleString()}
Total de datos: ${data.length} caracteres
Chunks recibidos: ${chunkCount}

COMANDOS DE CORTE ENCONTRADOS:
${Object.keys(comandosEncontrados).length > 0 ? 
    Object.keys(comandosEncontrados).map(cmd => {
        const info = comandosEncontrados[cmd];
        return `- ${cmd}: ${info.descripcion} (${info.veces} veces)`;
    }).join('\n') : 
    'NINGUNO - GoLabel no está configurado para cortar'
}

DATOS COMPLETOS:
================
${data}
`;
        
        fs.writeFileSync(analysisFilename, analisisContent);
        
        console.log(`💾 Archivos guardados:`);
        console.log(`   • Datos completos: ${filename}`);
        console.log(`   • Análisis: ${analysisFilename}`);
        console.log('');
        
        // Mostrar primeras líneas con análisis
        const lineas = data.split(/\r?\n/);
        console.log('📋 PRIMERAS LÍNEAS CON ANÁLISIS:');
        console.log('─'.repeat(60));
        lineas.slice(0, 10).forEach((linea, i) => {
            const tieneCorte = Object.keys(comandosCorteDetallados).some(cmd => linea.includes(cmd));
            const prefijo = tieneCorte ? '🔸 CORTE → ' : '         ';
            console.log(`${prefijo}${i+1}: ${linea}`);
        });
        console.log('─'.repeat(60));
        console.log('');
        
        if (Object.keys(comandosEncontrados).length > 0) {
            console.log('🎉 ¡PERFECTO! Comandos de corte capturados exitosamente');
            console.log('   → Usa estos comandos en tus scripts de Node.js');
            console.log('   → Especialmente presta atención a las líneas marcadas con 🔸');
        } else {
            console.log('⚠️  NO HAY COMANDOS DE CORTE - ACCIÓN REQUERIDA:');
            console.log('   1. Verificar configuración de GoLabel');
            console.log('   2. Activar Post-Print Action → Cut');
            console.log('   3. Volver a imprimir desde GoLabel');
        }
        console.log('');
    });
    
    socket.on('error', (err) => {
        console.error('❌ Error:', err.message);
    });
});

server.listen(9100, '0.0.0.0', () => {
    console.log('🚀 Servidor listo!');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error('❌ ERROR: Puerto 9100 ya está en uso');
        console.error('');
        console.error('Solución:');
        console.error('1. Cierra cualquier programa que use el puerto 9100');
        console.error('2. O usa otro puerto y configura GoLabel con ese puerto');
        process.exit(1);
    } else {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
});
