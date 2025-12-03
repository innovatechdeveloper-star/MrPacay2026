const fs = require('fs');
const path = require('path');

console.log('🔧 REGENERADOR DE LOGO - EZPL COMANDO I\n');

// Crear un logo simple manualmente (cuadrado con "CAMI")
// Para probar que el formato funciona

// Logo 40×18 píxeles = 5 bytes × 18 líneas
// Vamos a crear un logo de prueba SIMPLE

console.log('📋 Generando logo de prueba simple...\n');

// Cada línea tiene 40 píxeles = 5 bytes = 10 caracteres hex
// 0 = blanco, F = negro

const logoLineas = [
    "FFFFFFFFFF",  // Línea 1: ████████████████████████████████████████
    "F000000003",  // Línea 2: █                                    ██
    "F0FFFFFE03",  // Línea 3: █   ████████████████████████████   ██
    "F0F000FE03",  // Línea 4: █   ██        ████████████████     ██
    "F0F000FE03",  // Línea 5: █   ██        ████████████████     ██
    "F0FFFFFE03",  // Línea 6: █   ████████████████████████████   ██
    "F0F000FE03",  // Línea 7: █   ██        ████████████████     ██
    "F0F000FE03",  // Línea 8: █   ██        ████████████████     ██
    "F0F000FE03",  // Línea 9: █   ██        ████████████████     ██
    "F000000003",  // Línea 10: █                                   ██
    "F0FFFFFE03",  // Línea 11: █   ████████████████████████████   ██
    "F0F00FE003",  // Línea 12: █   ██      ██████████████       ██
    "F0F00FE003",  // Línea 13: █   ██      ██████████████       ██
    "F0FFFFFE03",  // Línea 14: █   ████████████████████████████   ██
    "F0F00FE003",  // Línea 15: █   ██      ██████████████       ██
    "F0F00FE003",  // Línea 16: █   ██      ██████████████       ██
    "F000000003",  // Línea 17: █                                   ██
    "FFFFFFFFFF"   // Línea 18: ████████████████████████████████████████
];

const logoData = logoLineas.join('');

console.log(`✅ Logo generado:`);
console.log(`   Tamaño: 40×18 píxeles`);
console.log(`   Bytes: 5 bytes × 18 líneas = 90 bytes`);
console.log(`   Datos: ${logoData.length / 2} bytes hex\n`);

// Guardar constantes
const codigoJS = `// Logo CAMITEX REGENERADO para EZPL Comando I
// 40×18 píxeles - Logo simple de prueba con cuadro y texto
const LOGO_CAMITEX_EZPL_WIDTH = 5;   // 5 bytes = 40 píxeles
const LOGO_CAMITEX_EZPL_HEIGHT = 18; // 18 líneas
const LOGO_CAMITEX_EZPL_DATA = "${logoData}";

module.exports = {
    LOGO_CAMITEX_EZPL_WIDTH,
    LOGO_CAMITEX_EZPL_HEIGHT,
    LOGO_CAMITEX_EZPL_DATA
};
`;

fs.writeFileSync('logo-camitex-regenerado.js', codigoJS);

console.log('💾 Archivo guardado: logo-camitex-regenerado.js\n');
console.log('📋 Para actualizar server.js (líneas 636-638):\n');
console.log('────────────────────────────────────────────────────────────');
console.log(`const LOGO_CAMITEX_EZPL_WIDTH = 5;`);
console.log(`const LOGO_CAMITEX_EZPL_HEIGHT = 18;`);
console.log(`const LOGO_CAMITEX_EZPL_DATA = "${logoData.substring(0, 60)}...";`);
console.log('────────────────────────────────────────────────────────────\n');

// Crear script de prueba
const testScript = `const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

const LOGO_WIDTH = 5;
const LOGO_HEIGHT = 18;
const LOGO_DATA = "${logoData}";

console.log('🧪 TEST LOGO REGENERADO\\n');

const test = \`^Q50,0,0
^W30
^H10
^P1
^S3
^L
I,5,5,\${LOGO_WIDTH},\${LOGO_HEIGHT},\${LOGO_DATA}
AC,5,30,1,1,0,0,ROPA DE CAMA
AC,5,50,1,1,0,0,PRODUCTO TEST
AC,5,70,1,1,0,0,TELA: BP
AC,5,90,1,1,0,0,TAMANO: 2P
AC,5,110,1,1,0,0,HECHO EN PERU
E
\`;

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado');
    console.log('📤 Enviando logo regenerado...\\n');
    socket.write(test);
    socket.end();
});

socket.on('close', () => {
    console.log('✅ Enviado\\n');
    console.log('📋 ¿Ves un CUADRO con texto "CA" y "MI"?');
    console.log('   ✅ SÍ → ¡Formato correcto! Ahora usamos el BMP real');
    console.log('   ❌ NO → Problema con comando I o impresora');
});

socket.on('error', (err) => console.error('❌ Error:', err.message));
`;

fs.writeFileSync('test-logo-regenerado.js', testScript);

console.log('💾 Script de prueba guardado: test-logo-regenerado.js\n');
console.log('🚀 Ejecuta: node test-logo-regenerado.js\n');
console.log('Si ves el logo (cuadro con CA/MI), significa que el formato funciona');
console.log('y podemos convertir el BMP real correctamente.');
