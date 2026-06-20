import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import type { AdmissionRecord, Province, SubjectCategory } from '@/lib/types';
import type { AdmissionEvidence, KnowledgeSearchInput, KnowledgeSearchResult } from './types';

const DB_PATH = process.env.ADMISSION_DB_PATH || path.join(process.cwd(), 'data', 'admission_clean.db');
const PROVINCE_NAME: Record<Province, string> = { zhejiang: '\u6d59\u6c5f', shandong: '\u5c71\u4e1c' };
const PROVINCE_CODE: Record<string, Province> = { '\u6d59\u6c5f': 'zhejiang', '\u5c71\u4e1c': 'shandong' };

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let databasePromise: Promise<Database> | null = null;

interface AdmissionRow { id: number; province: string; year: number; category: string | null; batch: string | null; school_name: string; major_name: string | null; score: number | null; rank: number | null; quota: number | null; source_file: string | null; }

export function getAdmissionDbPath(): string { return DB_PATH; }
export function hasAdmissionDatabase(): boolean { return fs.existsSync(DB_PATH); }

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: file => resolveSqlJsAsset(file),
    });
  }
  return sqlJsPromise;
}

function resolveSqlJsAsset(file: string): string {
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    path.join(process.cwd(), 'node_modules', '.pnpm', 'sql.js@1.14.1', 'node_modules', 'sql.js', 'dist', file),
  ];
  const found = candidates.find(candidate => fs.existsSync(candidate));
  return found || candidates[0];
}
async function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = (async () => {
      if (!hasAdmissionDatabase()) throw new Error(`\u672c\u5730\u5f55\u53d6\u6570\u636e\u5e93\u4e0d\u5b58\u5728\uff1a${DB_PATH}`);
      const SQL = await getSqlJs();
      return new SQL.Database(fs.readFileSync(DB_PATH));
    })();
  }
  return databasePromise;
}

export async function inspectAdmissionDatabase() {
  const db = await getDatabase();
  const count = selectRows<{ count: number }>(db, 'select count(*) as count from admission')[0]?.count ?? 0;
  const provinces = selectRows<{ province: string; count: number }>(db, 'select province, count(*) as count from admission group by province order by count desc, province');
  const years = selectRows<{ year: number; count: number }>(db, 'select year, count(*) as count from admission group by year order by year desc');
  return { path: DB_PATH, count, provinces, years };
}

export async function searchAdmissionKnowledge(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
  const db = await getDatabase();
  const provinceName = PROVINCE_NAME[input.province];
  const limit = Math.max(20, Math.min(input.limit ?? 160, 300));
  const rankWindow = calculateRankWindow(input.rank);
  const scoreWindow = 80;
  const excludeClause = buildExcludeClause(input.excludedMajors);
  const params: (string | number)[] = [provinceName, input.rank + rankWindow, input.rank - rankWindow, input.score - scoreWindow, input.score + scoreWindow];
  const sql = `select id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from admission where province = ? and rank is not null and score is not null and rank <= ? and rank >= ? and score between ? and ? ${excludeClause.sql} order by year desc, abs(rank - ${Math.round(input.rank)}) asc, abs(score - ${Math.round(input.score)}) asc limit ${limit}`;
  params.push(...excludeClause.params);
  let rows = selectRows<AdmissionRow>(db, sql, params);
  const warnings: string[] = [];
  if (rows.length < 40) {
    warnings.push('\u672c\u5730\u6570\u636e\u5e93\u6309\u4f4d\u6b21\u7a97\u53e3\u547d\u4e2d\u8f83\u5c11\uff0c\u5df2\u6269\u5927\u68c0\u7d22\u8303\u56f4\u3002');
    const broadParams: (string | number)[] = [provinceName, input.score - 120, input.score + 120, ...excludeClause.params];
    rows = selectRows<AdmissionRow>(db, `select id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from admission where province = ? and rank is not null and score is not null and score between ? and ? ${excludeClause.sql} order by year desc, abs(score - ${Math.round(input.score)}) asc, rank asc limit ${limit}`, broadParams);
  }
  if (rows.length < 20) {
    warnings.push('当前省份分数证据不足，已使用位次数据补充匹配。');
    const rankOnlyParams: (string | number)[] = [provinceName, input.rank + rankWindow, input.rank - rankWindow, ...excludeClause.params];
    rows = selectRows<AdmissionRow>(db, `select id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from admission where province = ? and rank is not null and rank <= ? and rank >= ? ${excludeClause.sql} order by year desc, abs(rank - ${Math.round(input.rank)}) asc limit ${limit}`, rankOnlyParams);
  }
  return { records: rows.map(toEvidence).filter(item => subjectRoughlyMatches(item, input.subjectCategory)), source: 'sqlite', warnings };
}

export function evidenceToAdmissionRecord(item: AdmissionEvidence): AdmissionRecord {
  return { id: item.id, universityCode: stableCode(item.schoolName), universityName: item.schoolName, universityLevel: item.schoolLevel, province: item.province, year: item.year, majorName: item.majorName, majorCategory: item.majorCategory, subjectRequirement: item.subjectRequirement, admissionType: 'parallel', lowestScore: item.score, lowestRank: item.rank, averageScore: item.score, highestScore: item.score, dataSource: item.sourceFile || `${item.provinceName}${item.year}\u5e74\u5f55\u53d6\u6570\u636e`, sourceUrl: item.sourceUrl, collectedAt: new Date().toISOString(), batchId: `sqlite-${item.year}`, notes: item.quota ? `\u62db\u751f\u8ba1\u5212\u6570\uff1a${item.quota}` : undefined };
}

function selectRows<T extends object>(db: Database, sql: string, params: (string | number)[] = []): T[] {
  const stmt = db.prepare(sql, params);
  const rows: T[] = [];
  try { while (stmt.step()) rows.push(stmt.getAsObject() as T); } finally { stmt.free(); }
  return rows;
}

function toEvidence(row: AdmissionRow): AdmissionEvidence {
  const province = PROVINCE_CODE[row.province] || 'zhejiang';
  const majorName = row.major_name || '\u672a\u6ce8\u660e\u4e13\u4e1a';
  return { id: `sqlite-${row.id}`, source: 'sqlite', province, provinceName: row.province, year: row.year, category: row.category || '\u672a\u6ce8\u660e\u7c7b\u522b', batch: row.batch || '\u672a\u6ce8\u660e\u6279\u6b21', schoolName: row.school_name, majorName, score: row.score || 0, rank: row.rank || 0, quota: row.quota || undefined, sourceFile: row.source_file || undefined, subjectRequirement: inferSubjectRequirement(row.category || '', majorName), majorCategory: inferMajorCategory(majorName), schoolLevel: inferSchoolLevel(row.school_name) };
}

function calculateRankWindow(rank: number): number { if (rank <= 5000) return 12000; if (rank <= 30000) return 25000; if (rank <= 100000) return 50000; return 90000; }
function buildExcludeClause(excludedMajors: string[]) { const majors = excludedMajors.map(item => item.trim()).filter(Boolean).slice(0, 12); if (majors.length === 0) return { sql: '', params: [] as string[] }; return { sql: majors.map(() => "and coalesce(major_name, '') not like ?").join('\n'), params: majors.map(item => `%${item}%`) }; }

function inferSubjectRequirement(category: string, majorName: string): SubjectCategory[] {
  const text = `${category} ${majorName}`;
  if (/\u7269\u7406|\u5316\u5b66|\u5de5\u79d1|\u8ba1\u7b97\u673a|\u8f6f\u4ef6|\u7535\u5b50|\u7535\u6c14|\u673a\u68b0|\u81ea\u52a8\u5316|\u4eba\u5de5\u667a\u80fd|\u6570\u636e|\u571f\u6728|\u6750\u6599/.test(text)) return ['physics_chemistry'];
  if (/\u533b\u5b66|\u4e34\u5e8a|\u53e3\u8154|\u836f\u5b66|\u751f\u7269|\u62a4\u7406/.test(text)) return ['chemistry_biology', 'physics_chemistry'];
  if (/\u5386\u53f2|\u653f\u6cbb|\u6cd5\u5b66|\u6c49\u8bed\u8a00|\u65b0\u95fb|\u4f20\u64ad|\u82f1\u8bed|\u6587\u5b66|\u54f2\u5b66/.test(text)) return ['history_politics'];
  return ['other', 'physics_history'];
}
function inferMajorCategory(majorName: string): string { if (/\u8ba1\u7b97\u673a|\u8f6f\u4ef6|\u4eba\u5de5\u667a\u80fd|\u7535\u5b50|\u7535\u6c14|\u673a\u68b0|\u81ea\u52a8\u5316|\u571f\u6728|\u6750\u6599|\u4fe1\u606f|\u6570\u636e/.test(majorName)) return '\u5de5\u5b66'; if (/\u533b\u5b66|\u4e34\u5e8a|\u53e3\u8154|\u836f\u5b66|\u62a4\u7406|\u9884\u9632/.test(majorName)) return '\u533b\u5b66'; if (/\u6570\u5b66|\u7269\u7406|\u5316\u5b66|\u751f\u7269|\u7edf\u8ba1|\u5fc3\u7406/.test(majorName)) return '\u7406\u5b66'; if (/\u6cd5\u5b66|\u653f\u6cbb|\u77e5\u8bc6\u4ea7\u6743/.test(majorName)) return '\u6cd5\u5b66'; if (/\u7ecf\u6d4e|\u91d1\u878d|\u8d38\u6613/.test(majorName)) return '\u7ecf\u6d4e\u5b66'; if (/\u7ba1\u7406|\u4f1a\u8ba1|\u8d22\u52a1|\u5de5\u5546/.test(majorName)) return '\u7ba1\u7406\u5b66'; if (/\u5e08\u8303|\u6559\u80b2/.test(majorName)) return '\u6559\u80b2\u5b66'; if (/\u6587\u5b66|\u6c49\u8bed\u8a00|\u65b0\u95fb|\u4f20\u64ad|\u82f1\u8bed|\u5916\u8bed/.test(majorName)) return '\u6587\u5b66'; if (/\u519c\u5b66|\u56ed\u827a|\u52a8\u7269/.test(majorName)) return '\u519c\u5b66'; return '\u7efc\u5408'; }
function inferSchoolLevel(schoolName: string): AdmissionEvidence['schoolLevel'] { const level985 = ['\u6e05\u534e\u5927\u5b66', '\u5317\u4eac\u5927\u5b66', '\u6d59\u6c5f\u5927\u5b66', '\u590d\u65e6\u5927\u5b66', '\u4e0a\u6d77\u4ea4\u901a\u5927\u5b66', '\u5357\u4eac\u5927\u5b66', '\u5c71\u4e1c\u5927\u5b66', '\u4e2d\u56fd\u6d77\u6d0b\u5927\u5b66']; const level211 = ['\u5317\u4eac\u90ae\u7535\u5927\u5b66', '\u4e0a\u6d77\u8d22\u7ecf\u5927\u5b66', '\u4e2d\u592e\u8d22\u7ecf\u5927\u5b66', '\u4e2d\u56fd\u653f\u6cd5\u5927\u5b66', '\u5357\u4eac\u7406\u5de5\u5927\u5b66', '\u82cf\u5dde\u5927\u5b66']; if (level985.some(name => schoolName.includes(name))) return '985'; if (level211.some(name => schoolName.includes(name))) return '211'; if (/\u5927\u5b66|\u5b66\u9662/.test(schoolName)) return 'ordinary'; return 'vocational'; }
function subjectRoughlyMatches(item: AdmissionEvidence, subject: SubjectCategory): boolean { if (subject === 'other') return true; return item.subjectRequirement.includes(subject) || item.subjectRequirement.includes('other') || item.subjectRequirement.includes('physics_history'); }
function stableCode(value: string): string { let hash = 0; for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return `sch-${hash.toString(16)}`; }
