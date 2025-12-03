const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST DE GRÁFICO SIMPLE - GODEX G530\n');

// LOGO DE PRUEBA: Cuadrado negro 16×16 píxeles (2 bytes × 16 líneas)
// FF = 11111111 (8 píxeles negros)
// Patrón: █████████████████
//         █               █
//         █               █
//         ...
//         █               █
//         █████████████████

const CUADRADO_WIDTH = 2;  // 2 bytes = 16 píxeles
const CUADRADO_HEIGHT = 16;
const CUADRADO_DATA = 
    "FFFF" +  // Línea 1: ████████████████
    "C003" +  // Línea 2: ██          ██
    "C003" +  // Línea 3: ██          ██
    "C003" +  // Línea 4: ██          ██
    "C003" +  // Línea 5: ██          ██
    "C003" +  // Línea 6: ██          ██
    "C003" +  // Línea 7: ██          ██
    "C003" +  // Línea 8: ██          ██
    "C003" +  // Línea 9: ██          ██
    "C003" +  // Línea 10: ██          ██
    "C003" +  // Línea 11: ██          ██
    "C003" +  // Línea 12: ██          ██
    "C003" +  // Línea 13: ██          ██
    "C003" +  // Línea 14: ██          ██
    "C003" +  // Línea 15: ██          ██
    "FFFF";   // Línea 16: ████████████████

// Test con cuadrado simple
const testCuadrado = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG,10,10,${CUADRADO_WIDTH},${CUADRADO_HEIGHT},${CUADRADO_DATA}
AC,5,35,1,1,0,0,CUADRADO ARRIBA
E
`;

console.log('📋 Test: Cuadrado negro 16×16 píxeles\n');

function enviarTest(ezpl) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
            console.log(`📤 Enviando EZPL con gráfico simple...\n`);
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

enviarTest(testCuadrado)
    .then(() => {
        console.log('📋 REVISA LA ETIQUETA:');
        console.log('');
        console.log('   ¿Ves un CUADRADO negro arriba del texto?');
        console.log('');
        console.log('   ✅ SÍ → El comando GG funciona, el logo CAMITEX tiene datos malos');
        console.log('   ❌ NO → El comando GG no funciona, necesitamos otro método');
        console.log('');
        console.log('💡 Si ves el cuadrado, ejecutaremos: node generar-logo-simple.js');
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
