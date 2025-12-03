// ============================================
// CONFIGURACIÓN ESPECÍFICA GUILLOTINA GODEX G530
// Etiquetas: 50mm alto x 30mm ancho
// DPI: 203 (no 590, Godex G530 es 203 DPI)
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 CONFIGURACIÓN ESPECÍFICA DE GUILLOTINA');
console.log('=========================================');
console.log('');
console.log('📏 Especificaciones detectadas:');
console.log('   • Modelo: Godex G530 (203 DPI)');
console.log('   • Etiquetas: 50mm alto x 30mm ancho');
console.log('   • Problema: Guillotina no corta físicamente');
console.log('');
console.log(`📡 Conectando a ${GODEX_IP}:${GODEX_PORT}`);

// Comandos específicos para Godex G530 con guillotina
const configEspecifica = [
    // 1. Limpiar buffer completamente
    '^XA^XZ',
    '~C',
    
    // 2. Configuración específica de guillotina Godex
    '~S,CUTTER,ENABLE',              // Habilitar cortador
    '~S,CUTTER,BATCH,1',             // Cortar después de cada etiqueta
    '~S,CUTTER,OFFSET,3',            // Offset de 3mm para compensar posición
    '~S,CUTTER,PARTIAL,DISABLE',     // Deshabilitar corte parcial
    
    // 3. Configuración de medios para 50x30mm
    '~S,LABEL,50,30,203',            // Tamaño: 50mm alto, 30mm ancho, 203 DPI
    '~S,SPEED,4',                    // Velocidad media (1-6)
    '~S,DENSITY,10',                 // Densidad de impresión (1-20)
    
    // 4. Configuración de sensor para etiquetas pequeñas
    '~S,SENSOR,0,MEDIA,WEB',         // Sensor web/gap
    '~S,SET,SENSOR,TYPE,TRANS',      // Transmisivo
    '~S,SET,SENSOR,GAIN,MEDIUM',     // Ganancia media
    
    // 5. Configuración específica de corte
    '~S,CUTTER,MODE,NORMAL',         // Modo normal (no batch)
    '~S,CUTTER,STRENGTH,MEDIUM',     // Fuerza de corte media
    
    // 6. Guardar configuración
    '~S,SAVE',                       // Guardar en memoria
    '~S,RELOAD',                     // Recargar configuración
    
    // 7. Test de corte inmediato
    '~C'                             // Comando de corte directo
    
].join('\n') + '\n';

const socket = new net.Socket();
socket.setTimeout(15000);

socket.connect(GODEX_PORT, GODEX_IP, () => {
    console.log('✅ Conectado a Godex G530');
    console.log('📤 Aplicando configuración específica para 50x30mm...');
    console.log('');
    console.log('Configuración aplicada:');
    console.log('• Tamaño etiqueta: 50mm x 30mm');
    console.log('• DPI: 203 (correcto para G530)');
    console.log('• Guillotina: Habilitada con offset 3mm');
    console.log('• Sensor: Configurado para gaps pequeños');
    console.log('• Fuerza corte: Media');
    console.log('• Velocidad: Media');
    console.log('');
    
    socket.write(configEspecifica);
    
    setTimeout(() => {
        console.log('✅ Configuración específica enviada');
        console.log('');
        console.log('⚠️  DEBERÍAS ESCUCHAR EL SONIDO DE CORTE AHORA');
        console.log('   (El último comando ~C debería activar la guillotina)');
        console.log('');
        socket.end();
    }, 3000);
});

socket.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
        console.log('📥 Respuesta de impresora:', response);
    }
});

socket.on('close', () => {
    console.log('🔌 Conexión cerrada');
    console.log('');
    console.log('==========================================');
    console.log('  VERIFICACIÓN REQUERIDA');
    console.log('==========================================');
    console.log('');
    console.log('1. ¿Escuchaste sonido de corte al final?');
    console.log('2. Si NO cortó, verifica:');
    console.log('   • Cable blanco bien conectado');
    console.log('   • Tornillos apretados');
    console.log('   • Guillotina en posición correcta');
    console.log('');
    console.log('3. Siguiente paso:');
    console.log('   node test-guillotina-especifico.js');
    console.log('');
});

socket.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('PASOS PARA SOLUCIONAR:');
    console.log('1. Verifica que la impresora esté encendida');
    console.log('2. Verifica la IP: 192.168.1.35');
    console.log('3. Presiona FEED en la impresora');
    console.log('4. Reinicia la impresora');
    process.exit(1);
});

socket.on('timeout', () => {
    console.error('⏱️ Timeout de conexión (15 segundos)');
    socket.destroy();
    process.exit(1);
});