import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const projectRoot = path.resolve('.');
const stagingDir = path.resolve('..', 'muet-point-tracker-deployment');
const desktopZip = 'C:\\Users\\LENOVO\\Desktop\\muet-point-tracker-deployment.zip';
const downloadsDir = 'C:\\Users\\LENOVO\\Downloads';
const downloadsZip = path.join(downloadsDir, 'muet-point-tracker-deployment.zip');

console.log('--- PACKAGING MUET POINT TRACKER DEPLOYMENT ---');
console.log(`Source project: ${projectRoot}`);
console.log(`Staging folder: ${stagingDir}`);

// 1. Clean staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// List of folders and files to include
const foldersToCopy = ['src', 'public', 'server', 'dist', 'scripts', 'docs'];
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html',
  'railway.json',
  'Procfile',
  '.gitignore',
  '.env.example',
  'README.md'
];

function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      copyFolderRecursive(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.log') || entry.name.endsWith('.tmp')) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Copy folders
for (const folder of foldersToCopy) {
  const src = path.join(projectRoot, folder);
  const dest = path.join(stagingDir, folder);
  if (fs.existsSync(src)) {
    console.log(`Copying folder: ${folder}...`);
    copyFolderRecursive(src, dest);
  } else {
    console.warn(`Warning: Folder not found: ${folder}`);
  }
}

// 3. Copy files
for (const file of filesToCopy) {
  const src = path.join(projectRoot, file);
  const dest = path.join(stagingDir, file);
  if (fs.existsSync(src)) {
    console.log(`Copying file: ${file}...`);
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`Warning: File not found: ${file}`);
  }
}

// Ensure .env is NOT in staging
const leakedEnv = path.join(stagingDir, '.env');
if (fs.existsSync(leakedEnv)) {
  fs.unlinkSync(leakedEnv);
  console.log('Removed sensitive .env from staging');
}

console.log('Staging prepared successfully.');

// 4. Create ZIP archive using PowerShell Compress-Archive
console.log('Compressing to ZIP archive...');
if (fs.existsSync(desktopZip)) {
  fs.unlinkSync(desktopZip);
}

const zipCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${desktopZip}' -Force"`;
execSync(zipCmd, { stdio: 'inherit' });

if (fs.existsSync(desktopZip)) {
  const sizeMb = (fs.statSync(desktopZip).size / (1024 * 1024)).toFixed(2);
  console.log(`\n[SUCCESS] Deployment ZIP created on Desktop: ${desktopZip} (${sizeMb} MB)`);
} else {
  console.error('\n[ERROR] Failed to create Desktop ZIP');
}

// Also copy to Downloads if Downloads exists
if (fs.existsSync(downloadsDir)) {
  try {
    fs.copyFileSync(desktopZip, downloadsZip);
    console.log(`[SUCCESS] Copy saved to Downloads: ${downloadsZip}`);
  } catch (err) {
    console.warn('Could not copy to Downloads:', err.message);
  }
}
