const { spawn } = require('child_process');

console.log('\n======================================================');
console.log('   BOOTING EXPENSEPILOT DEV STACK CONCURRENTLY        ');
console.log('======================================================\n');

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
  backend.kill();
  frontend.kill();
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
