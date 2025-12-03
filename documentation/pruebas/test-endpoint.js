// Script simple para probar el endpoint /api/datos-ejemplo
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3010,
    path: '/api/datos-ejemplo',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('🔍 Probando endpoint: http://localhost:3010/api/datos-ejemplo');
console.log('');

const req = http.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('');
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📦 Response Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.end();
