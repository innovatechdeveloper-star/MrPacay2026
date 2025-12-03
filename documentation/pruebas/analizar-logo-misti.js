const { Jimp } = require('jimp');

async function analizarLogoMisti() {
    try {
        console.log('📐 Analizando logo-misti.png...\n');
        
        const img = await Jimp.read('./founds/godex/logo-misti.png');
        
        console.log('✅ Información del logo-misti.png:');
        console.log(`   - Ancho: ${img.bitmap.width} píxeles`);
        console.log(`   - Alto: ${img.bitmap.height} píxeles`);
        console.log(`   - Tamaño físico a 300 DPI:`);
        console.log(`     * Ancho: ${(img.bitmap.width / 11.81).toFixed(2)} mm`);
        console.log(`     * Alto: ${(img.bitmap.height / 11.81).toFixed(2)} mm`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analizarLogoMisti();
