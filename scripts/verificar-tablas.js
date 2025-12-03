// Script para verificar tablas de PostgreSQL
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración directa
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'alsimtex'
});

async function verificarTablas() {
    try {
        console.log('🔍 Conectando a PostgreSQL...\n');

        // Obtener lista de tablas
        const tablesQuery = `
            SELECT 
                table_name,
                (SELECT COUNT(*) 
                 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const result = await pool.query(tablesQuery);
        
        console.log('📊 TABLAS EN LA BASE DE DATOS:\n');
        console.log('┌────────────────────────────────────────┬──────────┐');
        console.log('│ Tabla                                  │ Columnas │');
        console.log('├────────────────────────────────────────┼──────────┤');
        
        result.rows.forEach(row => {
            const tableName = row.table_name.padEnd(38);
            const colCount = row.column_count.toString().padStart(8);
            console.log(`│ ${tableName} │ ${colCount} │`);
        });
        
        console.log('└────────────────────────────────────────┴──────────┘');
        console.log(`\n✅ Total de tablas: ${result.rows.length}\n`);

        // Verificar secuencias
        const sequencesQuery = `
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
            ORDER BY sequence_name;
        `;
        
        const sequences = await pool.query(sequencesQuery);
        console.log('📋 SECUENCIAS:\n');
        sequences.rows.forEach(seq => {
            console.log(`   - ${seq.sequence_name}`);
        });
        console.log(`\n✅ Total de secuencias: ${sequences.rows.length}\n`);

        // Verificar funciones personalizadas
        const functionsQuery = `
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            AND routine_name LIKE '%producto%' OR routine_name LIKE '%qr%' OR routine_name LIKE '%codigo%'
            ORDER BY routine_name;
        `;
        
        const functions = await pool.query(functionsQuery);
        console.log('⚙️  FUNCIONES PERSONALIZADAS:\n');
        if (functions.rows.length > 0) {
            functions.rows.forEach(func => {
                console.log(`   - ${func.routine_name}()`);
            });
        } else {
            console.log('   (ninguna encontrada)');
        }
        console.log(`\n✅ Total de funciones: ${functions.rows.length}\n`);

        // Verificar triggers
        const triggersQuery = `
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            ORDER BY event_object_table, trigger_name;
        `;
        
        const triggers = await pool.query(triggersQuery);
        console.log('🎯 TRIGGERS:\n');
        if (triggers.rows.length > 0) {
            triggers.rows.forEach(trig => {
                console.log(`   - ${trig.trigger_name} → ${trig.event_object_table}`);
            });
        } else {
            console.log('   (ninguno encontrado)');
        }
        console.log(`\n✅ Total de triggers: ${triggers.rows.length}\n`);

        // Detalles de tablas específicas importantes
        console.log('📄 DETALLES DE TABLAS CLAVE:\n');
        
        const tablasImportantes = [
            'usuarios',
            'productos',
            'productos_especiales',
            'solicitudes_especiales',
            'cola_rotulado',
            'configuracion_logos'
        ];

        for (const tabla of tablasImportantes) {
            const columnsQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `;
            
            try {
                const cols = await pool.query(columnsQuery, [tabla]);
                if (cols.rows.length > 0) {
                    console.log(`\n📋 ${tabla.toUpperCase()} (${cols.rows.length} columnas):`);
                    cols.rows.forEach(col => {
                        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                        const defVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                        console.log(`   - ${col.column_name} (${col.data_type}) ${nullable}${defVal}`);
                    });
                }
            } catch (err) {
                console.log(`\n❌ ${tabla}: No existe`);
            }
        }

        await pool.end();
        console.log('\n✅ Verificación completa\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verificarTablas();
