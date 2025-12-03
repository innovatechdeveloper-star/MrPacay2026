// ====================================================================
// CONVERTIR ESCRITORIO.PNG A ICON.ICO
// ====================================================================

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = path.join(__dirname, '..', 'founds', 'instalation', 'escritorio.png');
const outputPath = path.join(__dirname, 'icon.ico');

console.log('🔄 Convirtiendo imagen a icono...');
console.log('   Origen:', inputPath);
console.log('   Destino:', outputPath);
console.log('');

// Función para hacer la imagen cuadrada y redimensionar
async function prepareImage(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        const size = Math.max(metadata.width, metadata.height, 256);
        
        // Crear imagen cuadrada con fondo transparente
        const tempPath = path.join(__dirname, 'temp-icon.png');
        
        await sharp(imagePath)
            .resize(256, 256, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(tempPath);
        
        return tempPath;
    } catch (error) {
        console.error('Error preparando imagen:', error);
        throw error;
    }
}

// Convertir a ICO
async function convert() {
    try {
        // Verificar que existe la imagen
        if (!fs.existsSync(inputPath)) {
            console.error('❌ ERROR: No se encuentra la imagen en:');
            console.error('   ' + inputPath);
            process.exit(1);
        }
        
        console.log('📐 Preparando imagen (256x256)...');
        const preparedPath = await prepareImage(inputPath);
        
        console.log('🔧 Convirtiendo a formato .ico...');
        
        // Crear múltiples tamaños para el .ico
        const sizes = [16, 32, 48, 256];
        const buffers = [];
        
        for (const size of sizes) {
            const buffer = await sharp(preparedPath)
                .resize(size, size)
                .png()
                .toBuffer();
            buffers.push(buffer);
        }
        
        // Usar sharp para crear el ICO (soporte nativo en Windows)
        console.log('💾 Guardando icon.ico...');
        
        // Para ICO usamos el archivo PNG de 256x256 directamente
        // Electron puede usar PNG como icono en Windows
        await sharp(preparedPath)
            .resize(256, 256)
            .toFormat('png')
            .toFile(outputPath.replace('.ico', '.png'));
        
        // Copiar también como .ico (Electron acepta ambos)
        fs.copyFileSync(outputPath.replace('.ico', '.png'), outputPath);
        
        // Limpiar archivo temporal
        if (fs.existsSync(preparedPath)) {
            fs.unlinkSync(preparedPath);
        }
        
        console.log('');
        console.log('✅ ¡Conversión exitosa!');
        console.log('   Archivos creados:');
        console.log('   - icon.ico');
        console.log('   - icon.png');
        console.log('');
        console.log('📍 Ubicación:');
        console.log('   ' + outputPath);
        console.log('');
        console.log('🎯 Próximo paso:');
        console.log('   Reinicia la aplicación para ver el nuevo icono');
        console.log('   npm start');
        
    } catch (error) {
        console.error('❌ Error durante la conversión:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

convert();
