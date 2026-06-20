
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { AdmissionRecord, Major, Province, Report, ReportChatMessage, University } from '@/lib/types';
import { getDatabase } from './client';
import { admissionRecords, majors, reportMessages, reports, universities } from './schema';

const inMemoryReports = new Map<string, Report>();
const inMemoryMessages = new Map<string, ReportChatMessage[]>();

function normalizeAdmission(row: typeof admissionRecords.$inferSelect): AdmissionRecord {
  return {
    id: row.id,
    universityCode: row.universityCode,
    universityName: row.universityName,
    universityLevel: row.universityLevel as AdmissionRecord['universityLevel'],
    province: row.province as Province,
    year: row.year,
    majorName: row.majorName,
    majorCategory: row.majorCategory,
    subjectRequirement: row.subjectRequirement as AdmissionRecord['subjectRequirement'],
    admissionType: row.admissionType as AdmissionRecord['admissionType'],
    lowestScore: row.lowestScore,
    lowestRank: row.lowestRank,
    averageScore: row.averageScore,
    highestScore: row.highestScore,
    dataSource: row.dataSource,
    sourceUrl: row.sourceUrl || undefined,
    sourcePublishedAt: row.sourcePublishedAt?.toISOString(),
    collectedAt: row.collectedAt?.toISOString(),
    batchId: row.batchId || undefined,
    notes: row.notes || undefined,
  };
}

function normalizeUniversity(row: typeof universities.$inferSelect): University {
  return {
    code: row.code,
    name: row.name,
    province: row.province as Province,
    city: row.city,
    level: row.level as University['level'],
    type: row.type as University['type'],
    website: row.website || undefined,
    features: row.features || [],
  };
}

function normalizeMajor(row: typeof majors.$inferSelect): Major {
  return {
    code: row.code,
    name: row.name,
    category: row.category,
    employmentRate: row.employmentRate === null ? undefined : row.employmentRate / 100,
    postgraduateRate: row.postgraduateRate === null ? undefined : row.postgraduateRate / 100,
    salaryRange: row.salaryMin !== null && row.salaryMax !== null ? [row.salaryMin, row.salaryMax] : undefined,
    description: row.description || undefined,
  };
}

export async function getAdmissionsByProvince(province: Province): Promise<AdmissionRecord[]> {
  const db = getDatabase();
  if (!db) throw new Error('未配置 Postgres 数据库；录取数据请使用本地 SQLite 知识库。');
  const rows = await db
    .select()
    .from(admissionRecords)
    .where(eq(admissionRecords.province, province))
    .orderBy(desc(admissionRecords.year), admissionRecords.lowestRank)
    .limit(5000);
  return rows.map(normalizeAdmission);
}

export async function getUniversityByCode(code: string): Promise<University | undefined> {
  const db = getDatabase();
  if (!db) return undefined;
  const [row] = await db.select().from(universities).where(eq(universities.code, code)).limit(1);
  return row ? normalizeUniversity(row) : undefined;
}

export async function getMajorByName(name: string): Promise<Major | undefined> {
  const db = getDatabase();
  if (!db) return undefined;
  const [row] = await db.select().from(majors).where(eq(majors.name, name)).limit(1);
  return row ? normalizeMajor(row) : undefined;
}

export async function getKnownUniversities(): Promise<University[]> {
  const db = getDatabase();
  if (!db) return [];
  const rows = await db.select().from(universities);
  return rows.map(normalizeUniversity);
}

export async function getKnownMajors(): Promise<Major[]> {
  const db = getDatabase();
  if (!db) return [];
  const rows = await db.select().from(majors);
  return rows.map(normalizeMajor);
}

export async function saveReport(report: Report): Promise<void> {
  inMemoryReports.set(report.id, report);
  const db = getDatabase();
  if (!db) return;
  await db
    .insert(reports)
    .values({
      id: report.id,
      province: report.userProfile.province,
      score: report.userProfile.score,
      rank: report.userProfile.rank,
      userProfile: report.userProfile,
      report,
    })
    .onConflictDoUpdate({
      target: reports.id,
      set: { report, userProfile: report.userProfile, rank: report.userProfile.rank },
    });
}

export async function getReportById(id: string): Promise<Report | null> {
  const cached = inMemoryReports.get(id);
  if (cached) return reviveReport(cached);
  const db = getDatabase();
  if (!db) return null;
  const [row] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!row) return null;
  const report = reviveReport(row.report as Report);
  inMemoryReports.set(id, report);
  return report;
}

export async function saveReportMessages(messages: ReportChatMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const reportId = messages[0].reportId;
  const current = inMemoryMessages.get(reportId) || [];
  inMemoryMessages.set(reportId, [...current, ...messages]);
  const db = getDatabase();
  if (!db) return;
  await db.insert(reportMessages).values(
    messages.map(message => ({
      id: message.id,
      reportId: message.reportId,
      role: message.role,
      content: message.content,
      createdAt: new Date(message.createdAt),
    })),
  );
}

export async function getReportMessages(reportId: string): Promise<ReportChatMessage[]> {
  const cached = inMemoryMessages.get(reportId);
  if (cached) return cached;
  const db = getDatabase();
  if (!db) return [];
  const rows = await db
    .select()
    .from(reportMessages)
    .where(eq(reportMessages.reportId, reportId))
    .orderBy(reportMessages.createdAt);
  const messages = rows.map(row => ({
    id: row.id,
    reportId: row.reportId,
    role: row.role as ReportChatMessage['role'],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));
  inMemoryMessages.set(reportId, messages);
  return messages;
}

export async function upsertSeedData(records: AdmissionRecord[], universityRows: University[], majorRows: Major[]): Promise<void> {
  const db = getDatabase();
  if (!db) throw new Error('DATABASE_URL, POSTGRES_URL or SUPABASE_DB_URL is required for import.');

  if (universityRows.length > 0) {
    await db
      .insert(universities)
      .values(
        universityRows.map(row => ({
          code: row.code,
          name: row.name,
          province: row.province,
          city: row.city,
          level: row.level,
          type: row.type,
          website: row.website,
          features: row.features || [],
        })),
      )
      .onConflictDoUpdate({
        target: universities.code,
        set: {
          name: sql`excluded.name`,
          province: sql`excluded.province`,
          city: sql`excluded.city`,
          level: sql`excluded.level`,
          type: sql`excluded.type`,
          website: sql`excluded.website`,
          features: sql`excluded.features`,
        },
      });
  }

  if (majorRows.length > 0) {
    await db
      .insert(majors)
      .values(
        majorRows.map(row => ({
          code: row.code,
          name: row.name,
          category: row.category,
          employmentRate: row.employmentRate === undefined ? null : Math.round(row.employmentRate * 100),
          postgraduateRate: row.postgraduateRate === undefined ? null : Math.round(row.postgraduateRate * 100),
          salaryMin: row.salaryRange?.[0] ?? null,
          salaryMax: row.salaryRange?.[1] ?? null,
          description: row.description,
        })),
      )
      .onConflictDoUpdate({
        target: majors.code,
        set: {
          name: sql`excluded.name`,
          category: sql`excluded.category`,
          employmentRate: sql`excluded.employment_rate`,
          postgraduateRate: sql`excluded.postgraduate_rate`,
          salaryMin: sql`excluded.salary_min`,
          salaryMax: sql`excluded.salary_max`,
          description: sql`excluded.description`,
        },
      });
  }

  if (records.length > 0) {
    await db
      .insert(admissionRecords)
      .values(
        records.map(record => ({
          id: record.id,
          universityCode: record.universityCode,
          universityName: record.universityName,
          universityLevel: record.universityLevel,
          province: record.province,
          year: record.year,
          majorName: record.majorName,
          majorCategory: record.majorCategory,
          subjectRequirement: record.subjectRequirement,
          admissionType: record.admissionType,
          lowestScore: record.lowestScore,
          lowestRank: record.lowestRank,
          averageScore: record.averageScore,
          highestScore: record.highestScore,
          dataSource: record.dataSource,
          sourceUrl: record.sourceUrl,
          sourcePublishedAt: record.sourcePublishedAt ? new Date(record.sourcePublishedAt) : null,
          collectedAt: record.collectedAt ? new Date(record.collectedAt) : new Date(),
          batchId: record.batchId,
          notes: record.notes,
        })),
      )
      .onConflictDoUpdate({
        target: admissionRecords.id,
        set: {
          lowestScore: sql`excluded.lowest_score`,
          lowestRank: sql`excluded.lowest_rank`,
          averageScore: sql`excluded.average_score`,
          highestScore: sql`excluded.highest_score`,
          dataSource: sql`excluded.data_source`,
          sourceUrl: sql`excluded.source_url`,
          collectedAt: sql`excluded.collected_at`,
          batchId: sql`excluded.batch_id`,
          notes: sql`excluded.notes`,
        },
      });
  }
}

function reviveReport(report: Report): Report {
  return {
    ...report,
    generatedAt: new Date(report.generatedAt),
    userProfile: {
      ...report.userProfile,
      createdAt: new Date(report.userProfile.createdAt),
    },
  };
}
