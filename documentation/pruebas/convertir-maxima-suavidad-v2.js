// ==================================================
// CONVERTIR MAXIMA SUAVIDAD V2 A ZPL (VERSION PEQUEÑA)
// ==================================================
const { Jimp } = require('jimp');
const fs = require('fs');

const inputFile = './founds/dinamic-founds/maxima_suavidadv2.png';
const outputFile = './logo-maxima-suavidad-v2-zpl.js';

// 📐 TAMAÑO OBJETIVO: 27mm × 10.3mm a 300 DPI (igual que Producto Peruano)
const TARGET_WIDTH = 319;   // 27.0mm × 11.81 dots/mm ≈ 319 dots
const TARGET_HEIGHT = 122;  // 10.3mm × 11.81 dots/mm ≈ 122 dots

console.log('🔄 Convirtiendo Máxima Suavidad V2 a ZPL...\n');
console.log('📐 Tamaño objetivo: 319×122 dots (27.0mm × 10.3mm a 300 DPI)\n');

(async () => {
    try {
        const loadedImg = await Jimp.read(inputFile);
        console.log(`📏 Original: ${loadedImg.bitmap.width}×${loadedImg.bitmap.height}px`);
        
        // Redimensionar a tamaño objetivo
        console.log(`🔄 Redimensionando a: ${TARGET_WIDTH}×${TARGET_HEIGHT}px...`);
        await loadedImg.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        const width = loadedImg.bitmap.width;
        const height = loadedImg.bitmap.height;
        
        // Calcular tamaño físico a 300 DPI
        const mmWidth = (width / 11.81).toFixed(1);  // 300 DPI = 11.81 dots/mm
        const mmHeight = (height / 11.81).toFixed(1);
        
        console.log('📏 Dimensiones originales:');
        console.log(`   • Pixels: ${width} × ${height} px`);
        console.log(`   • Físico a 300 DPI: ${mmWidth} × ${mmHeight} mm`);
        console.log('');
        
        // Convertir a monocromo (blanco y negro)
        await loadedImg.greyscale();
        await loadedImg.contrast(0.5);
        
        // Convertir a ZPL formato ^GFA
        const bytesPerRow = Math.ceil(width / 8);
        const totalBytes = bytesPerRow * height;
        
        console.log('🔢 Información ZPL:');
        console.log(`   • Bytes por fila: ${bytesPerRow}`);
        console.log(`   • Total bytes: ${totalBytes}`);
        console.log('');
        
        let hexData = '';
        
        for (let y = 0; y < height; y++) {
            let byte = 0;
            let bitPos = 7;
            
            for (let x = 0; x < width; x++) {
                const idx = loadedImg.getPixelIndex(x, y);
                const brightness = loadedImg.bitmap.data[idx];
                
                // Threshold: < 128 = negro (1), >= 128 = blanco (0)
                if (brightness < 128) {
                    byte |= (1 << bitPos);
                }
                
                bitPos--;
                
                if (bitPos < 0) {
                    hexData += byte.toString(16).padStart(2, '0').toUpperCase();
                    byte = 0;
                    bitPos = 7;
                }
            }
            
            // Completar último byte de la fila si es necesario
            if (bitPos < 7) {
                hexData += byte.toString(16).padStart(2, '0').toUpperCase();
            }
        }
        
        // Generar archivo JS
        const jsContent = `// =====================================================
// ✨ MÁXIMA SUAVIDAD V2 (VERSION PEQUEÑA)
// =====================================================
// Tamaño: ${mmWidth}mm × ${mmHeight}mm (${width}×${height} dots a 300 DPI)
// Generado: ${new Date().toLocaleDateString('es-PE')}, ${new Date().toLocaleTimeString('es-PE')}
// =====================================================

const MAXIMA_SUAVIDAD_V2_ZPL = \`^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}\`;

module.exports = { MAXIMA_SUAVIDAD_V2_ZPL };
`;
        
        fs.writeFileSync(outputFile, jsContent);
        
        console.log('✅ Conversión completada!');
        console.log('');
        console.log('📦 Archivo creado: ' + outputFile);
        console.log(`📊 Tamaño ZPL: ${hexData.length} caracteres`);
        console.log('');
        console.log('📝 Para usar en server.js:');
        console.log(`   const { MAXIMA_SUAVIDAD_V2_ZPL } = require('./logo-maxima-suavidad-v2-zpl.js');`);
        console.log('');
        console.log('🎯 Posición recomendada en etiqueta:');
        console.log(`   ^FO20,10\${MAXIMA_SUAVIDAD_V2_ZPL}`);
        
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
})();
