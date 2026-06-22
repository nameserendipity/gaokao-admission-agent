import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

interface CsvRecord {
  province: string;
  year: string;
  category?: string;
  batch?: string;
  school_name: string;
  major_name?: string;
  score?: string;
  rank?: string;
  quota?: string;
  source_file?: string;
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCsv(filePath: string): CsvRecord[] {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] || '');
  const required = ['province', 'year', 'school_name'];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length > 0) throw new Error(`CSV 缺少必要列：${missing.join(', ')}`);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])) as unknown as CsvRecord;
  });
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d.-]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

async function main() {
  const csvPath = getArg('csv');
  if (!csvPath) throw new Error('请传入 --csv=path/to/admission.csv');
  const dbPath = getArg('db') || path.join(process.cwd(), 'data', 'admission_clean.db');
  const dryRun = process.argv.includes('--dry-run');
  if (!fs.existsSync(csvPath)) throw new Error(`CSV 文件不存在：${csvPath}`);
  if (!fs.existsSync(dbPath)) throw new Error(`SQLite 数据库不存在：${dbPath}`);

  const records = parseCsv(csvPath);
  const invalid = records.filter(record => !record.province || !record.year || !record.school_name);
  if (invalid.length > 0) throw new Error(`存在 ${invalid.length} 条缺少 province/year/school_name 的记录`);

  console.log(`CSV 记录：${records.length}`);
  if (dryRun) {
    const byProvince = records.reduce<Record<string, number>>((acc, record) => {
      acc[record.province] = (acc[record.province] || 0) + 1;
      return acc;
    }, {});
    console.log('dry-run 通过，未写入数据库。');
    console.log(JSON.stringify(byProvince, null, 2));
    return;
  }

  const SQL = await initSqlJs({
    locateFile: file => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const db = new SQL.Database(fs.readFileSync(dbPath));
  db.run('begin transaction');
  const stmt = db.prepare(`
    insert into admission (province, year, category, batch, school_name, major_name, score, rank, quota, source_file)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  try {
    for (const record of records) {
      stmt.run([
        record.province,
        Number(record.year),
        record.category || null,
        record.batch || null,
        record.school_name,
        record.major_name || null,
        toNumber(record.score),
        toNumber(record.rank),
        toNumber(record.quota),
        record.source_file || path.basename(csvPath),
      ]);
    }
  } finally {
    stmt.free();
  }
  db.run('commit');
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log(`已写入 ${records.length} 条记录到 ${dbPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
