const { Jimp } = require('jimp');

async function analizarLogoMistiV2() {
    try {
        console.log('📐 Analizando logo-mistiv2.png...\n');
        
        const img = await Jimp.read('./founds/godex/logo-mistiv2.png');
        
        console.log('✅ Información del logo-mistiv2.png:');
        console.log(`   - Ancho: ${img.bitmap.width} píxeles`);
        console.log(`   - Alto: ${img.bitmap.height} píxeles`);
        console.log(`   - Relación aspecto: ${(img.bitmap.width / img.bitmap.height).toFixed(2)}`);
        console.log(`   - Tamaño físico a 300 DPI:`);
        console.log(`     * Ancho: ${(img.bitmap.width / 11.81).toFixed(2)} mm`);
        console.log(`     * Alto: ${(img.bitmap.height / 11.81).toFixed(2)} mm\n`);
        
        console.log('📊 COMPARACIÓN CON ESPACIO DISPONIBLE:');
        console.log('═══════════════════════════════════════════════════');
        console.log('Espacio reservado: 177×177 dots (15mm × 15mm cuadrado)');
        console.log(`Logo actual:       ${img.bitmap.width}×${img.bitmap.height}px (${(img.bitmap.width / 11.81).toFixed(1)}mm × ${(img.bitmap.height / 11.81).toFixed(1)}mm)\n`);
        
        // Calcular si cabe directamente
        if (img.bitmap.width <= 177 && img.bitmap.height <= 177) {
            console.log('✅ El logo CABE directamente en el espacio sin redimensionar');
            console.log(`   Márgenes: Horizontal ${Math.floor((177 - img.bitmap.width) / 2)} dots, Vertical ${Math.floor((177 - img.bitmap.height) / 2)} dots\n`);
        } else {
            console.log('⚠️  El logo es MÁS GRANDE que el espacio, necesita redimensionarse\n');
        }
        
        // Calcular redimensionamiento óptimo
        let targetWidth, targetHeight;
        
        if (img.bitmap.width > img.bitmap.height) {
            // Más ancho que alto - ajustar al ancho
            targetWidth = 177;
            targetHeight = Math.round((177 * img.bitmap.height) / img.bitmap.width);
        } else {
            // Más alto que ancho - ajustar al alto
            targetHeight = 177;
            targetWidth = Math.round((177 * img.bitmap.width) / img.bitmap.height);
        }
        
        console.log('💡 OPCIONES DE CONVERSIÓN:\n');
        
        console.log(`Opción 1 - MANTENER PROPORCIÓN (recomendado):`);
        console.log(`   Tamaño: ${targetWidth}×${targetHeight} dots`);
        console.log(`   Físico: ${(targetWidth/11.81).toFixed(1)}mm × ${(targetHeight/11.81).toFixed(1)}mm`);
        console.log(`   Centrado en espacio 15×15mm\n`);
        
        console.log(`Opción 2 - FORZAR CUADRADO (puede deformar):`);
        console.log(`   Tamaño: 177×177 dots`);
        console.log(`   Físico: 15.0mm × 15.0mm`);
        console.log(`   Rellena todo el espacio\n`);
        
        console.log(`Opción 3 - USAR ORIGINAL (si cabe):`);
        if (img.bitmap.width <= 177 && img.bitmap.height <= 177) {
            console.log(`   Tamaño: ${img.bitmap.width}×${img.bitmap.height} dots`);
            console.log(`   Físico: ${(img.bitmap.width/11.81).toFixed(1)}mm × ${(img.bitmap.height/11.81).toFixed(1)}mm`);
            console.log(`   Sin redimensionar ✓\n`);
        } else {
            console.log(`   ❌ No cabe - requiere redimensionamiento\n`);
        }
        
        console.log('🎯 RECOMENDACIÓN FINAL:');
        if (img.bitmap.width === img.bitmap.height) {
            console.log('   Logo es CUADRADO - usar Opción 2 (177×177 dots)');
        } else {
            console.log(`   Logo es RECTANGULAR - usar Opción 1 (${targetWidth}×${targetHeight} dots)`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analizarLogoMistiV2();