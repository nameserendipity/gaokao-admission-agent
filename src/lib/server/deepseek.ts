import type { Report, ReportChatMessage } from '@/lib/types';
import { collectAgentEvidence, type AgentToolResult } from './agent-tools';

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export async function generateDeepSeekSummary(report: Report): Promise<string | undefined> {
  if (!process.env.DEEPSEEK_API_KEY) return buildRuleBasedSummary(report);
  const evidence = compactReportEvidence(report);
  const prompt = `\u8bf7\u57fa\u4e8e\u4ee5\u4e0b\u9ad8\u8003\u5fd7\u613f\u63a8\u8350\u62a5\u544a\u8bc1\u636e\uff0c\u751f\u6210\u4e00\u6bb5\u4e2d\u6587\u62a5\u544a\u89e3\u8bfb\u3002\u8981\u6c42\uff1a1\uff09\u53ea\u80fd\u4f7f\u7528JSON\u91cc\u7684\u5206\u6570\u3001\u4f4d\u6b21\u3001\u9662\u6821\u3001\u4e13\u4e1a\u548c\u6765\u6e90\uff1b2\uff09\u8bf4\u660e\u51b2\u523a/\u7a33\u59a5/\u4fdd\u5e95\u7ed3\u6784\uff1b3\uff09\u6307\u51fa\u4e3b\u8981\u98ce\u9669\uff1b4\uff09\u7ed9\u51fa\u4e0b\u4e00\u6b65\u586b\u62a5\u5efa\u8bae\uff1b5\uff09\u4e0d\u8981\u627f\u8bfa\u5f55\u53d6\uff1b6\uff09\u4e0d\u8981\u4f7f\u7528Markdown\u52a0\u7c97\u7b26\u53f7\u3002JSON\uff1a${JSON.stringify(evidence)}`;
  return callDeepSeek([
    { role: 'system', content: '\u4f60\u662f\u4e25\u8c28\u7684\u9ad8\u8003\u5fd7\u613f\u5206\u6790\u52a9\u624b\uff0c\u53ea\u80fd\u57fa\u4e8e\u7528\u6237\u63d0\u4f9b\u7684\u7ed3\u6784\u5316\u8bc1\u636e\u56de\u7b54\u3002' },
    { role: 'user', content: prompt },
  ]).catch(() => buildRuleBasedSummary(report));
}

export async function answerReportQuestion(report: Report, question: string, history: ReportChatMessage[]): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error('\u95ee\u9898\u4e0d\u80fd\u4e3a\u7a7a');
  const toolResult = await collectAgentEvidence(report, trimmed);
  if (!process.env.DEEPSEEK_API_KEY) return buildToolBackedRuleAnswer(report, toolResult);
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: '\u4f60\u662f\u9ad8\u8003\u5fd7\u613f\u5de5\u5177\u578b Agent\u3002\u4f60\u5df2\u7ecf\u83b7\u5f97\u5de5\u5177\u7ed3\u679c\uff1a\u5f53\u524d\u62a5\u544a\u8bc1\u636e\u3001\u672c\u5730\u5f55\u53d6\u6570\u636e\u5e93\u3001\u8001\u5e08\u65b9\u6cd5\u8bba\u77e5\u8bc6\u5e93\uff0c\u5fc5\u8981\u65f6\u8fd8\u6709 Tavily \u7f51\u9875\u68c0\u7d22\u3002\u53ea\u80fd\u4f9d\u636e\u8fd9\u4e9b JSON \u8bc1\u636e\u56de\u7b54\uff0c\u4e0d\u5f97\u7f16\u9020\u5206\u6570\u3001\u4f4d\u6b21\u3001\u9662\u6821\u3001\u4e13\u4e1a\u6216\u6765\u6e90\uff1b\u5982\u679c\u5de5\u5177\u7ed3\u679c\u5305\u542b tavily_search\uff0c\u5fc5\u987b\u4f7f\u7528\u5176\u6807\u9898\u3001\u6458\u8981\u548cURL\u6765\u56de\u7b54\uff0c\u4e0d\u8981\u8bf4\u201c\u65e0\u6cd5\u67e5\u8be2\u201d\u6216\u201c\u6ca1\u6709\u8c03\u7528\u641c\u7d22\u201d\uff1b\u7f51\u9875\u7ed3\u679c\u5fc5\u987b\u63d0\u793a\u9700\u5b98\u65b9\u6838\u9a8c\uff1b\u4e0d\u627f\u8bfa\u5f55\u53d6\uff1b\u4e0d\u8981\u4f7f\u7528 Markdown \u52a0\u7c97\u7b26\u53f7\u3002' },
    { role: 'user', content: `\u5f53\u524d\u62a5\u544a\u6458\u8981JSON\uff1a${JSON.stringify(compactReportEvidence(report))}` },
    { role: 'user', content: `\u5de5\u5177\u8c03\u7528\u7ed3\u679cJSON\uff1a${JSON.stringify(toolResult)}` },
    ...history.slice(-6).map(item => ({ role: item.role, content: item.content }) as DeepSeekMessage),
    { role: 'user', content: trimmed },
  ];
  return callDeepSeek(messages)
    .then(answer => sanitizeAssistantText(answer))
    .catch(() => buildToolBackedRuleAnswer(report, toolResult));
}

type DeepSeekMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DEEPSEEK_MODEL, messages, temperature: 0.2, max_tokens: 1200 }),
  });
  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('DeepSeek returned empty content');
  return sanitizeAssistantText(content);
}

function compactReportEvidence(report: Report) {
  const all = [...report.recommendations.sprint, ...report.recommendations.stable, ...report.recommendations.guarantee];
  return {
    profile: { province: report.userProfile.province, score: report.userProfile.score, rank: report.positionAnalysis.rank, rankEstimated: report.positionAnalysis.rankEstimated, subjectCategory: report.userProfile.subjectCategory, preferredMajors: report.userProfile.preferredMajors },
    recommendations: all.slice(0, 18).map(item => ({ type: item.recommendationType, university: item.university.name, major: item.major.name, latest: { year: item.admissionRecord.year, lowestScore: item.admissionRecord.lowestScore, lowestRank: item.admissionRecord.lowestRank, source: item.admissionRecord.dataSource }, chance: item.admissionChance, rankDiff: item.rankDiff, isOpportunity: item.isOpportunity, riskLevel: item.riskLevel })),
    sources: report.dataSources,
    disclaimer: report.disclaimer,
  };
}

function buildRuleBasedSummary(report: Report): string {
  const stable = report.recommendations.stable[0];
  const guarantee = report.recommendations.guarantee[0];
  const opportunity = report.recommendations.opportunities?.[0];
  const parts = [`\u4f60\u7684\u53c2\u8003\u4f4d\u6b21\u4e3a ${report.positionAnalysis.rank}\uff0c\u7cfb\u7edf\u5df2\u6309\u8fd1\u5e74\u5f55\u53d6\u4f4d\u6b21\u548c\u9009\u79d1\u8981\u6c42\u751f\u6210\u51b2\u523a\u3001\u7a33\u59a5\u3001\u4fdd\u5e95\u7ec4\u5408\u3002`];
  if (stable) parts.push(`\u7a33\u59a5\u65b9\u5411\u53ef\u91cd\u70b9\u5173\u6ce8 ${stable.university.name} ${stable.major.name}\uff0c\u6700\u8fd1\u4e00\u5e74\u6700\u4f4e\u4f4d\u6b21\u4e3a ${stable.admissionRecord.lowestRank}\u3002`);
  if (guarantee) parts.push(`\u4fdd\u5e95\u65b9\u5411\u5efa\u8bae\u4fdd\u7559 ${guarantee.university.name} ${guarantee.major.name} \u7b49\u5b89\u5168\u57ab\uff0c\u907f\u514d\u5fd7\u613f\u68af\u5ea6\u8fc7\u9661\u3002`);
  if (opportunity) parts.push(`\u6361\u6f0f\u5019\u9009\u5305\u62ec ${opportunity.university.name} ${opportunity.major.name}\uff0c\u4f46\u4ecd\u9700\u7ed3\u5408\u62db\u751f\u8ba1\u5212\u53d8\u5316\u8c28\u614e\u5224\u65ad\u3002`);
  parts.push(report.disclaimer);
  return parts.join('\n');
}

function buildToolBackedRuleAnswer(report: Report, toolResult: AgentToolResult): string {
  const reportEvidence = toolResult.evidences.find(item => item.tool === 'report');
  const localEvidence = toolResult.evidences.find(item => item.tool === 'local_admission_db');
  const webEvidence = toolResult.evidences.find(item => item.tool === 'tavily_search');
  const lines = ['\u6211\u6839\u636e\u5f53\u524d\u62a5\u544a\u548c\u53ef\u7528\u5f55\u53d6\u6570\u636e\u6838\u5bf9\u5982\u4e0b\u3002'];
  const reportItems = Array.isArray(reportEvidence?.data) ? reportEvidence.data.slice(0, 3) as EvidenceLine[] : [];
  if (reportItems.length > 0) { lines.push('\u5f53\u524d\u62a5\u544a\u4e2d\u6700\u76f8\u5173\u7684\u8bc1\u636e\uff1a'); reportItems.forEach(item => lines.push(formatEvidenceLine(item))); }
  const localItems = Array.isArray(localEvidence?.data) ? localEvidence.data.slice(0, 5) as EvidenceLine[] : [];
  if (localItems.length > 0) { lines.push('\u8865\u5145\u6838\u5bf9\u5230\u7684\u5019\u9009\uff1a'); localItems.forEach(item => lines.push(formatEvidenceLine(item))); }
  if (webEvidence) lines.push(webEvidence.summary);
  if (toolResult.warnings.length > 0) lines.push(`\u6ce8\u610f\uff1a${[...new Set(toolResult.warnings)].slice(0, 3).join('\uFF1B')}`);
  lines.push(report.disclaimer);
  return sanitizeAssistantText(lines.join('\n'));
}


type EvidenceLine = { type?: string; university?: string; major?: string; rank?: number; score?: number; source?: string };

function formatEvidenceLine(item: EvidenceLine): string {
  const score = item.score && item.score > 0 ? item.score : '-';
  return `- ${item.type || '\u5019\u9009'}\uFF1A${item.university || '-'} ${item.major || '-'}\uFF0C\u6700\u4f4e\u4f4d\u6b21 ${item.rank || '-'}\uFF0C\u6700\u4f4e\u5206 ${score}${item.source ? `\uFF0C\u6765\u6e90\uFF1A${item.source}` : ''}`;
}

function sanitizeAssistantText(text: string): string {
  return text
    .replace(/\n{0,2}\u5df2\u8c03\u7528\u5de5\u5177\uff1a[\s\S]*$/g, '')
    .replace(/\n{0,2}\u5de5\u5177\u63d0\u793a\uff1a[\s\S]*$/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
