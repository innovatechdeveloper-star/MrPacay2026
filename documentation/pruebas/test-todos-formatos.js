const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST FINAL - DOCUMENTACIÓN GODEX EZPL\n');
console.log('Según el manual de Godex G530, el comando correcto es:\n');

// Según documentación Godex EZPL:
// Formato: GG x,y,width_bytes,height,data
// PERO algunos modelos requieren:
// - Modo gráfico activado primero
// - Datos en formato específico
// - Comando de inicio de gráfico

// Cuadrado 8×8 píxeles (1 byte × 8 líneas) - MÁS SIMPLE
const CUADRADO_SIMPLE = {
    width: 1,  // 1 byte = 8 píxeles
    height: 8,
    data: "FF818181818181FF"  // Cuadrado hueco
};

// TEST 1: GG con formato estándar
const test1 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
Dyson,5,10,1
GG,5,10,${CUADRADO_SIMPLE.width},${CUADRADO_SIMPLE.height},${CUADRADO_SIMPLE.data}
AC,5,25,1,1,0,0,T1: GG ESTANDAR
E
`;

// TEST 2: Sin "Dyson" (prefijo)
const test2 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG,5,10,${CUADRADO_SIMPLE.width},${CUADRADO_SIMPLE.height},${CUADRADO_SIMPLE.data}
AC,5,25,1,1,0,0,T2: GG SIMPLE
E
`;

// TEST 3: Con espacios en GG
const test3 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG, 5, 10, ${CUADRADO_SIMPLE.width}, ${CUADRADO_SIMPLE.height}, ${CUADRADO_SIMPLE.data}
AC,5,25,1,1,0,0,T3: GG ESPACIOS
E
`;

// TEST 4: Formato compacto sin espacios
const test4 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L
GG5,10,${CUADRADO_SIMPLE.width},${CUADRADO_SIMPLE.height},${CUADRADO_SIMPLE.data}
AC,5,25,1,1,0,0,T4: COMPACTO
E
`;

// TEST 5: Con salto de línea antes del comando
const test5 = `^Q50,0,0
^W30
^H12
^P1
^S3
^L

GG,5,10,${CUADRADO_SIMPLE.width},${CUADRADO_SIMPLE.height},${CUADRADO_SIMPLE.data}

AC,5,25,1,1,0,0,T5: CON SALTOS
E
`;

const tests = [test1, test2, test3, test4, test5];
const nombres = ['Dyson prefix', 'Simple', 'Con espacios', 'Compacto', 'Con saltos'];

// AUTO-EJECUTAR TODOS
console.log('🔄 Ejecutando los 5 tests automáticamente...\n');

function enviarTest(ezpl, nombre, num) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`📤 Test ${num + 1}/5: ${nombre}`);
            socket.write(ezpl);
            socket.end();
        });
        
        socket.on('close', () => {
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`   ❌ Error: ${error.message}`);
            reject(error);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Ejecutar todos los tests con pausa
async function ejecutarTodos() {
    for (let i = 0; i < tests.length; i++) {
        try {
            await enviarTest(tests[i], nombres[i], i);
            console.log(`   ✅ Enviado\n`);
            // Pausa de 2 segundos entre tests
            if (i < tests.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (err) {
            console.error(`   ❌ Falló: ${err.message}\n`);
        }
    }
    
    console.log('\n🏁 Tests completados');
    console.log('');
    console.log('📋 REVISA LAS 5 ETIQUETAS IMPRESAS:');
    console.log('');
    console.log('   Deberías ver 5 etiquetas con:');
    console.log('   - T1: GG ESTANDAR');
    console.log('   - T2: GG SIMPLE');
    console.log('   - T3: GG ESPACIOS');
    console.log('   - T4: COMPACTO');
    console.log('   - T5: CON SALTOS');
    console.log('');
    console.log('   ¿Alguna tiene un CUADRADO negro arriba del texto?');
    console.log('');
    console.log('   ✅ SÍ → Dime cuál número funciona');
    console.log('   ❌ NO → Tu Godex no soporta gráficos con EZPL');
}

ejecutarTodos();
