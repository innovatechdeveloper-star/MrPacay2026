const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'alsimtex'
});

async function exportarEsquema() {
    try {
        console.log('🔍 Extrayendo esquema de base de datos...\n');
        
        // Obtener todas las tablas
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        let sql = `-- =============================================
-- ESQUEMA COMPLETO - Sistema de Etiquetas
-- Base de datos: postgres
-- Fecha de exportación: ${new Date().toLocaleString('es-PE')}
-- =============================================

-- Eliminar tablas existentes (si existen)
`;

        for (const table of tables.rows) {
            sql += `DROP TABLE IF EXISTS ${table.table_name} CASCADE;\n`;
        }
        
        sql += `\n-- =============================================\n-- CREAR TABLAS\n-- =============================================\n\n`;
        
        // Para cada tabla, obtener su estructura completa
        for (const table of tables.rows) {
            console.log(`📋 Procesando tabla: ${table.table_name}`);
            
            // Obtener columnas
            const columns = await pool.query(`
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table.table_name]);
            
            sql += `-- Tabla: ${table.table_name}\n`;
            sql += `CREATE TABLE ${table.table_name} (\n`;
            
            const columnDefs = [];
            for (const col of columns.rows) {
                let def = `    ${col.column_name} `;
                
                // Tipo de dato
                if (col.data_type === 'character varying') {
                    def += `VARCHAR(${col.character_maximum_length || 255})`;
                } else if (col.data_type === 'timestamp without time zone') {
                    def += 'TIMESTAMP';
                } else if (col.data_type === 'USER-DEFINED') {
                    def += 'VARCHAR(50)'; // Para enums
                } else {
                    def += col.data_type.toUpperCase();
                }
                
                // NOT NULL
                if (col.is_nullable === 'NO') {
                    def += ' NOT NULL';
                }
                
                // DEFAULT
                if (col.column_default) {
                    def += ` DEFAULT ${col.column_default}`;
                }
                
                columnDefs.push(def);
            }
            
            // Obtener primary key
            const pk = await pool.query(`
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = $1::regclass AND i.indisprimary
            `, [table.table_name]);
            
            if (pk.rows.length > 0) {
                const pkCols = pk.rows.map(r => r.attname).join(', ');
                columnDefs.push(`    PRIMARY KEY (${pkCols})`);
            }
            
            sql += columnDefs.join(',\n');
            sql += '\n);\n\n';
            
            // Obtener foreign keys
            const fks = await pool.query(`
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = $1
            `, [table.table_name]);
            
            for (const fk of fks.rows) {
                sql += `ALTER TABLE ${table.table_name} ADD CONSTRAINT ${fk.constraint_name} `;
                sql += `FOREIGN KEY (${fk.column_name}) `;
                sql += `REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`;
            }
            
            if (fks.rows.length > 0) sql += '\n';
        }
        
        // Obtener índices
        sql += `-- =============================================\n-- ÍNDICES\n-- =============================================\n\n`;
        
        const indexes = await pool.query(`
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname NOT LIKE '%_pkey'
            ORDER BY tablename, indexname
        `);
        
        for (const idx of indexes.rows) {
            sql += `${idx.indexdef};\n`;
        }
        
        // Guardar archivo
        fs.writeFileSync('base_data/crear_base_datos.sql', sql, 'utf8');
        
        console.log('\n✅ Esquema exportado exitosamente');
        console.log(`📊 Tablas exportadas: ${tables.rows.length}`);
        console.log(`📁 Archivo: base_data/crear_base_datos.sql\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

exportarEsquema();
