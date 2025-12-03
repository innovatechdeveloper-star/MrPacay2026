const Jimp = require('jimp');
const path = require('path');

// Tamaños objetivo (en píxeles a 300 DPI)
const OPCIONES = {
    pequeno: { ancho: 80, alto: 36 },   // ~6.8mm × 3mm
    mediano: { ancho: 120, alto: 54 },  // ~10mm × 4.5mm
    grande: { ancho: 160, alto: 72 }    // ~13.5mm × 6mm
};

const TAMANO = 'mediano'; // Cambiar a 'pequeno', 'mediano' o 'grande'

console.log(`🖼️ Redimensionando logo a tamaño: ${TAMANO}`);
console.log(`📏 Dimensiones objetivo: ${OPCIONES[TAMANO].ancho}×${OPCIONES[TAMANO].alto} px`);

const inputPath = path.join(__dirname, 'founds', 'godex', 'logo-mono.bmp');
const outputPath = path.join(__dirname, 'founds', 'godex', `logo-${TAMANO}.bmp`);

Jimp.read(inputPath)
    .then(imagen => {
        console.log(`📐 Tamaño original: ${imagen.bitmap.width}×${imagen.bitmap.height} px`);
        
        // Redimensionar manteniendo proporción
        return imagen
            .resize(OPCIONES[TAMANO].ancho, OPCIONES[TAMANO].alto, Jimp.RESIZE_BICUBIC)
            .greyscale()
            .contrast(0.5)
            .posterize(2); // Forzar a 1-bit (blanco y negro puro)
    })
    .then(imagenRedim => {
        console.log(`📐 Tamaño nuevo: ${imagenRedim.bitmap.width}×${imagenRedim.bitmap.height} px`);
        return imagenRedim.write(outputPath);
    })
    .then(() => {
        console.log(`✅ Logo redimensionado guardado en: ${outputPath}`);
        console.log(`\n📋 Siguiente paso: Ejecuta el convertidor:`);
        console.log(`   node convertir-logo-redim-ezpl.js`);
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
