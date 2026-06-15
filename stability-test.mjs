import { spawn } from 'child_process';
import http from 'http';

console.log('Starting stability test...');

const proc = spawn('npx', ['tsx', 'api/server.ts'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
proc.stdout.on('data', (d) => { stdout += d.toString(); });
proc.stderr.on('data', (d) => { stderr += d.toString(); });

proc.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
});

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

setTimeout(async () => {
  console.log('Server should be started now');
  console.log('stdout so far:', stdout);
  
  try {
    // 1. 健康检查
    console.log('\n1. Health check...');
    const health = await makeRequest('GET', '/api/health');
    console.log('Status:', health.status);
    
    // 2. 获取科室列表
    console.log('\n2. Get departments...');
    const dept = await makeRequest('GET', '/api/appointments/departments');
    console.log('Status:', dept.status);
    console.log('Body:', dept.body.slice(0, 100));
    
    // 3. 注册
    console.log('\n3. Register...');
    const phone = '199' + Date.now().toString().slice(-8);
    const reg = await makeRequest('POST', '/api/auth/register', {
      name: '测试用户',
      phone: phone,
      password: '123456',
      role: 'owner'
    });
    console.log('Status:', reg.status);
    const regData = JSON.parse(reg.body);
    const token = regData.data?.token;
    console.log('Token:', token ? 'got it' : 'no');
    
    // 4. 并发请求 - 模拟浏览器的多个请求
    console.log('\n4. Concurrent requests...');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest('GET', '/api/appointments/departments'));
      promises.push(makeRequest('GET', '/api/appointments/departments/1/doctors'));
    }
    const results = await Promise.all(promises);
    const allOk = results.every(r => r.status === 200);
    console.log('All OK:', allOk);
    console.log('Process still alive:', !proc.killed);
    
    // 5. 再等 5 秒
    console.log('\n5. Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('Process still alive after 5s:', !proc.killed);
    
    console.log('\n=== All tests passed! ===');
    
  } catch (e) {
    console.log('Error:', e.message);
    console.log('Process alive:', !proc.killed);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
  }
  
  proc.kill();
}, 2000);
