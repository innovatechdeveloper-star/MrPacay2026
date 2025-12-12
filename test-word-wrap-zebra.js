// 🧪 PRUEBA DEL ALGORITMO WORD WRAP PARA ZEBRA
// Prueba la división inteligente de texto sin imprimir

console.log('🧪 ====== PRUEBA DE WORD WRAP INTELIGENTE ======\n');

const MAX_CHARS_POR_LINEA = 15;

function testWordWrap(nombreProducto) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📝 PROBANDO: "${nombreProducto}" (${nombreProducto.length} caracteres)`);
    console.log(`${'='.repeat(70)}\n`);
    
    const palabras = nombreProducto.split(' ').filter(p => p.length > 0);
    const lineasNombre = [];
    
    console.log(`   Palabras detectadas: [${palabras.map(p => `"${p}"`).join(', ')}]`);
    console.log(`   Límite por línea: ${MAX_CHARS_POR_LINEA} caracteres\n`);
    
    let lineaActual = '';
    let palabraIndex = 0;
    
    while (palabraIndex < palabras.length && lineasNombre.length < 4) {
        const palabra = palabras[palabraIndex];
        
        // Caso especial: palabra sola más larga que el límite
        if (palabra.length > MAX_CHARS_POR_LINEA) {
            console.log(`   ⚠️ Palabra "${palabra}" (${palabra.length} chars) excede límite ${MAX_CHARS_POR_LINEA}`);
            
            if (lineaActual.length === 0) {
                lineasNombre.push(palabra.substring(0, MAX_CHARS_POR_LINEA));
                console.log(`   ✂️ Línea ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}" (truncada)\n`);
                palabraIndex++;
                continue;
            } else {
                lineasNombre.push(lineaActual);
                console.log(`   ✅ Línea ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}" (${lineasNombre[lineasNombre.length - 1].length} chars)\n`);
                lineaActual = '';
                continue;
            }
        }
        
        // Probar agregar palabra a línea actual
        const pruebaLinea = lineaActual.length === 0 
            ? palabra 
            : `${lineaActual} ${palabra}`;
        
        console.log(`   🔍 Contando: "${pruebaLinea}" = ${pruebaLinea.length} chars`);
        
        if (pruebaLinea.length <= MAX_CHARS_POR_LINEA) {
            // ✅ Cabe!
            lineaActual = pruebaLinea;
            console.log(`      ✅ CABE! Línea actual: "${lineaActual}"`);
            palabraIndex++;
        } else {
            // ❌ NO cabe!
            console.log(`      ❌ NO CABE! Se pasa por ${pruebaLinea.length - MAX_CHARS_POR_LINEA} caracteres`);
            if (lineaActual.length > 0) {
                lineasNombre.push(lineaActual);
                console.log(`      📦 Guardando línea ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}"`);
                console.log(`      🔄 Palabra "${palabra}" se moverá a la siguiente línea\n`);
                lineaActual = '';
            }
        }
    }
    
    // Agregar última línea
    if (lineaActual.length > 0 && lineasNombre.length < 4) {
        lineasNombre.push(lineaActual);
        console.log(`   📦 Línea final ${lineasNombre.length}: "${lineasNombre[lineasNombre.length - 1]}"\n`);
    }
    
    // Resultado final
    console.log(`\n╔═══════════════════════════════════════════════════════════════╗`);
    console.log(`║  🎯 RESULTADO FINAL                                            ║`);
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    lineasNombre.forEach((linea, index) => {
        console.log(`║  LÍNEA ${index + 1}: "${linea.padEnd(30)}" (${String(linea.length).padStart(2)} chars) ║`);
    });
    console.log(`╠═══════════════════════════════════════════════════════════════╣`);
    console.log(`║  ⚡ Esta división se aplicará IGUAL a ambas etiquetas         ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════╝`);
    
    const palabrasSobrantes = palabras.slice(palabraIndex);
    if (palabrasSobrantes.length > 0) {
        console.log(`\n⚠️  ADVERTENCIA: Quedaron ${palabrasSobrantes.length} palabras sin mostrar:`);
        console.log(`   "${palabrasSobrantes.join(' ')}"`);
    }
}

// ========== CASOS DE PRUEBA ==========

// Tu caso ejemplo
testWordWrap('FUNDAS DE COLCHON BP');

// Más casos
testWordWrap('SABANAS');
testWordWrap('COLCHAS MATRIMONIALES KING');
testWordWrap('PROTECTOR DE COLCHON IMPERMEABLE PREMIUM');
testWordWrap('A B C D E F G H I J K L M N O P');

console.log('\n\n✅ Pruebas completadas. Ahora puedes imprimir con confianza!\n');
