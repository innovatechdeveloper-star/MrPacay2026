const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'alsimtex'
});

async function migrar() {
    try {
        console.log('🔄 Iniciando migración de logo_principal...\n');
        
        // 1. Agregar columna
        console.log('1️⃣ Agregando columna logo_principal...');
        await pool.query(`
            ALTER TABLE solicitudes_etiquetas 
            ADD COLUMN IF NOT EXISTS logo_principal VARCHAR(50) DEFAULT 'camitex'
        `);
        console.log('   ✅ Columna agregada\n');
        
        // 2. Migrar datos existentes
        console.log('2️⃣ Migrando datos existentes...');
        const result = await pool.query(`
            UPDATE solicitudes_etiquetas 
            SET logo_principal = CASE 
                WHEN config_logo_camitex = true THEN 'camitex'
                WHEN config_logo_camitex = false THEN 'sin_logo'
                ELSE 'camitex'
            END
            WHERE logo_principal = 'camitex'
        `);
        console.log(`   ✅ ${result.rowCount} registros actualizados\n`);
        
        // 3. Verificar si existe la columna antes de eliminar
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'solicitudes_etiquetas' 
            AND column_name = 'config_logo_camitex'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('3️⃣ Eliminando columna antigua config_logo_camitex...');
            await pool.query(`
                ALTER TABLE solicitudes_etiquetas 
                DROP COLUMN config_logo_camitex
            `);
            console.log('   ✅ Columna eliminada\n');
        } else {
            console.log('3️⃣ Columna config_logo_camitex ya no existe (omitiendo)\n');
        }
        
        // 4. Verificar migración
        console.log('4️⃣ Verificando migración...');
        const stats = await pool.query(`
            SELECT logo_principal, COUNT(*) as cantidad 
            FROM solicitudes_etiquetas 
            GROUP BY logo_principal 
            ORDER BY cantidad DESC
        `);
        
        console.log('   📊 Distribución de logos:');
        stats.rows.forEach(row => {
            console.log(`      ${row.logo_principal}: ${row.cantidad} registros`);
        });
        
        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
        
    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrar();
