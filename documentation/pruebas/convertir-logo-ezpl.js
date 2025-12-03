const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function convertirLogoAEZPL() {
    console.log('🖼️ Convirtiendo logo PNG a EZPL...');
    
    try {
        // Cargar imagen
        const image = await loadImage('d:/Informacion/DESARROLLO/mi-app-etiquetas/mi-app-etiquetas/founds/godex/LOGO.png');
        
        console.log(`📏 Tamaño original: ${image.width}x${image.height}`);
        
        // Redimensionar a un tamaño pequeño para etiqueta 30mm (aprox 40x18 pixels)
        const targetWidth = 40;
        const targetHeight = Math.round((image.height / image.width) * targetWidth);
        
        console.log(`📐 Tamaño objetivo: ${targetWidth}x${targetHeight}`);
        
        const canvas = createCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        
        // Dibujar imagen escalada
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        
        // Convertir a blanco y negro
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const pixels = imageData.data;
        
        let binaryData = '';
        let hexData = '';
        
        for (let y = 0; y < targetHeight; y++) {
            let rowBits = '';
            for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                
                // Promedio RGB
                const brightness = (r + g + b) / 3;
                
                // Umbral: 128 (negro si < 128, blanco si >= 128)
                const bit = brightness < 128 ? '1' : '0';
                rowBits += bit;
            }
            
            // Completar con 0s hasta múltiplo de 8
            while (rowBits.length % 8 !== 0) {
                rowBits += '0';
            }
            
            // Convertir a hex
            for (let i = 0; i < rowBits.length; i += 8) {
                const byte = rowBits.substr(i, 8);
                const hexByte = parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase();
                hexData += hexByte;
            }
            
            binaryData += rowBits;
        }
        
        // Calcular bytes por línea
        const bytesPerRow = Math.ceil(targetWidth / 8);
        
        console.log(`📊 Bytes por línea: ${bytesPerRow}`);
        console.log(`📦 Total bytes: ${hexData.length / 2}`);
        console.log('');
        
        // Generar comando EZPL para imagen
        // Formato: GG x,y,ancho_bytes,alto,data
        const ezplCommand = `GG,10,10,${bytesPerRow},${targetHeight},${hexData}`;
        
        console.log('✅ Comando EZPL generado');
        console.log('');
        console.log('📋 Para usar en el código:');
        console.log('─'.repeat(60));
        console.log(`const LOGO_EZPL = "GG,10,10,${bytesPerRow},${targetHeight},${hexData.substring(0, 100)}...";`);
        console.log('─'.repeat(60));
        console.log('');
        
        // Guardar comando completo
        fs.writeFileSync('logo-ezpl-command.txt', ezplCommand);
        console.log('💾 Comando completo guardado en: logo-ezpl-command.txt');
        
        // Guardar datos hex por separado
        fs.writeFileSync('logo-hex-data.txt', hexData);
        console.log('💾 Datos hex guardados en: logo-hex-data.txt');
        
        // Crear función JavaScript
        const jsCode = `
// Logo CAMITEX para EZPL
const LOGO_CAMITEX_EZPL_WIDTH = ${bytesPerRow};
const LOGO_CAMITEX_EZPL_HEIGHT = ${targetHeight};
const LOGO_CAMITEX_EZPL_DATA = "${hexData}";

function agregarLogoCamitex(x, y) {
    return \`GG,\${x},\${y},\${LOGO_CAMITEX_EZPL_WIDTH},\${LOGO_CAMITEX_EZPL_HEIGHT},\${LOGO_CAMITEX_EZPL_DATA}\`;
}
`;
        
        fs.writeFileSync('logo-camitex-ezpl.js', jsCode);
        console.log('💾 Código JavaScript guardado en: logo-camitex-ezpl.js');
        console.log('');
        console.log('✅ ¡Conversión completada!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('Si falta el módulo "canvas", instálalo con:');
        console.log('npm install canvas');
    }
}

convertirLogoAEZPL();
