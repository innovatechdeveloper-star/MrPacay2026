const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Redimensiona el BMP y convierte a EZPL
 */

const bmpPath = path.join(__dirname, 'founds', 'godex', 'logo-mono.bmp');

// Tamaño objetivo para etiqueta de 30mm (354 pixels de ancho a 300 DPI)
// Dejamos margen, usamos máximo 80 pixels de ancho
const TARGET_WIDTH = 80;
const TARGET_HEIGHT = 33; // Mantiene proporción aproximada de 998x418

console.log('🖼️ Redimensionando logo BMP para EZPL...');

async function convertirLogoRedimensionado() {
    try {
        // Cargar imagen original
        const img = await loadImage(bmpPath);
        
        console.log(`📏 Tamaño original: ${img.width}x${img.height}`);
        console.log(`📐 Tamaño objetivo: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
        
        // Crear canvas con tamaño objetivo
        const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
        const ctx = canvas.getContext('2d');
        
        // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        
        // Obtener datos de imagen
        const imageData = ctx.getImageData(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        
        // Convertir a monocromo
        const bytesPerLine = Math.ceil(TARGET_WIDTH / 8);
        let hexData = '';
        
        console.log(`📊 Bytes por línea: ${bytesPerLine}`);
        
        for (let y = 0; y < TARGET_HEIGHT; y++) {
            for (let byteIndex = 0; byteIndex < bytesPerLine; byteIndex++) {
                let byte = 0;
                
                for (let bit = 0; bit < 8; bit++) {
                    const x = byteIndex * 8 + bit;
                    
                    if (x < TARGET_WIDTH) {
                        const pixelIndex = (y * TARGET_WIDTH + x) * 4;
                        const r = imageData.data[pixelIndex];
                        const g = imageData.data[pixelIndex + 1];
                        const b = imageData.data[pixelIndex + 2];
                        
                        // Calcular brillo
                        const brightness = (r + g + b) / 3;
                        
                        // Si es oscuro (< 128), poner bit a 1
                        if (brightness < 128) {
                            byte |= (0x80 >> bit);
                        }
                    }
                }
                
                hexData += byte.toString(16).padStart(2, '0').toUpperCase();
            }
        }
        
        console.log(`\n✅ Conversión completada`);
        console.log(`📦 Total bytes: ${hexData.length / 2}`);
        console.log(`📋 Primeros bytes: ${hexData.substring(0, 60)}...`);
        
        // Generar comando EZPL
        const ezplCommand = `GG,85,8,${bytesPerLine},${TARGET_HEIGHT},${hexData}`;
        
        // Guardar archivos
        fs.writeFileSync('logo-ezpl-final.txt', ezplCommand);
        console.log('💾 Comando EZPL guardado en: logo-ezpl-final.txt');
        
        fs.writeFileSync('logo-hex-final.txt', hexData);
        console.log('💾 Datos hex guardados en: logo-hex-final.txt');
        
        // Generar código JavaScript
        const jsCode = `
// Logo CAMITEX para EZPL (${TARGET_WIDTH}x${TARGET_HEIGHT} pixels)
const LOGO_CAMITEX_EZPL_WIDTH = ${bytesPerLine};
const LOGO_CAMITEX_EZPL_HEIGHT = ${TARGET_HEIGHT};
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
        
        fs.writeFileSync('logo-camitex-ezpl-final.js', jsCode);
        console.log('💾 Código JavaScript guardado en: logo-camitex-ezpl-final.js');
        
        console.log(`\n📋 Para usar en server.js:`);
        console.log('────────────────────────────────────────────────────────────');
        console.log(`const LOGO_CAMITEX_EZPL_WIDTH = ${bytesPerLine};`);
        console.log(`const LOGO_CAMITEX_EZPL_HEIGHT = ${TARGET_HEIGHT};`);
        console.log(`const LOGO_CAMITEX_EZPL_DATA = "${hexData.substring(0, 50)}...";`);
        console.log('────────────────────────────────────────────────────────────');
        
        console.log('\n✅ ¡Logo redimensionado y convertido exitosamente!');
        console.log(`✨ El logo ahora mide ${TARGET_WIDTH}x${TARGET_HEIGHT} pixels (cabe perfectamente en etiqueta de 30mm)`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

convertirLogoRedimensionado();
