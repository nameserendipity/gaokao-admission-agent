import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
const checkTables = process.argv.includes('--tables');

if (!connectionString) {
  console.error('缺少数据库连接串：请在 .env.local 或环境变量中设置 DATABASE_URL、POSTGRES_URL 或 SUPABASE_DB_URL。');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    const info = await client.query<{ database: string; user_name: string; server_time: string }>(
      `select current_database() as database, current_user as user_name, now()::text as server_time`,
    );
    const row = info.rows[0];
    console.log(`数据库连接成功：database=${row.database}, user=${row.user_name}, time=${row.server_time}`);

    if (checkTables) {
      const tables = ['data_sources', 'universities', 'majors', 'admission_records', 'reports', 'report_messages'];
      const result = await client.query<{ table_name: string; row_count: string }>(
        `select t.table_name,
                coalesce(s.n_live_tup, 0)::text as row_count
           from unnest($1::text[]) as t(table_name)
           left join pg_stat_user_tables s on s.relname = t.table_name
          order by array_position($1::text[], t.table_name)`,
        [tables],
      );
      const existing = new Set(result.rows.filter(item => item.row_count !== '0' || tables.includes(item.table_name)).map(item => item.table_name));
      console.log('目标表检查：');
      for (const table of tables) {
        const found = result.rows.find(item => item.table_name === table);
        const existsResult = await client.query<{ exists: boolean }>(
          `select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = $1)`,
          [table],
        );
        const status = existsResult.rows[0]?.exists ? `存在，估算行数 ${found?.row_count ?? '0'}` : '不存在，请先运行 pnpm db:push';
        console.log(`- ${table}: ${status}`);
      }
      void existing;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('数据库连接检查失败：');
  console.error(error);
  process.exit(1);
});
