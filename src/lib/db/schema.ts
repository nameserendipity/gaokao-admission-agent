
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  province: text('province').notNull(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  url: text('url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  collectedAt: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull(),
  batchId: text('batch_id').notNull(),
  contentHash: text('content_hash'),
});

export const universities = pgTable('universities', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  province: text('province').notNull(),
  city: text('city').notNull(),
  level: text('level').notNull(),
  type: text('type').notNull(),
  website: text('website'),
  features: jsonb('features').$type<string[]>().default([]),
});

export const majors = pgTable('majors', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  employmentRate: integer('employment_rate'),
  postgraduateRate: integer('postgraduate_rate'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  description: text('description'),
});

export const admissionRecords = pgTable(
  'admission_records',
  {
    id: text('id').primaryKey(),
    universityCode: text('university_code').notNull(),
    universityName: text('university_name').notNull(),
    universityLevel: text('university_level').notNull(),
    province: text('province').notNull(),
    year: integer('year').notNull(),
    majorName: text('major_name').notNull(),
    majorCategory: text('major_category').notNull(),
    subjectRequirement: jsonb('subject_requirement').$type<string[]>().notNull(),
    admissionType: text('admission_type').notNull(),
    lowestScore: integer('lowest_score').notNull(),
    lowestRank: integer('lowest_rank').notNull(),
    averageScore: integer('average_score').notNull(),
    highestScore: integer('highest_score').notNull(),
    dataSource: text('data_source').notNull(),
    sourceUrl: text('source_url'),
    sourcePublishedAt: timestamp('source_published_at', { withTimezone: true }),
    collectedAt: timestamp('collected_at', { withTimezone: true }).defaultNow().notNull(),
    batchId: text('batch_id'),
    notes: text('notes'),
  },
  table => ({
    naturalKey: uniqueIndex('admission_records_natural_key').on(
      table.province,
      table.year,
      table.universityCode,
      table.majorName,
      table.admissionType,
    ),
  }),
);

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  province: text('province').notNull(),
  score: integer('score').notNull(),
  rank: integer('rank'),
  userProfile: jsonb('user_profile').notNull(),
  report: jsonb('report').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reportMessages = pgTable('report_messages', {
  id: text('id').primaryKey(),
  reportId: text('report_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
