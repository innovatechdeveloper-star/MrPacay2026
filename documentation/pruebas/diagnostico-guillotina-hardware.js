// ============================================
// DIAGNÓSTICO DE HARDWARE - GUILLOTINA GODEX G530
// Detectar problemas físicos de conexión
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔧 DIAGNÓSTICO DE HARDWARE - GUILLOTINA');
console.log('======================================');
console.log('');
console.log('Este diagnóstico verificará si el problema es:');
console.log('• Conexión del cable blanco');
console.log('• Configuración de la impresora');
console.log('• Comandos de corte');
console.log('');

let testStep = 1;

// Test 1: Verificar estado de la guillotina
function testEstadoGuillotina() {
    return new Promise((resolve) => {
        console.log(`📋 PASO ${testStep++}: Consultando estado de guillotina...`);
        
        const socket = new net.Socket();
        socket.setTimeout(8000);
        
        let respuestaRecibida = false;
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Consultando configuración actual...');
            
            // Comandos para consultar estado
            const consultaEstado = [
                '~S,CUTTER,STATUS',      // Estado de la guillotina
                '~S,CUTTER,TEST',        // Test de guillotina
                '~S,CONFIG',             // Configuración general
                '~HI'                    // Info del sistema
            ].join('\n') + '\n';
            
            socket.write(consultaEstado);
            
            setTimeout(() => {
                if (!respuestaRecibida) {
                    console.log('   ⚠️  No hay respuesta específica de estado');
                }
                socket.end();
                resolve();
            }, 3000);
        });
        
        socket.on('data', (data) => {
            respuestaRecibida = true;
            const response = data.toString().trim();
            console.log('   📥 Estado recibido:', response);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error consultando estado:', error.message);
            resolve();
        });
        
        socket.on('timeout', () => {
            console.log('   ⏱️  Timeout en consulta de estado');
            socket.destroy();
            resolve();
        });
    });
}

// Test 2: Comando de corte directo con retroalimentación
function testCorteDirecto() {
    return new Promise((resolve) => {
        console.log(`📋 PASO ${testStep++}: Test de corte directo...`);
        
        const socket = new net.Socket();
        socket.setTimeout(6000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Enviando comando de corte directo...');
            console.log('   ⏰ ESCUCHA ATENTAMENTE si hay sonido mecánico...');
            
            // Enviar comando de corte simple
            socket.write('~C\n');
            
            setTimeout(() => {
                console.log('   ✅ Comando de corte enviado');
                console.log('   🎯 ¿Escuchaste algún sonido mecánico?');
                socket.end();
                resolve();
            }, 2000);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error en corte directo:', error.message);
            resolve();
        });
    });
}

// Test 3: Configuración completa y test
function testConfiguracionCompleta() {
    return new Promise((resolve) => {
        console.log(`📋 PASO ${testStep++}: Configuración completa y test...`);
        
        const socket = new net.Socket();
        socket.setTimeout(10000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Aplicando configuración completa...');
            
            const configCompleta = [
                // Reset completo
                '~R',                        // Reset de impresora
                '',                          // Pausa
                '~C',                        // Clear buffer
                
                // Configuración específica de guillotina
                '~S,CUTTER,ENABLE',          // Habilitar
                '~S,CUTTER,BATCH,1',         // Cada etiqueta
                '~S,CUTTER,OFFSET,0',        // Sin offset
                '~S,CUTTER,STRENGTH,HIGH',   // Fuerza ALTA
                '~S,CUTTER,MODE,NORMAL',     // Modo normal
                
                // Guardar y aplicar
                '~S,SAVE',                   // Guardar config
                '~S,RELOAD',                 // Recargar
                
                // Test inmediato
                '~C',                        // Corte test 1
                '',                          // Pausa
                '~C',                        // Corte test 2
                '',                          // Pausa
                '~S,CUT'                     // Comando alternativo
                
            ].join('\n') + '\n';
            
            socket.write(configCompleta);
            
            setTimeout(() => {
                console.log('   ✅ Configuración completa aplicada');
                console.log('   🎯 ¿Escuchaste MÚLTIPLES sonidos de corte?');
                socket.end();
                resolve();
            }, 4000);
        });
        
        socket.on('data', (data) => {
            const response = data.toString().trim();
            if (response) {
                console.log('   📥 Respuesta:', response);
            }
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error en configuración completa:', error.message);
            resolve();
        });
    });
}

// Test 4: Etiqueta mínima con corte
function testEtiquetaMinima() {
    return new Promise((resolve) => {
        console.log(`📋 PASO ${testStep++}: Etiqueta mínima con corte forzado...`);
        
        const socket = new net.Socket();
        socket.setTimeout(8000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Imprimiendo etiqueta mínima...');
            
            const etiquetaMinima = `^XA
^LL394
^PW236
^FO5,5^ADN,16,10^FD*TEST*^FS
^FO5,25^ADN,12,8^FD${Date.now().toString().slice(-6)}^FS
^XZ
~C
~C
~C`;
            
            socket.write(etiquetaMinima);
            
            setTimeout(() => {
                console.log('   ✅ Etiqueta enviada con triple comando de corte');
                console.log('   🎯 ¿Se imprimió Y cortó la etiqueta?');
                socket.end();
                resolve();
            }, 3000);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error en etiqueta mínima:', error.message);
            resolve();
        });
    });
}

// Ejecutar todos los tests
async function ejecutarDiagnostico() {
    console.log('🚀 Iniciando diagnóstico completo de hardware...');
    console.log('');
    
    await testEstadoGuillotina();
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testCorteDirecto();
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testConfiguracionCompleta();
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    await testEtiquetaMinima();
    
    console.log('');
    console.log('==========================================');
    console.log('  DIAGNÓSTICO COMPLETADO');
    console.log('==========================================');
    console.log('');
    console.log('📊 ANÁLISIS DE RESULTADOS:');
    console.log('');
    console.log('✅ SI ESCUCHASTE SONIDOS DE CORTE:');
    console.log('   • La guillotina está físicamente conectada');
    console.log('   • Los comandos llegan correctamente');
    console.log('   • Problema puede ser de configuración o timing');
    console.log('');
    console.log('❌ SI NO ESCUCHASTE NINGÚN SONIDO:');
    console.log('   • Verifica cable blanco dentro de la impresora');
    console.log('   • Verifica que los tornillos estén apretados');
    console.log('   • Verifica que la guillotina esté en posición correcta');
    console.log('   • Posible defecto en la guillotina o cable');
    console.log('');
    console.log('🔧 PRÓXIMOS PASOS:');
    console.log('   1. Reporta si escuchaste sonidos de corte');
    console.log('   2. Verifica físicamente las conexiones');
    console.log('   3. Si no hay sonidos, puede ser problema de hardware');
    console.log('');
}

ejecutarDiagnostico();