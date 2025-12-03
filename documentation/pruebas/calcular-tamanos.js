const fs = require('fs');
const path = require('path');

console.log(`🖼️ Redimensionador manual de BMP monocrómico`);
console.log(`📋 Este script NO redimensiona, pero te da las dimensiones correctas\n`);

// Leer BMP original
const bmpPath = path.join(__dirname, 'founds', 'godex', 'logo-mono.bmp');
const buffer = fs.readFileSync(bmpPath);

const anchoOriginal = buffer.readInt32LE(18);
const altoOriginal = buffer.readInt32LE(22);

console.log(`📐 Logo original: ${anchoOriginal}×${altoOriginal} px`);
console.log(`📏 Tamaño real a 300 DPI: ${(anchoOriginal/11.81).toFixed(1)}mm × ${(altoOriginal/11.81).toFixed(1)}mm\n`);

// Calcular proporciones
const proporcion = anchoOriginal / altoOriginal;
console.log(`📊 Proporción: ${proporcion.toFixed(2)}:1\n`);

// Opciones de tamaño
const opciones = [
    { nombre: 'Pequeño', ancho: 80, alto: Math.round(80/proporcion) },
    { nombre: 'Mediano', ancho: 120, alto: Math.round(120/proporcion) },
    { nombre: 'Grande', ancho: 160, alto: Math.round(160/proporcion) }
];

console.log(`📋 OPCIONES DE REDIMENSIONAMIENTO:\n`);
opciones.forEach(op => {
    const anchoMM = (op.ancho / 11.81).toFixed(1);
    const altoMM = (op.alto / 11.81).toFixed(1);
    const bytesAncho = Math.ceil(op.ancho / 8);
    
    console.log(`${op.nombre}:`);
    console.log(`   Píxeles: ${op.ancho}×${op.alto} px`);
    console.log(`   Tamaño real: ${anchoMM}mm × ${altoMM}mm`);
    console.log(`   Bytes ancho: ${bytesAncho}`);
    console.log(`   Cabe en etiqueta 30mm: ${parseFloat(anchoMM) < 25 ? '✅ SÍ' : '❌ NO'}\n`);
});

console.log(`\n⚠️ PROBLEMA: El logo original es demasiado grande.`);
console.log(`\n📋 SOLUCIONES:`);
console.log(`\n1. OPCIÓN RÁPIDA (recomendada):`);
console.log(`   - Usa una herramienta externa para redimensionar:`);
console.log(`   - Windows: Paint, GIMP, Photoshop`);
console.log(`   - Online: https://www.photopea.com`);
console.log(`   - Redimensiona a: 120×${Math.round(120/proporcion)} píxeles`);
console.log(`   - Guarda como BMP monocrómico (1-bit)`);
console.log(`   - Guarda en: founds/godex/logo-mediano.bmp`);
console.log(`\n2. OPCIÓN ALTERNATIVA:`);
console.log(`   - Instalar Jimp: npm install jimp`);
console.log(`   - Ejecutar: node redimensionar-logo.js`);
console.log(`\n3. OPCIÓN TEMPORAL:`);
console.log(`   - Usa el logo actual de 40×18px que ya funciona`);
console.log(`   - Es pequeño pero se ve (muestra "CAMI")`);

console.log(`\n💡 RECOMENDACIÓN:`);
console.log(`   Redimensiona manualmente a 120×${Math.round(120/proporcion)}px en Paint:`);
console.log(`   1. Abre: founds/godex/logo-mono.bmp`);
console.log(`   2. Redimensionar → 120×${Math.round(120/proporcion)} píxeles`);
console.log(`   3. Guardar como → logo-mediano.bmp (BMP monocrómico)`);
console.log(`   4. Ejecutar: node convertir-logo-mediano.js`);
