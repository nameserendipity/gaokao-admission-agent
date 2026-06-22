import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

interface CountRow {
  count: number;
}

interface ProvinceRow {
  province: string;
  count: number;
  min_year: number;
  max_year: number;
  missing_rank: number;
  missing_score: number;
  source_files: number;
}

interface SourceRow {
  province: string;
  source_file: string | null;
  count: number;
}

function numberArg(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const raw = process.argv.find(arg => arg.startsWith(prefix));
  if (!raw) return fallback;
  const value = Number(raw.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

async function main() {
  const dbPath = process.env.ADMISSION_DB_PATH || path.join(process.cwd(), 'data', 'admission_clean.db');
  if (!fs.existsSync(dbPath)) throw new Error(`本地录取数据库不存在：${dbPath}`);

  const SQL = await initSqlJs({
    locateFile: file => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const topSources = Math.max(1, Math.min(numberArg('top-sources', 3), 20));

  const selectRows = <T extends object>(sql: string): T[] => {
    const stmt = db.prepare(sql);
    const rows: T[] = [];
    try {
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
    } finally {
      stmt.free();
    }
    return rows;
  };

  const count = selectRows<CountRow>('select count(*) as count from admission')[0]?.count ?? 0;
  const provinces = selectRows<ProvinceRow>(`
    select province,
           count(*) as count,
           min(year) as min_year,
           max(year) as max_year,
           sum(case when rank is null or rank <= 0 then 1 else 0 end) as missing_rank,
           sum(case when score is null or score <= 0 then 1 else 0 end) as missing_score,
           count(distinct source_file) as source_files
      from admission
     group by province
     order by count desc, province
  `);
  const sources = selectRows<SourceRow>(`
    select province, source_file, count(*) as count
      from admission
     group by province, source_file
     order by province, count desc
  `);

  console.log(`数据库：${dbPath}`);
  console.log(`录取记录总数：${count}`);
  console.log('');
  console.log('| 省份 | 记录数 | 年份 | 缺位次 | 缺分数 | 来源文件 | 质量 |');
  console.log('| --- | ---: | --- | ---: | ---: | ---: | --- |');
  for (const province of provinces) {
    const quality = province.count >= 20000 ? 'A' : province.count >= 3000 ? 'B' : 'C';
    console.log(`| ${province.province} | ${province.count} | ${province.min_year}-${province.max_year} | ${province.missing_rank} | ${province.missing_score} | ${province.source_files} | ${quality} |`);
  }

  console.log('');
  console.log(`每省 Top ${topSources} 来源文件：`);
  for (const province of provinces) {
    const top = sources.filter(source => source.province === province.province).slice(0, topSources);
    console.log(`- ${province.province}: ${top.map(source => `${source.source_file || '未知来源'}（${source.count}）`).join('；')}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
