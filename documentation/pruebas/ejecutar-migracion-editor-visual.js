const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer configuración
const configPath = path.join(__dirname, 'system.config');
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = {};

configContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        config[key.trim()] = value.trim();
    }
});

// Configurar cliente PostgreSQL
const client = new Client({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD
});

async function ejecutarMigracion() {
    try {
        console.log('========================================');
        console.log('🎨 MIGRACIÓN: Tabla Editor Visual');
        console.log('========================================\n');
        
        await client.connect();
        console.log('✅ Conectado a la base de datos\n');
        
        console.log('📊 Creando tabla: plantillas_etiquetas\n');
        
        // Leer archivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'create_plantillas_etiquetas.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
        
        // Ejecutar migración
        await client.query(sqlContent);
        
        console.log('\n✅ Migración completada exitosamente\n');
        
        // Verificar tabla creada
        console.log('📋 Verificando tabla creada...\n');
        const result = await client.query(`
            SELECT 
                id_plantilla,
                nombre_plantilla,
                ancho_dots,
                alto_dots,
                es_default,
                activa,
                jsonb_array_length(config_elementos->'elementos') as num_elementos
            FROM plantillas_etiquetas
        `);
        
        console.log('Plantillas encontradas:', result.rows.length);
        result.rows.forEach(row => {
            console.log(`  - ID: ${row.id_plantilla}`);
            console.log(`    Nombre: ${row.nombre_plantilla}`);
            console.log(`    Dimensiones: ${row.ancho_dots}x${row.alto_dots} dots`);
            console.log(`    Default: ${row.es_default ? 'Sí' : 'No'}`);
            console.log(`    Elementos: ${row.num_elementos}`);
            console.log('');
        });
        
        console.log('✅ LISTO! Sistema de Editor Visual preparado');
        console.log('📌 Plantilla por defecto creada\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.code === '42P07') {
            console.log('ℹ️ La tabla ya existe. No es necesario crear de nuevo.');
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

ejecutarMigracion();
