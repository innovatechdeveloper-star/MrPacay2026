// Script para exportar esquema completo de PostgreSQL
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

async function exportarEsquema() {
    try {
        console.log('🔍 Exportando esquema completo...\n');
        
        let sql = `-- =============================================
-- SISTEMA DE ETIQUETAS V2.5 - BASE DE DATOS COMPLETA
-- Generado: ${new Date().toLocaleString('es-PE')}
-- =============================================

`;

        // 1. Obtener todas las tablas con sus columnas
        const tablesQuery = `
            SELECT 
                t.table_name,
                json_agg(
                    json_build_object(
                        'column_name', c.column_name,
                        'data_type', c.data_type,
                        'character_maximum_length', c.character_maximum_length,
                        'is_nullable', c.is_nullable,
                        'column_default', c.column_default
                    ) ORDER BY c.ordinal_position
                ) as columns
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            AND c.table_schema = 'public'
            GROUP BY t.table_name
            ORDER BY t.table_name;
        `;
        
        const tables = await pool.query(tablesQuery);
        
        console.log(`✅ Encontradas ${tables.rows.length} tablas\n`);
        
        // Generar CREATE TABLE para cada tabla
        for (const table of tables.rows) {
            sql += `\n-- Tabla: ${table.table_name}\n`;
            sql += `CREATE TABLE IF NOT EXISTS ${table.table_name} (\n`;
            
            const columns = table.columns.map(col => {
                let colDef = `    ${col.column_name} `;
                
                // Tipo de dato
                if (col.data_type === 'character varying') {
                    colDef += col.character_maximum_length ? 
                        `VARCHAR(${col.character_maximum_length})` : 
                        'VARCHAR';
                } else if (col.data_type === 'integer' && col.column_default?.includes('nextval')) {
                    colDef += 'SERIAL';
                } else if (col.data_type === 'timestamp without time zone') {
                    colDef += 'TIMESTAMP';
                } else if (col.data_type === 'boolean') {
                    colDef += 'BOOLEAN';
                } else if (col.data_type === 'text') {
                    colDef += 'TEXT';
                } else if (col.data_type === 'numeric') {
                    colDef += 'NUMERIC';
                } else if (col.data_type === 'date') {
                    colDef += 'DATE';
                } else {
                    colDef += col.data_type.toUpperCase();
                }
                
                // NULL/NOT NULL
                if (col.is_nullable === 'NO' && !col.column_default?.includes('nextval')) {
                    colDef += ' NOT NULL';
                }
                
                // DEFAULT
                if (col.column_default && !col.column_default.includes('nextval')) {
                    colDef += ` DEFAULT ${col.column_default}`;
                }
                
                return colDef;
            });
            
            sql += columns.join(',\n');
            sql += '\n);\n';
            
            console.log(`✅ ${table.table_name}`);
        }
        
        // 2. Primary Keys
        sql += `\n-- =============================================\n`;
        sql += `-- PRIMARY KEYS\n`;
        sql += `-- =============================================\n\n`;
        
        const pkeysQuery = `
            SELECT 
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY tc.table_name;
        `;
        
        const pkeys = await pool.query(pkeysQuery);
        for (const pk of pkeys.rows) {
            sql += `ALTER TABLE ${pk.table_name} ADD PRIMARY KEY (${pk.column_name});\n`;
        }
        
        // 3. Foreign Keys
        sql += `\n-- =============================================\n`;
        sql += `-- FOREIGN KEYS\n`;
        sql += `-- =============================================\n\n`;
        
        const fkeysQuery = `
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name;
        `;
        
        const fkeys = await pool.query(fkeysQuery);
        for (const fk of fkeys.rows) {
            sql += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} `;
            sql += `FOREIGN KEY (${fk.column_name}) `;
            sql += `REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`;
        }
        
        // 4. Índices
        sql += `\n-- =============================================\n`;
        sql += `-- INDEXES\n`;
        sql += `-- =============================================\n\n`;
        
        const indexesQuery = `
            SELECT
                i.relname AS index_name,
                t.relname AS table_name,
                a.attname AS column_name,
                ix.indisunique AS is_unique
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relkind = 'r'
            AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND i.relname NOT LIKE '%_pkey'
            ORDER BY t.relname, i.relname;
        `;
        
        const indexes = await pool.query(indexesQuery);
        const processedIndexes = new Set();
        
        for (const idx of indexes.rows) {
            if (!processedIndexes.has(idx.index_name)) {
                const uniqueStr = idx.is_unique ? 'UNIQUE ' : '';
                sql += `CREATE ${uniqueStr}INDEX IF NOT EXISTS ${idx.index_name} ON ${idx.table_name}(${idx.column_name});\n`;
                processedIndexes.add(idx.index_name);
            }
        }
        
        // 5. Funciones
        sql += `\n-- =============================================\n`;
        sql += `-- FUNCTIONS\n`;
        sql += `-- =============================================\n\n`;
        
        const functionsQuery = `
            SELECT 
                p.proname AS function_name,
                pg_get_functiondef(p.oid) AS function_definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.prokind = 'f'
            ORDER BY p.proname;
        `;
        
        const functions = await pool.query(functionsQuery);
        for (const func of functions.rows) {
            sql += `${func.function_definition};\n\n`;
        }
        
        // 6. Triggers
        sql += `\n-- =============================================\n`;
        sql += `-- TRIGGERS\n`;
        sql += `-- =============================================\n\n`;
        
        const triggersQuery = `
            SELECT 
                tgname AS trigger_name,
                tgrelid::regclass AS table_name,
                pg_get_triggerdef(oid) AS trigger_definition
            FROM pg_trigger
            WHERE tgisinternal = false
            ORDER BY tgrelid::regclass::text, tgname;
        `;
        
        const triggers = await pool.query(triggersQuery);
        for (const trig of triggers.rows) {
            sql += `${trig.trigger_definition};\n\n`;
        }
        
        // Guardar archivo
        const outputPath = path.join(__dirname, '..', 'base_data', 'crear_base_datos.sql');
        fs.writeFileSync(outputPath, sql, 'utf8');
        
        console.log(`\n✅ Esquema exportado a: ${outputPath}`);
        console.log(`📊 Tamaño: ${(sql.length / 1024).toFixed(2)} KB\n`);
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

exportarEsquema();
