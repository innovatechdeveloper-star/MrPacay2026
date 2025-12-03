// ============================================
// VERIFICACIÓN DRIVER WINDOWS + CONFIGURACIÓN MANUAL
// Verificar configuración del driver y habilitar guillotina
// ============================================

const net = require('net');
const { exec } = require('child_process');

console.log('🔧 VERIFICACIÓN DRIVER WINDOWS + CONFIGURACIÓN');
console.log('==============================================');
console.log('');
console.log('Este script verificará:');
console.log('• Configuración del driver de Windows');
console.log('• Estado de la impresora desde sistema');
console.log('• Configuración manual de guillotina');
console.log('');

// Función para verificar driver de Windows
function verificarDriverWindows() {
    return new Promise((resolve) => {
        console.log('📋 PASO 1: Verificando driver de Windows...');
        
        exec('wmic printer where "name like \'%Godex%\' or name like \'%G530%\'" get name,drivername,portname', (error, stdout, stderr) => {
            if (error) {
                console.log('   ⚠️  No se pudo consultar drivers automáticamente');
                console.log('   📝 VERIFICACIÓN MANUAL REQUERIDA:');
            } else {
                console.log('   📊 Información del driver:');
                console.log(stdout);
            }
            
            console.log('');
            console.log('   🔧 PASOS MANUALES CRÍTICOS:');
            console.log('   1. Ve a "Configuración" → "Impresoras y escáneres"');
            console.log('   2. Busca "Godex G530" en la lista');
            console.log('   3. Haz clic → "Administrar" → "Preferencias de impresión"');
            console.log('   4. Busca pestaña "Stock", "Página" o "Avanzado"');
            console.log('   5. Encuentra "Tipo de Post-Impresión" o "Post-Print Action"');
            console.log('   6. Cámbialo de "Ninguno" a "CORTADOR" o "CUTTER"');
            console.log('   7. Aplicar y Aceptar');
            console.log('');
            
            resolve();
        });
    });
}

// Función para configuración manual directa
function configuracionManualDirecta() {
    return new Promise((resolve) => {
        console.log('📋 PASO 2: Configuración manual directa...');
        
        const GODEX_IP = '192.168.1.35';
        const GODEX_PORT = 9100;
        
        const socket = new net.Socket();
        socket.setTimeout(8000);
        
        // Configuración paso a paso muy específica
        const configManual = [
            // Reset total
            '~R',                       // Reset hardware completo
            '',                         // Pausa 1 segundo
            
            // Configuración específica del cortador en el firmware
            '^S,CUT,1,0',              // Habilitar cortador: 1=activo, 0=corte total
            '^S,CUT,ENABLE',           // Comando alternativo para habilitar
            
            // Configuración de modo de operación
            '^S,MODE,CUT',             // Establecer modo cortador
            '^S,POSTPRINT,CUT',        // Post-impresión = cortar
            
            // Configuración de etiqueta estándar
            '^Q394,16',                // 50mm alto, 2mm gap
            '^W236',                   // 30mm ancho
            
            // Test de corte directo
            '~C,1',                    // Corte forzado con parámetro
            '',                        // Pausa
            '~CUT',                    // Comando alternativo
            
        ].join('\r\n') + '\r\n';
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   ✅ Conectado para configuración manual');
            console.log('   📤 Aplicando configuración específica del cortador...');
            
            socket.write(configManual);
            
            setTimeout(() => {
                console.log('   ✅ Configuración manual aplicada');
                console.log('   🎯 ¿Escuchaste sonido de corte?');
                socket.end();
                resolve();
            }, 3000);
        });
        
        socket.on('data', (data) => {
            const response = data.toString().trim();
            if (response) {
                console.log('   📥 Respuesta:', response);
            }
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error en configuración manual:', error.message);
            resolve();
        });
    });
}

// Función para test final con verificación física
function testFinalConVerificacion() {
    return new Promise((resolve) => {
        console.log('📋 PASO 3: Test final con verificación física...');
        
        const GODEX_IP = '192.168.1.35';
        const GODEX_PORT = 9100;
        
        const socket = new net.Socket();
        socket.setTimeout(10000);
        
        // Etiqueta de prueba muy simple
        const etiquetaSimple = [
            '^Q394,16',                // Configurar etiqueta
            '^W236',
            '^S,CUT,1,0',             // Habilitar corte
            '^L',                      // Inicio
            'A50,50,0,3,1,1,N,"PRUEBA"',   // Texto centrado
            'A30,100,0,2,1,1,N,"GUILLOTINA"',
            'E'                        // Imprimir Y cortar automáticamente
        ].join('\r\n') + '\r\n';
        
        socket.connect(GODEX_PORT, GODEX_IP, () => {
            console.log('   ✅ Conectado para test final');
            console.log('   📤 Enviando etiqueta de prueba...');
            console.log('   ⏰ OBSERVA la impresora físicamente...');
            
            socket.write(etiquetaSimple);
            
            setTimeout(() => {
                console.log('   ✅ Etiqueta de prueba enviada');
                console.log('');
                console.log('   🔍 VERIFICACIÓN FÍSICA:');
                console.log('   • ¿Hay una etiqueta con "PRUEBA GUILLOTINA"?');
                console.log('   • ¿Está separada del rollo (cortada)?');
                console.log('   • ¿Escuchaste sonido de impresión + corte?');
                console.log('');
                socket.end();
                resolve();
            }, 4000);
        });
        
        socket.on('error', (error) => {
            console.log('   ❌ Error en test final:', error.message);
            resolve();
        });
    });
}

// Ejecutar verificación completa
async function ejecutarVerificacionCompleta() {
    console.log('🚀 Iniciando verificación completa...');
    console.log('');
    
    await verificarDriverWindows();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await configuracionManualDirecta();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testFinalConVerificacion();
    
    console.log('==========================================');
    console.log('  VERIFICACIÓN COMPLETADA');
    console.log('==========================================');
    console.log('');
    console.log('📊 ANÁLISIS FINAL:');
    console.log('');
    console.log('✅ SI LA ETIQUETA SE IMPRIMIÓ Y CORTÓ:');
    console.log('   🎉 ¡PROBLEMA RESUELTO!');
    console.log('   • La guillotina funciona correctamente');
    console.log('   • Usar comandos EZPL en el sistema');
    console.log('   • Configuración: ^S,CUT,1,0 + comando E');
    console.log('');
    console.log('⚠️  SI SE IMPRIMIÓ PERO NO CORTÓ:');
    console.log('   • Configurar el driver de Windows (CRÍTICO)');
    console.log('   • Verificar conexión física del cable blanco');
    console.log('   • La impresora debe "saber" que tiene guillotina');
    console.log('');
    console.log('❌ SI NO SE IMPRIMIÓ:');
    console.log('   • Verificar papel y ribbon');
    console.log('   • Verificar estado de la impresora');
    console.log('   • Presionar botón FEED manualmente');
    console.log('');
    console.log('🔧 ACCIÓN REQUERIDA:');
    console.log('   Reporta el resultado de la verificación física');
    console.log('');
}

ejecutarVerificacionCompleta();