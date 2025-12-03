const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

console.log('🎨 CONVERTIDOR LOGOS DINÁMICOS → ZPL ^GFA\n');
console.log('═══════════════════════════════════════════════════\n');

// 📐 CONFIGURACIÓN: 14mm × 14mm a 300 DPI = 165 dots × 165 dots
const TARGET_WIDTH = 165;   // 14mm × 11.81 dots/mm ≈ 165 dots
const TARGET_HEIGHT = 165;  // 14mm × 11.81 dots/mm ≈ 165 dots

const LOGOS_DINAMICOS = [
    {
        input: './founds/dinamic-founds/algodon_100.png',
        output: './logo-algodon-100-zpl.js',
        nombre: 'ALGODON_100',
        descripcion: '100% Algodón'
    },
    {
        input: './founds/dinamic-founds/maxima_suavidad.png',
        output: './logo-maxima-suavidad-zpl.js',
        nombre: 'MAXIMA_SUAVIDAD',
        descripcion: 'Máxima Suavidad'
    },
    {
        input: './founds/dinamic-founds/producto_peruano.png',
        output: './logo-producto-peruano-zpl.js',
        nombre: 'PRODUCTO_PERUANO',
        descripcion: 'Producto Peruano'
    }
];

async function convertirPngAZpl(config) {
    try {
        console.log(`\n📂 Procesando: ${config.nombre}`);
        console.log(`   Entrada: ${config.input}`);
        
        // Cargar imagen
        const image = await Jimp.read(config.input);
        console.log(`   ✅ Original: ${image.bitmap.width}×${image.bitmap.height}px`);
        
        // Redimensionar a 14mm × 14mm (165×165 dots a 300 DPI)
        console.log(`   📐 Redimensionando a: ${TARGET_WIDTH}×${TARGET_HEIGHT}px (14mm×14mm)`);
        await image.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        // Convertir a monocromático
        console.log(`   🎨 Convirtiendo a blanco/negro...`);
        await image.greyscale();
        await image.contrast(0.4); // Aumentar contraste
        
        // Dimensiones
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const bytesPerRow = Math.ceil(width / 8);
        const totalBytes = bytesPerRow * height;
        
        console.log(`   📊 Dimensiones finales:`);
        console.log(`      - Píxeles: ${width}×${height}`);
        console.log(`      - Bytes por fila: ${bytesPerRow}`);
        console.log(`      - Total bytes: ${totalBytes}`);
        console.log(`      - Tamaño físico: ${(width / 11.81).toFixed(1)}mm × ${(height / 11.81).toFixed(1)}mm`);
        
        // Generar datos hexadecimales
        let hexData = '';
        
        for (let y = 0; y < height; y++) {
            let byte = 0;
            let bitPos = 7;
            
            for (let x = 0; x < width; x++) {
                const idx = image.getPixelIndex(x, y);
                const brightness = image.bitmap.data[idx];
                
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
        
        // Generar comando ZPL ^GFA
        const zplCommand = `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}`;
        
        // Crear archivo JS con la constante
        const jsContent = `// =====================================================
// 🎨 ${config.descripcion.toUpperCase()}
// =====================================================
// Tamaño: 14mm × 14mm (${width}×${height} dots a 300 DPI)
// Generado: ${new Date().toLocaleString('es-ES')}
// =====================================================

const ${config.nombre}_ZPL = \`${zplCommand}\`;

module.exports = { ${config.nombre}_ZPL };
`;
        
        // Guardar archivo
        fs.writeFileSync(config.output, jsContent, 'utf8');
        console.log(`   ✅ Generado: ${config.output}`);
        console.log(`   📦 Constante: ${config.nombre}_ZPL`);
        console.log(`   📏 Tamaño ZPL: ${zplCommand.length} caracteres`);
        
    } catch (error) {
        console.error(`\n❌ Error procesando ${config.nombre}:`, error.message);
    }
}

async function main() {
    console.log('🚀 Iniciando conversión de logos dinámicos...\n');
    
    for (const logoConfig of LOGOS_DINAMICOS) {
        await convertirPngAZpl(logoConfig);
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ CONVERSIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📋 Archivos generados:');
    LOGOS_DINAMICOS.forEach(logo => {
        console.log(`   - ${logo.output}`);
    });
    
    console.log('\n💡 Para usar en server.js:');
    LOGOS_DINAMICOS.forEach(logo => {
        console.log(`   const { ${logo.nombre}_ZPL } = require('./${path.basename(logo.output)}');`);
    });
}

main().catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
});
