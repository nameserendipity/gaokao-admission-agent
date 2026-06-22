import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import type { AdmissionRecord, Province, SubjectCategory } from '@/lib/types';
import { getProvinceMeta, isProvince, PROVINCES } from '@/lib/provinces';
import type { AdmissionEvidence, KnowledgeSearchInput, KnowledgeSearchResult } from './types';
import { inferSubjectCategoriesFromRequirement, isAdmissionRequirementAllowedForSubject, isMajorAllowedForSubject, SUBJECT_COMBINATIONS } from '@/lib/subject-rules';

const DB_PATH = process.env.ADMISSION_DB_PATH || path.join(process.cwd(), 'data', 'admission_clean.db');
const PROVINCE_NAME: Record<Province, string> = Object.fromEntries(PROVINCES.map(province => [province.value, province.dbName])) as Record<Province, string>;
const PROVINCE_CODE: Record<string, Province> = Object.fromEntries(PROVINCES.map(province => [province.dbName, province.value])) as Record<string, Province>;

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let databasePromise: Promise<Database> | null = null;

interface AdmissionRow { id: number; province: string; year: number; category: string | null; batch: string | null; school_name: string; major_name: string | null; score: number | null; rank: number | null; quota: number | null; source_file: string | null; }
export interface ArtSportsAdmissionRow {
  id: number;
  province: string;
  year: number;
  batch: string;
  candidate_type: 'art' | 'sports';
  category: string;
  school_code: string | null;
  school_name: string;
  group_code: string;
  group_name: string | null;
  filing_score: number;
  filing_rank: number | null;
  source_file: string | null;
}

export interface ArtSportsAdmission {
  id: number;
  year: number;
  batch: string;
  candidateType: 'art' | 'sports';
  category: string;
  schoolCode: string | null;
  schoolName: string;
  groupCode: string;
  groupName: string | null;
  filingScore: number;
  filingRank: number | null;
  sourceFile: string | null;
}

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
      if (!hasAdmissionDatabase()) throw new Error(`本地录取数据库不存在：${DB_PATH}`);
      const SQL = await getSqlJs();
      return new SQL.Database(fs.readFileSync(DB_PATH));
    })();
  }
  return databasePromise;
}

export async function inspectAdmissionDatabase() {
  const db = await getDatabase();
  const count = selectRows<{ count: number }>(db, 'select count(*) as count from admission')[0]?.count ?? 0;
  const searchTable = getAdmissionSearchTable(db);
  const searchCount = selectRows<{ count: number }>(db, `select count(*) as count from ${searchTable}`)[0]?.count ?? 0;
  const provinces = selectRows<{ province: string; count: number }>(db, 'select province, count(*) as count from admission group by province order by count desc, province');
  const years = selectRows<{ year: number; count: number }>(db, 'select year, count(*) as count from admission group by year order by year desc');
  return { path: DB_PATH, count, searchTable, searchCount, provinces, years };
}


export async function searchAdmissionKnowledge(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
  const db = await getDatabase();
  const searchTable = getAdmissionSearchTable(db);
  const idColumn = searchTable === 'recommendation_records' ? 'admission_id' : 'id';
  const selectColumns = `${idColumn} as id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file`;
  const provinceName = PROVINCE_NAME[input.province];
  if (!provinceName) throw new Error(`\u6682\u4e0d\u652f\u6301\u8be5\u7701\u4efd\uff1a${input.province}`);
  const limit = Math.max(20, Math.min(input.limit ?? 160, 800));
  const queryLimit = Math.min(2400, Math.max(limit * 8, limit));
  const hasReliableRank = input.rank > 0;
  const rankWindow = hasReliableRank ? calculateRankWindow(input.rank) : 0;
  const scoreWindow = 80;
  const excludeClause = buildExcludeClause(input.excludedMajors);
  const primaryOrder = input.balancedYears
    ? `case when rank is not null and rank > 0 then abs(rank - ${Math.round(input.rank)}) else 999999999 end asc, case when score is not null and score > 0 then abs(score - ${Math.round(input.score)}) else 999999999 end asc, year desc`
    : `year desc, case when rank is not null and rank > 0 then abs(rank - ${Math.round(input.rank)}) else 999999999 end asc, case when score is not null and score > 0 then abs(score - ${Math.round(input.score)}) else 999999999 end asc`;
  const scoreOrder = input.balancedYears
    ? `abs(score - ${Math.round(input.score)}) asc, year desc, case when rank is null or rank <= 0 then 1 else 0 end, rank asc`
    : `year desc, abs(score - ${Math.round(input.score)}) asc, case when rank is null or rank <= 0 then 1 else 0 end, rank asc`;
  const rankOrder = input.balancedYears
    ? `abs(rank - ${Math.round(input.rank)}) asc, year desc`
    : `year desc, abs(rank - ${Math.round(input.rank)}) asc`;
  const params: (string | number)[] = hasReliableRank
    ? [provinceName, input.rank + rankWindow, input.rank - rankWindow, input.score - scoreWindow, input.score + scoreWindow]
    : [provinceName, input.score - scoreWindow, input.score + scoreWindow];
  const sql = hasReliableRank
    ? `select ${selectColumns} from ${searchTable} where province = ? and ((rank is not null and rank > 0 and rank <= ? and rank >= ?) or (score is not null and score > 0 and score between ? and ?)) ${excludeClause.sql} order by ${primaryOrder} limit ${queryLimit}`
    : `select ${selectColumns} from ${searchTable} where province = ? and score is not null and score > 0 and score between ? and ? ${excludeClause.sql} order by ${scoreOrder} limit ${queryLimit}`;
  params.push(...excludeClause.params);
  let rows = selectRows<AdmissionRow>(db, sql, params);
  const warnings: string[] = [];
  if (rows.length < 40) {
    warnings.push('\u672c\u5730\u6570\u636e\u5e93\u6309\u5f53\u524d\u7a97\u53e3\u547d\u4e2d\u8f83\u5c11\uff0c\u5df2\u6269\u5927\u68c0\u7d22\u8303\u56f4\u3002');
    const broadParams: (string | number)[] = [provinceName, input.score - 120, input.score + 120, ...excludeClause.params];
    rows = selectRows<AdmissionRow>(db, `select ${selectColumns} from ${searchTable} where province = ? and score is not null and score > 0 and score between ? and ? ${excludeClause.sql} order by ${scoreOrder} limit ${queryLimit}`, broadParams);
  }
  if (hasReliableRank && rows.length < 20) {
    warnings.push('\u5f53\u524d\u7701\u4efd\u5206\u6570\u8bc1\u636e\u4e0d\u8db3\uff0c\u5df2\u4f7f\u7528\u4f4d\u6b21\u6570\u636e\u8865\u5145\u5339\u914d\u3002');
    const rankOnlyParams: (string | number)[] = [provinceName, input.rank + rankWindow, input.rank - rankWindow, ...excludeClause.params];
    rows = selectRows<AdmissionRow>(db, `select ${selectColumns} from ${searchTable} where province = ? and rank is not null and rank <= ? and rank >= ? ${excludeClause.sql} order by ${rankOrder} limit ${queryLimit}`, rankOnlyParams);
  }
  if (rows.length > 0 && rows.every(row => !row.rank || row.rank <= 0)) warnings.push('\u5f53\u524d\u7701\u4efd\u539f\u59cb\u6570\u636e\u7f3a\u5c11\u4f4d\u6b21\u5b57\u6bb5\uff0c\u672c\u6b21\u4f18\u5148\u6309\u5206\u6570\u5dee\u5339\u914d\uff1b\u5efa\u8bae\u7ed3\u5408\u5b98\u65b9\u4e00\u5206\u4e00\u6bb5\u8868\u590d\u6838\u3002');
  if (rows.length > 0 && rows.every(row => !row.score || row.score <= 0)) warnings.push('\u5f53\u524d\u7701\u4efd\u539f\u59cb\u6570\u636e\u7f3a\u5c11\u5206\u6570\u5b57\u6bb5\uff0c\u62a5\u544a\u5c06\u4f18\u5148\u4f7f\u7528\u4f4d\u6b21\u8bc1\u636e\u3002');
  if (!hasReliableRank) warnings.push('\u672a\u586b\u5199\u4f4d\u6b21\uff0c\u7cfb\u7edf\u672a\u4f7f\u7528\u7c97\u7565\u516c\u5f0f\u4f30\u7b97\uff1b\u672c\u6b21\u4f18\u5148\u6309\u540c\u7701\u540c\u9009\u79d1\u5206\u6570\u7a97\u53e3\u5339\u914d\u3002');
  const records = rows.map(row => toEvidence(row, input)).filter(item => subjectRoughlyMatches(item, input.subjectCategory)).slice(0, limit);
  return { records, source: 'sqlite', warnings };
}

export async function estimateRankFromAdmissionDb(input: Pick<KnowledgeSearchInput, 'province' | 'score' | 'subjectCategory'>): Promise<number | null> {
  const db = await getDatabase();
  const searchTable = getAdmissionSearchTable(db);
  const idColumn = searchTable === 'recommendation_records' ? 'admission_id' : 'id';
  const selectColumns = `${idColumn} as id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file`;
  const provinceName = PROVINCE_NAME[input.province];
  if (!provinceName) return null;
  const windows = [10, 20, 40, 80];
  for (const scoreWindow of windows) {
    const rows = selectRows<AdmissionRow>(
      db,
      `select ${selectColumns} from ${searchTable} where province = ? and score is not null and rank is not null and rank > 0 and score between ? and ? order by abs(score - ?) asc, year desc limit 1200`,
      [provinceName, input.score - scoreWindow, input.score + scoreWindow, input.score],
    );
    const ranks = rows
      .map(row => toEvidence(row, { province: input.province, score: input.score, rank: 0, subjectCategory: input.subjectCategory, preferredMajors: [], excludedMajors: [], limit: 1200 }))
      .filter(item => subjectRoughlyMatches(item, input.subjectCategory))
      .map(item => item.rank)
      .filter(rank => rank > 0)
      .sort((a, b) => a - b);
    if (ranks.length >= 3) return ranks[Math.floor(ranks.length / 2)];
    if (ranks.length > 0 && scoreWindow >= 40) return ranks[Math.floor(ranks.length / 2)];
  }
  return null;
}

export async function searchArtSportsAdmissions(input: {
  candidateType: 'art' | 'sports';
  category?: string;
  compositeScore: number;
  limit?: number;
}): Promise<{ records: ArtSportsAdmission[]; warnings: string[] }> {
  const db = await getArtSportsDatabase();
  const tableExists = hasTable(db, 'art_sports_admission');
  if (!tableExists) throw new Error('本地数据库缺少 art_sports_admission 艺体投档表。');

  const limit = Math.max(20, Math.min(input.limit ?? 120, 300));
  const score = input.compositeScore;
  const params: (string | number)[] = [input.candidateType];
  let where = "province = '江西' and candidate_type = ?";
  if (input.category && input.candidateType === 'art') {
    where += ' and category = ?';
    params.push(input.category);
  }
  const warnings: string[] = [];
  let rows = selectRows<ArtSportsAdmissionRow>(
    db,
    `select id, province, year, batch, candidate_type, category, school_code, school_name, group_code, group_name, filing_score, filing_rank, source_file
     from art_sports_admission
     where ${where} and filing_score between ? and ?
     order by year desc, abs(filing_score - ?) asc, filing_score desc
     limit ${limit}`,
    [...params, score - 35, score + 35, score],
  );
  if (rows.length < 20) {
    warnings.push('按当前综合分窗口命中较少，已扩大艺体投档线检索范围。');
    rows = selectRows<ArtSportsAdmissionRow>(
      db,
      `select id, province, year, batch, candidate_type, category, school_code, school_name, group_code, group_name, filing_score, filing_rank, source_file
       from art_sports_admission
       where ${where}
       order by year desc, abs(filing_score - ?) asc, filing_score desc
       limit ${limit}`,
      [...params, score],
    );
  }
  if (rows.length === 0 && input.category && input.candidateType === 'art') {
    warnings.push('所选艺术类别未精确命中本地类别名称，已放宽为艺术类全类别匹配。');
    rows = selectRows<ArtSportsAdmissionRow>(
      db,
      `select id, province, year, batch, candidate_type, category, school_code, school_name, group_code, group_name, filing_score, filing_rank, source_file
       from art_sports_admission
       where province = '江西' and candidate_type = ?
       order by year desc, abs(filing_score - ?) asc, filing_score desc
       limit ${limit}`,
      [input.candidateType, score],
    );
  }
  return {
    records: rows.map(row => ({
      id: row.id,
      year: row.year,
      batch: row.batch,
      candidateType: row.candidate_type,
      category: row.category,
      schoolCode: row.school_code,
      schoolName: row.school_name,
      groupCode: row.group_code,
      groupName: row.group_name,
      filingScore: row.filing_score,
      filingRank: row.filing_rank,
      sourceFile: row.source_file,
    })),
    warnings,
  };
}

async function getArtSportsDatabase(): Promise<Database> {
  const primary = await getDatabase();
  if (hasTable(primary, 'art_sports_admission')) return primary;
  const fallbackPath = path.join(process.cwd(), 'data', 'admission_clean.db');
  if (path.resolve(fallbackPath) === path.resolve(DB_PATH) || !fs.existsSync(fallbackPath)) return primary;
  const SQL = await getSqlJs();
  return new SQL.Database(fs.readFileSync(fallbackPath));
}

function hasTable(db: Database, tableName: string): boolean {
  return selectRows<{ name: string }>(
    db,
    "select name from sqlite_master where type = 'table' and name = ? limit 1",
    [tableName],
  ).length > 0;
}


export interface AdmissionTrendRecord {
  year: number;
  category: string | null;
  batch: string | null;
  schoolName: string;
  majorName: string | null;
  score: number | null;
  rank: number | null;
  quota: number | null;
  sourceFile: string | null;
}

export interface AdmissionTrendLookupResult {
  schoolName: string;
  majorKeyword: string;
  records: AdmissionTrendRecord[];
  trend: {
    yearsCovered: number[];
    rankDirection: 'rising' | 'falling' | 'stable' | 'volatile' | 'insufficient';
    scoreDirection: 'rising' | 'falling' | 'stable' | 'volatile' | 'insufficient';
    summary: string;
  };
}

export async function lookupAdmissionTrend(input: {
  province: Province;
  schoolName: string;
  majorName?: string;
  category?: string;
  years?: number[];
  limitPerYear?: number;
}): Promise<AdmissionTrendLookupResult> {
  const db = await getDatabase();
  const searchTable = getAdmissionSearchTable(db);
  const provinceName = PROVINCE_NAME[input.province];
  const years = (input.years && input.years.length > 0 ? input.years : [2023, 2024, 2025]).sort((a, b) => b - a);
  const limitPerYear = Math.max(1, Math.min(input.limitPerYear ?? 3, 8));
  const majorKeyword = extractMajorKeyword(input.majorName || '');
  const category = normalizeCategoryKeyword(input.category || '');
  const records: AdmissionTrendRecord[] = [];

  for (const year of years) {
    const params: (string | number)[] = [provinceName, input.schoolName, year];
    let where = 'province = ? and school_name = ? and year = ?';
    if (majorKeyword) {
      where += ' and coalesce(major_name, \'\') like ?';
      params.push(`%${majorKeyword}%`);
    }
    if (category) {
      where += ' and coalesce(category, \'\') like ?';
      params.push(`%${category}%`);
    }
    let rows = selectRows<AdmissionRow>(db, `select ${searchTable === 'recommendation_records' ? 'admission_id' : 'id'} as id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from ${searchTable} where ${where} order by case when rank is null or rank <= 0 then 1 else 0 end, rank asc, score desc limit ${limitPerYear}`, params);
    if (rows.length === 0 && majorKeyword) {
      const fallbackParams: (string | number)[] = [provinceName, input.schoolName, year];
      rows = selectRows<AdmissionRow>(db, `select ${searchTable === 'recommendation_records' ? 'admission_id' : 'id'} as id, province, year, category, batch, school_name, major_name, score, rank, quota, source_file from ${searchTable} where province = ? and school_name = ? and year = ? order by case when rank is null or rank <= 0 then 1 else 0 end, rank asc, score desc limit ${limitPerYear}`, fallbackParams);
    }
    records.push(...rows.map(row => ({
      year: row.year,
      category: row.category,
      batch: row.batch,
      schoolName: row.school_name,
      majorName: row.major_name,
      score: row.score,
      rank: row.rank,
      quota: row.quota,
      sourceFile: row.source_file,
    })));
  }

  return {
    schoolName: input.schoolName,
    majorKeyword,
    records,
    trend: buildTrendSummary(records),
  };
}

function extractMajorKeyword(majorName: string): string {
  const first = majorName.split('|')[0]?.trim() || majorName.trim();
  const cleaned = first.replace(/[（(].*?[）)]/g, '').replace(/\d{2,3}\s*人/g, '').trim();
  const known = ['计算机', '软件工程', '电子信息', '自动化', '人工智能', '数据科学', '临床医学', '口腔医学', '法学', '金融', '会计', '师范', '汉语言'];
  return known.find(item => cleaned.includes(item)) || cleaned.slice(0, 12);
}

function normalizeCategoryKeyword(category: string): string {
  if (/物理|理科|综合改革|普通类/.test(category)) return category.includes('理科') ? '理科' : category.includes('物理') ? '物理' : '普通类';
  if (/历史|文科/.test(category)) return category.includes('文科') ? '文科' : '历史';
  return category;
}

function buildTrendSummary(records: AdmissionTrendRecord[]): AdmissionTrendLookupResult['trend'] {
  const byYear = new Map<number, AdmissionTrendRecord[]>();
  for (const record of records) {
    const list = byYear.get(record.year) || [];
    list.push(record);
    byYear.set(record.year, list);
  }
  const yearly = [...byYear.entries()].map(([year, list]) => {
    const ranked = list.filter(item => item.rank && item.rank > 0).sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const scored = list.filter(item => item.score && item.score > 0).sort((a, b) => (b.score || 0) - (a.score || 0));
    return { year, rank: ranked[0]?.rank || null, score: scored[0]?.score || null };
  }).sort((a, b) => a.year - b.year);
  const yearsCovered = yearly.map(item => item.year);
  const rankDirection = judgeDirection(yearly.map(item => item.rank), true);
  const scoreDirection = judgeDirection(yearly.map(item => item.score), false);
  const summary = summarizeTrend(yearly, rankDirection, scoreDirection);
  return { yearsCovered, rankDirection, scoreDirection, summary };
}

function judgeDirection(values: (number | null)[], lowerIsRising: boolean): 'rising' | 'falling' | 'stable' | 'volatile' | 'insufficient' {
  const valid = values.filter((value): value is number => Boolean(value && value > 0));
  if (valid.length < 2) return 'insufficient';
  const first = valid[0];
  const last = valid[valid.length - 1];
  const change = (last - first) / Math.max(first, 1);
  const rising = lowerIsRising ? change < -0.05 : change > 0.03;
  const falling = lowerIsRising ? change > 0.05 : change < -0.03;
  const diffs = valid.slice(1).map((value, index) => value - valid[index]);
  const hasUp = diffs.some(diff => diff > Math.max(first * 0.03, 500));
  const hasDown = diffs.some(diff => diff < -Math.max(first * 0.03, 500));
  if (hasUp && hasDown) return 'volatile';
  if (rising) return 'rising';
  if (falling) return 'falling';
  return 'stable';
}

function summarizeTrend(yearly: { year: number; rank: number | null; score: number | null }[], rankDirection: string, scoreDirection: string): string {
  if (yearly.length < 2) return '历史记录不足，暂不能形成可靠趋势。';
  const first = yearly[0];
  const last = yearly[yearly.length - 1];
  const rankText = first.rank && last.rank ? `位次从 ${first.rank} 到 ${last.rank}` : '位次数据不完整';
  const scoreText = first.score && last.score ? `分数从 ${first.score} 到 ${last.score}` : '分数数据不完整';
  const directionText: Record<string, string> = { rising: '录取门槛上升', falling: '录取门槛下降', stable: '整体稳定', volatile: '波动较大', insufficient: '样本不足' };
  return `${yearly[0].year}-${last.year}：${rankText}，${scoreText}，综合判断为${directionText[rankDirection] || directionText[scoreDirection] || '样本不足'}。`;
}

export function evidenceToAdmissionRecord(item: AdmissionEvidence): AdmissionRecord {
  const displayMajorName = normalizeDisplayMajorName(item.majorName);
  const notes = [
    item.quota ? `\u62db\u751f\u8ba1\u5212\u6570\uff1a${item.quota}` : undefined,
    displayMajorName !== item.majorName ? `\u539f\u59cb\u4e13\u4e1a\u7ec4\u4fe1\u606f\uff1a${item.majorName}` : undefined,
  ].filter((note): note is string => Boolean(note));
  return { id: item.id, universityCode: stableCode(item.schoolName), universityName: item.schoolName, universityLevel: item.schoolLevel, province: item.province, year: item.year, majorName: displayMajorName, majorCategory: inferMajorCategory(displayMajorName), subjectRequirement: inferSubjectRequirement(item.category, item.majorName, displayMajorName), admissionType: 'parallel', lowestScore: item.score, lowestRank: item.rank, averageScore: item.score, highestScore: item.score, dataSource: item.sourceFile || `${item.provinceName}${item.year}\u5e74\u5f55\u53d6\u6570\u636e`, sourceUrl: item.sourceUrl, collectedAt: new Date().toISOString(), batchId: `sqlite-${item.year}`, notes: notes.length > 0 ? notes.join('\uff1b') : undefined };
}

function normalizeDisplayMajorName(rawMajorName: string): string {
  const raw = rawMajorName.trim();
  if (!raw) return '\u672a\u6ce8\u660e\u4e13\u4e1a';
  const withNormalizedPipes = raw.replace(/[｜]/g, '|').replace(/\s+/g, ' ').trim();
  const containsMatch = withNormalizedPipes.match(/[（(]\s*(?:含|包含|含有)\s*[:：]\s*([^()（）]+)[）)]/);
  if (containsMatch?.[1]) return tidyMajorList(containsMatch[1]);
  const withoutLeadingCodes = withNormalizedPipes
    .replace(/^(?:[A-Z]?\d{1,6}\s*\|\s*){1,5}/i, '')
    .replace(/^\d{1,6}\s+/, '')
    .trim();
  const cleaned = withoutLeadingCodes || withNormalizedPipes;
  if (/^(?:[A-Z]?\d{1,6})(?:\s*\|\s*[A-Z]?\d{1,6}){0,4}$/i.test(cleaned)) return '\u9662\u6821\u4e13\u4e1a\u7ec4';
  return tidyMajorList(cleaned);
}

function tidyMajorList(value: string): string {
  return value
    .replace(/^[：:、,，\s|]+/, '')
    .replace(/[;；]/g, '、')
    .replace(/\s*[、,，]\s*/g, '、')
    .replace(/\s*\|\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[、,，;；\s]+$/, '') || '\u9662\u6821\u4e13\u4e1a\u7ec4';
}

function selectRows<T extends object>(db: Database, sql: string, params: (string | number)[] = []): T[] {
  const stmt = db.prepare(sql, params);
  const rows: T[] = [];
  try { while (stmt.step()) rows.push(stmt.getAsObject() as T); } finally { stmt.free(); }
  return rows;
}


function getAdmissionSearchTable(db: Database): 'recommendation_records' | 'admission' {
  const rows = selectRows<{ name: string }>(
    db,
    "select name from sqlite_master where type = 'table' and name = 'recommendation_records' limit 1",
  );
  return rows.length > 0 ? 'recommendation_records' : 'admission';
}

function toEvidence(row: AdmissionRow, input: KnowledgeSearchInput): AdmissionEvidence {
  const province = PROVINCE_CODE[row.province];
  if (!isProvince(province)) throw new Error(`数据库中存在未登记省份：${row.province}`);
  const rawMajorName = row.major_name || '\u672a\u6ce8\u660e\u4e13\u4e1a';
  const displayMajorName = normalizeDisplayMajorName(rawMajorName);
  const score = row.score || 0;
  const rank = row.rank && row.rank > 0 ? row.rank : 0;
  return { id: `sqlite-${row.id}`, source: 'sqlite', province, provinceName: row.province, year: row.year, category: row.category || '\u672a\u6ce8\u660e\u7c7b\u522b', batch: row.batch || '\u672a\u6ce8\u660e\u6279\u6b21', schoolName: row.school_name, majorName: rawMajorName, score, rank, quota: row.quota || undefined, sourceFile: row.source_file || undefined, subjectRequirement: inferSubjectRequirement(row.category || '', rawMajorName, displayMajorName), majorCategory: inferMajorCategory(displayMajorName), schoolLevel: inferSchoolLevel(row.school_name) };
}

function calculateRankWindow(rank: number): number { if (rank <= 5000) return 12000; if (rank <= 30000) return 25000; if (rank <= 100000) return 50000; return 90000; }
function buildExcludeClause(excludedMajors: string[]) { const majors = excludedMajors.map(item => item.trim()).filter(Boolean).slice(0, 12); if (majors.length === 0) return { sql: '', params: [] as string[] }; return { sql: majors.map(() => "and coalesce(major_name, '') not like ?").join('\n'), params: majors.map(item => `%${item}%`) }; }

function inferSubjectRequirement(category: string, rawMajorName: string, displayMajorName: string): SubjectCategory[] {
  const explicit = inferSubjectCategoriesFromRequirement(`${category} ${rawMajorName}`);
  if (explicit && explicit.length > 0) return explicit;
  const text = `${category} ${displayMajorName}`;
  const all = [...SUBJECT_COMBINATIONS];
  if (/\u7269\u7406|\u5316\u5b66|\u5de5\u79d1|\u8ba1\u7b97\u673a|\u8f6f\u4ef6|\u7535\u5b50|\u7535\u6c14|\u673a\u68b0|\u81ea\u52a8\u5316|\u4eba\u5de5\u667a\u80fd|\u6570\u636e|\u571f\u6728|\u6750\u6599|\u533b\u5b66|\u4e34\u5e8a|\u53e3\u8154|\u836f\u5b66/.test(text)) {
    return all.filter(item => item.startsWith('physics_') && item.includes('chemistry'));
  }
  if (/\u653f\u6cbb|\u9a6c\u514b\u601d|\u601d\u60f3\u653f\u6cbb/.test(text)) return all.filter(item => item.includes('politics'));
  if (/\u5730\u7406|\u6d4b\u7ed8|\u9065\u611f/.test(text)) return all.filter(item => item.includes('geography'));
  if (/\u5386\u53f2|\u6cd5\u5b66|\u6c49\u8bed\u8a00|\u65b0\u95fb|\u4f20\u64ad|\u82f1\u8bed|\u6587\u5b66|\u54f2\u5b66|\u6559\u80b2|\u5e08\u8303|\u7ecf\u6d4e|\u91d1\u878d|\u4f1a\u8ba1|\u7ba1\u7406/.test(text)) return all;
  return all;
}
function inferMajorCategory(majorName: string): string { if (/\u8ba1\u7b97\u673a|\u8f6f\u4ef6|\u4eba\u5de5\u667a\u80fd|\u7535\u5b50|\u7535\u6c14|\u673a\u68b0|\u81ea\u52a8\u5316|\u571f\u6728|\u6750\u6599|\u4fe1\u606f|\u6570\u636e/.test(majorName)) return '\u5de5\u5b66'; if (/\u533b\u5b66|\u4e34\u5e8a|\u53e3\u8154|\u836f\u5b66|\u62a4\u7406|\u9884\u9632/.test(majorName)) return '\u533b\u5b66'; if (/\u6570\u5b66|\u7269\u7406|\u5316\u5b66|\u751f\u7269|\u7edf\u8ba1|\u5fc3\u7406/.test(majorName)) return '\u7406\u5b66'; if (/\u6cd5\u5b66|\u653f\u6cbb|\u77e5\u8bc6\u4ea7\u6743/.test(majorName)) return '\u6cd5\u5b66'; if (/\u7ecf\u6d4e|\u91d1\u878d|\u8d38\u6613/.test(majorName)) return '\u7ecf\u6d4e\u5b66'; if (/\u7ba1\u7406|\u4f1a\u8ba1|\u8d22\u52a1|\u5de5\u5546/.test(majorName)) return '\u7ba1\u7406\u5b66'; if (/\u5e08\u8303|\u6559\u80b2/.test(majorName)) return '\u6559\u80b2\u5b66'; if (/\u6587\u5b66|\u6c49\u8bed\u8a00|\u65b0\u95fb|\u4f20\u64ad|\u82f1\u8bed|\u5916\u8bed/.test(majorName)) return '\u6587\u5b66'; if (/\u519c\u5b66|\u56ed\u827a|\u52a8\u7269/.test(majorName)) return '\u519c\u5b66'; return '\u7efc\u5408'; }
function inferSchoolLevel(schoolName: string): AdmissionEvidence['schoolLevel'] { const level985 = ['\u6e05\u534e\u5927\u5b66', '\u5317\u4eac\u5927\u5b66', '\u6d59\u6c5f\u5927\u5b66', '\u590d\u65e6\u5927\u5b66', '\u4e0a\u6d77\u4ea4\u901a\u5927\u5b66', '\u5357\u4eac\u5927\u5b66', '\u5c71\u4e1c\u5927\u5b66', '\u4e2d\u56fd\u6d77\u6d0b\u5927\u5b66']; const level211 = ['\u5317\u4eac\u90ae\u7535\u5927\u5b66', '\u4e0a\u6d77\u8d22\u7ecf\u5927\u5b66', '\u4e2d\u592e\u8d22\u7ecf\u5927\u5b66', '\u4e2d\u56fd\u653f\u6cd5\u5927\u5b66', '\u5357\u4eac\u7406\u5de5\u5927\u5b66', '\u82cf\u5dde\u5927\u5b66']; if (level985.some(name => schoolName.includes(name))) return '985'; if (level211.some(name => schoolName.includes(name))) return '211'; if (/\u5927\u5b66|\u5b66\u9662/.test(schoolName)) return 'ordinary'; return 'vocational'; }
function subjectRoughlyMatches(item: AdmissionEvidence, subject: SubjectCategory): boolean {
  const explicit = isAdmissionRequirementAllowedForSubject(`${item.category} ${item.batch} ${item.majorName}`, subject);
  if (typeof explicit === 'boolean') return explicit;
  return isMajorAllowedForSubject(item.majorName, subject);
}
function stableCode(value: string): string { let hash = 0; for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return `sch-${hash.toString(16)}`; }

function estimateRankFromScore(province: Province, score: number, input: KnowledgeSearchInput): number {
  if (score <= 0) return 0;
  const scoreDiff = input.score - score;
  if (input.rank > 0 && Math.abs(scoreDiff) <= 120) {
    return Math.max(1, Math.round(input.rank + scoreDiff * 1200));
  }
  const scoreRatio = score / 750;
  const totalStudents = getProvinceMeta(province).totalStudents;
  if (scoreRatio > 0.9) return Math.max(1, Math.round(totalStudents * (1 - scoreRatio) * 0.35));
  if (scoreRatio > 0.8) return Math.max(1, Math.round(totalStudents * (1 - scoreRatio) * 0.55));
  if (scoreRatio > 0.7) return Math.max(1, Math.round(totalStudents * (1 - scoreRatio) * 0.75));
  return Math.max(1, Math.round(totalStudents * (1 - scoreRatio) * 0.9));
}
