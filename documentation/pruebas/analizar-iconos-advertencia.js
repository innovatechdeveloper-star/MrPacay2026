const { Jimp } = require('jimp');

async function analizarIconosAdvertencia() {
    try {
        console.log('📐 Analizando iconos de advertencia...\n');
        
        const iconos = [
            './founds/godex/lavado-a-30.png',
            './founds/godex/no-usar-lejia.png',
            './founds/godex/planchar-a-baja-temperatura.png',
            './founds/godex/secadora-a-baja-temperatura.png'
        ];
        
        for (const ruta of iconos) {
            const img = await Jimp.read(ruta);
            const nombre = ruta.split('/').pop();
            
            console.log(`✅ ${nombre}:`);
            console.log(`   - Dimensiones: ${img.bitmap.width}×${img.bitmap.height}px`);
            console.log(`   - Tamaño físico a 300 DPI: ${(img.bitmap.width / 11.81).toFixed(1)}mm × ${(img.bitmap.height / 11.81).toFixed(1)}mm`);
            console.log(`   - Relación aspecto: ${(img.bitmap.width / img.bitmap.height).toFixed(2)}\n`);
        }
        
        console.log('\n📊 CÁLCULO PARA ESPACIO DISPONIBLE:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Espacio disponible: 177 dots (15mm) × 195 dots (16.5mm)');
        console.log('Distribución: 2 filas × 2 columnas\n');
        
        // Opción 1: 2x2 igual
        console.log('Opción 1 - 2×2 IGUAL (con separación de 5 dots):');
        const ancho1 = Math.floor((177 - 5) / 2); // 86 dots por icono
        const alto1 = Math.floor((195 - 5) / 2);  // 95 dots por icono
        console.log(`   Cada icono: ${ancho1}×${alto1} dots (${(ancho1/11.81).toFixed(1)}mm × ${(alto1/11.81).toFixed(1)}mm)`);
        
        // Opción 2: 2x2 ajustado máximo
        console.log('\nOpción 2 - 2×2 MÁXIMO (con separación de 3 dots):');
        const ancho2 = Math.floor((177 - 3) / 2); // 87 dots por icono
        const alto2 = Math.floor((195 - 3) / 2);  // 96 dots por icono
        console.log(`   Cada icono: ${ancho2}×${alto2} dots (${(ancho2/11.81).toFixed(1)}mm × ${(alto2/11.81).toFixed(1)}mm)`);
        
        // Opción 3: 4 en fila
        console.log('\nOpción 3 - 4 EN FILA HORIZONTAL (con separación de 4 dots):');
        const ancho3 = Math.floor((177 - 12) / 4); // 41 dots por icono
        const alto3 = 195; // Altura completa
        console.log(`   Cada icono: ${ancho3}×${alto3} dots (${(ancho3/11.81).toFixed(1)}mm × ${(alto3/11.81).toFixed(1)}mm)`);
        
        // Opción 4: 4 en columna
        console.log('\nOpción 4 - 4 EN COLUMNA VERTICAL (con separación de 5 dots):');
        const ancho4 = 177; // Ancho completo
        const alto4 = Math.floor((195 - 15) / 4); // 45 dots por icono
        console.log(`   Cada icono: ${ancho4}×${alto4} dots (${(ancho4/11.81).toFixed(1)}mm × ${(alto4/11.81).toFixed(1)}mm)`);
        
        console.log('\n💡 RECOMENDACIÓN:');
        console.log('Opción 1 o 2 (2×2) son las mejores para iconos cuadrados.');
        console.log('Tamaño recomendado: 87×87 dots (7.4mm × 7.4mm) - máximo aprovechamiento\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analizarIconosAdvertencia();
