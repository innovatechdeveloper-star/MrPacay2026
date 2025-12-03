const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

console.log('🎨 CONVERTIDOR PNG → ZPL ^GFA\n');
console.log('═══════════════════════════════════════════════════\n');

const LOGO_PATH = './founds/godex/LOGO.png';
const OUTPUT_JS = './logo-zpl-generado.js';

// Tamaño objetivo: 27mm × 10.4mm a 300 DPI
const TARGET_WIDTH = 319;   // 27mm × 11.81 dots/mm = 319 dots
const TARGET_HEIGHT = 123;  // 10.4mm × 11.81 dots/mm = 123 dots

async function convertirPngAZpl() {
    try {
        console.log(`📂 Cargando: ${LOGO_PATH}`);
        
        // Cargar imagen
        const image = await Jimp.read(LOGO_PATH);
        console.log(`✅ Original: ${image.bitmap.width}×${image.bitmap.height}px\n`);
        
        // Redimensionar
        console.log(`📐 Redimensionando a: ${TARGET_WIDTH}×${TARGET_HEIGHT}px`);
        await image.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        // Convertir a escala de grises y aplicar threshold
        console.log(`🎨 Convirtiendo a monocromático...`);
        await image.greyscale();
        await image.contrast(0.3);
        
        // Convertir a binario (blanco/negro)
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const bytesPerRow = Math.ceil(width / 8);
        
        console.log(`📊 Dimensiones finales:`);
        console.log(`   - Píxeles: ${width}×${height}`);
        console.log(`   - Bytes por fila: ${bytesPerRow}`);
        console.log(`   - Tamaño físico: ~${(width / 11.81).toFixed(1)}mm × ${(height / 11.81).toFixed(1)}mm\n`);
        
        // Generar datos hexadecimales
        let hexData = '';
        let totalBytes = 0;
        
        for (let y = 0; y < height; y++) {
            let rowHex = '';
            let byte = 0;
            let bitPos = 7;
            
            for (let x = 0; x < width; x++) {
                const idx = image.getPixelIndex(x, y);
                const brightness = image.bitmap.data[idx]; // R value (greyscale)
                
                // Threshold: < 128 = negro (1), >= 128 = blanco (0)
                if (brightness < 128) {
                    byte |= (1 << bitPos);
                }
                
                bitPos--;
                
                if (bitPos < 0 || x === width - 1) {
                    rowHex += byte.toString(16).toUpperCase().padStart(2, '0');
                    totalBytes++;
                    byte = 0;
                    bitPos = 7;
                }
            }
            
            hexData += rowHex;
            
            // Mostrar progreso cada 10 líneas
            if ((y + 1) % 10 === 0) {
                process.stdout.write(`\r⏳ Procesando: ${y + 1}/${height} líneas...`);
            }
        }
        
        console.log(`\r✅ Conversión completa: ${totalBytes} bytes totales\n`);
        
        // Generar código JavaScript
        const codigo = `// Logo CAMITEX convertido automáticamente
// Fuente: ${LOGO_PATH}
// Tamaño: ${width}×${height}px (${(width / 11.81).toFixed(1)}mm × ${(height / 11.81).toFixed(1)}mm a 300 DPI)
// Generado: ${new Date().toLocaleString('es-PE')}

const LOGO_CAMITEX_ZPL = \`^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS\`;

module.exports = { LOGO_CAMITEX_ZPL };

// USO EN server.js (línea ~668):
// ^FO5,10\${LOGO_CAMITEX_ZPL}
`;
        
        fs.writeFileSync(OUTPUT_JS, codigo);
        
        console.log('═══════════════════════════════════════════════════');
        console.log(`✅ ARCHIVO GENERADO: ${OUTPUT_JS}\n`);
        console.log('📋 PARA ACTUALIZAR server.js:');
        console.log('   1. Copia el contenido de LOGO_CAMITEX_ZPL');
        console.log('   2. Reemplaza la constante en línea ~635');
        console.log('   3. El logo ya está más pequeño (70% del original)\n');
        console.log('📏 Tamaño del logo:');
        console.log(`   - Píxeles: ${width}×${height}px`);
        console.log(`   - Físico: ${(width / 11.81).toFixed(1)}mm × ${(height / 11.81).toFixed(1)}mm`);
        console.log(`   - Datos: ${(totalBytes / 1024).toFixed(2)} KB\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('Could not find module')) {
            console.log('\n💡 Instala Jimp primero:');
            console.log('   npm install jimp');
        }
    }
}

// Ejecutar
convertirPngAZpl();
