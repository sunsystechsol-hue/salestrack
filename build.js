const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Build] Installing frontend dependencies and building production bundle...');
execSync('npm --prefix frontend install', { stdio: 'inherit' });
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'dist');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log('[Build] Synchronized frontend/dist to root dist successfully.');
}
