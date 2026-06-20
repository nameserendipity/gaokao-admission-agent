import type { Report } from '@/lib/types';
import { searchAdmissionKnowledge, evidenceToAdmissionRecord } from '@/lib/knowledge/admission-sqlite';
import { searchAdmissionWithTavily } from '@/lib/knowledge/tavily-search';
import { searchTeacherKnowledge } from '@/lib/knowledge/teacher-knowledge';

export interface AgentToolEvidence {
  tool: 'report' | 'local_admission_db' | 'teacher_knowledge' | 'tavily_search';
  title: string;
  summary: string;
  data: unknown;
}

export interface AgentToolResult {
  evidences: AgentToolEvidence[];
  warnings: string[];
  usedTools: AgentToolEvidence['tool'][];
}

export async function collectAgentEvidence(report: Report, question: string): Promise<AgentToolResult> {
  const evidences: AgentToolEvidence[] = [];
  const warnings: string[] = [];
  const usedTools = new Set<AgentToolEvidence['tool']>();
  const reportMatches = searchCurrentReport(report, question);

  evidences.push({ tool: 'report', title: '\u5f53\u524d\u62a5\u544a\u8bc1\u636e', summary: reportMatches.length > 0 ? '\u5df2\u4ece\u5f53\u524d\u62a5\u544a\u4e2d\u627e\u5230\u76f8\u5173\u63a8\u8350\u3002' : '\u5f53\u524d\u62a5\u544a\u4e2d\u6ca1\u6709\u76f4\u63a5\u547d\u4e2d\u7684\u9662\u6821\u6216\u4e13\u4e1a\u3002', data: reportMatches });
  usedTools.add('report');

  try {
    const local = await searchAdmissionKnowledge({ province: report.userProfile.province, score: report.userProfile.score, rank: report.positionAnalysis.rank, subjectCategory: report.userProfile.subjectCategory, preferredMajors: extractQueryMajors(report, question), excludedMajors: report.userProfile.excludedMajors, limit: 80 });
    const records = local.records.map(evidenceToAdmissionRecord).slice(0, 20);
    evidences.push({ tool: 'local_admission_db', title: '\u672c\u5730\u5f55\u53d6\u6570\u636e\u5e93\u8865\u67e5', summary: records.length > 0 ? `\u672c\u5730\u6570\u636e\u5e93\u8865\u67e5\u547d\u4e2d ${records.length} \u6761\u5019\u9009\u8bb0\u5f55\u3002` : '\u672c\u5730\u5f55\u53d6\u6570\u636e\u5e93\u672a\u8865\u67e5\u5230\u53ef\u7528\u8bb0\u5f55\u3002', data: records.map(item => ({ university: item.universityName, major: item.majorName, category: item.majorCategory, year: item.year, score: item.lowestScore, rank: item.lowestRank, source: item.dataSource })) });
    warnings.push(...local.warnings);
    usedTools.add('local_admission_db');
  } catch (error) {
    warnings.push(`\u672c\u5730\u5f55\u53d6\u6570\u636e\u5e93\u8865\u67e5\u5931\u8d25\uff1a${error instanceof Error ? error.message : '\u672a\u77e5\u9519\u8bef'}`);
  }

  const teacher = searchTeacherKnowledge(report.userProfile, [...report.riskWarnings, question]);
  evidences.push({ tool: 'teacher_knowledge', title: '\u8001\u5e08\u65b9\u6cd5\u8bba\u77e5\u8bc6\u5e93', summary: teacher.items.length > 0 ? `\u547d\u4e2d ${teacher.items.length} \u6761\u65b9\u6cd5\u8bba\u3002` : '\u672a\u547d\u4e2d\u65b9\u6cd5\u8bba\u77e5\u8bc6\u3002', data: teacher.items.slice(0, 5).map(item => ({ title: item.title, category: item.category, tags: item.tags, content: item.content.slice(0, 800) })) });
  warnings.push(...teacher.warnings);
  usedTools.add('teacher_knowledge');

  if (shouldUseWebSearch(question, reportMatches.length)) {
    try {
      const tavily = await searchAdmissionWithTavily({ province: report.userProfile.province, score: report.userProfile.score, rank: report.positionAnalysis.rank, subjectCategory: report.userProfile.subjectCategory, preferredMajors: extractQueryMajors(report, question), excludedMajors: report.userProfile.excludedMajors, limit: 8 });
      evidences.push({ tool: 'tavily_search', title: 'Tavily \u7f51\u9875\u68c0\u7d22', summary: tavily.records.length > 0 ? `\u7f51\u9875\u68c0\u7d22\u8fd4\u56de ${tavily.records.length} \u6761\u8865\u5145\u8bc1\u636e\u3002` : '\u7f51\u9875\u68c0\u7d22\u6ca1\u6709\u8fd4\u56de\u53ef\u7528\u5f55\u53d6\u8bc1\u636e\uff0c\u6216\u672a\u914d\u7f6e Tavily Key\u3002', data: tavily.records.slice(0, 8).map(item => ({ title: item.schoolName, major: item.majorName, year: item.year, score: item.score, rank: item.rank, url: item.sourceUrl, source: item.sourceFile })) });
      warnings.push(...tavily.warnings);
      usedTools.add('tavily_search');
    } catch (error) {
      warnings.push(`\u7f51\u9875\u68c0\u7d22\u5931\u8d25\uff1a${error instanceof Error ? error.message : '\u672a\u77e5\u9519\u8bef'}`);
    }
  }
  return { evidences, warnings, usedTools: [...usedTools] };
}

function searchCurrentReport(report: Report, question: string) {
  const terms = extractTerms(question);
  const all = [...report.recommendations.sprint, ...report.recommendations.stable, ...report.recommendations.guarantee, ...(report.recommendations.opportunities || [])];
  const matched = all.filter(item => {
    const haystack = `${item.university.name} ${item.major.name} ${item.major.category} ${item.recommendationType}`;
    return terms.length === 0 || terms.some(term => haystack.includes(term));
  });
  return (matched.length > 0 ? matched : all.slice(0, 12)).slice(0, 18).map(item => ({ type: item.recommendationType, university: item.university.name, major: item.major.name, category: item.major.category, year: item.admissionRecord.year, score: item.admissionRecord.lowestScore, rank: item.admissionRecord.lowestRank, rankDiff: item.rankDiff, chance: item.admissionChance, source: item.admissionRecord.dataSource, reasons: item.reasons }));
}

function extractQueryMajors(report: Report, question: string): string[] {
  const stopWords = ['\u6df1\u5733', '\u5927\u5b66', '\u5b66\u6821', '\u9662\u6821', '\u67e5\u8be2', '\u4e0a\u7f51', '\u5b98\u7f51', '\u6700\u65b0'];
  const terms = extractTerms(question).filter(term => !stopWords.includes(term));
  const merged = [...terms, ...report.userProfile.preferredMajors].filter(term => term.length >= 2);
  return [...new Set(merged)].slice(0, 6);
}

function extractTerms(question: string): string[] {
  const known = ['\u6df1\u5733', '\u8ba1\u7b97\u673a', '\u7535\u5b50\u4fe1\u606f', '\u81ea\u52a8\u5316', '\u7ecf\u6d4e\u5b66', '\u91d1\u878d', '\u4f1a\u8ba1', '\u6cd5\u5b66', '\u533b\u5b66', '\u4e34\u5e8a', '\u53e3\u8154', '\u5e08\u8303', '\u4fdd\u5e95', '\u7a33\u59a5', '\u51b2\u523a', '985', '211'];
  const found = known.filter(term => question.includes(term));
  const chunks = question.split(/[\uFF0C\u3002\uFF01\uFF1F\u3001\s]+/).map(item => item.trim()).filter(item => item.length >= 2 && item.length <= 12);
  return [...new Set([...found, ...chunks])].slice(0, 10);
}

function shouldUseWebSearch(question: string, reportHitCount: number): boolean {
  const explicitWeb = new RegExp('\\u4e0a\\u7f51|\\u8054\\u7f51|\\u641c\\u7d22|\\u67e5\\u8be2|\\u5b98\\u7f51|\\u6700\\u65b0|\\u4eca\\u5e74|2026|\\u6df1\\u5733|\\u5e7f\\u5dde|\\u57ce\\u5e02|\\u5927\\u5b66\\u540d\\u5355');
  if (explicitWeb.test(question)) return true;
  const broadAsk = new RegExp('\\u6709\\u6ca1\\u6709|\\u54ea\\u4e9b|\\u4ec0\\u4e48\\u5927\\u5b66|\\u5b66\\u6821|\\u9662\\u6821');
  return reportHitCount === 0 && broadAsk.test(question);
}
