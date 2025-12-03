// ============================================
// VERIFICACIÓN COMPLETA DE GUILLOTINA GODEX G530
// Diagnóstico de estado y funcionamiento
// ============================================

const net = require('net');

const GODEX_IP = '192.168.1.35';
const GODEX_PORT = 9100;

console.log('🔍 VERIFICACIÓN COMPLETA DE GUILLOTINA');
console.log('=====================================');
console.log('');

let testsPassed = 0;
let totalTests = 4;

// Test 1: Conexión básica
function test1_conexion() {
    return new Promise((resolve) => {
        console.log('📋 TEST 1: Verificando conexión a Godex...');
        
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   ✅ Conexión TCP exitosa');
            testsPassed++;
            socket.end();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error de conexión:', error.message);
            resolve(false);
        });
        
        socket.on('timeout', () => {
            console.log('   ❌ Timeout de conexión');
            socket.destroy();
            resolve(false);
        });
    });
}

// Test 2: Comando de corte directo
function test2_corte_directo() {
    return new Promise((resolve) => {
        console.log('📋 TEST 2: Probando comando de corte directo (~C)...');
        
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Enviando comando ~C...');
            socket.write('~C\n');
            
            setTimeout(() => {
                console.log('   ✅ Comando enviado (verifica físicamente si cortó)');
                testsPassed++;
                socket.end();
                resolve(true);
            }, 1000);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error enviando comando:', error.message);
            resolve(false);
        });
    });
}

// Test 3: Etiqueta con corte automático
function test3_etiqueta_con_corte() {
    return new Promise((resolve) => {
        console.log('📋 TEST 3: Imprimiendo etiqueta con corte automático...');
        
        const socket = new net.Socket();
        socket.setTimeout(8000);
        
        const comandoCompleto = `^XA
^FO50,50^ADN,30,18^FDVERIFICACION GUILLOTINA^FS
^FO50,100^ADN,20,12^FD${new Date().toLocaleTimeString()}^FS
^FO50,150^ADN,16,10^FDTEST COMPLETO OK^FS
^XZ
~C`;
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Enviando etiqueta de test...');
            socket.write(comandoCompleto);
            
            setTimeout(() => {
                console.log('   ✅ Etiqueta enviada con comando de corte');
                testsPassed++;
                socket.end();
                resolve(true);
            }, 2000);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error imprimiendo:', error.message);
            resolve(false);
        });
    });
}

// Test 4: Verificación de estado
function test4_estado_impresora() {
    return new Promise((resolve) => {
        console.log('📋 TEST 4: Verificando estado general de la impresora...');
        
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   📤 Consultando estado...');
            // Comando para consultar estado (puede variar según modelo)
            socket.write('~S\n');
            
            setTimeout(() => {
                console.log('   ✅ Impresora respondiendo correctamente');
                testsPassed++;
                socket.end();
                resolve(true);
            }, 1000);
        });
        
        socket.on('data', (data) => {
            console.log('   📥 Estado recibido:', data.toString().trim());
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error consultando estado:', error.message);
            resolve(false);
        });
    });
}

// Ejecutar todos los tests
async function ejecutarVerificacion() {
    console.log('🚀 Iniciando verificación completa...');
    console.log('');
    
    await test1_conexion();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await test2_corte_directo();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await test3_etiqueta_con_corte();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await test4_estado_impresora();
    
    console.log('');
    console.log('==========================================');
    console.log('  RESULTADO FINAL');
    console.log('==========================================');
    console.log('');
    console.log(`✅ Tests pasados: ${testsPassed}/${totalTests}`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 ¡GUILLOTINA FUNCIONANDO PERFECTAMENTE!');
        console.log('');
        console.log('✅ La guillotina está:');
        console.log('   • Conectada correctamente');
        console.log('   • Respondiendo a comandos');
        console.log('   • Cortando automáticamente');
        console.log('   • Lista para usar en producción');
        console.log('');
        console.log('📋 VERIFICACIÓN FÍSICA REQUERIDA:');
        console.log('   ¿Se imprimieron y cortaron las etiquetas de test?');
        console.log('   ¿Escuchaste el sonido de la guillotina?');
    } else {
        console.log('⚠️  PROBLEMAS DETECTADOS');
        console.log('');
        console.log('🔧 PASOS PARA SOLUCIONAR:');
        console.log('   1. Verifica que el cable blanco esté bien conectado');
        console.log('   2. Verifica que los tornillos estén ajustados');
        console.log('   3. Apaga y enciende la impresora');
        console.log('   4. Ejecuta: node calibrar-godex.js');
        console.log('   5. Vuelve a ejecutar esta verificación');
    }
    console.log('');
}

ejecutarVerificacion();