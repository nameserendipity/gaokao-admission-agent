import type { AdmissionRecord, Recommendation, Report, University, UserProfile } from '@/lib/types';
import { searchArtSportsAdmissions } from '@/lib/knowledge/admission-sqlite';

type ArtSportsCandidate = Awaited<ReturnType<typeof searchArtSportsAdmissions>>['records'][number];

const ART_SPORTS_LABEL: Record<'art' | 'sports', string> = {
  art: '艺术类',
  sports: '体育类',
};

const REC = {
  sprint: '冲刺',
  stable: '稳妥',
  guarantee: '保底',
} as const;

type ArtSportsRecommendationType = (typeof REC)[keyof typeof REC];

const SPORTS_PROFESSIONAL_MIN_SCORE = Number(process.env.JIANGXI_SPORTS_PROFESSIONAL_MIN_SCORE || 0);

export async function generateArtSportsReport(userProfile: UserProfile): Promise<Report> {
  if (userProfile.province !== 'jiangxi') throw new Error('当前艺体预览仅支持江西省。');
  if (userProfile.candidateType !== 'art' && userProfile.candidateType !== 'sports') {
    throw new Error('艺体报告需要选择艺术类或体育类考生。');
  }

  const scoreForMatch = userProfile.compositeScore ?? userProfile.score;
  if (!scoreForMatch || scoreForMatch <= 0) {
    throw new Error(userProfile.candidateType === 'sports' ? '请填写体育综合分/投档分。' : '请填写艺体综合分/投档分。');
  }
  if (userProfile.candidateType === 'sports' && (!userProfile.professionalScore || userProfile.professionalScore <= 0)) throw new Error('请填写体育专业分。');

  const result = await searchArtSportsAdmissions({
    candidateType: userProfile.candidateType,
    category: userProfile.candidateType === 'sports' ? '体育类' : userProfile.artSportsCategory || undefined,
    compositeScore: scoreForMatch,
    scoreWindow: userProfile.candidateType === 'sports' ? 12 : 60,
    limit: 220,
  });
  if (result.records.length === 0) throw new Error('未查询到匹配的江西艺体投档数据。');

  const recommendations = assembleArtSportsRecommendations(result.records, userProfile, scoreForMatch);
  const label = ART_SPORTS_LABEL[userProfile.candidateType];
  const category = userProfile.candidateType === 'sports' ? '体育类' : userProfile.artSportsCategory || '艺术类';
  const scoreLabel = getArtSportsScoreLabel(userProfile.candidateType);
  const rankLabel = userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体综合分排名/投档排名';
  const diffBasis = userProfile.candidateType === 'sports' ? '体育综合分/投档分差值' : '综合分差值';
  const rankText = userProfile.rank ? `；你填写的${rankLabel}约第 ${userProfile.rank} 名` : `；未填写${rankLabel}，将主要按${diffBasis}匹配`;
  const sportsCompositeNote = userProfile.candidateType === 'sports' ? `；体育专业分 ${userProfile.professionalScore} 分用于全局门槛风险提示` : '';
  const sportsGateDiagnosis = buildSportsGateDiagnosis(userProfile);
  const sportsGateWarnings = buildSportsGateWarnings(userProfile);

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
      positionDescription: `江西${label}${category}预览：按你填写的${scoreLabel} ${scoreForMatch} 分，与2024-2025年本科批艺体投档线进行同口径匹配${rankText}${sportsCompositeNote}。`,
    },
    suitableMajors: [
      {
        category,
        majors: [category],
        reasons: [
          userProfile.candidateType === 'sports'
            ? '体育类先核验专业分是否达到全局门槛，再以体育综合分/投档分、院校专业组和投档排名作为核心参考。'
            : '艺术类录取以对应类别、院校专业组和综合分/投档分为核心参考。',
          '本报告不套用普通类位次模型，单独按江西艺体本科批投档数据匹配。',
        ],
      },
    ],
    recommendations,
    strategyInsights: [
      {
        title: '艺体类单独成组判断',
        category: '艺体规则',
        summary: userProfile.candidateType === 'sports'
          ? '体育类投档口径与普通类不同。当前先用体育专业分做全局门槛风险提示，再按体育综合分/投档分匹配；仍需核对文化成绩要求、招生计划和院校专业组。'
          : '艺术类投档口径与普通类不同，应重点核对专业类别、综合分、专业成绩要求、招生计划和院校专业组。',
        source: '江西省教育考试院艺体本科批投档线',
      },
    ],
    riskDiagnosis: [
      ...(sportsGateDiagnosis || []),
      {
        type: 'data',
        level: 'medium',
        message: '艺体预览为最小闭环版本',
        suggestion: userProfile.candidateType === 'sports'
          ? '当前按体育综合分/投档分和体育投档排名匹配，体育专业分只做全局门槛风险提示。正式填报前还需核验当年招生章程、文化成绩要求、单科限制、组内具体专业、招生人数、学费、校区和院校专业组录取规则。'
          : '当前按综合分/投档分差值匹配。正式填报前还需核验当年招生章程、专业成绩合格线、单科限制、组内具体专业、招生人数、学费、校区和院校专业组录取规则。',
      },
    ],
    riskWarnings: [
      ...result.warnings,
      ...sportsGateWarnings,
      userProfile.candidateType === 'sports'
        ? '体育类不按普通类位次模型判断。报告优先按体育综合分/投档分和投档排名匹配；体育专业分用于全局门槛风险提示。'
        : '艺术类不按普通类位次模型判断，综合分公式和专业合格要求以江西省当年政策为准。',
      userProfile.candidateType === 'sports'
        ? '若体育专业分未达到江西当年专业合格线或高校要求，即使综合分接近也存在资格风险。'
        : '若你填写的是文化分而非综合分/投档分，请先换算后重新生成。',
    ],
    dataSources: collectArtSportsSources(result.records),
    disclaimer: '本报告仅供参考，不构成录取承诺或保证。艺体类当前只推荐院校专业组，不推荐具体专业；组内具体专业、招生人数、学费、校区、录取规则最终以江西省教育考试院、高校招生章程及当年正式投档规则为准。',
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
    sprint: unique.filter(item => item.recommendationType === REC.sprint).slice(0, 8),
    stable: unique.filter(item => item.recommendationType === REC.stable).slice(0, 10),
    guarantee: unique.filter(item => item.recommendationType === REC.guarantee).slice(0, 8),
    opportunities: unique.filter(item => item.isOpportunity).slice(0, 6),
  };
}

function toRecommendation(record: ArtSportsCandidate, userProfile: UserProfile, scoreForMatch: number): Recommendation {
  const scoreDiff = scoreForMatch - record.filingScore;
  const rankDiff = userProfile.rank && record.filingRank ? record.filingRank - userProfile.rank : undefined;
  const scoreLabel = getArtSportsScoreLabel(userProfile.candidateType);
  const recommendationType = classifyArtSportsRecommendation(userProfile, record, scoreDiff);
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
    majorName: `${record.category}院校专业组`,
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
    notes: `院校专业组：${record.groupCode}${record.groupName ? ` ${record.groupName}` : ''}；组内具体专业、招生人数、学费、校区、录取规则需以江西省招生计划和高校招生章程为准`,
  };
  return {
    university,
    major: { code: record.groupCode, name: `${record.category}院校专业组`, category: record.category },
    admissionRecord,
    recommendationType,
    matchScore: calculateScore(scoreDiff, recommendationType, rankDiff),
    admissionChance: calculateChance(scoreDiff, recommendationType, rankDiff),
    rankDiff,
    isOpportunity: rankDiff !== undefined ? rankDiff >= -50 && rankDiff <= 300 : scoreDiff >= -3 && scoreDiff <= 5,
    reasons: [
      `你的${scoreLabel} ${scoreForMatch}，${scoreDiff >= 0 ? '高于' : '低于'}该专业组${record.year}年投档线约 ${Math.abs(scoreDiff).toFixed(3)} 分。`,
      `匹配类别：${record.category}；院校专业组：${record.groupCode}${record.groupName ? ` ${record.groupName}` : ''}。`,
      userProfile.candidateType === 'sports'
        ? `当前按体育综合分/投档分和体育投档排名匹配；体育专业分 ${userProfile.professionalScore ?? '-'} 仅作全局门槛风险提示。`
        : '当前按艺术类综合分/投档分口径匹配。',
      record.filingRank ? `该专业组${record.year}年投档最低排名为 ${record.filingRank}。` : `该条数据未提供投档最低排名，优先按${userProfile.candidateType === 'sports' ? '体育综合分/投档分' : '综合分'}差值参考。`,
      userProfile.rank && record.filingRank ? `你的${userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体排名'}与该专业组投档最低排名相差约 ${Math.abs(record.filingRank - userProfile.rank)} 名。` : `若补充${userProfile.candidateType === 'sports' ? '体育投档排名' : '艺体综合分排名/投档排名'}，风险判断会更精细。`,
    ],
    evidence: [{
      year: record.year,
      lowestScore: Math.round(record.filingScore * 1000) / 1000,
      lowestRank: record.filingRank || 0,
      averageScore: Math.round(record.filingScore * 1000) / 1000,
      sourceName: record.sourceFile || '江西艺体本科批投档线',
    }],
    riskLevel: recommendationType === REC.sprint ? 'high' : recommendationType === REC.stable ? 'medium' : 'low',
    riskNotes: userProfile.candidateType === 'sports'
      ? '当前投档线只到院校专业组层级；这不是具体专业推荐。组内具体专业、招生人数、学费、校区、文化成绩要求、体育综合分/投档分口径和录取规则需复核江西省招生计划、高校招生章程。'
      : '当前投档线只到院校专业组层级；这不是具体专业推荐。组内具体专业、招生人数、学费、校区和录取规则需复核江西省招生计划、高校招生章程和当年综合分公式。',
  };
}

function getArtSportsScoreLabel(candidateType: UserProfile['candidateType']): string {
  return candidateType === 'sports' ? '体育综合分/投档分' : '综合分/投档分';
}

function classifyArtSportsRecommendation(userProfile: UserProfile, record: ArtSportsCandidate, scoreDiff: number): ArtSportsRecommendationType {
  if (userProfile.rank && record.filingRank) {
    const rankDiff = record.filingRank - userProfile.rank;
    if (rankDiff < 0) return REC.sprint;
    if (rankDiff <= 300) return REC.stable;
    return REC.guarantee;
  }
  return classifyByScoreDiff(scoreDiff, userProfile.candidateType === 'sports' ? 'sports' : 'art');
}

function classifyByScoreDiff(diff: number, candidateType: 'art' | 'sports'): ArtSportsRecommendationType {
  if (candidateType === 'sports') {
    if (diff < 0) return REC.sprint;
    if (diff <= 2) return REC.stable;
    return REC.guarantee;
  }
  if (diff < 0) return REC.sprint;
  if (diff <= 14) return REC.stable;
  return REC.guarantee;
}

function calculateScore(diff: number, type: ArtSportsRecommendationType, rankDiff?: number): number {
  const base = type === REC.guarantee ? 86 : type === REC.stable ? 76 : 58;
  if (rankDiff !== undefined) {
    const rankAdjust = type === REC.sprint
      ? Math.max(-12, Math.min(8, rankDiff / 80))
      : type === REC.stable
        ? Math.max(-6, Math.min(14, (300 - Math.abs(rankDiff)) / 30))
        : Math.max(-4, Math.min(10, rankDiff / 300));
    return Math.max(1, Math.min(100, Math.round(base + rankAdjust)));
  }
  return Math.max(1, Math.min(100, Math.round(base + Math.max(-18, Math.min(12, diff)))));
}

function calculateChance(diff: number, type: ArtSportsRecommendationType, rankDiff?: number): number {
  const base = type === REC.guarantee ? 82 : type === REC.stable ? 62 : 34;
  if (rankDiff !== undefined) {
    const rankAdjust = type === REC.sprint
      ? Math.max(-18, Math.min(8, rankDiff / 35))
      : type === REC.stable
        ? Math.max(-6, Math.min(18, (300 - Math.abs(rankDiff)) / 18))
        : Math.max(0, Math.min(13, rankDiff / 180));
    return Math.max(5, Math.min(95, Math.round(base + rankAdjust)));
  }
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

function buildSportsGateDiagnosis(userProfile: UserProfile): Report['riskDiagnosis'] {
  if (userProfile.candidateType !== 'sports') return [];
  if (!SPORTS_PROFESSIONAL_MIN_SCORE) {
    return [{
      type: 'data',
      level: 'medium',
      message: '体育专业分门槛需人工核验',
      suggestion: '当前未配置江西体育专业分全局门槛，系统只按你填写的体育综合分/投档分匹配院校专业组；正式填报前需核验当年体育专业合格线、文化控制线和高校要求。',
    }];
  }
  const pass = (userProfile.professionalScore || 0) >= SPORTS_PROFESSIONAL_MIN_SCORE;
  return [{
    type: 'data',
    level: pass ? 'low' : 'high',
    message: pass ? '体育专业分已达到配置门槛' : '体育专业分低于配置门槛',
    suggestion: pass
      ? `已按配置门槛 ${SPORTS_PROFESSIONAL_MIN_SCORE} 分做初步校验，后续仍需以江西省当年正式政策和高校要求为准。`
      : `你填写的体育专业分 ${userProfile.professionalScore ?? '-'} 低于当前配置门槛 ${SPORTS_PROFESSIONAL_MIN_SCORE}，即使综合分接近也存在资格风险。`,
  }];
}

function buildSportsGateWarnings(userProfile: UserProfile): string[] {
  if (userProfile.candidateType !== 'sports') return [];
  if (!SPORTS_PROFESSIONAL_MIN_SCORE) return ['体育专业分全局门槛未配置，本报告未对专业合格线做硬性过滤。'];
  return [`体育专业分全局门槛按当前配置 ${SPORTS_PROFESSIONAL_MIN_SCORE} 分提示风险，最终以江西省当年政策为准。`];
}

function stableCode(value: string): string {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `sch-${hash.toString(16)}`;
}
