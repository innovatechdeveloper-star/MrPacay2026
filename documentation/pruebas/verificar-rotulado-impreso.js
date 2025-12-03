const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'alsimtex',
    port: 5432,
});

async function verificarRotuladoImpreso() {
    try {
        console.log('🔍 Verificando últimas solicitudes con rotulado_impreso...\n');
        
        // Ver últimas 5 solicitudes con su estado de rotulado
        const solicitudes = await pool.query(`
            SELECT 
                se.id_solicitud,
                se.numero_solicitud,
                se.cantidad_solicitada,
                se.estado,
                se.rotulado_impreso,
                p.nombre_producto,
                u.nombre_completo as costurera
            FROM solicitudes_etiquetas se
            JOIN productos p ON se.id_producto = p.id_producto
            JOIN usuarios u ON se.id_usuario = u.id_usuario
            ORDER BY se.fecha_solicitud DESC
            LIMIT 5
        `);
        
        console.log('📋 Últimas 5 solicitudes:\n');
        solicitudes.rows.forEach((s, i) => {
            console.log(`${i + 1}. ${s.numero_solicitud}`);
            console.log(`   Producto: ${s.nombre_producto}`);
            console.log(`   Costurera: ${s.costurera}`);
            console.log(`   Estado: ${s.estado}`);
            console.log(`   Rotulado impreso: ${s.rotulado_impreso ? '✅ SÍ' : '❌ NO'}`);
            console.log('');
        });
        
        // Verificar cola_impresion_rotulado
        console.log('🔍 Verificando cola_impresion_rotulado...\n');
        const cola = await pool.query(`
            SELECT 
                id_solicitud,
                numero_solicitud,
                nombre_producto,
                cantidad,
                codigo_producto,
                fecha_solicitud
            FROM cola_impresion_rotulado
            ORDER BY fecha_solicitud DESC
            LIMIT 3
        `);
        
        console.log(`📦 Registros en cola_impresion_rotulado: ${cola.rows.length}\n`);
        cola.rows.forEach((c, i) => {
            console.log(`${i + 1}. ${c.numero_solicitud} - ${c.nombre_producto}`);
            console.log(`   Cantidad: ${c.cantidad}`);
            console.log(`   Código: ${c.codigo_producto}`);
            console.log('');
        });
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        await pool.end();
    }
}

verificarRotuladoImpreso();
