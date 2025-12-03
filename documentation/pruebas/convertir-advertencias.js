const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

console.log('🎨 CONVERTIDOR PNG → ZPL ^GFA - ADVERTENCIAS\n');
console.log('═══════════════════════════════════════════════════\n');

const LOGO_PATH = './founds/godex/advertencias.png';
const OUTPUT_JS = './logo-advertencias-zpl-generado.js';

// Tamaño objetivo: 15mm × 15mm a 300 DPI
const TARGET_WIDTH = 177;   // 15mm × 11.81 dots/mm = 177 dots
const TARGET_HEIGHT = 177;  // 15mm × 11.81 dots/mm = 177 dots

async function convertirPngAZpl() {
    try {
        console.log(`📂 Cargando imagen: ${LOGO_PATH}`);
        const image = await Jimp.read(LOGO_PATH);
        
        console.log(`📏 Tamaño original: ${image.bitmap.width}×${image.bitmap.height}px`);
        console.log(`🎯 Tamaño objetivo: ${TARGET_WIDTH}×${TARGET_HEIGHT} dots (15.0mm × 15.0mm)\n`);
        
        // Redimensionar
        image.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        // Convertir a escala de grises
        image.greyscale();
        
        // Aumentar contraste
        image.contrast(0.5);
        
        // Convertir a blanco/negro con threshold
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const gray = this.bitmap.data[idx];
            const bw = gray < 128 ? 0 : 255;
            this.bitmap.data[idx] = bw;
            this.bitmap.data[idx + 1] = bw;
            this.bitmap.data[idx + 2] = bw;
        });
        
        console.log('🔄 Conversión a formato ZPL ^GFA...');
        
        // Convertir a formato hexadecimal para ZPL
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const bytesPerRow = Math.ceil(width / 8);
        
        let hexData = '';
        
        for (let y = 0; y < height; y++) {
            let row = '';
            for (let x = 0; x < width; x += 8) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    if (x + bit < width) {
                        const idx = (y * width + x + bit) * 4;
                        const pixel = image.bitmap.data[idx];
                        if (pixel < 128) {
                            byte |= (128 >> bit);
                        }
                    }
                }
                row += byte.toString(16).toUpperCase().padStart(2, '0');
            }
            hexData += row;
        }
        
        const totalBytes = bytesPerRow * height;
        
        // Crear el código ZPL
        const zplCommand = `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS`;
        
        // Generar el archivo JavaScript con el logo
        const jsContent = `// Logo ADVERTENCIAS generado automáticamente
// Fecha: ${new Date().toLocaleDateString('es-PE')}
// Tamaño: ${width}×${height}px (${(width/11.81).toFixed(1)}mm × ${(height/11.81).toFixed(1)}mm a 300 DPI)

const LOGO_ADVERTENCIAS_ZPL = \`${zplCommand}\`;

module.exports = { LOGO_ADVERTENCIAS_ZPL };

// Uso en ZPL:
// ^FO0,305    <- Posición X=0 (columna izquierda), Y=305
// ${zplCommand}
`;
        
        fs.writeFileSync(OUTPUT_JS, jsContent, 'utf8');
        
        console.log(`\n✅ Conversión completada exitosamente!\n`);
        console.log(`📊 Información del logo:`);
        console.log(`   - Dimensiones: ${width}×${height} dots`);
        console.log(`   - Tamaño físico: ${(width/11.81).toFixed(1)}mm × ${(height/11.81).toFixed(1)}mm`);
        console.log(`   - Bytes por fila: ${bytesPerRow}`);
        console.log(`   - Total bytes: ${totalBytes}`);
        console.log(`   - Tamaño datos: ${(hexData.length / 2 / 1024).toFixed(2)} KB\n`);
        console.log(`📁 Archivo generado: ${OUTPUT_JS}`);
        console.log(`\n💡 Copia la constante LOGO_ADVERTENCIAS_ZPL al archivo server.js\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

convertirPngAZpl();
