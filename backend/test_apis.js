const http = require('http');

const postData = JSON.stringify({ identifier: 'admin@trinetra.com', password: 'ChangeMe@123' });

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json.token;
    console.log('Login successful');
    
    // GET /api/workers
    http.get({
      hostname: 'localhost',
      port: 5001,
      path: '/api/workers',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res2) => {
      console.log('GET /api/workers Status:', res2.statusCode);
      
      // GET /api/clients
      http.get({
        hostname: 'localhost',
        port: 5001,
        path: '/api/clients',
        headers: { 'Authorization': 'Bearer ' + token }
      }, (res3) => {
        console.log('GET /api/clients Status:', res3.statusCode);
      });
    });
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
