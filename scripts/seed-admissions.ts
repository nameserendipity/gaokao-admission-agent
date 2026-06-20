import 'dotenv/config';
import {
  shandongAdmissions,
  zhejiangAdmissions,
  majors,
  universities,
} from '../src/lib/mock-data';
import { upsertSeedData } from '../src/lib/db/repository';
import type { AdmissionRecord } from '../src/lib/types';

const isDryRun = process.argv.includes('--dry-run');

function buildSeedRecords(): AdmissionRecord[] {
  return [...zhejiangAdmissions, ...shandongAdmissions].map(record => ({
    ...record,
    sourceUrl: record.province === 'zhejiang' ? 'https://www.zjzs.net' : 'https://www.sdzs.gov.cn',
    collectedAt: new Date().toISOString(),
    batchId: `seed-${new Date().toISOString().slice(0, 10)}`,
  }));
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  if (duplicates.size > 0) {
    throw new Error(`${label} 存在重复：${[...duplicates].slice(0, 10).join(', ')}`);
  }
}

function validateRecords(records: AdmissionRecord[]) {
  const errors: string[] = [];
  const allowedProvinces = new Set(['zhejiang', 'shandong']);
  const allowedAdmissionTypes = new Set(['parallel', 'sequential']);

  assertUnique(records.map(record => record.id), '录取记录 id');
  assertUnique(universities.map(item => item.code), '院校 code');
  assertUnique(majors.map(item => item.code), '专业 code');

  const naturalKeys = records.map(record => [
    record.province,
    record.year,
    record.universityCode,
    record.majorName,
    record.admissionType,
  ].join('::'));
  assertUnique(naturalKeys, '录取记录自然键');

  for (const record of records) {
    if (!allowedProvinces.has(record.province)) errors.push(`${record.id}: 不支持的省份 ${record.province}`);
    if (!allowedAdmissionTypes.has(record.admissionType)) errors.push(`${record.id}: 不支持的录取类型 ${record.admissionType}`);
    if (!record.universityCode || !record.universityName) errors.push(`${record.id}: 院校信息缺失`);
    if (!record.majorName || !record.majorCategory) errors.push(`${record.id}: 专业信息缺失`);
    if (!Array.isArray(record.subjectRequirement) || record.subjectRequirement.length === 0) errors.push(`${record.id}: 选科要求缺失`);
    if (record.year < 2020 || record.year > 2030) errors.push(`${record.id}: 年份异常 ${record.year}`);
    if (record.lowestScore <= 0 || record.lowestScore > 750) errors.push(`${record.id}: 最低分异常 ${record.lowestScore}`);
    if (record.averageScore < record.lowestScore) errors.push(`${record.id}: 平均分低于最低分`);
    if (record.highestScore < record.averageScore) errors.push(`${record.id}: 最高分低于平均分`);
    if (record.lowestRank <= 0) errors.push(`${record.id}: 最低位次异常 ${record.lowestRank}`);
    if (!record.dataSource) errors.push(`${record.id}: 数据来源缺失`);
  }

  if (errors.length > 0) {
    throw new Error(`种子数据校验失败：\n${errors.slice(0, 30).join('\n')}`);
  }
}

async function main() {
  const records = buildSeedRecords();
  validateRecords(records);

  const byProvince = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.province] = (acc[record.province] || 0) + 1;
    return acc;
  }, {});

  if (isDryRun) {
    console.log('种子数据 dry-run 校验通过。');
    console.log(`录取记录：${records.length} 条；院校：${universities.length} 所；专业：${majors.length} 个。`);
    console.log(`省份分布：浙江 ${byProvince.zhejiang || 0} 条，山东 ${byProvince.shandong || 0} 条。`);
    console.log('未写入数据库。设置 DATABASE_URL 后可运行 pnpm db:push && pnpm db:seed。');
    return;
  }

  await upsertSeedData(records, universities, majors);
  console.log(`Seeded ${records.length} admission records, ${universities.length} universities, ${majors.length} majors.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
