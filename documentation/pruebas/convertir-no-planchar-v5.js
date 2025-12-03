// ==================================================
// CONVERTIR NO PLANCHAR V5 A ZPL (14.5mm × 14.5mm)
// ==================================================
const { Jimp } = require('jimp');
const fs = require('fs');

const inputFile = './founds/warning-founds/no_planchar.png';
const outputFile = './logo-no-planchar-v5-zpl.js';

// 📐 MEDIDAS EXACTAS: 14.5mm × 14.5mm a 300 DPI = 172×172 dots
// IMPORTANTE: Jimp redondea a múltiplos de 8, así que 172 se convierte en 176
// Vamos a usar 168 dots para que quede en 168 (21 bytes × 8 = 168 dots)
const TARGET_WIDTH = 168;
const TARGET_HEIGHT = 172;

console.log('🔄 Convirtiendo NO PLANCHAR V5 a ZPL...');
console.log('📐 Medidas objetivo: 14.5mm × 14.5mm (172×172 dots a 300 DPI)\n');

(async () => {
    try {
        const image = await Jimp.read(inputFile);
        console.log(`✅ Original: ${image.bitmap.width}×${image.bitmap.height}px`);
        
        // Redimensionar a 172×172 dots (14.5mm × 14.5mm a 300 DPI)
        console.log(`📐 Redimensionando a: ${TARGET_WIDTH}×${TARGET_HEIGHT}px (14.5mm×14.5mm)`);
        await image.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        // Convertir a monocromático
        console.log(`🎨 Convirtiendo a blanco/negro...`);
        await image.greyscale();
        await image.contrast(0.4); // Aumentar contraste
        
        // Dimensiones finales
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const bytesPerRow = Math.ceil(width / 8);
        const totalBytes = bytesPerRow * height;
        
        console.log(`\n📊 Dimensiones finales:`);
        console.log(`   • Píxeles: ${width}×${height}`);
        console.log(`   • Bytes por fila: ${bytesPerRow}`);
        console.log(`   • Total bytes: ${totalBytes}`);
        console.log(`   • Tamaño físico: ${(width / 11.81).toFixed(1)}mm × ${(height / 11.81).toFixed(1)}mm`);
        
        // Generar datos hexadecimales
        let hexData = '';
        
        for (let y = 0; y < height; y++) {
            let rowBits = '';
            for (let x = 0; x < width; x++) {
                const pixel = image.getPixelColor(x, y);
                // Extraer el valor rojo (en escala de grises todos son iguales)
                const r = (pixel >> 16) & 0xFF;
                // Umbral: si es más oscuro que 128, es negro (1), sino blanco (0)
                rowBits += (r < 128) ? '1' : '0';
            }
            
            // Rellenar con ceros si no es múltiplo de 8
            while (rowBits.length % 8 !== 0) {
                rowBits += '0';
            }
            
            // Convertir bits a hex
            for (let i = 0; i < rowBits.length; i += 8) {
                const byte = rowBits.substr(i, 8);
                const hex = parseInt(byte, 2).toString(16).toUpperCase().padStart(2, '0');
                hexData += hex;
            }
        }
        
        // Generar archivo JS
        const jsContent = `// =====================================================
// 🚫 NO PLANCHAR V5
// =====================================================
// Tamaño: 14.5mm × 14.5mm (172×172 dots a 300 DPI)
// Generado: ${new Date().toLocaleDateString('es-PE')}, ${new Date().toLocaleTimeString('es-PE')}
// =====================================================

const NO_PLANCHAR_V5_ZPL = \`^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}\`;

module.exports = { NO_PLANCHAR_V5_ZPL };
`;
        
        fs.writeFileSync(outputFile, jsContent);
        
        console.log('\n✅ Conversión completada!');
        console.log(`📦 Archivo creado: ${outputFile}`);
        console.log(`📊 Tamaño ZPL: ${hexData.length} caracteres`);
        console.log(`📊 Tamaño archivo: ${jsContent.length} bytes`);
        console.log('\n📝 Para usar en server.js:');
        console.log(`   const { NO_PLANCHAR_V5_ZPL } = require('./logo-no-planchar-v5-zpl.js');`);
        console.log('\n🎯 Usar en lugar de NO_PLANCHAR_ZPL:');
        console.log(`   ^FO188,\${Y_ICONOS_1}\${NO_PLANCHAR_V5_ZPL}`);
        
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
})();
