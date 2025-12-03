const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

console.log('🧺 CONVERTIDOR LOGOS ADVERTENCIA FINALES → ZPL ^GFA\n');
console.log('═══════════════════════════════════════════════════\n');

// 📐 CONFIGURACIÓN: 14.5mm × 14.5mm a 300 DPI = 172 dots × 172 dots
const TARGET_WIDTH = 172;   // 14.5mm × 11.81 dots/mm ≈ 172 dots
const TARGET_HEIGHT = 172;  // 14.5mm × 11.81 dots/mm ≈ 172 dots

const LOGOS = [
    {
        input: './founds/warning-founds/max_temp.png',
        output: './logo-lavar-max-zpl.js',
        nombre: 'LAVAR_MAX',
        descripcion: 'Lavar temperatura máxima'
    },
    {
        input: './founds/warning-founds/no_planchar.png',
        output: './logo-no-planchar-zpl.js',
        nombre: 'NO_PLANCHAR',
        descripcion: 'No planchar'
    }
];

async function convertirPngAZpl(config) {
    try {
        console.log(`\n📂 Procesando: ${config.nombre}`);
        console.log(`   Entrada: ${config.input}`);
        
        // Cargar imagen
        const image = await Jimp.read(config.input);
        console.log(`   ✅ Original: ${image.bitmap.width}×${image.bitmap.height}px`);
        
        // Redimensionar a 14.5mm × 14.5mm (172×172 dots a 300 DPI)
        console.log(`   📐 Redimensionando a: ${TARGET_WIDTH}×${TARGET_HEIGHT}px (14.5mm×14.5mm)`);
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
// 🧺 ${config.descripcion.toUpperCase()}
// =====================================================
// Tamaño: 14.5mm × 14.5mm (${width}×${height} dots a 300 DPI)
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
    console.log('🚀 Iniciando conversión de logos de advertencia finales...\n');
    
    for (const logoConfig of LOGOS) {
        await convertirPngAZpl(logoConfig);
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ CONVERSIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('📋 Archivos generados:');
    LOGOS.forEach(logo => {
        console.log(`   - ${logo.output}`);
    });
    
    console.log('\n💡 Archivos listos para usar en server.js');
}

main().catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
});
