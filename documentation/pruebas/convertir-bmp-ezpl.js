const fs = require('fs');
const path = require('path');

/**
 * Convierte un archivo BMP monocrómico (1 bit) a formato EZPL
 * para impresoras Godex
 */

const bmpPath = path.join(__dirname, 'founds', 'godex', 'logo-mono.bmp');

console.log('🖼️ Leyendo archivo BMP monocrómico...');

// Leer el archivo BMP
const bmpBuffer = fs.readFileSync(bmpPath);

// Leer encabezado BMP
const fileSize = bmpBuffer.readUInt32LE(2);
const dataOffset = bmpBuffer.readUInt32LE(10);
const headerSize = bmpBuffer.readUInt32LE(14);
const width = bmpBuffer.readUInt32LE(18);
const height = bmpBuffer.readUInt32LE(22);
const bitsPerPixel = bmpBuffer.readUInt16LE(28);

console.log(`📏 Información del BMP:`);
console.log(`   Tamaño archivo: ${fileSize} bytes`);
console.log(`   Ancho: ${width} pixels`);
console.log(`   Alto: ${height} pixels`);
console.log(`   Bits por pixel: ${bitsPerPixel}`);
console.log(`   Offset datos: ${dataOffset}`);

if (bitsPerPixel !== 1) {
    console.error('❌ ERROR: El archivo debe ser monocrómico (1 bit por pixel)');
    process.exit(1);
}

// Calcular bytes por línea (con padding a múltiplo de 4)
const bytesPerLine = Math.ceil(width / 8);
const paddedBytesPerLine = Math.ceil(bytesPerLine / 4) * 4;

console.log(`📊 Bytes por línea: ${bytesPerLine}`);
console.log(`📦 Bytes con padding: ${paddedBytesPerLine}`);

// Extraer datos de imagen (BMP se guarda invertido verticalmente)
let hexData = '';

for (let y = height - 1; y >= 0; y--) {
    const rowOffset = dataOffset + (y * paddedBytesPerLine);
    
    for (let x = 0; x < bytesPerLine; x++) {
        const byte = bmpBuffer[rowOffset + x];
        // Invertir bits porque BMP usa 1=blanco, 0=negro y necesitamos 1=negro, 0=blanco
        const invertedByte = ~byte & 0xFF;
        hexData += invertedByte.toString(16).padStart(2, '0').toUpperCase();
    }
}

console.log(`\n✅ Conversión completada`);
console.log(`📦 Total bytes: ${hexData.length / 2}`);
console.log(`📋 Primeros bytes: ${hexData.substring(0, 40)}...`);

// Generar comando EZPL
const ezplCommand = `GG,10,10,${bytesPerLine},${height},${hexData}`;

// Guardar archivos
fs.writeFileSync('logo-bmp-ezpl-command.txt', ezplCommand);
console.log('💾 Comando EZPL guardado en: logo-bmp-ezpl-command.txt');

fs.writeFileSync('logo-bmp-hex-data.txt', hexData);
console.log('💾 Datos hex guardados en: logo-bmp-hex-data.txt');

// Generar código JavaScript
const jsCode = `
// Logo CAMITEX para EZPL (desde BMP monocrómico)
const LOGO_CAMITEX_EZPL_WIDTH = ${bytesPerLine};
const LOGO_CAMITEX_EZPL_HEIGHT = ${height};
const LOGO_CAMITEX_EZPL_DATA = "${hexData}";

function agregarLogoCamitex(x, y) {
    return \`GG,\${x},\${y},\${LOGO_CAMITEX_EZPL_WIDTH},\${LOGO_CAMITEX_EZPL_HEIGHT},\${LOGO_CAMITEX_EZPL_DATA}\`;
}

module.exports = {
    LOGO_CAMITEX_EZPL_WIDTH,
    LOGO_CAMITEX_EZPL_HEIGHT,
    LOGO_CAMITEX_EZPL_DATA,
    agregarLogoCamitex
};
`;

fs.writeFileSync('logo-camitex-bmp-ezpl.js', jsCode);
console.log('💾 Código JavaScript guardado en: logo-camitex-bmp-ezpl.js');

console.log(`\n📋 Para usar en el código:`);
console.log('────────────────────────────────────────────────────────────');
console.log(`const LOGO_EZPL_WIDTH = ${bytesPerLine};`);
console.log(`const LOGO_EZPL_HEIGHT = ${height};`);
console.log(`const LOGO_EZPL_DATA = "${hexData.substring(0, 40)}...";`);
console.log('────────────────────────────────────────────────────────────');

console.log('\n✅ ¡Conversión desde BMP completada!');
