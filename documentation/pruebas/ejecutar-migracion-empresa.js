// Script para ejecutar la migración de la columna empresa
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'alsimtex'
});

async function ejecutarMigracion() {
    console.log('🔄 Ejecutando migración: add_empresa_column_to_productos.sql');
    
    try {
        // Verificar si la columna ya existe
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'productos' 
            AND column_name = 'empresa'
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('⚠️ La columna "empresa" ya existe en tabla productos');
        } else {
            // Agregar columna empresa
            await pool.query(`
                ALTER TABLE productos 
                ADD COLUMN empresa VARCHAR(100) DEFAULT 'HECHO EN PERU'
            `);
            console.log('✅ Columna "empresa" agregada a tabla productos con default "HECHO EN PERU"');
        }
        
        // Actualizar productos existentes que tengan empresa NULL
        const updateResult = await pool.query(`
            UPDATE productos 
            SET empresa = 'HECHO EN PERU' 
            WHERE empresa IS NULL
        `);
        
        if (updateResult.rowCount > 0) {
            console.log(`✅ ${updateResult.rowCount} productos actualizados con valor "HECHO EN PERU"`);
        }
        
        // Verificar que la columna existe
        const result = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'productos'
            AND column_name = 'empresa'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Columna "empresa" confirmada en tabla productos:');
            console.log('   - Tipo:', result.rows[0].data_type);
            console.log('   - Default:', result.rows[0].column_default);
        } else {
            console.log('⚠️ No se encontró la columna "empresa"');
        }
        
        // Mostrar estadísticas
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_productos,
                COUNT(CASE WHEN empresa IS NOT NULL THEN 1 END) as con_empresa,
                COUNT(CASE WHEN empresa = 'HECHO EN PERU' THEN 1 END) as con_default
            FROM productos
        `);
        
        console.log('\n📊 Estadísticas:');
        console.log('   - Total productos:', stats.rows[0].total_productos);
        console.log('   - Con empresa:', stats.rows[0].con_empresa);
        console.log('   - Con default "HECHO EN PERU":', stats.rows[0].con_default);
        
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔌 Conexión cerrada');
    }
}

ejecutarMigracion();
