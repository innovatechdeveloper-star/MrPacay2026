const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'alsimtex',
    port: 5432,
});

async function verificarColumnas() {
    try {
        console.log('🔍 Verificando columnas en usuarios...\n');
        
        // Verificar auto_servicesgd
        const autoServicesgd = await pool.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            AND column_name = 'auto_servicesgd'
        `);
        
        if (autoServicesgd.rows.length > 0) {
            console.log('✅ Columna auto_servicesgd EXISTE:');
            console.log(autoServicesgd.rows[0]);
        } else {
            console.log('❌ Columna auto_servicesgd NO EXISTE');
            console.log('   → Necesitas ejecutar: AGREGAR-ROTULADO-IMPRESO.sql');
        }
        
        console.log('\n🔍 Verificando columnas en solicitudes_etiquetas...\n');
        
        // Verificar rotulado_impreso
        const rotuladoImpreso = await pool.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'solicitudes_etiquetas' 
            AND column_name = 'rotulado_impreso'
        `);
        
        if (rotuladoImpreso.rows.length > 0) {
            console.log('✅ Columna rotulado_impreso EXISTE:');
            console.log(rotuladoImpreso.rows[0]);
        } else {
            console.log('❌ Columna rotulado_impreso NO EXISTE');
            console.log('   → Necesitas ejecutar: AGREGAR-ROTULADO-IMPRESO.sql');
        }
        
        console.log('\n🔍 Verificando usuario MARIA LUISA...\n');
        
        // Ver datos del usuario
        const usuario = await pool.query(`
            SELECT id_usuario, nombre_completo, auto_services, auto_servicesgd 
            FROM usuarios 
            WHERE nombre_completo LIKE '%MARIA%'
            LIMIT 1
        `);
        
        if (usuario.rows.length > 0) {
            console.log('✅ Usuario encontrado:');
            console.log(usuario.rows[0]);
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

verificarColumnas();
