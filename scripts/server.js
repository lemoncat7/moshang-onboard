const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 19000;
const DASHBOARD_PATH = '/home/root/.openclaw/workspace/skills/dashboard-service/frontend/index.html';
const STAR_OFFICE_PATH = '/workspace/Star-Office-UI';

// 静态文件缓存
const cache = new Map();

// 运行时状态
let apiCalls = 0;
let taskCount = 0;
let chatCount = 0;
const startTime = Date.now();
const statusHistory = [];

// 状态历史记录
function addStatusHistory(status) {
    statusHistory.push({ status, time: Date.now() });
    if (statusHistory.length > 50) statusHistory.shift();
}

function getContentType(url) {
  if (url.endsWith('.html')) return 'text/html';
  if (url.endsWith('.js')) return 'application/javascript';
  if (url.endsWith('.css')) return 'text/css';
  if (url.endsWith('.png')) return 'image/png';
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
  if (url.endsWith('.webp')) return 'image/webp';
  if (url.endsWith('.woff') || url.endsWith('.woff2')) return 'font/woff2';
  return 'text/plain';
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const contentType = getContentType(filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(data);
  });
}

function serveStarOffice(req, res) {
  const url = req.url.replace(/^\/star/, '') || '/';
  const filePath = path.join(STAR_OFFICE_PATH, 'frontend', url);
  
  if (url === '/' || !url.includes('.')) {
    serveFile(path.join(STAR_OFFICE_PATH, 'frontend', 'index.html'), res);
    return;
  }
  
  serveFile(filePath, res);
}

function serveDashboard(req, res) {
  serveFile(DASHBOARD_PATH, res);
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  
  // 健康检查
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'dashboard', time: new Date().toISOString() }));
    return;
  }
  
  // 状态 API
  if (url === '/api/status') {
    apiCalls++;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = uptime % 60;
    const uptimeStr = `${hours}h ${mins}m ${secs}s`;
    
    // 获取内存使用情况
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    
    // 获取CPU使用率（简单估算）
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuPercent = Math.round((1 - totalIdle / totalTick) * 100);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      uptime: uptimeStr,
      memory: `${Math.round(usedMem / 1024 / 1024)}MB`,
      memoryPercent: memPercent,
      cpuPercent: cpuPercent,
      sessions: '1',
      apiCalls: apiCalls,
      taskCount: taskCount,
      chatCount: chatCount,
      gateway: true,
      status: 'idle',
      statusHistory: statusHistory.slice(-10)
    }));
    return;
  }
  
  // EvoMap 节点状态缓存
let evomapStatus = null;
let evomapStatusTime = 0;
const EVOMAP_CACHE_TIME = 60000; // 1分钟缓存

async function fetchEvomapStatus() {
  if (evomapStatus && (Date.now() - evomapStatusTime) < EVOMAP_CACHE_TIME) {
    return evomapStatus;
  }
  
  try {
    const https = require('https');
    const nodeId = 'node_6de4354b';
    
    return new Promise((resolve) => {
      https.get(`https://evomap.ai/a2a/nodes/${nodeId}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            evomapStatus = JSON.parse(data);
            evomapStatusTime = Date.now();
            resolve(evomapStatus);
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  } catch (e) {
    return null;
  }
}

// Dashboard API (simplified for frontend)
  if (url === '/api/dashboard') {
    apiCalls++;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const uptimeStr = hours > 0 ? `${hours}h` : '<1h';
    
    const now = new Date();
    const heartbeat = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    // 同步获取 EvoMap 状态
    const evomap = await fetchEvomapStatus();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      heartbeat: heartbeat,
      msgCount: chatCount,
      taskDone: taskCount,
      uptime: uptimeStr,
      currentTask: '',
      evomap: evomap ? {
        reputation: evomap.reputation_score,
        published: evomap.total_published,
        promoted: evomap.total_promoted,
        online: evomap.online,
        survival: evomap.survival_status
      } : null
    }));
    return;
  }
  
  // 更新任务计数
  if (url.startsWith('/api/task/')) {
    const action = url.split('/')[3];
    if (action === 'complete') taskCount++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ taskCount }));
    return;
  }
  
  // 更新对话计数
  if (url === '/api/chat') {
    chatCount++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ chatCount }));
    return;
  }
  
  // 更新状态
  if (url.startsWith('/api/status/')) {
    const newStatus = url.split('/')[4];
    addStatusHistory(newStatus);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: newStatus, history: statusHistory.slice(-10) }));
    return;
  }
  
  // Star Office UI 代理
  if (url.startsWith('/star') || url.startsWith('/office')) {
    serveStarOffice(req, res);
    return;
  }
  
  // 默认显示看板
  serveDashboard(req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 Dashboard 服务已启动: http://localhost:${PORT}`);
  console.log(`📊 看板: http://localhost:${PORT}/`);
  console.log(`🏢 Star Office: http://localhost:${PORT}/star`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit());
});
