const net = require('net');

// PRUEBA: Enviar etiqueta simple estilo Godex (no Zebra ZPL)
const testGodex = `
^L
H10
D8
S2
Q354,024
^W50
A10,10,0,3,1,1,N,"CAMITEX"
A10,40,0,2,1,1,N,"ROPA DE CAMA"
A10,80,0,4,1,1,N,"COBERTOR"
A10,130,0,2,1,1,N,"TELA: PK"
A10,160,0,2,1,1,N,"TAMANO: 1 1/2 PLAZA"
A10,200,0,2,1,1,N,"30C NO CLORO NO PLANCHA"
A10,240,0,2,1,1,N,"HECHO EN PERU"
E
`;

console.log('🧪 Probando formato GODEX EZPL...');
console.log('');

const client = new net.Socket();

client.connect(9100, '192.168.1.35', () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando etiqueta de prueba...');
    
    client.write(testGodex);
    
    setTimeout(() => {
        console.log('✅ Comando enviado');
        console.log('');
        console.log('¿Salió bien la etiqueta?');
        console.log('Si salió BIEN: Godex usa EZPL, no ZPL');
        console.log('Si salió MAL o no imprimió: Godex usa ZPL puro');
        client.destroy();
        process.exit(0);
    }, 2000);
});

client.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
