import type { AdmissionEvidence, KnowledgeSearchInput, KnowledgeSearchResult } from './types';

const TAVILY_API_URL = process.env.TAVILY_API_URL || 'https://api.tavily.com/search';
const PROVINCE_NAME = { zhejiang: '浙江', shandong: '山东' } as const;

interface TavilyResponse {
  results?: {
    title?: string;
    url?: string;
    content?: string;
  }[];
}

export async function searchAdmissionWithTavily(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult> {
  if (!process.env.TAVILY_API_KEY) {
    return { records: [], source: 'tavily', warnings: ['未配置 TAVILY_API_KEY，无法进行网页实时检索。'] };
  }

  const provinceName = PROVINCE_NAME[input.province];
  const query = `${provinceName} ${new Date().getFullYear() - 1} 高考 普通高校招生 投档分数线 位次 ${input.preferredMajors.join(' ')}`.trim();
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_answer: false,
      include_raw_content: false,
      max_results: 8,
    }),
  });

  if (!response.ok) {
    return { records: [], source: 'tavily', warnings: [`Tavily 检索失败：HTTP ${response.status}`] };
  }

  const data = (await response.json()) as TavilyResponse;
  const records: AdmissionEvidence[] = (data.results || []).map((item, index) => ({
    id: `tavily-${Date.now()}-${index}`,
    source: 'tavily',
    province: input.province,
    provinceName,
    year: new Date().getFullYear() - 1,
    category: '网页检索',
    batch: '待核验',
    schoolName: item.title || '网页检索结果',
    majorName: input.preferredMajors[0] || '相关专业',
    score: input.score,
    rank: input.rank,
    sourceUrl: item.url,
    sourceFile: item.title,
    subjectRequirement: [input.subjectCategory],
    majorCategory: '网页证据',
    schoolLevel: 'ordinary',
  }));

  return {
    records,
    source: 'tavily',
    warnings: records.length > 0 ? ['本地数据库证据不足，已使用 Tavily 网页检索结果作为补充，需人工核验。'] : ['Tavily 未返回可用结果。'],
  };
}
