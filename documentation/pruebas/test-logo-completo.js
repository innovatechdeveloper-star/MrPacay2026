const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

// Logo actual (40×18 px)
const LOGO_WIDTH = 5;
const LOGO_HEIGHT = 18;
const LOGO_DATA = "0000000000000000000000000000000E00000000100000000020313044482053304430204AD04C30204A50400806000047401801C0000007E003C000000000000000000000000000000000000000000000000000000000000000";

console.log('🧪 TEST LOGO COMPLETO CON COMANDO I\n');

const testCompleto = `^Q50,0,0
^W30
^H10
^P1
^S3
^AD
^C1
^R0
~Q+0
^O0
^D0
^E18
~R255
^L
I,5,5,${LOGO_WIDTH},${LOGO_HEIGHT},${LOGO_DATA}
AC,5,25,1,1,0,0,ROPA DE CAMA
AC,5,40,1,1,0,0,COBERTOR
AC,5,60,1,1,0,0,TELA: BP
AC,5,75,1,1,0,0,TAMANO: 2 PLAZA
AC,5,95,1,1,0,0,HECHO EN PERU
E
`;

console.log('📋 Contenido de la etiqueta:');
console.log('   - Logo CAMITEX (arriba izquierda)');
console.log('   - ROPA DE CAMA');
console.log('   - COBERTOR');
console.log('   - TELA: BP');
console.log('   - TAMANO: 2 PLAZA');
console.log('   - HECHO EN PERU\n');

function enviarTest(ezpl) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log(`✅ Conectado a ${GODEX_IP}:${GODEX_PORT}`);
            console.log(`📤 Enviando etiqueta de prueba...\n`);
            socket.write(ezpl);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ Etiqueta enviada.\n`);
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

enviarTest(testCompleto)
    .then(() => {
        console.log('════════════════════════════════════════════════════════════');
        console.log('📋 REVISA LA ETIQUETA IMPRESA:');
        console.log('');
        console.log('   ✅ ¿Ves el LOGO arriba a la izquierda?');
        console.log('   ✅ ¿El texto es legible?');
        console.log('   ✅ ¿Todo cabe en la etiqueta?');
        console.log('');
        console.log('Si ves el logo (aunque sea pequeño):');
        console.log('   🎉 ¡ÉXITO! Ya funciona, ahora lo agrandamos');
        console.log('');
        console.log('Si NO ves el logo:');
        console.log('   🔧 Los datos del logo están corruptos');
        console.log('   🔧 Necesitamos regenerar desde el BMP');
        console.log('════════════════════════════════════════════════════════════');
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
