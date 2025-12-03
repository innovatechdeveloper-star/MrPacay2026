const path = require('path');

async function convertirIcono() {
    try {
        // Importar Jimp de forma dinámica
        const { default: Jimp } = await import('jimp');
        
        console.log('📊 Analizando escritorio.png...\n');
        
        const inputPath = path.join(__dirname, 'founds', 'instalation', 'escritorio.png');
        const image = await Jimp.read(inputPath);
        
        console.log(`📐 Dimensiones originales: ${image.bitmap.width}×${image.bitmap.height} px`);
        console.log(`📏 Aspect ratio: ${(image.bitmap.width / image.bitmap.height).toFixed(3)}\n`);
        
        // Crear iconos para diferentes usos
        const iconos = [
            { nombre: 'icon.png', size: 256, descripcion: 'Ícono principal' },
            { nombre: 'icon-64.png', size: 64, descripcion: 'Ícono bandeja (alta resolución)' },
            { nombre: 'icon-32.png', size: 32, descripcion: 'Ícono bandeja (normal)' },
            { nombre: 'icon-16.png', size: 16, descripcion: 'Ícono bandeja (baja resolución)' }
        ];
        
        const outputDir = path.join(__dirname, '..', 'sistema-bandeja', 'tray-app');
        
        console.log('🎨 Generando iconos:\n');
        
        for (const icono of iconos) {
            const outputPath = path.join(outputDir, icono.nombre);
            
            await image
                .clone()
                .resize(icono.size, icono.size, Jimp.RESIZE_BEZIER)
                .writeAsync(outputPath);
            
            console.log(`✅ ${icono.nombre} (${icono.size}×${icono.size}) → ${icono.descripcion}`);
        }
        
        console.log('\n✅ Todos los iconos generados exitosamente');
        console.log(`📁 Ubicación: sistema-bandeja/tray-app/\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

convertirIcono();
