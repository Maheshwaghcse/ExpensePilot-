const { spawn, execSync } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('   BOOTING EXPENSEPILOT DEV STACK CONCURRENTLY        ');
console.log('======================================================\n');

const checkMongoRunning = () => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(27017, '127.0.0.1');
  });
};

const ensureMongoStarted = async () => {
  const isRunning = await checkMongoRunning();
  if (isRunning) {
    console.log('[Runner] MongoDB daemon is already running on port 27017.');
    return null;
  }

  const mongodPaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe'
  ];

  let foundPath = mongodPaths.find(p => fs.existsSync(p));
  if (foundPath) {
    const dbDir = path.join(__dirname, 'backend', 'data', 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    console.log('[Runner] Launching local MongoDB daemon (mongod.exe)...');
    const mongodProc = spawn(foundPath, ['--dbpath', dbDir], { stdio: 'ignore' });
    // Give mongo 2 seconds to initialize
    await new Promise(r => setTimeout(r, 2000));
    return mongodProc;
  } else {
    console.log('[Runner] Local mongod.exe binary not found at standard path. Backend will use MongoMemoryServer fallback.');
    return null;
  }
};

(async () => {
  const mongodProc = await ensureMongoStarted();

  // 1. Start Backend API
  console.log('[Runner] Launching Express Backend Server (Port 5000)...');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: './backend',
    shell: true,
    stdio: 'inherit'
  });

  // 2. Start Frontend Client
  console.log('[Runner] Launching React Vite Dev Server (Port 5173)...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: './frontend',
    shell: true,
    stdio: 'inherit'
  });

  // 3. Graceful Shutdown handlers
  const terminateServices = () => {
    console.log('\n[Runner] Stopping all dev stack processes...');
    if (backend) backend.kill();
    if (frontend) frontend.kill();
    if (mongodProc) mongodProc.kill();
    process.exit(0);
  };

  process.on('SIGINT', terminateServices);
  process.on('SIGTERM', terminateServices);

  backend.on('exit', (code) => {
    console.log(`[Runner] Backend process exited with code ${code}`);
  });

  frontend.on('exit', (code) => {
    console.log(`[Runner] Frontend process exited with code ${code}`);
  });
})();

