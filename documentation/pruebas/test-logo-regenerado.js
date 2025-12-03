const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

const LOGO_WIDTH = 5;
const LOGO_HEIGHT = 18;
const LOGO_DATA = "FFFFFFFFFFF000000003F0FFFFFE03F0F000FE03F0F000FE03F0FFFFFE03F0F000FE03F0F000FE03F0F000FE03F000000003F0FFFFFE03F0F00FE003F0F00FE003F0FFFFFE03F0F00FE003F0F00FE003F000000003FFFFFFFFFF";

console.log('🧪 TEST LOGO REGENERADO\n');

const test = `^Q50,0,0
^W30
^H10
^P1
^S3
^L
I,5,5,${LOGO_WIDTH},${LOGO_HEIGHT},${LOGO_DATA}
AC,5,30,1,1,0,0,ROPA DE CAMA
AC,5,50,1,1,0,0,PRODUCTO TEST
AC,5,70,1,1,0,0,TELA: BP
AC,5,90,1,1,0,0,TAMANO: 2P
AC,5,110,1,1,0,0,HECHO EN PERU
E
`;

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado');
    console.log('📤 Enviando logo regenerado...\n');
    socket.write(test);
    socket.end();
});

socket.on('close', () => {
    console.log('✅ Enviado\n');
    console.log('📋 ¿Ves un CUADRO con texto "CA" y "MI"?');
    console.log('   ✅ SÍ → ¡Formato correcto! Ahora usamos el BMP real');
    console.log('   ❌ NO → Problema con comando I o impresora');
});

socket.on('error', (err) => console.error('❌ Error:', err.message));
