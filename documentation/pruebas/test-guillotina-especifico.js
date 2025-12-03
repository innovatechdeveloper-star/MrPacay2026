// ============================================
// TEST ESPECÍFICO DE GUILLOTINA 
// Etiquetas 50mm x 30mm con corte forzado
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🧪 TEST ESPECÍFICO DE GUILLOTINA 50x30mm');
console.log('========================================');
console.log('');
console.log('📏 Configuración del test:');
console.log('   • Tamaño: 50mm alto x 30mm ancho');
console.log('   • DPI: 203 (Godex G530)');
console.log('   • Comando de corte: FORZADO después de impresión');
console.log('');

// Calcular posiciones para etiqueta 50x30mm en 203 DPI
// 50mm = 393 dots (50 * 203 / 25.4)
// 30mm = 236 dots (30 * 203 / 25.4)

const etiquetaTest = `^XA
^LL394
^PW236
^FO10,10^ADN,20,12^FDTEST 50x30^FS
^FO10,40^ADN,16,10^FD${new Date().toLocaleTimeString()}^FS
^FO10,70^ADN,14,8^FDCORTE AUTO^FS
^XZ`;

const comandoCompleto = [
    // 1. Limpiar buffer
    '^XA^XZ',
    
    // 2. Configurar tamaño específico
    '~S,LABEL,50,30,203',
    
    // 3. Habilitar guillotina con configuración específica
    '~S,CUTTER,ENABLE',
    '~S,CUTTER,BATCH,1',
    '~S,CUTTER,OFFSET,0',
    
    // 4. Etiqueta de prueba
    etiquetaTest,
    
    // 5. MÚLTIPLES comandos de corte para asegurar que funcione
    '~C',           // Corte inmediato
    '~S,CUT',       // Comando alternativo de corte
    '~C',           // Segundo intento de corte
    
    // 6. Pausa y otro corte
    '', // línea vacía = pausa
    '~C'            // Tercer intento
    
].join('\n') + '\n';

const socket = new net.Socket();
socket.setTimeout(12000);

let tiempoInicio = Date.now();

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Enviando etiqueta 50x30mm con corte forzado...');
    console.log('');
    console.log('Secuencia de comandos:');
    console.log('1. Configurar tamaño 50x30mm');
    console.log('2. Habilitar guillotina');
    console.log('3. Imprimir etiqueta test');
    console.log('4. Ejecutar MÚLTIPLES comandos de corte');
    console.log('');
    console.log('⏰ Enviando comandos...');
    
    socket.write(comandoCompleto);
    
    // Verificar progreso cada segundo
    const interval = setInterval(() => {
        const tiempoTranscurrido = (Date.now() - tiempoInicio) / 1000;
        console.log(`   ⏱️  ${tiempoTranscurrido.toFixed(1)}s - Procesando...`);
        
        if (tiempoTranscurrido > 8) {
            clearInterval(interval);
            console.log('   📤 Finalizando envío...');
        }
    }, 1000);
    
    setTimeout(() => {
        clearInterval(interval);
        console.log('');
        console.log('✅ TODOS LOS COMANDOS ENVIADOS');
        console.log('');
        console.log('🎯 VERIFICACIÓN FÍSICA INMEDIATA:');
        console.log('   ¿Se imprimió una etiqueta pequeña (50x30mm)?');
        console.log('   ¿Escuchaste sonidos de la guillotina cortando?');
        console.log('   ¿La etiqueta está cortada/separada del rollo?');
        console.log('');
        
        socket.end();
    }, 4000);
});

let datosRecibidos = '';

socket.on('data', (data) => {
    datosRecibidos += data.toString();
    const response = data.toString().trim();
    if (response) {
        console.log('📥 Respuesta:', response);
    }
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  DIAGNÓSTICO DEL RESULTADO');
    console.log('==========================================');
    console.log('');
    
    if (datosRecibidos.length > 0) {
        console.log('📊 Datos recibidos de la impresora:');
        console.log(datosRecibidos);
        console.log('');
    }
    
    console.log('📋 CHECKLIST DE VERIFICACIÓN:');
    console.log('');
    console.log('✅ IMPRESIÓN:');
    console.log('   [ ] ¿Se imprimió etiqueta con "TEST 50x30"?');
    console.log('   [ ] ¿El tamaño es correcto (50x30mm)?');
    console.log('');
    console.log('✅ GUILLOTINA:');
    console.log('   [ ] ¿Escuchaste sonido mecánico de corte?');
    console.log('   [ ] ¿La etiqueta se separó del rollo?');
    console.log('   [ ] ¿El corte es limpio y recto?');
    console.log('');
    console.log('SI NO CORTÓ:');
    console.log('1. Verifica conexión física del cable blanco');
    console.log('2. Verifica que los tornillos estén bien ajustados');
    console.log('3. Ejecuta: node diagnostico-guillotina-hardware.js');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('POSIBLES CAUSAS:');
    console.log('• Impresora apagada o desconectada');
    console.log('• IP incorrecta (verifica que sea 192.168.1.35)');
    console.log('• Cable de red desconectado');
    console.log('• Firewall bloqueando puerto 9100');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout - La impresora no respondió en 12 segundos');
    console.log('Esto puede indicar que la impresora está procesando los comandos lentamente');
    socket.destroy();
});