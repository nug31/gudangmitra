/**
 * Test Frontend Development Server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Testing Frontend Development Server');
console.log('Current directory:', __dirname);

// Check if node_modules exists
import fs from 'fs';
const nodeModulesPath = join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules found');
} else {
  console.log('❌ node_modules not found - run npm install');
  process.exit(1);
}

// Check if vite exists
const vitePath = join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
if (fs.existsSync(vitePath)) {
  console.log('✅ Vite found');
} else {
  console.log('❌ Vite not found');
  process.exit(1);
}

// Start Vite with explicit configuration
console.log('🚀 Starting Vite development server...');

const viteProcess = spawn('node', [vitePath, '--port', '5175', '--host'], {
  cwd: __dirname,
  stdio: 'inherit'
});

viteProcess.on('error', (error) => {
  console.error('❌ Error starting Vite:', error);
});

viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Vite...');
  viteProcess.kill();
  process.exit(0);
});
