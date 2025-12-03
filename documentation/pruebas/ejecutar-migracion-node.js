// Script para ejecutar migración de productos especiales
const { Pool } = require('pg');
const fs = require('fs');

console.log('==========================================');
console.log(' 🔧 MIGRACIÓN: Productos Especiales');
console.log('==========================================');
console.log('');

// Leer archivo de configuración INI
const configContent = fs.readFileSync('./system.config', 'utf8');
const configLines = configContent.split('\n');

// Parsear configuración
const config = {
    database: {}
};

let currentSection = '';
configLines.forEach(line => {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
    } else if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=').map(s => s.trim());
        if (currentSection === 'DATABASE_CONFIG') {
            config.database[key] = value;
        }
    }
});

console.log('Conectando a base de datos...');
console.log(`Host: ${config.database.HOST}`);
console.log(`Database: ${config.database.DATABASE}`);
console.log(`User: ${config.database.USER}`);
console.log('');

const pool = new Pool({
    user: config.database.USER,
    host: config.database.HOST,
    database: config.database.DATABASE,
    password: config.database.PASSWORD,
    port: parseInt(config.database.PORT),
});

async function ejecutarMigracion() {
    const client = await pool.connect();
    
    try {
        console.log('✅ Conexión establecida');
        console.log('');
        console.log('📝 Ejecutando migración...');
        console.log('');

        // Agregar columna id_producto_especial
        console.log('1️⃣  Agregando columna id_producto_especial...');
        await client.query(`
            ALTER TABLE solicitudes_etiquetas 
            ADD COLUMN IF NOT EXISTS id_producto_especial INTEGER REFERENCES productos_especiales(id_producto_especial)
        `);
        console.log('   ✅ Columna id_producto_especial agregada');

        // Agregar columna numero_solicitud_grupo
        console.log('2️⃣  Agregando columna numero_solicitud_grupo...');
        await client.query(`
            ALTER TABLE solicitudes_etiquetas 
            ADD COLUMN IF NOT EXISTS numero_solicitud_grupo VARCHAR(50)
        `);
        console.log('   ✅ Columna numero_solicitud_grupo agregada');

        // Crear índice para producto especial
        console.log('3️⃣  Creando índice idx_solicitudes_producto_especial...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_solicitudes_producto_especial 
            ON solicitudes_etiquetas(id_producto_especial)
        `);
        console.log('   ✅ Índice idx_solicitudes_producto_especial creado');

        // Crear índice para grupo
        console.log('4️⃣  Creando índice idx_solicitudes_grupo...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_solicitudes_grupo 
            ON solicitudes_etiquetas(numero_solicitud_grupo)
        `);
        console.log('   ✅ Índice idx_solicitudes_grupo creado');

        // Agregar comentarios
        console.log('5️⃣  Agregando comentarios de documentación...');
        await client.query(`
            COMMENT ON COLUMN solicitudes_etiquetas.id_producto_especial IS 
            'Referencia al producto especial (JUEGO/COMBO) del cual proviene esta solicitud'
        `);
        await client.query(`
            COMMENT ON COLUMN solicitudes_etiquetas.numero_solicitud_grupo IS 
            'Agrupa todas las solicitudes generadas por un mismo JUEGO/COMBO (ESP-timestamp)'
        `);
        console.log('   ✅ Comentarios agregados');

        // Verificar columnas
        console.log('');
        console.log('🔍 Verificando columnas creadas...');
        const result = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'solicitudes_etiquetas' 
            AND column_name IN ('id_producto_especial', 'numero_solicitud_grupo')
            ORDER BY column_name
        `);

        console.log('');
        console.log('📊 Columnas verificadas:');
        console.log('─────────────────────────────────────────────────────────');
        result.rows.forEach(row => {
            console.log(`   ${row.column_name}`);
            console.log(`     Tipo: ${row.data_type}`);
            console.log(`     Nullable: ${row.is_nullable}`);
            if (row.column_default) {
                console.log(`     Default: ${row.column_default}`);
            }
            console.log('');
        });

        console.log('');
        console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨');
        console.log('✅ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨');
        console.log('');
        console.log('La base de datos está lista para manejar');
        console.log('productos especiales (JUEGOS/COMBOS)');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ ERROR AL EJECUTAR MIGRACIÓN:');
        console.error('─────────────────────────────────────────────────────────');
        console.error(error.message);
        console.error('');
        if (error.detail) {
            console.error('Detalle:', error.detail);
            console.error('');
        }
        if (error.hint) {
            console.error('Sugerencia:', error.hint);
            console.error('');
        }
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar migración
ejecutarMigracion()
    .then(() => {
        console.log('Migración finalizada. Presiona Ctrl+C para salir.');
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
