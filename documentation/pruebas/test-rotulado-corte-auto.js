// =====================================================
// TEST ROTULADO CON CORTE AUTOMÁTICO - MEDIDAS CAMITEX
// =====================================================
// Probar funcionalidad integrada en server.js
// usando datos reales de productos CAMITEX

const net = require('net');

// ✂️ Función para enviar EZPL con corte automático (igual que en server.js)
function enviarEZPLConCorte(ezplData, ip, port) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.connect(port, ip, () => {
            console.log(`🔗 [Godex] Conectado a ${ip}:${port}`);
            
            // ✂️ COMANDOS DE CORTE CAPTURADOS DE GOLABEL
            const comandosCorte = '^XSETCUT,DOUBLECUT,0\r\n';
            
            // Configurar medidas exactas CAMITEX (50x30mm) - CORREGIDO
            // ^Q = altura etiqueta, ^W = ancho etiqueta en mm
            const configuracionGodex = '^Q50,30\r\n^W50\r\n^H8\r\n^P1\r\n^S4\r\n^AD\r\n^C1\r\n';
            
            // Enviar configuración + EZPL + comando de corte
            const datosCompletos = comandosCorte + configuracionGodex + ezplData + '\r\nE\r\n';
            
            console.log(`✂️ [Godex] Enviando con corte automático activado`);
            console.log(`📋 Datos completos (${datosCompletos.length} chars):`, datosCompletos);
            
            socket.write(datosCompletos);
            socket.end();
        });
        
        socket.on('close', () => {
            console.log(`✅ [Godex] Impresión completada con corte automático`);
            resolve(true);
        });
        
        socket.on('error', (error) => {
            console.error(`❌ [Godex] Error:`, error.message);
            reject(error);
        });
        
        socket.on('timeout', () => {
            console.error(`⏱️ [Godex] Timeout`);
            socket.destroy();
            reject(new Error('Timeout en conexión con Godex'));
        });
    });
}

// 🏷️ Generar EZPL para producto CAMITEX
function generarRotuladoCAMITEX() {
    // Datos de ejemplo CAMITEX
    const tipoProducto = 'ALMOHADA';
    const telaTipo = 'TC';
    const tamano = 'KING';
    const codigoBarras = '10002-192';
    
    // EZPL usando formato capturado de GoLabel
    const ezpl = `^R0
~Q+0
^O0
^Db
^E18
~R255
^C1
^D0
^D1
^L
Dy2-me-dd
Th:m:s
AF,32,54,1,3,0,0E,${tipoProducto}
AF,32,95,1,2,0,0E,TELA: ${telaTipo}
AF,32,125,1,2,0,0E,MODELO: ${tamano}
AF,32,155,1,2,0,0E,HECHO EN PERU
AF,32,185,1,1,0,0E,COD: ${codigoBarras}`;

    return ezpl;
}

// 🎯 EJECUTAR PRUEBA
async function ejecutarPrueba() {
    console.log('🚀 TEST ROTULADO CAMITEX CON CORTE AUTOMÁTICO');
    console.log('===============================================');
    
    try {
        // Configuración Godex G530
        const GODEX_IP = '192.168.1.35';
        const GODEX_PORT = 9100;
        
        // Generar EZPL
        const ezplData = generarRotuladoCAMITEX();
        console.log('📋 EZPL Generado:');
        console.log(ezplData);
        console.log('');
        
        // Enviar a impresora
        console.log(`📡 Enviando a Godex ${GODEX_IP}:${GODEX_PORT}...`);
        await enviarEZPLConCorte(ezplData, GODEX_IP, GODEX_PORT);
        
        console.log('');
        console.log('🎯 VERIFICACIÓN:');
        console.log('✅ ¿Se imprimió la etiqueta con datos CAMITEX?');
        console.log('✅ ¿Se cortó automáticamente al terminar?');
        console.log('✅ ¿Las medidas son correctas (50x30mm)?');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

// Ejecutar
ejecutarPrueba();