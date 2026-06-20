
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dbPath = path.join(process.cwd(), 'data', 'admission_clean.db');
const gzPath = `${dbPath}.gz`;

if (fs.existsSync(dbPath)) {
  console.log('admission_clean.db already exists.');
  process.exit(0);
}

if (!fs.existsSync(gzPath)) {
  console.warn('No data/admission_clean.db or data/admission_clean.db.gz found. Build will continue, but report generation needs admission data.');
  process.exit(0);
}

console.log('Extracting data/admission_clean.db.gz...');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.createReadStream(gzPath)
  .pipe(zlib.createGunzip())
  .pipe(fs.createWriteStream(dbPath))
  .on('finish', () => console.log('Extracted data/admission_clean.db'))
  .on('error', error => {
    console.error(error);
    process.exit(1);
  });
