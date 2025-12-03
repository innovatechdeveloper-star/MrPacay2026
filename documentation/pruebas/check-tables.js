const {Pool} = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'alsimtex',
    port: 5432
});

pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'", (err, res) => {
    if(err) {
        console.log('❌ Error:', err.message);
    } else {
        console.log('✅ Tablas encontradas:', res.rows.length);
        console.log('\nTablas:');
        res.rows.forEach(r => console.log('  -', r.tablename));
    }
    pool.end();
});
