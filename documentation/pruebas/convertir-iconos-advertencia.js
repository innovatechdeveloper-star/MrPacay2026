const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

console.log('🎨 CONVERTIDOR 4 ICONOS DE ADVERTENCIA → ZPL\n');
console.log('═══════════════════════════════════════════════════\n');

// Tamaño objetivo: 87×96 dots (7.4mm × 8.1mm) para máximo aprovechamiento
const TARGET_WIDTH = 87;
const TARGET_HEIGHT = 96;

const iconos = [
    { 
        nombre: 'LAVADO_30',
        archivo: './founds/godex/lavado-a-30.png',
        output: './icono-lavado-30-zpl.js',
        posicion: { x: 0, y: 305 }
    },
    { 
        nombre: 'NO_LEJIA',
        archivo: './founds/godex/no-usar-lejia.png',
        output: './icono-no-lejia-zpl.js',
        posicion: { x: 90, y: 305 }
    },
    { 
        nombre: 'PLANCHAR_BAJA',
        archivo: './founds/godex/planchar-a-baja-temperatura.png',
        output: './icono-planchar-baja-zpl.js',
        posicion: { x: 0, y: 404 }
    },
    { 
        nombre: 'SECADORA_BAJA',
        archivo: './founds/godex/secadora-a-baja-temperatura.png',
        output: './icono-secadora-baja-zpl.js',
        posicion: { x: 90, y: 404 }
    }
];

async function convertirIcono(config) {
    try {
        console.log(`📂 Procesando ${config.nombre}...`);
        const image = await Jimp.read(config.archivo);
        
        console.log(`   Original: ${image.bitmap.width}×${image.bitmap.height}px`);
        
        // Redimensionar manteniendo proporción y centrando
        image.contain({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        // Convertir a escala de grises
        image.greyscale();
        
        // Aumentar contraste para letras más claras
        image.contrast(0.6);
        
        // Convertir a blanco/negro con threshold
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const gray = this.bitmap.data[idx];
            const bw = gray < 128 ? 0 : 255;
            this.bitmap.data[idx] = bw;
            this.bitmap.data[idx + 1] = bw;
            this.bitmap.data[idx + 2] = bw;
        });
        
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
        const zplCommand = `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS`;
        
        // Generar el archivo JavaScript
        const jsContent = `// Icono ${config.nombre} generado automáticamente
// Fecha: ${new Date().toLocaleDateString('es-PE')}
// Tamaño: ${width}×${height}px (${(width/11.81).toFixed(1)}mm × ${(height/11.81).toFixed(1)}mm a 300 DPI)
// Posición en etiqueta: ^FO${config.posicion.x},${config.posicion.y}

const ICONO_${config.nombre}_ZPL = \`${zplCommand}\`;

module.exports = { ICONO_${config.nombre}_ZPL };
`;
        
        fs.writeFileSync(config.output, jsContent, 'utf8');
        
        console.log(`   ✅ Convertido: ${width}×${height} dots (${(totalBytes/1024).toFixed(2)} KB)`);
        console.log(`   📁 Archivo: ${config.output}\n`);
        
        return {
            nombre: config.nombre,
            constante: `ICONO_${config.nombre}_ZPL`,
            posicion: config.posicion
        };
        
    } catch (error) {
        console.error(`   ❌ Error procesando ${config.nombre}:`, error.message);
        return null;
    }
}

async function convertirTodos() {
    console.log('🔄 Iniciando conversión de 4 iconos...\n');
    
    const resultados = [];
    
    for (const config of iconos) {
        const resultado = await convertirIcono(config);
        if (resultado) {
            resultados.push(resultado);
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ CONVERSIÓN COMPLETADA\n');
    console.log('📊 Resumen de iconos generados:');
    console.log('┌─────────────────┬──────────────────┬────────────┐');
    console.log('│ Icono           │ Posición (X,Y)   │ Constante  │');
    console.log('├─────────────────┼──────────────────┼────────────┤');
    
    resultados.forEach(r => {
        console.log(`│ ${r.nombre.padEnd(15)} │ (${r.posicion.x.toString().padStart(3)},${r.posicion.y.toString().padStart(3)})        │ ${r.constante.substring(0,10)}... │`);
    });
    
    console.log('└─────────────────┴──────────────────┴────────────┘\n');
    console.log('💡 Próximo paso: Integrar en server.js');
    console.log('   Reemplazar LOGO_ADVERTENCIAS_ZPL por estos 4 iconos\n');
}

convertirTodos();
