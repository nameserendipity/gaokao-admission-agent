import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'admission_clean.db');
const gzPath = `${dbPath}.gz`;

function listGzipParts() {
  if (!fs.existsSync(dataDir)) return [];
  return fs.readdirSync(dataDir)
    .filter(name => /^admission_clean\.db\.gz\.\d{3}$/.test(name))
    .sort()
    .map(name => path.join(dataDir, name));
}

async function concatenateParts(parts, targetPath) {
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  const writer = fs.createWriteStream(targetPath);
  try {
    for (const part of parts) {
      await new Promise((resolve, reject) => {
        const reader = fs.createReadStream(part);
        reader.on('error', reject);
        writer.on('error', reject);
        reader.on('end', resolve);
        reader.pipe(writer, { end: false });
      });
    }
  } finally {
    await new Promise(resolve => writer.end(resolve));
  }
}

async function gunzipFile(sourcePath, targetPath) {
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  await new Promise((resolve, reject) => {
    fs.createReadStream(sourcePath)
      .pipe(zlib.createGunzip())
      .pipe(fs.createWriteStream(targetPath))
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function main() {
  if (fs.existsSync(dbPath)) {
    console.log('admission_clean.db already exists.');
    return;
  }

  if (fs.existsSync(gzPath)) {
    console.log('Extracting data/admission_clean.db.gz...');
    await gunzipFile(gzPath, dbPath);
    console.log('Extracted data/admission_clean.db');
    return;
  }

  const parts = listGzipParts();
  if (parts.length > 0) {
    const tempGzPath = path.join(dataDir, '.admission_clean.db.gz.tmp');
    console.log(`Combining ${parts.length} admission database gzip part(s)...`);
    await concatenateParts(parts, tempGzPath);
    console.log('Extracting combined admission database...');
    try {
      await gunzipFile(tempGzPath, dbPath);
      console.log('Extracted data/admission_clean.db from gzip parts');
    } finally {
      fs.rmSync(tempGzPath, { force: true });
    }
    return;
  }

  console.warn('No data/admission_clean.db, data/admission_clean.db.gz, or data/admission_clean.db.gz.001 parts found. Build will continue, but report generation needs admission data.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
