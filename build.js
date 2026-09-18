const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Build] Installing frontend dependencies...');
execSync('npm --prefix frontend install --include=dev', { stdio: 'inherit' });

console.log('[Build] Building production bundle with Vite...');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'dist');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log('[Build] Synchronized frontend/dist to root dist successfully.');
}
