const fs = require('fs');
const path = require('path');

// Lee el BMP redimensionado
const TAMANO = 'mediano'; // Debe coincidir con redimensionar-logo.js
const bmpPath = path.join(__dirname, 'founds', 'godex', `logo-${TAMANO}.bmp`);

console.log(`🖼️ Convirtiendo logo redimensionado (${TAMANO})...`);

const buffer = fs.readFileSync(bmpPath);

// Leer header BMP
const ancho = buffer.readInt32LE(18);
const alto = buffer.readInt32LE(22);
const bitsPerPixel = buffer.readInt16LE(28);
const offsetDatos = buffer.readInt32LE(10);

console.log(`📏 Información del BMP:`);
console.log(`   Ancho: ${ancho} pixels`);
console.log(`   Alto: ${alto} pixels`);
console.log(`   Bits por pixel: ${bitsPerPixel}`);

if (bitsPerPixel !== 1) {
    console.error('❌ Error: El BMP debe ser monocrómico (1 bit)');
    process.exit(1);
}

// Calcular bytes por línea
const bytesRealPorLinea = Math.ceil(ancho / 8);
const bytesPadding = Math.ceil(bytesRealPorLinea / 4) * 4;

console.log(`📊 Bytes por línea (real): ${bytesRealPorLinea}`);
console.log(`📊 Bytes por línea (con padding): ${bytesPadding}`);

// Convertir a hexadecimal (INVERTIDO para EZPL)
let hexData = '';
for (let y = alto - 1; y >= 0; y--) {
    const lineaOffset = offsetDatos + (y * bytesPadding);
    
    for (let x = 0; x < bytesRealPorLinea; x++) {
        const byte = buffer[lineaOffset + x];
        // INVERTIR bits: EZPL usa 1=negro, BMP usa 0=negro
        const byteInvertido = ~byte & 0xFF;
        hexData += byteInvertido.toString(16).padStart(2, '0').toUpperCase();
    }
}

console.log(`✅ Conversión completada`);
console.log(`📦 Total bytes: ${hexData.length / 2}`);
console.log(`📋 Primeros 40 chars: ${hexData.substring(0, 40)}...`);

// Generar comando EZPL
const comandoEZPL = `GG,5,5,${bytesRealPorLinea},${alto},${hexData}`;

// Guardar archivos
fs.writeFileSync('logo-ezpl-command-final.txt', comandoEZPL);
fs.writeFileSync('logo-ezpl-data-final.txt', hexData);

// Generar código JavaScript
const codigoJS = `// Logo CAMITEX para EZPL (${ancho}×${alto} pixels - ${TAMANO})
const LOGO_CAMITEX_EZPL_WIDTH = ${bytesRealPorLinea};
const LOGO_CAMITEX_EZPL_HEIGHT = ${alto};
const LOGO_CAMITEX_EZPL_DATA = "${hexData}";

module.exports = {
    LOGO_CAMITEX_EZPL_WIDTH,
    LOGO_CAMITEX_EZPL_HEIGHT,
    LOGO_CAMITEX_EZPL_DATA
};
`;

fs.writeFileSync('logo-camitex-ezpl-final.js', codigoJS);

console.log(`💾 Archivos guardados:`);
console.log(`   - logo-ezpl-command-final.txt (comando completo)`);
console.log(`   - logo-ezpl-data-final.txt (datos hex)`);
console.log(`   - logo-camitex-ezpl-final.js (código JavaScript)`);

console.log(`\n📋 Para usar en server.js (líneas 636-638):`);
console.log(`────────────────────────────────────────────────────────────`);
console.log(`const LOGO_CAMITEX_EZPL_WIDTH = ${bytesRealPorLinea};`);
console.log(`const LOGO_CAMITEX_EZPL_HEIGHT = ${alto};`);
console.log(`const LOGO_CAMITEX_EZPL_DATA = "${hexData.substring(0, 60)}...";`);
console.log(`────────────────────────────────────────────────────────────`);
console.log(`\n✅ Listo para actualizar server.js`);
