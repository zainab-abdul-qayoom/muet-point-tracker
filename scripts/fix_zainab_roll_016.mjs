import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
const db = new DatabaseSync(path.resolve('muet_tracker.sqlite'));
console.log('Before:');
const before = db.prepare("SELECT id, name, roll_no FROM users WHERE id = 'usr-01'").get();
console.log(before);
// Update to 25BSCS016
const result = db.prepare("UPDATE users SET roll_no = '25BSCS016' WHERE id = 'usr-01'").run();
console.log('Updated rows:', result.changes);
const after = db.prepare("SELECT id, name, roll_no FROM users WHERE id = 'usr-01'").get();
console.log('Zainab after update:', after);
db.close();
