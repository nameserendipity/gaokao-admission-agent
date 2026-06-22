import type { AdmissionRecord, Recommendation, Report, University, UserProfile } from '@/lib/types';
import { searchArtSportsAdmissions } from '@/lib/knowledge/admission-sqlite';

type ArtSportsCandidate = Awaited<ReturnType<typeof searchArtSportsAdmissions>>['records'][number];

const ART_SPORTS_LABEL: Record<'art' | 'sports', string> = {
  art: '艺术类',
  sports: '体育类',
};

export async function generateArtSportsReport(userProfile: UserProfile): Promise<Report> {
  if (userProfile.province !== 'jiangxi') throw new Error('当前艺体预览仅支持江西省。');
  if (userProfile.candidateType !== 'art' && userProfile.candidateType !== 'sports') {
    throw new Error('艺体报告需要选择艺术类或体育类考生。');
  }
  const scoreForMatch = userProfile.candidateType === 'sports'
    ? userProfile.professionalScore
    : userProfile.compositeScore ?? userProfile.score;
  if (!scoreForMatch || scoreForMatch <= 0) throw new Error(userProfile.candidateType === 'sports' ? '请填写体育专业分。' : '请填写艺体综合分/投档分。');

  const result = await searchArtSportsAdmissions({
    candidateType: userProfile.candidateType,
    category: userProfile.candidateType === 'sports' ? '体育类' : userProfile.artSportsCategory || undefined,
    compositeScore: scoreForMatch,
    limit: 160,
  });
  if (result.records.length === 0) throw new Error('未查询到匹配的江西艺体投档数据。');

  const recommendations = assembleArtSportsRecommendations(result.records, userProfile, scoreForMatch);
  const label = ART_SPORTS_LABEL[userProfile.candidateType];
  const category = userProfile.candidateType === 'sports' ? '体育类' : userProfile.artSportsCategory || '艺术类';
  const scoreLabel = getArtSportsScoreLabel(userProfile.candidateType);
  const rankLabel = userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体综合分排名/投档排名';
  const diffBasis = userProfile.candidateType === 'sports' ? '体育专业投档分差值' : '综合分差值';
  const rankText = userProfile.rank ? `；你填写的${rankLabel}约第 ${userProfile.rank} 名` : `；未填写${rankLabel}，将主要按${diffBasis}匹配`;

  return {
    id: `report-art-sports-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userProfile,
    generatedAt: new Date(),
    positionAnalysis: {
      province: 'jiangxi',
      score: userProfile.score,
      rank: userProfile.rank || 0,
      rankEstimated: false,
      rankPercentile: 0,
      positionDescription: `江西${label}${category}预览：按你填写的${scoreLabel} ${scoreForMatch} 分，与2024-2025年本科批艺体投档线进行同口径匹配${rankText}。`,
    },
    suitableMajors: [
      {
        category,
        majors: [category],
        reasons: [
          userProfile.candidateType === 'sports' ? '体育类录取以对应类别、院校专业组和体育专业投档分/专业分为核心参考。' : '艺术类录取以对应类别、专业组和综合分/投档分为核心参考。',
          '本报告不套用普通类位次模型，单独按江西艺体本科批投档数据匹配。',
        ],
      },
    ],
    recommendations,
    strategyInsights: [
      {
        title: '艺体类单独成组判断',
        category: '艺体规则',
        summary: userProfile.candidateType === 'sports' ? '体育类投档口径与普通类不同，应重点核对体育专业投档分/专业分、文化成绩要求、招生计划和院校专业组。' : '艺术类投档口径与普通类不同，应重点核对专业类别、综合分、专业成绩要求、招生计划和院校专业组。',
        source: '江西省教育考试院艺体本科批投档线',
      },
    ],
    riskDiagnosis: [
      {
        type: 'data',
        level: 'medium',
        message: '艺体预览为最小闭环版本',
        suggestion: userProfile.candidateType === 'sports' ? '当前按体育专业投档分/专业分差值匹配。正式填报前还需核验当年招生章程、文化成绩要求、单科限制和专业组要求。' : '当前按综合分/投档分差值匹配。正式填报前还需核验当年招生章程、专业成绩合格线、单科限制和专业组要求。',
      },
    ],
    riskWarnings: [
      ...result.warnings,
      userProfile.candidateType === 'sports'
        ? '体育类不按普通类位次模型判断，体育专业投档分/专业分、文化成绩要求和投档排序规则以江西省当年政策为准。'
        : '艺术类不按普通类位次模型判断，综合分公式和专业合格要求以江西省当年政策为准。',
      userProfile.candidateType === 'sports'
        ? '体育类报告中的98分左右口径为体育专业投档分/专业分，不是文化分或普通类综合分。'
        : '若你填写的是文化分而非综合分/投档分，请先换算后重新生成。',
    ],
    dataSources: collectArtSportsSources(result.records),
    disclaimer: '本报告仅供参考，不构成录取承诺或保证。艺体类最终以江西省教育考试院、高校招生章程及当年正式投档规则为准。',
  };
}

function assembleArtSportsRecommendations(records: ArtSportsCandidate[], userProfile: UserProfile, scoreForMatch: number): Report['recommendations'] {
  const recommendations = records.map(record => toRecommendation(record, userProfile, scoreForMatch));
  const byKey = new Map<string, Recommendation>();
  for (const item of recommendations.sort((a, b) => b.admissionRecord.year - a.admissionRecord.year || b.matchScore - a.matchScore)) {
    const key = `${item.university.name}-${item.admissionRecord.majorName}`;
    if (!byKey.has(key)) byKey.set(key, item);
  }
  const unique = [...byKey.values()].sort((a, b) => b.matchScore - a.matchScore);
  return {
    sprint: unique.filter(item => item.recommendationType === '冲刺').slice(0, 8),
    stable: unique.filter(item => item.recommendationType === '稳妥').slice(0, 10),
    guarantee: unique.filter(item => item.recommendationType === '保底').slice(0, 8),
    opportunities: unique.filter(item => item.isOpportunity).slice(0, 6),
  };
}

function toRecommendation(record: ArtSportsCandidate, userProfile: UserProfile, scoreForMatch: number): Recommendation {
  const scoreDiff = scoreForMatch - record.filingScore;
  const scoreLabel = getArtSportsScoreLabel(userProfile.candidateType);
  const recommendationType = classifyByScoreDiff(scoreDiff);
  const university: University = {
    code: record.schoolCode || stableCode(record.schoolName),
    name: record.schoolName,
    province: 'jiangxi',
    city: '未注明',
    level: 'ordinary',
    type: userProfile.candidateType === 'art' ? 'art' : 'comprehensive',
  };
  const admissionRecord: AdmissionRecord = {
    id: `art-sports-${record.id}`,
    universityCode: university.code,
    universityName: record.schoolName,
    universityLevel: 'ordinary',
    province: 'jiangxi',
    year: record.year,
    majorName: `${record.category}专业组`,
    majorCategory: record.category,
    subjectRequirement: [userProfile.subjectCategory],
    admissionType: 'parallel',
    lowestScore: Math.round(record.filingScore * 1000) / 1000,
    lowestRank: record.filingRank || 0,
    averageScore: Math.round(record.filingScore * 1000) / 1000,
    highestScore: Math.round(record.filingScore * 1000) / 1000,
    dataSource: record.sourceFile || '江西省教育考试院艺体本科批投档线',
    collectedAt: new Date().toISOString(),
    batchId: record.batch,
    notes: `院校专业组：${record.groupCode}${record.groupName ? ` ${record.groupName}` : ''}；组内具体专业需以江西省招生计划和高校招生章程为准`,
  };
  return {
    university,
    major: { code: record.groupCode, name: `${record.category}专业组`, category: record.category },
    admissionRecord,
    recommendationType,
    matchScore: calculateScore(scoreDiff, recommendationType),
    admissionChance: calculateChance(scoreDiff, recommendationType),
    rankDiff: record.filingRank ? record.filingRank - (userProfile.rank || record.filingRank) : undefined,
    isOpportunity: scoreDiff >= -3 && scoreDiff <= 5,
    reasons: [
      `你的${scoreLabel} ${scoreForMatch}，${scoreDiff >= 0 ? '高于' : '低于'}该专业组${record.year}年投档线约 ${Math.abs(scoreDiff).toFixed(3)} 分。`,
      `匹配类别：${record.category}；院校专业组：${record.groupCode}${record.groupName ? ` ${record.groupName}` : ''}。`,
      userProfile.candidateType === 'sports' ? '\u5f53\u524d\u6309\u6c5f\u897f\u4f53\u80b2\u7c7b\u516c\u5f00\u7684\u4f53\u80b2\u4e13\u4e1a\u6295\u6863\u5206\u548c\u4f53\u80b2\u6295\u6863\u6392\u540d\u5339\u914d\uff0c\u4e0d\u4f7f\u7528\u666e\u901a\u7c7b\u7efc\u5408\u5206\u6a21\u578b\u3002' : '\u5f53\u524d\u6309\u827a\u672f\u7c7b\u7efc\u5408\u5206/\u6295\u6863\u5206\u53e3\u5f84\u5339\u914d\u3002',
      record.filingRank ? `该专业组${record.year}年投档最低排名为 ${record.filingRank}。` : `该条数据未提供投档最低排名，优先按${userProfile.candidateType === 'sports' ? '体育专业投档分' : '综合分'}差值参考。`,
      userProfile.rank && record.filingRank ? `你的${userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体排名'}与该专业组投档最低排名相差约 ${Math.abs(record.filingRank - userProfile.rank)} 名。` : `若补充${userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体综合分排名/投档排名'}，风险判断会更精细。`,
    ],
    evidence: [{
      year: record.year,
      lowestScore: Math.round(record.filingScore * 1000) / 1000,
      lowestRank: record.filingRank || 0,
      averageScore: Math.round(record.filingScore * 1000) / 1000,
      sourceName: record.sourceFile || '江西艺体本科批投档线',
    }],
    riskLevel: recommendationType === '冲刺' ? 'high' : recommendationType === '稳妥' ? 'medium' : 'low',
    riskNotes: userProfile.candidateType === 'sports' ? '当前投档线只到院校专业组层级；组内具体专业、计划数、学费、文化成绩要求和录取规则需复核江西省招生计划、高校招生章程。' : '当前投档线只到院校专业组层级；组内具体专业、计划数、学费和录取规则需复核江西省招生计划、高校招生章程和当年综合分公式。',
  };
}

function getArtSportsScoreLabel(candidateType: UserProfile['candidateType']): string {
  return candidateType === 'sports' ? '\u4f53\u80b2\u4e13\u4e1a\u6295\u6863\u5206/\u4e13\u4e1a\u5206' : '\u7efc\u5408\u5206/\u6295\u6863\u5206';
}

function classifyByScoreDiff(diff: number): string {
  if (diff < 0) return '冲刺';
  if (diff <= 18) return '稳妥';
  return '保底';
}

function calculateScore(diff: number, type: string): number {
  const base = type === '保底' ? 86 : type === '稳妥' ? 76 : 58;
  return Math.max(1, Math.min(100, Math.round(base + Math.max(-18, Math.min(12, diff)))));
}

function calculateChance(diff: number, type: string): number {
  const base = type === '保底' ? 82 : type === '稳妥' ? 62 : 34;
  return Math.max(5, Math.min(95, Math.round(base + Math.max(-20, Math.min(16, diff * 1.4)))));
}

function collectArtSportsSources(records: ArtSportsCandidate[]): Report['dataSources'] {
  const map = new Map<string, Report['dataSources'][number]>();
  for (const record of records) {
    const key = `${record.year}-${record.sourceFile || '江西艺体投档线'}`;
    if (!map.has(key)) map.set(key, { name: record.sourceFile || '江西省教育考试院艺体本科批投档线', year: record.year, collectedAt: new Date().toISOString() });
  }
  return [...map.values()].sort((a, b) => b.year - a.year).slice(0, 8);
}

function stableCode(value: string): string {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `sch-${hash.toString(16)}`;
}
