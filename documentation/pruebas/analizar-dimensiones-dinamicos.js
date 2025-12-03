const { Jimp } = require('jimp');
const path = require('path');

console.log('📐 ANÁLISIS DE DIMENSIONES - LOGOS DINÁMICOS\n');
console.log('═══════════════════════════════════════════════════\n');

// Logo Camitex de referencia (27mm ancho × 10.4mm alto)
const LOGO_CAMITEX_WIDTH_DOTS = 319;  // 27mm a 300 DPI
const LOGO_CAMITEX_HEIGHT_DOTS = 123; // 10.4mm a 300 DPI
const DPI = 300;
const MM_TO_DOTS = DPI / 25.4; // 11.81 dots/mm

console.log('🎯 LOGO DE REFERENCIA (CAMITEX):');
console.log(`   Dimensiones: ${LOGO_CAMITEX_WIDTH_DOTS}×${LOGO_CAMITEX_HEIGHT_DOTS} dots`);
console.log(`   Tamaño físico: ${(LOGO_CAMITEX_WIDTH_DOTS / MM_TO_DOTS).toFixed(1)}mm × ${(LOGO_CAMITEX_HEIGHT_DOTS / MM_TO_DOTS).toFixed(1)}mm`);
console.log('');

const LOGOS_DINAMICOS = [
    {
        input: './founds/dinamic-founds/100_algodon.png',
        nombre: '100% ALGODÓN'
    },
    {
        input: './founds/dinamic-founds/maxima_suavidadv2.png',
        nombre: 'MÁXIMA SUAVIDAD'
    },
    {
        input: './founds/dinamic-founds/producto_peruanov2.png',
        nombre: 'PRODUCTO PERUANO'
    }
];

async function analizarLogos() {
    console.log('📊 LOGOS DINÁMICOS - DIMENSIONES ORIGINALES:\n');
    
    for (const logo of LOGOS_DINAMICOS) {
        try {
            const image = await Jimp.read(logo.input);
            const originalWidth = image.bitmap.width;
            const originalHeight = image.bitmap.height;
            const aspectRatio = originalWidth / originalHeight;
            
            console.log(`\n🎨 ${logo.nombre}`);
            console.log(`   Archivo: ${path.basename(logo.input)}`);
            console.log(`   Dimensiones originales: ${originalWidth}×${originalHeight}px`);
            console.log(`   Aspect Ratio: ${aspectRatio.toFixed(3)} (${aspectRatio > 1 ? 'horizontal' : aspectRatio < 1 ? 'vertical' : 'cuadrado'})`);
            
            // Opción 1: Escalar por ancho (mantener ancho de Camitex)
            const scaledByWidth_Height = Math.round(LOGO_CAMITEX_WIDTH_DOTS / aspectRatio);
            console.log(`\n   ✅ ESCALADO POR ANCHO (igual que Camitex):`);
            console.log(`      Dimensiones: ${LOGO_CAMITEX_WIDTH_DOTS}×${scaledByWidth_Height} dots`);
            console.log(`      Tamaño físico: ${(LOGO_CAMITEX_WIDTH_DOTS / MM_TO_DOTS).toFixed(1)}mm × ${(scaledByWidth_Height / MM_TO_DOTS).toFixed(1)}mm`);
            console.log(`      Bytes por fila: ${Math.ceil(LOGO_CAMITEX_WIDTH_DOTS / 8)}`);
            
            // Opción 2: Escalar por alto (mantener alto de Camitex)
            const scaledByHeight_Width = Math.round(LOGO_CAMITEX_HEIGHT_DOTS * aspectRatio);
            console.log(`\n   ⚠️  ESCALADO POR ALTO (igual alto que Camitex):`);
            console.log(`      Dimensiones: ${scaledByHeight_Width}×${LOGO_CAMITEX_HEIGHT_DOTS} dots`);
            console.log(`      Tamaño físico: ${(scaledByHeight_Width / MM_TO_DOTS).toFixed(1)}mm × ${(LOGO_CAMITEX_HEIGHT_DOTS / MM_TO_DOTS).toFixed(1)}mm`);
            console.log(`      Bytes por fila: ${Math.ceil(scaledByHeight_Width / 8)}`);
            
            // Verificar si cabe en el espacio disponible
            if (scaledByWidth_Height <= LOGO_CAMITEX_HEIGHT_DOTS) {
                console.log(`\n   ✅ RECOMENDACIÓN: Escalar por ANCHO`);
                console.log(`      Cabe perfectamente en el espacio de Camitex`);
            } else {
                console.log(`\n   ⚠️  RECOMENDACIÓN: Escalar por ANCHO con ajuste`);
                console.log(`      Sobrepasa ${scaledByWidth_Height - LOGO_CAMITEX_HEIGHT_DOTS} dots en altura`);
                console.log(`      Considera reducir proporcionalmente o recortar`);
            }
            
            console.log(`\n   ${'─'.repeat(70)}`);
            
        } catch (error) {
            console.error(`\n❌ Error procesando ${logo.nombre}:`, error.message);
        }
    }
    
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE CÁLCULOS');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Para mantener la MISMA CALIDAD y proporciones:');
    console.log('  • Escalar con ANCHO fijo = 319 dots (27mm)');
    console.log('  • Calcular ALTO proporcionalmente según aspect ratio');
    console.log('  • Usar Jimp.resize({ w: 319, h: AUTO_HEIGHT })');
    console.log('');
}

analizarLogos().catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
});
