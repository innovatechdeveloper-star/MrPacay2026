const net = require('net');

// ZPL de prueba MUY SIMPLE (sin gráficos)
const zplPrueba = `^XA
^MMC
^PW354
^LL650
^LH0,0
^LS0
^CF0,30
^FO100,200^FDPRUEBA SIMPLE^FS
^FO100,250^FDSIN GRAFICOS^FS
^XZ`;

console.log('🧪 Probando Godex con ZPL simple...');
console.log(`📄 ZPL: ${zplPrueba.length} caracteres`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(9100, '192.168.1.35', () => {
    console.log('✅ Conectado a Godex');
    socket.write(zplPrueba, (err) => {
        if (err) {
            console.error('❌ Error:', err);
        } else {
            console.log('✅ Datos enviados');
            setTimeout(() => {
                socket.end();
            }, 500);
        }
    });
});

socket.on('close', () => {
    console.log('✅ Conexión cerrada');
    process.exit(0);
});

socket.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout');
    socket.destroy();
    process.exit(1);
});
