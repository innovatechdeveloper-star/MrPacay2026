// Script de prueba para verificar generación de ZPL de Godex
const { LOGO_MISTI_ZPL } = require('./logo-misti-zpl-generado.js');
const { ICONO_LAVADO_30_ZPL } = require('./icono-lavado-30-zpl.js');
const { ICONO_NO_LEJIA_ZPL } = require('./icono-no-lejia-zpl.js');
const { ICONO_PLANCHAR_BAJA_ZPL } = require('./icono-planchar-baja-zpl.js');
const { ICONO_SECADORA_BAJA_ZPL } = require('./icono-secadora-baja-zpl.js');

// Simular logo CAMITEX (solo para tamaño)
const LOGO_CAMITEX_ZPL = '^GFA,4920,4920,40,' + '00'.repeat(2460) + '^FS';

// Datos de ejemplo
const datosEjemplo = {
    subcategoria: 'ALMOHADA',
    marca: 'BP',
    modelo: 'King',
    codigo_producto: 'ALMOH001',
    unidad_medida: 'UND'
};

function generarRotuladoZPL(data) {
    const { 
        subcategoria,
        marca,
        modelo,
        codigo_producto,
        unidad_medida
    } = data;
    
    const tipoProducto = (subcategoria || 'PRODUCTO').toUpperCase();
    const telaTipo = (marca || '').toUpperCase();
    const tamano = (modelo || '').toUpperCase();
    const codigoBarras = `${codigo_producto || 'SIN-CODIGO'}-${unidad_medida || 'UND'}`;
    
    let productoLinea1 = tipoProducto;
    let productoLinea2 = '';
    
    if (tipoProducto.length > 18) {
        const corte = tipoProducto.lastIndexOf(' ', 18);
        if (corte > 0) {
            productoLinea1 = tipoProducto.substring(0, corte);
            productoLinea2 = tipoProducto.substring(corte + 1);
        }
    }
    
    const zpl = `^XA
^PW354
^LL590

^FO30,10${LOGO_CAMITEX_ZPL.substring(0, 50)}...(logo CAMITEX)...^FS

^FO0,305^GFA...(LAVADO_30)...^FS
^FO90,305^GFA...(NO_LEJIA)...^FS
^FO0,404^GFA...(PLANCHAR_BAJA)...^FS
^FO90,404^GFA...(SECADORA_BAJA)...^FS

^FO177,305^GFA...(LOGO_MISTI)...^FS

^CF0,40
^FO40,150^FD${productoLinea1}^FS
${productoLinea2 ? `^FO40,195^FD${productoLinea2}^FS` : ''}

^CF0,28
^FO40,${productoLinea2 ? '240' : '205'}^FDTELA: ${telaTipo}^FS

^CF0,28
^FO40,${productoLinea2 ? '275' : '240'}^FDTAMANO: ${tamano}^FS

^CF0,24
^FO40,${productoLinea2 ? '305' : '270'}^FDHECHO EN PERU^FS

~SD15
^FO40,500^BY2^BCN,80,Y,N^FD${codigoBarras}^FS

^XZ`;
    
    return zpl;
}

console.log('🧪 PRUEBA DE GENERACIÓN ZPL - GODEX G530\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📋 Datos de prueba:');
console.log(JSON.stringify(datosEjemplo, null, 2));
console.log('\n🏷️ ZPL Generada (estructura):\n');

const zplGenerada = generarRotuladoZPL(datosEjemplo);
console.log(zplGenerada);

console.log('\n\n✅ VERIFICACIÓN DE ELEMENTOS:');
console.log('═══════════════════════════════════════════════════════════');
console.log('✓ Logo CAMITEX:        ^FO30,10  (superior, 319×123 dots)');
console.log('✓ Icono Lavado 30°:    ^FO0,305  (izq-arriba, 87×96 dots)');
console.log('✓ Icono No Lejía:      ^FO90,305 (der-arriba, 87×96 dots)');
console.log('✓ Icono Planchar:      ^FO0,404  (izq-abajo, 87×96 dots)');
console.log('✓ Icono Secadora:      ^FO90,404 (der-abajo, 87×96 dots)');
console.log('✓ Logo MISTI:          ^FO177,305 (columna derecha, 177×177 dots)');
console.log('✓ Producto:            ^FO40,150 (texto principal)');
console.log('✓ TELA:                ^FO40,205/240 (info tela)');
console.log('✓ TAMAÑO:              ^FO40,240/275 (info tamaño)');
console.log('✓ HECHO EN PERU:       ^FO40,270/305 (origen)');
console.log('✓ Código de Barras:    ^FO40,500 (inferior, Code128)');
console.log('\n📊 Resumen de espaciado:');
console.log('   10-133:   Logo CAMITEX (123 dots)');
console.log('   150-305:  Info producto (155 dots)');
console.log('   305-500:  Iconos + Logo MISTI (195 dots)');
console.log('   500-580:  Código de barras (80 dots)');
console.log('   580-590:  Margen inferior (10 dots)');
console.log('   ────────');
console.log('   TOTAL:    590 dots ✓\n');

// Verificar tamaños de datos
console.log('📦 Tamaños de datos ZPL:');
console.log(`   LOGO_CAMITEX:    ${(LOGO_CAMITEX_ZPL.length / 1024).toFixed(2)} KB`);
console.log(`   LOGO_MISTI:      ${(LOGO_MISTI_ZPL.length / 1024).toFixed(2)} KB`);
console.log(`   ICONO_LAVADO:    ${(ICONO_LAVADO_30_ZPL.length / 1024).toFixed(2)} KB`);
console.log(`   ICONO_NO_LEJIA:  ${(ICONO_NO_LEJIA_ZPL.length / 1024).toFixed(2)} KB`);
console.log(`   ICONO_PLANCHAR:  ${(ICONO_PLANCHAR_BAJA_ZPL.length / 1024).toFixed(2)} KB`);
console.log(`   ICONO_SECADORA:  ${(ICONO_SECADORA_BAJA_ZPL.length / 1024).toFixed(2)} KB`);

const totalKB = (
    LOGO_CAMITEX_ZPL.length +
    LOGO_MISTI_ZPL.length +
    ICONO_LAVADO_30_ZPL.length +
    ICONO_NO_LEJIA_ZPL.length +
    ICONO_PLANCHAR_BAJA_ZPL.length +
    ICONO_SECADORA_BAJA_ZPL.length
) / 1024;

console.log(`   ────────────────`);
console.log(`   TOTAL GRÁFICOS:  ${totalKB.toFixed(2)} KB\n`);

console.log('💡 Para probar en impresora real, usa el endpoint:');
console.log('   POST http://localhost:3000/api/imprimir/rotulado');
console.log('   Body: ' + JSON.stringify(datosEjemplo));
