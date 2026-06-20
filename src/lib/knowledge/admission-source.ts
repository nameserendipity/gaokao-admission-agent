import type { AdmissionRecord } from '@/lib/types';
import { evidenceToAdmissionRecord, searchAdmissionKnowledge } from './admission-sqlite';
import { searchAdmissionWithTavily } from './tavily-search';
import type { KnowledgeSearchInput } from './types';

export interface AdmissionSourceResult {
  records: AdmissionRecord[];
  warnings: string[];
  usedSource: 'sqlite' | 'tavily';
}

export async function getAdmissionsForProfile(input: KnowledgeSearchInput): Promise<AdmissionSourceResult> {
  try {
    const local = await searchBalancedAdmissionKnowledge(input);
    if (local.records.length >= 8) {
      return {
        records: local.records.map(evidenceToAdmissionRecord),
        warnings: local.warnings,
        usedSource: 'sqlite',
      };
    }
    const tavily = await searchAdmissionWithTavily(input);
    return {
      records: tavily.records.length > 0 ? tavily.records.map(evidenceToAdmissionRecord) : local.records.map(evidenceToAdmissionRecord),
      warnings: [...local.warnings, '本地数据库命中不足，已尝试网页实时检索。', ...tavily.warnings],
      usedSource: tavily.records.length > 0 ? 'tavily' : 'sqlite',
    };
  } catch (error) {
    const tavily = await searchAdmissionWithTavily(input);
    if (tavily.records.length > 0) {
      return {
        records: tavily.records.map(evidenceToAdmissionRecord),
        warnings: [`本地数据库查询失败：${error instanceof Error ? error.message : '未知错误'}`, ...tavily.warnings],
        usedSource: 'tavily',
      };
    }
    throw new Error(`没有可用录取数据：本地数据库查询失败，网页检索也未返回证据。${error instanceof Error ? error.message : ''}`);
  }
}


async function searchBalancedAdmissionKnowledge(input: KnowledgeSearchInput) {
  const rank = input.rank;
  const segments = [
    { name: 'sprint', rank: Math.max(1, rank - 10000), score: input.score + 8, limit: 90 },
    { name: 'stable', rank, score: input.score, limit: 110 },
    { name: 'guarantee', rank: rank + 18000, score: input.score - 18, limit: 90 },
  ];
  const results = await Promise.all(segments.map(segment => searchAdmissionKnowledge({
    ...input,
    rank: segment.rank,
    score: segment.score,
    limit: segment.limit,
  })));
  const seen = new Set<string>();
  const records = results.flatMap(result => result.records).filter(record => {
    const key = `${record.schoolName}::${record.majorName}::${record.year}::${record.rank}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    records,
    source: 'sqlite' as const,
    warnings: results.flatMap(result => result.warnings),
  };
}
