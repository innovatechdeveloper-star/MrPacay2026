const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertirIcono() {
    try {
        console.log('📊 Analizando escritorio.png...\n');
        
        const inputPath = path.join(__dirname, 'founds', 'instalation', 'escritorio.png');
        
        if (!fs.existsSync(inputPath)) {
            console.error('❌ No se encontró escritorio.png en founds/instalation/');
            return;
        }
        
        // Obtener metadatos
        const metadata = await sharp(inputPath).metadata();
        console.log(`📐 Dimensiones originales: ${metadata.width}×${metadata.height} px`);
        console.log(`📏 Formato: ${metadata.format}`);
        console.log(`📏 Aspect ratio: ${(metadata.width / metadata.height).toFixed(3)}\n`);
        
        // Crear iconos para diferentes usos
        const iconos = [
            { nombre: 'icon.png', size: 256, descripcion: 'Ícono principal (Windows)' },
            { nombre: 'icon-64.png', size: 64, descripcion: 'Ícono bandeja (alta resolución)' },
            { nombre: 'icon-32.png', size: 32, descripcion: 'Ícono bandeja (normal)' },
            { nombre: 'icon-16.png', size: 16, descripcion: 'Ícono bandeja (baja resolución)' }
        ];
        
        const outputDir = path.join(__dirname, 'sistema-bandeja', 'tray-app');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        console.log('🎨 Generando iconos:\n');
        
        for (const icono of iconos) {
            const outputPath = path.join(outputDir, icono.nombre);
            
            await sharp(inputPath)
                .resize(icono.size, icono.size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);
            
            console.log(`✅ ${icono.nombre.padEnd(15)} (${icono.size}×${icono.size}) → ${icono.descripcion}`);
        }
        
        console.log('\n✅ Todos los iconos generados exitosamente');
        console.log(`📁 Ubicación: sistema-bandeja/tray-app/\n`);
        console.log('📝 Nota: Para Windows, Electron usará automáticamente:');
        console.log('   - icon.png (256×256) para ventanas');
        console.log('   - icon-32.png (32×32) para bandeja en pantallas normales');
        console.log('   - icon-16.png (16×16) para bandeja en pantallas pequeñas\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n💡 Solución: Instala Sharp con: npm install sharp');
    }
}

convertirIcono();
