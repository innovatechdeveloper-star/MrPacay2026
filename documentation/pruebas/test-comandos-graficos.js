const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST DE COMANDOS GRÁFICOS ALTERNATIVOS - GODEX G530\n');

// Cuadrado simple 16×16 píxeles (2 bytes × 16 líneas)
const CUADRADO_WIDTH = 2;
const CUADRADO_HEIGHT = 16;
const CUADRADO_DATA = "FFFFC003C003C003C003C003C003C003C003C003C003C003C003C003C003FFFF";

// TEST 1: Comando GG (ya probamos, no funciona)
const test1 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG,10,10,${CUADRADO_WIDTH},${CUADRADO_HEIGHT},${CUADRADO_DATA}
AC,5,35,1,1,0,0,TEST 1: GG
E
`;

// TEST 2: Comando GM (Download Graphics)
const test2 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GM,10,10,${CUADRADO_WIDTH},${CUADRADO_HEIGHT},${CUADRADO_DATA}
AC,5,35,1,1,0,0,TEST 2: GM
E
`;

// TEST 3: Comando GI (Alternative Graphics)
const test3 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GI,10,10,${CUADRADO_WIDTH},${CUADRADO_HEIGHT},${CUADRADO_DATA}
AC,5,35,1,1,0,0,TEST 3: GI
E
`;

// TEST 4: ZPL style (~DG + ^FO + ^XG)
const test4 = `^XA
^FO10,10
~DG000.GRF,${CUADRADO_WIDTH * CUADRADO_HEIGHT},${CUADRADO_WIDTH},${CUADRADO_DATA}
^XGR:000.GRF,1,1
^XZ
^Q50,0,0
^W30
^H12
^P1
^S3
^L
AC,5,35,1,1,0,0,TEST 4: ZPL
E
`;

// TEST 5: Comando bitmap directo (^FO + ^GFA)
const test5 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
^FO10,10^GFA,${CUADRADO_WIDTH * CUADRADO_HEIGHT},${CUADRADO_WIDTH * CUADRADO_HEIGHT},${CUADRADO_WIDTH},${CUADRADO_DATA}^FS
AC,5,35,1,1,0,0,TEST 5: GFA
E
`;

const tests = [
    { nombre: 'GG (no funciona)', ezpl: test1 },
    { nombre: 'GM', ezpl: test2 },
    { nombre: 'GI', ezpl: test3 },
    { nombre: 'ZPL ~DG', ezpl: test4 },
    { nombre: 'GFA', ezpl: test5 }
];

// Cambiar aquí para probar cada test (0, 1, 2, 3, 4)
const TEST_NUM = 2; // Probando GI

console.log(`🎯 Ejecutando Test ${TEST_NUM + 1}: ${tests[TEST_NUM].nombre}\n`);

function enviarTest(ezpl) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
            console.log(`📤 Enviando comando ${tests[TEST_NUM].nombre}...\n`);
            socket.write(ezpl);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Comando enviado.\n`);
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

enviarTest(tests[TEST_NUM].ezpl)
    .then(() => {
        console.log('📋 REVISA LA ETIQUETA:');
        console.log('');
        console.log(`   Test actual: ${tests[TEST_NUM].nombre}`);
        console.log('   Texto esperado: TEST X: [nombre]');
        console.log('   Gráfico esperado: Cuadrado negro arriba');
        console.log('');
        console.log('   ✅ ¿Ves el CUADRADO? → ¡Este comando funciona!');
        console.log('   ❌ Solo texto → Cambia TEST_NUM (línea 69) al siguiente número');
        console.log('');
        console.log(`💡 Prueba los 5 tests cambiando TEST_NUM: 0, 1, 2, 3, 4`);
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
