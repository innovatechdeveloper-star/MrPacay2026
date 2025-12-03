const net = require('net');

// Configuración Godex
const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST DE LOGO GODEX G530\n');

// Logo actual (40×18 px)
const LOGO_WIDTH = 5;
const LOGO_HEIGHT = 18;
const LOGO_DATA = "0000000000000000000000000000000E00000000100000000020313044482053304430204AD04C30204A50400806000047401801C0000007E003C000000000000000000000000000000000000000000000000000000000000000";

// Test 1: Solo logo (sin texto)
const test1 = `^Q50,0,0
^W30
^H10
^P1
^S3
^L
GG,10,10,${LOGO_WIDTH},${LOGO_HEIGHT},${LOGO_DATA}
E
`;

// Test 2: Logo + un texto de referencia
const test2 = `^Q50,0,0
^W30
^H10
^P1
^S3
^L
GG,5,5,${LOGO_WIDTH},${LOGO_HEIGHT},${LOGO_DATA}
AC,5,30,1,1,0,0,LOGO ARRIBA
E
`;

// Test 3: Solo texto (para verificar impresora funciona)
const test3 = `^Q50,0,0
^W30
^H10
^P1
^S3
^L
AC,5,25,1,2,0,0,TEST SIN LOGO
E
`;

const tests = [
    { nombre: 'Test 1: Solo logo', ezpl: test1 },
    { nombre: 'Test 2: Logo + texto', ezpl: test2 },
    { nombre: 'Test 3: Solo texto', ezpl: test3 }
];

console.log('📋 Tests disponibles:');
tests.forEach((t, i) => console.log(`   ${i+1}. ${t.nombre}`));
console.log('');

// Seleccionar test (cambiar aquí: 0, 1 o 2)
const TEST_SELECCIONADO = 1; // Test 2: Logo + texto

console.log(`🎯 Ejecutando: ${tests[TEST_SELECCIONADO].nombre}\n`);

function enviarTest(ezpl) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
            console.log(`📤 Enviando EZPL:\n${ezpl}`);
            socket.write(ezpl);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Comando enviado. Revisa la impresora.`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ Error:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ Timeout`);
            socket.destroy();
            reject(new Error('Timeout'));
        });
    });
}

enviarTest(tests[TEST_SELECCIONADO].ezpl)
    .then(() => {
        console.log('\n📋 INSTRUCCIONES:');
        console.log('   1. Revisa la etiqueta impresa');
        console.log('   2. Si NO sale el logo:');
        console.log('      - Verifica que los datos del logo sean correctos');
        console.log('      - Prueba con Test 3 (solo texto) para verificar impresora');
        console.log('   3. Si sale el logo:');
        console.log('      - ¡Funciona! El problema está en server.js');
        console.log('\n💡 Para cambiar de test, edita TEST_SELECCIONADO (línea 51)');
    })
    .catch(err => {
        console.error('❌ Error al enviar:', err);
    });
