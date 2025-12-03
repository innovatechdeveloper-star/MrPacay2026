const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'alsimtex',
    port: 5432
});

async function ejecutarMigracion() {
    console.log('🔄 Ejecutando migración: add_config_impresion_especiales.sql');
    
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'add_config_impresion_especiales.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await pool.query(sql);
        
        console.log('✅ Migración completada exitosamente');
        console.log('📊 Tabla config_impresion_especiales creada');
        console.log('📋 Configuraciones por defecto insertadas para productos especiales existentes');
        
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

ejecutarMigracion();
