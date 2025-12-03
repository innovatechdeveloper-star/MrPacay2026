const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST COMANDO Lo (Load Object) - GODEX\n');

// Según la captura de GoLabel, el formato es:
// Lo,X,Y,Ancho,Alto

// Primero necesitamos SUBIR el gráfico con comando I o GG
// Luego lo cargamos con Lo

// Test 1: Intentar usar Lo sin subir gráfico (debería fallar)
const test1 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
Lo,10,10,50,50
AC,5,70,1,1,0,0,T1: Lo SIN DATOS
E
`;

// Test 2: Usar GG + Lo juntos
const CUADRADO_DATA = "FFFFC003C003C003C003C003C003C003C003C003C003C003C003C003C003FFFF";
const test2 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG,10,10,2,16,${CUADRADO_DATA}
Lo,10,10,16,16
AC,5,35,1,1,0,0,T2: GG+Lo
E
`;

// Test 3: Comando I (Image) según documentación Godex
const test3 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
I,10,10,2,16,${CUADRADO_DATA}
AC,5,35,1,1,0,0,T3: I (IMAGE)
E
`;

// Test 4: Comando IS (Image Store)
const test4 = `^Q50,0,0
^W30
^H12
^P1
^S3
^IS,LOGO1,2,16,${CUADRADO_DATA}
^L
^IA,10,10,LOGO1
AC,5,35,1,1,0,0,T4: IS+IA
E
`;

const tests = [test1, test2, test3, test4];
const nombres = ['Lo solo', 'GG+Lo', 'I (Image)', 'IS+IA (Store)'];

console.log('📋 Prueba estos tests uno por uno:\n');
tests.forEach((t, i) => console.log(`   ${i + 1}. ${nombres[i]}`));
console.log('');

// Cambiar TEST_NUM para probar cada uno
const TEST_NUM = 2; // Empezar con test 3: I (Image)

console.log(`🎯 Ejecutando Test ${TEST_NUM + 1}: ${nombres[TEST_NUM]}\n`);

function enviarTest(ezpl) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
            console.log(`📤 Enviando...\n`);
            socket.write(ezpl);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Enviado.\n`);
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

enviarTest(tests[TEST_NUM])
    .then(() => {
        console.log('📋 REVISA LA ETIQUETA:');
        console.log('');
        console.log(`   Test: ${nombres[TEST_NUM]}`);
        console.log('   ¿Ves un CUADRADO negro?');
        console.log('');
        console.log('   ✅ SÍ → ¡Comando correcto! Usaremos este');
        console.log('   ❌ NO → Cambia TEST_NUM y prueba otro');
        console.log('');
        console.log(`💡 Prueba los 4 tests: TEST_NUM = 0, 1, 2, 3`);
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
