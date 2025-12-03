// ============================================
// TEST DE IMPRESIÓN + CORTE - EZPL NATIVO GODEX
// Imprimir etiqueta 50x30mm y cortar automáticamente
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST IMPRESIÓN + CORTE - EZPL NATIVO');
console.log('=======================================');
console.log('');
console.log('📏 Test específico:');
console.log('   • Etiqueta: 50mm alto x 30mm ancho');
console.log('   • Lenguaje: EZPL (nativo Godex)');
console.log('   • Objetivo: Imprimir Y cortar automáticamente');
console.log('');

// Comando EZPL completo para imprimir y cortar
const etiquetaEZPL = [
    // 1. Configuración de etiqueta
    '^Q394,16',                     // Altura 394 dots (50mm), gap 16 dots (2mm)
    '^W236',                        // Ancho 236 dots (30mm)
    '^H8',                          // Velocidad impresión media
    '^S4',                          // Velocidad alimentación
    
    // 2. HABILITAR CORTE AUTOMÁTICO
    '^S,CUT,1,0',                   // Cortar después de cada etiqueta, corte total
    
    // 3. Inicio de formato de etiqueta
    '^L',                           // Inicio de formato (Label start)
    
    // 4. Contenido de la etiqueta (posiciones para 30mm ancho)
    'A10,10,0,3,1,1,N,"TEST EZPL"',     // Texto en posición 10,10
    'A10,40,0,2,1,1,N,"GUILLOTINA"',    // Texto en posición 10,40
    `A10,70,0,1,1,1,N,"${new Date().toLocaleTimeString()}"`, // Hora actual
    'A10,100,0,1,1,1,N,"50x30mm"',      // Tamaño
    
    // 5. COMANDO CRÍTICO: Fin de formato e impresión
    'E',                            // End format - IMPRIME Y CORTA AUTOMÁTICAMENTE
    
    // 6. Comando adicional de corte por seguridad
    '~C'                            // Corte manual adicional
    
].join('\r\n') + '\r\n';

console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);

const socket = new net.Socket();
socket.setTimeout(12000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando etiqueta EZPL con corte automático...');
    console.log('');
    console.log('Comando EZPL que se envía:');
    console.log('• ^Q394,16  - Configurar tamaño 50x30mm');
    console.log('• ^S,CUT,1,0 - HABILITAR corte automático');
    console.log('• ^L        - Inicio de formato');
    console.log('• A...      - Texto de prueba');
    console.log('• E         - IMPRIMIR Y CORTAR');
    console.log('• ~C        - Corte adicional por seguridad');
    console.log('');
    console.log('⏰ Enviando comandos...');
    
    socket.write(etiquetaEZPL);
    
    setTimeout(() => {
        console.log('✅ Comandos EZPL enviados completamente');
        console.log('');
        console.log('🎯 VERIFICACIÓN INMEDIATA:');
        console.log('   ¿Se está imprimiendo la etiqueta AHORA?');
        console.log('   ¿Escuchas el motor de la impresora?');
        console.log('');
        socket.end();
    }, 3000);
});

let datosRecibidos = '';

socket.on('data', (data) => {
    datosRecibidos += data.toString();
    const response = data.toString().trim();
    if (response) {
        console.log('📥 Respuesta EZPL:', response);
    }
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  RESULTADO DEL TEST EZPL');
    console.log('==========================================');
    console.log('');
    
    if (datosRecibidos.length > 0) {
        console.log('📊 Datos recibidos:');
        console.log(datosRecibidos);
        console.log('');
    }
    
    console.log('📋 CHECKLIST FINAL:');
    console.log('');
    console.log('✅ IMPRESIÓN:');
    console.log('   [ ] ¿Se imprimió etiqueta con "TEST EZPL"?');
    console.log('   [ ] ¿Contiene texto "GUILLOTINA" y hora?');
    console.log('   [ ] ¿El tamaño es 50x30mm aproximadamente?');
    console.log('');
    console.log('✅ GUILLOTINA:');
    console.log('   [ ] ¿Escuchaste sonido de impresión?');
    console.log('   [ ] ¿Escuchaste sonido de corte después?');
    console.log('   [ ] ¿La etiqueta se separó del rollo?');
    console.log('');
    console.log('📊 DIAGNÓSTICO:');
    console.log('');
    console.log('✅ SI SE IMPRIMIÓ Y CORTÓ:');
    console.log('   🎉 ¡GUILLOTINA FUNCIONANDO PERFECTAMENTE!');
    console.log('   • Usar comandos EZPL para el sistema');
    console.log('   • Integrar ^S,CUT,1,0 y comando E');
    console.log('');
    console.log('⚠️  SI SE IMPRIMIÓ PERO NO CORTÓ:');
    console.log('   • La impresora funciona, guillotina no');
    console.log('   • Verificar instalación física');
    console.log('   • Verificar cable blanco');
    console.log('');
    console.log('❌ SI NO SE IMPRIMIÓ NADA:');
    console.log('   • Problema de configuración EZPL');
    console.log('   • Verificar estado de papel/ribbon');
    console.log('   • Verificar configuración de impresora');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('SOLUCIONES:');
    console.log('• Verificar que la impresora esté encendida');
    console.log('• Verificar conexión de red');
    console.log('• Presionar botón FEED en la impresora');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout - Impresora no responde');
    console.log('La impresora puede estar procesando los comandos...');
    socket.destroy();
});