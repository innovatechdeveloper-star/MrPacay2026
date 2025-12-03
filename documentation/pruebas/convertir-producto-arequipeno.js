// ==================================================
// CONVERTIR PRODUCTO AREQUIPEÑO A ZPL
// ==================================================
const { Jimp } = require('jimp');
const fs = require('fs');

const inputFile = './founds/dinamic-founds/producto_arequipeño.png';
const outputFile = './logo-producto-arequipeno-zpl.js';

// 📐 MEDIDAS IGUALES A PRODUCTO PERUANO: 27mm × 10.3mm a 300 DPI
// 27mm × (300 DPI / 25.4 mm/inch) = 319 dots
// 10.3mm × (300 DPI / 25.4 mm/inch) = 122 dots
const TARGET_WIDTH = 319;
const TARGET_HEIGHT = 122;

console.log('🔄 Convirtiendo PRODUCTO AREQUIPEÑO a ZPL...');
console.log('📐 Medidas objetivo: 27mm × 10.3mm (319×122 dots a 300 DPI)');
console.log('📦 Mismo tamaño que: PRODUCTO PERUANO\n');

(async () => {
    try {
        const image = await Jimp.read(inputFile);
        console.log(`✅ Original: ${image.bitmap.width}×${image.bitmap.height}px`);
        
        // Redimensionar manteniendo aspect ratio, pero forzando ancho = 319 dots
        const aspectRatio = image.bitmap.width / image.bitmap.height;
        let finalWidth = TARGET_WIDTH;
        let finalHeight = Math.round(finalWidth / aspectRatio);
        
        // Si altura resultante excede 122, ajustar por altura
        if (finalHeight > TARGET_HEIGHT) {
            finalHeight = TARGET_HEIGHT;
            finalWidth = Math.round(finalHeight * aspectRatio);
        }
        
        console.log(`📐 Redimensionando a: ${finalWidth}×${finalHeight}px`);
        await image.resize({ w: finalWidth, h: finalHeight });
        
        // Si no llegamos a 319 ancho, expandir canvas centrado
        if (finalWidth < TARGET_WIDTH) {
            const offsetX = Math.floor((TARGET_WIDTH - finalWidth) / 2);
            const canvas = await Jimp.fromBitmap({
                width: TARGET_WIDTH,
                height: finalHeight,
                data: Buffer.alloc(TARGET_WIDTH * finalHeight * 4, 255) // Fondo blanco
            });
            await canvas.composite(image, offsetX, 0);
            image.bitmap = canvas.bitmap;
            console.log(`🖼️  Canvas expandido a ${TARGET_WIDTH}×${finalHeight}px (centrado)`);
        }
        
        // Convertir a monocromático
        console.log(`🎨 Convirtiendo a blanco/negro...`);
        await image.greyscale();
        await image.contrast(0.3); // Contraste moderado
        
        // Dimensiones finales
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const bytesPerRow = Math.ceil(width / 8);
        const totalBytes = bytesPerRow * height;
        
        console.log(`\n📊 Dimensiones finales:`);
        console.log(`   • Píxeles: ${width}×${height}`);
        console.log(`   • Bytes por fila: ${bytesPerRow}`);
        console.log(`   • Total bytes: ${totalBytes}`);
        console.log(`   • Tamaño físico: ${(width * 25.4 / 300).toFixed(1)}mm × ${(height * 25.4 / 300).toFixed(1)}mm\n`);
        
        // Convertir a hexadecimal para ZPL
        let hexData = '';
        
        for (let y = 0; y < height; y++) {
            let rowBits = '';
            
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const gray = image.bitmap.data[idx]; // Canal R (ya está en escala de grises)
                
                // Umbral: < 128 = negro (1), >= 128 = blanco (0)
                rowBits += (gray < 128) ? '1' : '0';
            }
            
            // Rellenar con ceros si no es múltiplo de 8
            while (rowBits.length % 8 !== 0) {
                rowBits += '0';
            }
            
            // Convertir bits a hexadecimal
            for (let i = 0; i < rowBits.length; i += 8) {
                const byte = rowBits.slice(i, i + 8);
                const hex = parseInt(byte, 2).toString(16).toUpperCase().padStart(2, '0');
                hexData += hex;
            }
        }
        
        // Crear archivo JavaScript con el ZPL
        const fecha = new Date().toLocaleString('es-PE');
        const fileContent = `// =====================================================
// 🏔️ PRODUCTO AREQUIPEÑO
// =====================================================
// Tamaño: 27.0mm × ${(height * 25.4 / 300).toFixed(1)}mm (${width}×${height} dots a 300 DPI)
// Escalado proporcional: ancho fijo = 27mm (igual que Producto Peruano)
// Generado: ${fecha}
// =====================================================

const PRODUCTO_AREQUIPENO_ZPL = \`^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}\`;

module.exports = { PRODUCTO_AREQUIPENO_ZPL };
`;
        
        fs.writeFileSync(outputFile, fileContent);
        
        console.log(`✅ Archivo generado: ${outputFile}`);
        console.log(`📦 Tamaño del archivo: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
        console.log(`\n🎨 Comando ZPL generado:`);
        console.log(`   ^GFA,${totalBytes},${totalBytes},${bytesPerRow},...`);
        console.log(`\n✅ ¡Conversión completada!`);
        console.log(`\n📋 Próximos pasos:`);
        console.log(`   1. Agregar en server.js: const { PRODUCTO_AREQUIPENO_ZPL } = require('./logo-producto-arequipeno-zpl.js');`);
        console.log(`   2. Agregar case 'arequipeno': en generarRotuladoZPL()`);
        console.log(`   3. Usar posición X=20, Y=${186} (igual que otros logos principales)`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
