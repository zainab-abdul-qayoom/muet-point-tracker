import fs from 'node:fs';
import path from 'node:path';

const projectDir = process.cwd();
const backupDir = 'C:/Users/LENOVO/.gemini/antigravity/scratch/backups_muet_point_tracker';

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const dbSrc = path.join(projectDir, 'muet_tracker.sqlite');
const dbDest1 = path.join(backupDir, 'muet_tracker_verified_backup.sqlite');
const dbDestTimestamp = path.join(backupDir, 'muet_tracker_' + Date.now() + '.sqlite');

if (fs.existsSync(dbSrc)) {
  fs.copyFileSync(dbSrc, dbDest1);
  fs.copyFileSync(dbSrc, dbDestTimestamp);
  console.log('✓ Successfully backed up SQLite database:');
  console.log('  Source:', dbSrc);
  console.log('  Destination 1:', dbDest1, '(' + fs.statSync(dbDest1).size + ' bytes)');
  console.log('  Destination 2:', dbDestTimestamp);
} else {
  console.error('Source database not found:', dbSrc);
}
