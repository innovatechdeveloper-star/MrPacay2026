const { Jimp } = require('jimp');

async function analizarAdvertencias() {
    try {
        console.log('📐 Analizando advertencias.png...\n');
        
        const img = await Jimp.read('./founds/godex/advertencias.png');
        
        console.log('✅ Información del advertencias.png:');
        console.log(`   - Ancho: ${img.bitmap.width} píxeles`);
        console.log(`   - Alto: ${img.bitmap.height} píxeles`);
        console.log(`   - Relación aspecto: ${(img.bitmap.width / img.bitmap.height).toFixed(2)}`);
        console.log(`   - Tamaño físico a 300 DPI:`);
        console.log(`     * Ancho: ${(img.bitmap.width / 11.81).toFixed(2)} mm`);
        console.log(`     * Alto: ${(img.bitmap.height / 11.81).toFixed(2)} mm`);
        
        console.log('\n📊 Opciones de tamaño para columna izquierda (15mm de ancho):');
        
        // Opción 1: Ajustar al ancho de 15mm
        const targetWidth1 = 177; // 15mm
        const targetHeight1 = Math.round(targetWidth1 * img.bitmap.height / img.bitmap.width);
        console.log(`\n   Opción 1 - Ajustar al ancho (15mm):`);
        console.log(`     * Tamaño: ${targetWidth1}×${targetHeight1} dots`);
        console.log(`     * Físico: 15.0mm × ${(targetHeight1 / 11.81).toFixed(1)}mm`);
        console.log(`     * Cabe en 16.5mm alto: ${targetHeight1 <= 195 ? '✅ SÍ' : '❌ NO'}`);
        
        // Opción 2: Ajustar al alto de 16.5mm
        const targetHeight2 = 195; // 16.5mm
        const targetWidth2 = Math.round(targetHeight2 * img.bitmap.width / img.bitmap.height);
        console.log(`\n   Opción 2 - Ajustar al alto (16.5mm):`);
        console.log(`     * Tamaño: ${targetWidth2}×${targetHeight2} dots`);
        console.log(`     * Físico: ${(targetWidth2 / 11.81).toFixed(1)}mm × 16.5mm`);
        console.log(`     * Cabe en 15mm ancho: ${targetWidth2 <= 177 ? '✅ SÍ' : '❌ NO'}`);
        
        // Opción 3: Cuadrado 15×15mm
        console.log(`\n   Opción 3 - Forzar cuadrado (15×15mm):`);
        console.log(`     * Tamaño: 177×177 dots`);
        console.log(`     * Físico: 15.0mm × 15.0mm`);
        console.log(`     * Nota: Se deformará si imagen no es cuadrada`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analizarAdvertencias();
