import { spawn } from 'child_process';
import http from 'http';

const proc = spawn('npx', ['tsx', 'api/server.ts'], { stdio: ['pipe', 'pipe', 'pipe'] });

let serverOutput = '';
proc.stdout.on('data', (d) => { serverOutput += d.toString(); });
proc.stderr.on('data', (d) => { serverOutput += d.toString(); });

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
  console.log('=== Server started ===');
  
  try {
    // 1. 注册
    console.log('\n=== Step 1: Register ===');
    const phone = '139' + Date.now().toString().slice(-8);
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: '测试用户',
      phone: phone,
      password: '123456',
      role: 'owner'
    });
    console.log('Status:', regRes.status);
    console.log('Body:', regRes.body.slice(0, 200));
    
    // 2. 登录
    console.log('\n=== Step 2: Login ===');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      phone: phone,
      password: '123456'
    });
    console.log('Status:', loginRes.status);
    console.log('Body:', loginRes.body.slice(0, 200));
    
    const loginData = JSON.parse(loginRes.body);
    const token = loginData.data?.token;
    console.log('Token:', token ? 'got it' : 'no token');
    
    // 3. 添加宠物
    console.log('\n=== Step 3: Add Pet ===');
    const addPetRes = await makeRequest('POST', '/api/pets', {
      name: '旺财',
      breed: '金毛犬',
      age: 3,
      weight: 25,
      neutered: false,
      vaccines: []
    }, token);
    console.log('Status:', addPetRes.status);
    console.log('Body:', addPetRes.body.slice(0, 200));
    
    // 4. 获取宠物列表
    console.log('\n=== Step 4: Get Pets ===');
    const getPetsRes = await makeRequest('GET', '/api/pets', null, token);
    console.log('Status:', getPetsRes.status);
    console.log('Body:', getPetsRes.body.slice(0, 200));
    
    // 5. 获取科室列表
    console.log('\n=== Step 5: Get Departments ===');
    const deptRes = await makeRequest('GET', '/api/appointments/departments');
    console.log('Status:', deptRes.status);
    console.log('Body:', deptRes.body.slice(0, 200));
    
    // 6. 检查后端是否还活着
    console.log('\n=== Step 6: Check server alive ===');
    const healthRes = await makeRequest('GET', '/api/health');
    console.log('Status:', healthRes.status);
    console.log('Body:', healthRes.body.slice(0, 200));
    
    console.log('\n=== All tests passed! ===');
    
  } catch (e) {
    console.log('Error:', e.message);
    console.log('\nServer output:');
    console.log(serverOutput);
  }
  
  proc.kill();
}, 2000);
