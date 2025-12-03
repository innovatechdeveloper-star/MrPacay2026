const net = require('net');

// Comandos ZPL para configurar Godex G530
// Etiqueta: 3cm (354 dots) x 5cm (590 dots) a 300 DPI
const comandosConfiguracion = `
~C
^XA
^PW354
^LL590
^MNN
^MTT
^LH0,0
^XZ
`;

console.log('🔧 Configurando tamaño de etiqueta en Godex G530...');
console.log('📏 Tamaño: 3cm × 5cm (354×590 dots a 300 DPI)');
console.log('');

const client = new net.Socket();
const TIMEOUT = 10000;

let timeoutHandle = setTimeout(() => {
    console.error('❌ Timeout: No se pudo conectar a la impresora');
    console.log('');
    console.log('Verifica:');
    console.log('1. La impresora está encendida');
    console.log('2. Está conectada a la red (IP: 192.168.1.35)');
    console.log('3. El puerto 9100 está abierto');
    client.destroy();
    process.exit(1);
}, TIMEOUT);

client.connect(9100, '192.168.1.35', () => {
    clearTimeout(timeoutHandle);
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando comandos de configuración...');
    
    client.write(comandosConfiguracion);
    
    setTimeout(() => {
        console.log('✅ Comandos enviados exitosamente');
        console.log('');
        console.log('🔄 Ahora realiza la calibración física:');
        console.log('1. APAGA la impresora');
        console.log('2. Mantén presionado FEED');
        console.log('3. ENCIENDE la impresora (sin soltar FEED)');
        console.log('4. Suelta FEED cuando parpadee');
        console.log('');
        client.destroy();
        process.exit(0);
    }, 2000);
});

client.on('error', (err) => {
    clearTimeout(timeoutHandle);
    console.error('❌ Error:', err.message);
    process.exit(1);
});

client.on('close', () => {
    console.log('🔌 Conexión cerrada');
});
