import type {
  AdmissionRecord,
  CareerGoal,
  Major,
  Province,
  Recommendation,
  Region,
  Report,
  SubjectCategory,
  StrategyMode,
  University,
  UserProfile,
} from '@/lib/types';
import { getAdmissionsForProfile } from '@/lib/knowledge/admission-source';
import { estimateRankFromAdmissionDb } from '@/lib/knowledge/admission-sqlite';
import { filterMajorsBySubject, getAllowedMajorCategories, getAllowedMajorOptions, getSubjectCategoryFromSelection, getSubjectSelection, isAdmissionRecordAllowedForSubject, isMajorAllowedForSubject, isSubjectCategory as isModernSubjectCategory, normalizeSubjectCategory } from '@/lib/subject-rules';
import { getProvinceLabel, getProvinceMeta, isProvince } from '@/lib/provinces';
import { searchTeacherKnowledge } from '@/lib/knowledge/teacher-knowledge';
import { generateDeepSeekSummary } from './deepseek';
import { generateArtSportsReport } from './art-sports-report';

const C = {
  sprint: '\u51b2\u523a',
  stable: '\u7a33\u59a5',
  guarantee: '\u4fdd\u5e95',
  engineering: '\u5de5\u5b66',
  science: '\u7406\u5b66',
  medicine: '\u533b\u5b66',
  literature: '\u6587\u5b66',
  law: '\u6cd5\u5b66',
  management: '\u7ba1\u7406\u5b66',
  economics: '\u7ecf\u6d4e\u5b66',
  education: '\u6559\u80b2\u5b66',
  agriculture: '\u519c\u5b66',
} as const;

type RecommendationType = string;

export function validateUserProfile(input: unknown): UserProfile {
  if (!input || typeof input !== 'object') throw new Error('Request body is required.');
  const raw = input as Partial<UserProfile>;
  const candidateType = raw.candidateType === 'art' || raw.candidateType === 'sports' ? raw.candidateType : 'general';
  if (!isProvince(raw.province)) throw new Error('暂不支持该省份。');
  const provinceMeta = getProvinceMeta(raw.province);
  if (provinceMeta.status === 'collecting') throw new Error(`${provinceMeta.label}录取数据仍在补充中，暂不生成正式报告。`);
  if (typeof raw.score !== 'number' || raw.score <= 0 || raw.score > 750) throw new Error('Score must be between 1 and 750.');
  if (raw.rank !== null && raw.rank !== undefined && (typeof raw.rank !== 'number' || raw.rank <= 0)) throw new Error('Rank must be a positive number.');
  if (candidateType !== 'general' && raw.province !== 'jiangxi') throw new Error('当前艺体报告仅支持江西省。');
  if (candidateType === 'art' && (typeof raw.compositeScore !== 'number' || raw.compositeScore <= 0)) throw new Error('请填写艺术类综合分/投档分。');
  if (candidateType === 'sports' && (typeof raw.professionalScore !== 'number' || raw.professionalScore <= 0)) throw new Error('请填写体育专业分。');
  if (candidateType === 'art' && !isNonEmptyString(raw.artSportsCategory)) throw new Error('请选择艺术类专业类别。');
  const normalizedSubjectCategory = candidateType === 'general'
    ? normalizeSubjectCategory(raw.subjectCategory) || getSubjectCategoryFromSelection(raw.primarySubject, raw.electiveSubjects)
    : 'physics_chemistry_biology';
  if (!normalizedSubjectCategory) throw new Error('请选择完整的3+1+2选科组合。');
  if (candidateType === 'general' && !isCareerGoal(raw.careerGoal)) throw new Error('Invalid career goal.');
  const subjectSelection = getSubjectSelection(normalizedSubjectCategory);

  return {
    candidateType,
    province: raw.province,
    score: Math.round(raw.score),
    rank: raw.rank ? Math.round(raw.rank) : null,
    professionalScore: typeof raw.professionalScore === 'number' ? raw.professionalScore : null,
    compositeScore: typeof raw.compositeScore === 'number' ? raw.compositeScore : null,
    artSportsCategory: isNonEmptyString(raw.artSportsCategory) ? raw.artSportsCategory.trim() : null,
    primarySubject: subjectSelection.primarySubject,
    electiveSubjects: subjectSelection.electiveSubjects,
    subjectCategory: subjectSelection.subjectCategory,
    preferredMajors: filterMajorsBySubject(Array.isArray(raw.preferredMajors) ? raw.preferredMajors.filter(isNonEmptyString) : [], subjectSelection.subjectCategory),
    excludedMajors: filterMajorsBySubject(Array.isArray(raw.excludedMajors) ? raw.excludedMajors.filter(isNonEmptyString) : [], subjectSelection.subjectCategory),
    preferredRegions: Array.isArray(raw.preferredRegions) ? raw.preferredRegions.filter(isRegion) : [],
    familyBackground: raw.familyBackground === 'well_off' || raw.familyBackground === 'difficult' ? raw.familyBackground : 'ordinary',
    careerGoal: isCareerGoal(raw.careerGoal) ? raw.careerGoal : 'flexible',
    strategyMode: isStrategyMode(raw.strategyMode) ? raw.strategyMode : 'safe',
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

export async function generateServerReport(userProfile: UserProfile): Promise<Report> {
  if (userProfile.candidateType === 'art' || userProfile.candidateType === 'sports') {
    return generateArtSportsReport(userProfile);
  }
  const estimatedRank = userProfile.rank ? null : await estimateRankFromAdmissionDb({ province: userProfile.province, score: userProfile.score, subjectCategory: userProfile.subjectCategory }).catch(() => null);
  const rank = userProfile.rank || estimatedRank || 0;
  const rankEstimated = !userProfile.rank;
  const rankEstimateMethod: NonNullable<Report['positionAnalysis']['rankEstimateMethod']> = userProfile.rank ? 'user' : estimatedRank ? 'admission_db' : 'score_only';
  const sourceResult = await getAdmissionsForProfile({
    province: userProfile.province,
    score: userProfile.score,
    rank,
    subjectCategory: userProfile.subjectCategory,
    preferredMajors: userProfile.preferredMajors,
    excludedMajors: userProfile.excludedMajors,
    limit: 220,
  });
  const admissions = sourceResult.records;
  if (admissions.length === 0) throw new Error('没有可用录取数据，请补充本地知识库或配置 Tavily。');
  const rankPercentile = rank > 0 ? (rank / getProvinceMeta(userProfile.province).totalStudents) * 100 : 0;
  const suitableMajors = determineSuitableMajors(userProfile);
  const matchedAdmissions = filterAdmissions(admissions, userProfile, suitableMajors);
  const relaxedAdmissions = buildRelaxedAdmissions(admissions, userProfile);
  const broadAdmissions = buildBroadAdmissions(admissions, userProfile);
  const recommendationResult = await generateRecommendationsWithFallback(matchedAdmissions, relaxedAdmissions, broadAdmissions, userProfile, rank);
  const recommendations = recommendationResult.recommendations;
  const riskWarnings = [...sourceResult.warnings, ...recommendationResult.warnings, ...generateRiskWarnings(userProfile, recommendations, rankEstimated, rankEstimateMethod)];
  const teacherKnowledge = searchTeacherKnowledge(userProfile, riskWarnings);
  const strategyInsights = buildStrategyInsights(teacherKnowledge.items);
  const riskDiagnosis = buildRiskDiagnosis(userProfile, recommendations, riskWarnings, rankEstimated, rankEstimateMethod);
  const dataSources = collectDataSources(matchedAdmissions.length > 0 ? matchedAdmissions : admissions);

  const report: Report = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userProfile,
    generatedAt: new Date(),
    positionAnalysis: {
      province: userProfile.province,
      score: userProfile.score,
      rank,
      rankEstimated,
      rankEstimateMethod,
      rankPercentile,
      positionDescription: generatePositionDescription(rankPercentile, userProfile.province, rankEstimated, rankEstimateMethod),
    },
    suitableMajors,
    recommendations,
    strategyInsights,
    riskDiagnosis,
    riskWarnings,
    dataSources,
    disclaimer: '\u672c\u62a5\u544a\u4ec5\u4f9b\u53c2\u8003\uff0c\u4e0d\u6784\u6210\u5f55\u53d6\u627f\u8bfa\u6216\u4fdd\u8bc1\u3002\u6700\u7ec8\u4ee5\u5404\u7701\u6559\u80b2\u8003\u8bd5\u9662\u53ca\u9ad8\u6821\u5b98\u65b9\u53d1\u5e03\u4e3a\u51c6\u3002',
  };
  report.aiSummary = await generateDeepSeekSummary(report);
  return report;
}

function isSubjectCategory(value: unknown): value is SubjectCategory {
  return isModernSubjectCategory(value);
}
function isCareerGoal(value: unknown): value is CareerGoal {
  return ['employment', 'postgraduate', 'stable', 'flexible'].includes(String(value));
}
function isStrategyMode(value: unknown): value is StrategyMode {
  return ['safe', 'major', 'school', 'city'].includes(String(value));
}
function isRegion(value: unknown): value is Region {
  return ['east', 'south', 'north', 'west', 'central', 'northeast'].includes(String(value));
}
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function determineSuitableMajors(userProfile: UserProfile): Report['suitableMajors'] {
  const allowedOptions = getAllowedMajorOptions(userProfile.subjectCategory);
  const allowedCategories = getAllowedMajorCategories(userProfile.subjectCategory);
  const careerCategories = getMajorCategoriesByCareerGoal(userProfile.careerGoal).filter(category => allowedCategories.includes(category));
  const recommendedCategories = [...new Set([...allowedCategories, ...careerCategories])];
  const excludedCategories = userProfile.excludedMajors.map(getMajorCategory);
  return recommendedCategories
    .filter(category => !excludedCategories.includes(category))
    .map(category => {
      const preferredInCategory = userProfile.preferredMajors.filter(major => getMajorCategory(major) === category);
      const majors = preferredInCategory.length > 0 ? preferredInCategory : allowedOptions.filter(option => option.category === category).map(option => option.name);
      return { category, majors, reasons: generateCategoryReasons(category, userProfile) };
    })
    .filter(item => item.majors.length > 0);
}

function getMajorCategoriesBySubject(subject: SubjectCategory): string[] {
  return getAllowedMajorCategories(subject);
}

function getMajorCategoriesByCareerGoal(goal: CareerGoal): string[] {
  const categories: Record<CareerGoal, string[]> = {
    employment: [C.engineering, C.management, C.economics],
    postgraduate: [C.science, C.medicine, C.engineering],
    stable: [C.law, C.education, C.medicine],
    flexible: [C.engineering, C.science, C.management, C.literature],
  };
  return categories[goal] || [];
}

function getMajorCategory(majorName: string): string {
  const categoryMap: [string, string][] = [
    ['\u8ba1\u7b97\u673a', C.engineering], ['\u8f6f\u4ef6', C.engineering], ['\u4eba\u5de5\u667a\u80fd', C.engineering], ['\u7535\u6c14', C.engineering], ['\u7535\u5b50', C.engineering], ['\u673a\u68b0', C.engineering], ['\u571f\u6728', C.engineering], ['\u6750\u6599', C.engineering],
    ['\u533b\u5b66', C.medicine], ['\u4e34\u5e8a', C.medicine], ['\u53e3\u8154', C.medicine],
    ['\u5e08\u8303', C.education], ['\u6559\u80b2', C.education],
    ['\u6587\u5b66', C.literature], ['\u6c49\u8bed\u8a00', C.literature], ['\u82f1\u8bed', C.literature], ['\u65b0\u95fb', C.literature],
    ['\u6cd5\u5b66', C.law], ['\u7ecf\u6d4e', C.economics], ['\u91d1\u878d', C.economics],
    ['\u7ba1\u7406', C.management], ['\u4f1a\u8ba1', C.management], ['\u8d22\u52a1', C.management],
    ['\u6570\u5b66', C.science], ['\u7269\u7406', C.science], ['\u5316\u5b66', C.science], ['\u5fc3\u7406', C.science], ['\u6d77\u6d0b', C.science],
  ];
  return categoryMap.find(([key]) => majorName.includes(key))?.[1] || C.management;
}

function getMajorsByCategory(category: string, preferredMajors: string[]): string[] {
  const preferredInCategory = preferredMajors.filter(major => getMajorCategory(major) === category);
  if (preferredInCategory.length > 0) return preferredInCategory;
  const popularMajors = new Map<string, string[]>([
    [C.engineering, ['\u8ba1\u7b97\u673a\u79d1\u5b66\u4e0e\u6280\u672f', '\u8f6f\u4ef6\u5de5\u7a0b', '\u4eba\u5de5\u667a\u80fd', '\u7535\u5b50\u4fe1\u606f\u5de5\u7a0b']],
    [C.science, ['\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66', '\u7269\u7406\u5b66', '\u5316\u5b66', '\u751f\u7269\u79d1\u5b66']],
    [C.medicine, ['\u4e34\u5e8a\u533b\u5b66', '\u53e3\u8154\u533b\u5b66', '\u9884\u9632\u533b\u5b66', '\u836f\u5b66']],
    [C.literature, ['\u6c49\u8bed\u8a00\u6587\u5b66', '\u82f1\u8bed', '\u65b0\u95fb\u4f20\u64ad\u5b66']],
    [C.law, ['\u6cd5\u5b66', '\u77e5\u8bc6\u4ea7\u6743']],
    [C.education, ['\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66(\u5e08\u8303)', '\u6c49\u8bed\u8a00\u6587\u5b66(\u5e08\u8303)', '\u82f1\u8bed(\u5e08\u8303)']],
    [C.management, ['\u5de5\u5546\u7ba1\u7406', '\u4f1a\u8ba1\u5b66', '\u8d22\u52a1\u7ba1\u7406']],
    [C.economics, ['\u7ecf\u6d4e\u5b66', '\u91d1\u878d\u5b66', '\u56fd\u9645\u7ecf\u6d4e\u4e0e\u8d38\u6613']],
    [C.agriculture, ['\u519c\u5b66', '\u56ed\u827a', '\u52a8\u7269\u533b\u5b66']],
  ]);
  return popularMajors.get(category) || [];
}

function generateCategoryReasons(category: string, userProfile: UserProfile): string[] {
  const reasons = [`\u60a8\u7684\u9009\u79d1\u7ec4\u5408\u53ef\u4f18\u5148\u5173\u6ce8${category}\u7c7b\u4e13\u4e1a`];
  if (userProfile.careerGoal === 'employment' && [C.engineering, C.management, C.economics].includes(category as typeof C.engineering)) reasons.push(`${category}\u7c7b\u4e13\u4e1a\u66f4\u8d34\u8fd1\u5c31\u4e1a\u4f18\u5148\u8bc9\u6c42`);
  if (userProfile.careerGoal === 'postgraduate' && [C.science, C.medicine, C.engineering].includes(category as typeof C.science)) reasons.push(`${category}\u7c7b\u4e13\u4e1a\u9002\u5408\u7ee7\u7eed\u6df1\u9020\u8def\u5f84`);
  if (userProfile.careerGoal === 'stable' && [C.law, C.education, C.medicine].includes(category as typeof C.law)) reasons.push(`${category}\u7c7b\u4e13\u4e1a\u66f4\u8d34\u8fd1\u7a33\u5b9a\u5c31\u4e1a\u8bc9\u6c42`);
  return reasons;
}

function filterAdmissions(admissions: AdmissionRecord[], userProfile: UserProfile, suitableMajors: Report['suitableMajors']): AdmissionRecord[] {
  const suitableCategories = suitableMajors.map(item => item.category);
  const userRank = userProfile.rank || 0;
  return admissions.filter(record => {
    const subjectMatch = isAdmissionRecordAllowedForSubject(record, userProfile.subjectCategory);
    const majorMatch = userProfile.preferredMajors.length === 0 || isRelatedToPreferences(record, userProfile) || suitableCategories.includes(record.majorCategory);
    const notExcluded = !userProfile.excludedMajors.some(excluded => record.majorName.includes(excluded) || getMajorCategory(record.majorName) === getMajorCategory(excluded));
    const scoreWindow = record.lowestScore <= 0 || Math.abs(record.lowestScore - userProfile.score) <= 80;
    const rankWindow = userRank <= 0 || record.lowestRank <= 0 || Math.abs(record.lowestRank - userRank) <= 70000 || record.lowestRank > userRank;
    return subjectMatch && majorMatch && notExcluded && scoreWindow && rankWindow;
  });
}

function buildRelaxedAdmissions(admissions: AdmissionRecord[], userProfile: UserProfile): AdmissionRecord[] {
  const userRank = userProfile.rank || 0;
  return admissions.filter(record => {
    const subjectMatch = isAdmissionRecordAllowedForSubject(record, userProfile.subjectCategory);
    const notExcluded = !userProfile.excludedMajors.some(excluded => record.majorName.includes(excluded) || getMajorCategory(record.majorName) === getMajorCategory(excluded));
    const scoreWindow = record.lowestScore <= 0 || Math.abs(record.lowestScore - userProfile.score) <= 140;
    const rankWindow = userRank <= 0 || record.lowestRank <= 0 || Math.abs(record.lowestRank - userRank) <= 160000 || record.lowestRank > userRank;
    return subjectMatch && notExcluded && scoreWindow && rankWindow;
  });
}

function buildBroadAdmissions(admissions: AdmissionRecord[], userProfile: UserProfile): AdmissionRecord[] {
  const userRank = userProfile.rank || 0;
  return admissions.filter(record => {
    const subjectMatch = isAdmissionRecordAllowedForSubject(record, userProfile.subjectCategory);
    const notExcluded = !userProfile.excludedMajors.some(excluded => record.majorName.includes(excluded) || getMajorCategory(record.majorName) === getMajorCategory(excluded));
    const scoreWindow = record.lowestScore <= 0 || Math.abs(record.lowestScore - userProfile.score) <= 180;
    const rankWindow = userRank <= 0 || record.lowestRank <= 0 || Math.abs(record.lowestRank - userRank) <= 240000 || record.lowestRank > userRank;
    return subjectMatch && notExcluded && scoreWindow && rankWindow;
  });
}

async function generateRecommendations(admissions: AdmissionRecord[], userProfile: UserProfile, userRank: number): Promise<Report['recommendations']> {
  const valid = await buildRecommendationCandidates(admissions, userProfile, userRank);
  return assembleRecommendations(valid);
}

type RecommendationResult = { recommendations: Report['recommendations']; warnings: string[] };

async function generateRecommendationsWithFallback(
  matchedAdmissions: AdmissionRecord[],
  relaxedAdmissions: AdmissionRecord[],
  broadAdmissions: AdmissionRecord[],
  userProfile: UserProfile,
  userRank: number,
): Promise<RecommendationResult> {
  const strictCandidates = await buildRecommendationCandidates(matchedAdmissions, userProfile, userRank);
  const relaxedCandidates = await buildRecommendationCandidates(relaxedAdmissions, userProfile, userRank);
  const broadCandidates = await buildRecommendationCandidates(broadAdmissions, userProfile, userRank);
  const warnings: string[] = [];
  const merged = [...strictCandidates];
  const noPreferenceMode = userProfile.preferredMajors.length === 0 && userProfile.preferredRegions.length === 0;

  const addFallback = (type: RecommendationType, minCount: number) => {
    const current = merged.filter(item => item.recommendationType === type).length;
    if (current >= minCount) return;
    const fallbackPool = type === C.guarantee ? [...relaxedCandidates, ...broadCandidates] : noPreferenceMode ? [...relaxedCandidates, ...broadCandidates] : relaxedCandidates;
    const fallback = fallbackPool
      .filter(item => item.recommendationType === type && !merged.some(existing => sameRecommendation(existing, item)))
      .slice(0, minCount - current);
    if (fallback.length > 0) {
      merged.push(...fallback.map(item => noPreferenceMode ? markBroadRecommendation(item) : type === C.guarantee ? markExpandedGuaranteeRecommendation(item) : markFallbackRecommendation(item)));
      warnings.push(noPreferenceMode ? `${type}\u5019\u9009\u6570\u91cf\u4e0d\u8db3\uff0c\u5df2\u6309\u5206\u6570/\u4f4d\u6b21\u4f18\u5148\u8865\u5145\u5e7f\u8c31\u9662\u6821\u3002` : type === C.guarantee ? '\u4fdd\u5e95\u5019\u9009\u6570\u91cf\u4e0d\u8db3\uff0c\u5df2\u5728\u9075\u5b88\u9009\u79d1\u786c\u89c4\u5219\u7684\u524d\u63d0\u4e0b\u653e\u5bbd\u4e13\u4e1a\u6216\u5730\u57df\u504f\u597d\uff0c\u8865\u5145\u6269\u5c55\u4fdd\u5e95\u3002' : `${type}\u5019\u9009\u6570\u91cf\u4e0d\u8db3\uff0c\u5df2\u653e\u5bbd\u4e13\u4e1a\u6216\u5730\u57df\u6761\u4ef6\u8865\u5145\u76f8\u8fd1\u9662\u6821\u3002`);
    }
  };
  addFallback(C.stable, noPreferenceMode ? 5 : 3);
  addFallback(C.guarantee, noPreferenceMode ? 4 : 2);
  addFallback(C.sprint, noPreferenceMode ? 3 : 2);

  return { recommendations: assembleRecommendations(merged.sort((a, b) => b.matchScore - a.matchScore)), warnings: [...new Set(warnings)] };
}

async function buildRecommendationCandidates(admissions: AdmissionRecord[], userProfile: UserProfile, userRank: number): Promise<Recommendation[]> {
  const grouped = groupAdmissionHistory(admissions);
  const candidates = await Promise.all([...grouped.values()].map(records => createRecommendation(records, userProfile, userRank)));
  return candidates.filter((item): item is Recommendation => Boolean(item)).sort((a, b) => b.matchScore - a.matchScore);
}

function assembleRecommendations(valid: Recommendation[]): Report['recommendations'] {
  return {
    sprint: diversifyRecommendations(valid.filter(item => item.recommendationType === C.sprint), 6),
    stable: diversifyRecommendations(valid.filter(item => item.recommendationType === C.stable), 8),
    guarantee: diversifyRecommendations(valid.filter(item => item.recommendationType === C.guarantee), 6),
    opportunities: diversifyRecommendations(valid.filter(item => item.isOpportunity), 5),
  };
}

function sameRecommendation(a: Recommendation, b: Recommendation): boolean {
  return a.university.name === b.university.name && a.major.name === b.major.name;
}

function markFallbackRecommendation(item: Recommendation): Recommendation {
  return {
    ...item,
    matchScore: Math.max(1, item.matchScore - 6),
    reasons: [...item.reasons, '该候选来自放宽条件后的补充匹配，需重点复核专业、地域和招生计划。'],
    riskNotes: item.riskNotes ? `${item.riskNotes}；该项为补充候选，请谨慎排序。` : '该项为补充候选，建议结合专业接受度、城市和招生章程谨慎判断。',
  };
}


function markExpandedGuaranteeRecommendation(item: Recommendation): Recommendation {
  return {
    ...item,
    matchScore: Math.max(1, item.matchScore - 4),
    reasons: [...item.reasons, '\u6269\u5c55\u4fdd\u5e95\uff1a\u5728\u4fdd\u5e95\u6570\u91cf\u4e0d\u8db3\u65f6\u8865\u5165\uff0c\u5df2\u653e\u5bbd\u4e13\u4e1a\u6216\u5730\u57df\u504f\u597d\uff0c\u4f46\u4ecd\u4fdd\u7559\u9009\u79d1\u8981\u6c42\u548c\u4e13\u4e1a\u65b9\u5411\u786c\u6821\u9a8c\u3002'],
    riskNotes: item.riskNotes ? `${item.riskNotes}\uff1b\u8be5\u9879\u4e3a\u6269\u5c55\u4fdd\u5e95\uff0c\u6b63\u5f0f\u586b\u62a5\u524d\u4ecd\u9700\u786e\u8ba4\u4e13\u4e1a\u3001\u6821\u533a\u3001\u5b66\u8d39\u548c\u62db\u751f\u8ba1\u5212\u3002` : '\u8be5\u9879\u4e3a\u6269\u5c55\u4fdd\u5e95\uff0c\u6b63\u5f0f\u586b\u62a5\u524d\u4ecd\u9700\u786e\u8ba4\u4e13\u4e1a\u3001\u6821\u533a\u3001\u5b66\u8d39\u548c\u62db\u751f\u8ba1\u5212\u3002',
  };
}

function markBroadRecommendation(item: Recommendation): Recommendation {
  return {
    ...item,
    matchScore: Math.max(1, item.matchScore - 2),
    reasons: [...item.reasons, '你未限定专业或地域，系统按分数、位次和选科优先补充广谱候选。'],
    riskNotes: item.riskNotes || '该项为广谱匹配候选，建议结合专业接受度、城市、学费和招生计划进一步筛选。',
  };
}

function groupAdmissionHistory(admissions: AdmissionRecord[]): Map<string, AdmissionRecord[]> {
  const map = new Map<string, AdmissionRecord[]>();
  for (const record of admissions) {
    const key = `${record.universityCode}::${record.majorName}`;
    const existing = map.get(key) || [];
    existing.push(record);
    map.set(key, existing.sort((a, b) => b.year - a.year));
  }
  return map;
}

function diversifyRecommendations(items: Recommendation[], limit: number): Recommendation[] {
  const selected: Recommendation[] = [];
  const remaining = [...items];
  const categoryCount = new Map<string, number>();
  const universityCount = new Map<string, number>();

  while (selected.length < limit && remaining.length > 0) {
    const index = remaining.findIndex(item => {
      const category = item.major.category;
      const university = item.university.name;
      const maxPerCategory = selected.length < Math.ceil(limit * 0.75) ? 2 : 3;
      return (categoryCount.get(category) || 0) < maxPerCategory && (universityCount.get(university) || 0) < 2;
    });
    const pickIndex = index >= 0 ? index : 0;
    const [picked] = remaining.splice(pickIndex, 1);
    selected.push(picked);
    categoryCount.set(picked.major.category, (categoryCount.get(picked.major.category) || 0) + 1);
    universityCount.set(picked.university.name, (universityCount.get(picked.university.name) || 0) + 1);
  }
  return selected;
}

async function createRecommendation(records: AdmissionRecord[], userProfile: UserProfile, userRank: number): Promise<Recommendation | null> {
  const latest = records[0];
  if (!latest) return null;
  const hasRankEvidence = userRank > 0 && latest.lowestRank > 0;
  const hasUserProvidedRank = Boolean(userProfile.rank);
  const scoreDiff = userProfile.score - latest.lowestScore;
  const rankDiff = hasRankEvidence ? latest.lowestRank - userRank : Math.round((userProfile.score - latest.lowestScore) * 1000);
  const trend = calculateRankTrend(records);
  const recommendationType = classifyRecommendation(rankDiff, latest.lowestRank, userRank, trend, scoreDiff, hasUserProvidedRank);
  if (!recommendationType) return null;
  const matchScore = adjustMatchScoreForEstimatedRank(calculateMatchScore(latest, userProfile, rankDiff, trend), recommendationType, scoreDiff, hasUserProvidedRank);
  const riskLevel = assessRisk(rankDiff, trend);
  const university = fallbackUniversity(latest);
  const major = fallbackMajor(latest);
  const isOpportunity = detectOpportunity(records, userRank, latest, trend);
  return {
    university,
    major,
    admissionRecord: latest,
    recommendationType,
    matchScore,
    admissionChance: calculateAdmissionChance(rankDiff, trend, recommendationType),
    rankDiff,
    isOpportunity,
    reasons: generateRecommendationReasons(latest, userProfile, rankDiff, trend, isOpportunity),
    evidence: records.slice(0, 3).map(record => ({ year: record.year, lowestScore: record.lowestScore, lowestRank: record.lowestRank, averageScore: record.averageScore, sourceName: record.dataSource, sourceUrl: record.sourceUrl })),
    riskLevel,
    riskNotes: generateRiskNotes(rankDiff, trend, recommendationType),
  };
}

interface RankWindow {
  sprintMax: number;
  stableMax: number;
  guaranteeMax: number;
}

function classifyRecommendation(rankDiff: number, admissionRank: number, userRank: number, trend: number, scoreDiff: number, hasUserProvidedRank: boolean): RecommendationType | null {
  if (admissionRank <= 0 || userRank <= 0) return classifyScoreFallbackRecommendation(rankDiff);
  const window = getRankWindow(Math.min(admissionRank, userRank));
  if (rankDiff < 0) {
    const overreach = Math.abs(rankDiff);
    if (overreach > window.sprintMax) return null;
    if (trend < -5000 && overreach > Math.round(window.sprintMax * 0.65)) return null;
    return C.sprint;
  }

  let type: RecommendationType = rankDiff <= window.stableMax ? C.stable : C.guarantee;
  if (rankDiff > window.guaranteeMax) return null;
  if (trend < -3000) {
    if (type === C.guarantee) type = C.stable;
    else if (type === C.stable) type = C.sprint;
  }
  return hasUserProvidedRank ? type : applyEstimatedRankScoreGuard(type, scoreDiff);
}

function applyEstimatedRankScoreGuard(type: RecommendationType, scoreDiff: number): RecommendationType | null {
  if (scoreDiff < -10) return null;
  if (scoreDiff < 0) return C.sprint;
  return type;
}

function classifyScoreFallbackRecommendation(rankDiff: number): RecommendationType | null {
  if (rankDiff < -15000) return null;
  if (rankDiff < -5000) return C.sprint;
  if (rankDiff <= 10000) return C.stable;
  if (rankDiff <= 45000) return C.guarantee;
  return null;
}

function getRankWindow(anchorRank: number): RankWindow {
  if (anchorRank <= 5000) return { sprintMax: 2500, stableMax: 3000, guaranteeMax: 8000 };
  if (anchorRank <= 10000) return { sprintMax: 4000, stableMax: 5000, guaranteeMax: 12000 };
  if (anchorRank <= 30000) return { sprintMax: 8000, stableMax: 9000, guaranteeMax: 30000 };
  if (anchorRank <= 80000) return { sprintMax: 15000, stableMax: 15000, guaranteeMax: 60000 };
  return { sprintMax: 25000, stableMax: 18000, guaranteeMax: 90000 };
}

function calculateRankTrend(records: AdmissionRecord[]): number {
  if (records.length < 2) return 0;
  return records[0].lowestRank - records[1].lowestRank;
}
function calculateMatchScore(record: AdmissionRecord, userProfile: UserProfile, rankDiff: number, trend: number): number {
  let score = 72;
  if (rankDiff >= 0 && rankDiff <= 5000) score += 15;
  else if (rankDiff > 5000 && rankDiff <= 15000) score += 10;
  else if (rankDiff < 0 && Math.abs(rankDiff) <= 8000) score += 4;
  else if (rankDiff < -12000) score -= 18;
  const preferenceScore = calculatePreferenceScore(record, userProfile);
  score += preferenceScore;
  const isHighLevelSchool = ['985', '211', 'double_first_class'].includes(record.universityLevel);
  if (isHighLevelSchool) score += 3;
  if (userProfile.preferredRegions.length > 0 && userProfile.preferredRegions.includes(getRegionByProvince(record.province))) score += 4;
  if (trend > 3000) score += 5;
  if (trend < -3000) score -= 4;
  score += calculateStrategyAdjustment(record, userProfile, rankDiff, preferenceScore, isHighLevelSchool);
  return Math.max(1, Math.min(100, Math.round(score)));
}
function adjustMatchScoreForEstimatedRank(score: number, type: RecommendationType, scoreDiff: number, hasUserProvidedRank: boolean): number {
  if (hasUserProvidedRank) return score;
  if (type === C.sprint) return Math.min(score, scoreDiff < 0 ? 78 : 82);
  if (type === C.stable && scoreDiff <= 5) return Math.min(score, 88);
  return score;
}
function calculateStrategyAdjustment(record: AdmissionRecord, userProfile: UserProfile, rankDiff: number, preferenceScore: number, isHighLevelSchool: boolean): number {
  const mode = userProfile.strategyMode || 'safe';
  if (mode === 'safe') {
    if (rankDiff >= 0 && rankDiff <= 18000) return 7;
    if (rankDiff < -8000) return -10;
    return 0;
  }
  if (mode === 'major') {
    return preferenceScore > 0 ? 8 : userProfile.preferredMajors.length > 0 ? -4 : 0;
  }
  if (mode === 'school') {
    if (isHighLevelSchool) return 8;
    if (record.universityLevel === 'ordinary') return 2;
    return 0;
  }
  if (mode === 'city') {
    if (userProfile.preferredRegions.length === 0) return 0;
    return userProfile.preferredRegions.includes(getRegionByProvince(record.province)) ? 10 : -5;
  }
  return 0;
}
function calculatePreferenceScore(record: AdmissionRecord, userProfile: UserProfile): number {
  if (isDirectPreferenceMatch(record, userProfile)) return 10;
  if (isRelatedToPreferences(record, userProfile)) return 5;
  return 0;
}
function isDirectPreferenceMatch(record: AdmissionRecord, userProfile: UserProfile): boolean {
  return userProfile.preferredMajors.some(major => record.majorName.includes(major) || major.includes(record.majorName));
}
function isRelatedToPreferences(record: AdmissionRecord, userProfile: UserProfile): boolean {
  if (userProfile.preferredMajors.length === 0) return true;
  const recordCategory = getMajorCategory(record.majorName);
  return userProfile.preferredMajors.some(major => {
    const preferredCategory = getMajorCategory(major);
    return recordCategory === preferredCategory || getAdjacentMajorCategories(preferredCategory).includes(recordCategory);
  });
}
function getAdjacentMajorCategories(category: string): string[] {
  const adjacent = new Map<string, string[]>([
    [C.economics, [C.management, C.law, C.science]],
    [C.management, [C.economics, C.engineering, C.law]],
    [C.engineering, [C.science, C.management]],
    [C.science, [C.engineering, C.medicine, C.economics]],
    [C.medicine, [C.science, C.engineering]],
    [C.law, [C.economics, C.management, C.literature]],
    [C.literature, [C.law, C.education, C.management]],
    [C.education, [C.literature, C.science]],
    [C.agriculture, [C.science, C.engineering]],
  ]);
  return adjacent.get(category) || [];
}
function calculateAdmissionChance(rankDiff: number, trend: number, type: RecommendationType): number {
  const base = type === C.guarantee ? 82 : type === C.stable ? 62 : 32;
  const rankAdjust = Math.max(-18, Math.min(18, rankDiff / 1200));
  const trendAdjust = Math.max(-8, Math.min(8, trend / 1500));
  return Math.max(5, Math.min(95, Math.round(base + rankAdjust + trendAdjust)));
}
function detectOpportunity(records: AdmissionRecord[], userRank: number, latest: AdmissionRecord, trend: number): boolean {
  const rankDiff = latest.lowestRank - userRank;
  return records.length >= 2 && trend > 2500 && rankDiff >= -3000 && rankDiff <= 12000;
}
function assessRisk(rankDiff: number, trend: number): 'low' | 'medium' | 'high' {
  if (rankDiff < -10000 || trend < -6000) return 'high';
  if (rankDiff < 0 || trend < -2500) return 'medium';
  return 'low';
}


function generateRecommendationReasons(record: AdmissionRecord, userProfile: UserProfile, rankDiff: number, trend: number, isOpportunity: boolean): string[] {
  const reasons: string[] = [];
  if (userProfile.rank && record.lowestRank > 0) reasons.push(`\u53c2\u8003${record.year}\u5e74\u6700\u4f4e\u4f4d\u6b21${record.lowestRank}\uff0c\u4e0e\u4f60\u7684\u4f4d\u6b21\u5dee\u7ea6${Math.abs(rankDiff)}\u540d`);
  else if (record.lowestRank > 0 && rankDiff !== 0) reasons.push(`\u53c2\u8003${record.year}\u5e74\u6700\u4f4e\u4f4d\u6b21${record.lowestRank}\uff0c\u6309\u5206\u6570\u4f30\u7b97\u4f4d\u6b21\u5dee\u7ea6${Math.abs(rankDiff)}\u540d\uff1b${formatScoreDiffReason(userProfile.score - record.lowestScore)}`);
  else reasons.push(`\u53c2\u8003${record.year}\u5e74\u6700\u4f4e\u5206${record.lowestScore}\uff0c${formatScoreDiffReason(userProfile.score - record.lowestScore)}`);
  if (trend > 0) reasons.push(`\u8fd1\u5e74\u5f55\u53d6\u6700\u4f4e\u4f4d\u6b21\u6709\u653e\u5bbd\u8d8b\u52bf\uff0c\u8f83\u4e0a\u4e00\u5e74\u589e\u52a0\u7ea6${trend}\u540d`);
  if (trend < 0) reasons.push(`\u8fd1\u5e74\u5f55\u53d6\u6700\u4f4e\u4f4d\u6b21\u6709\u6536\u7d27\u8d8b\u52bf\uff0c\u8f83\u4e0a\u4e00\u5e74\u6536\u7d27\u7ea6${Math.abs(trend)}\u540d`);
  if (isDirectPreferenceMatch(record, userProfile)) reasons.push('\u5339\u914d\u4f60\u7684\u4e13\u4e1a\u504f\u597d');
  else if (isRelatedToPreferences(record, userProfile)) reasons.push('\u5c5e\u4e8e\u4f60\u5173\u6ce8\u65b9\u5411\u7684\u76f8\u8fd1\u4e13\u4e1a\uff0c\u7528\u4e8e\u6269\u5c55\u51b2\u7a33\u4fdd\u9009\u62e9');
  const strategyReason = getStrategyReason(record, userProfile, rankDiff);
  if (strategyReason) reasons.push(strategyReason);
  if (isOpportunity) reasons.push('\u5386\u53f2\u4f4d\u6b21\u6ce2\u52a8\u63d0\u4f9b\u4e86\u4e00\u5b9a\u6361\u6f0f\u7a7a\u95f4\uff0c\u4f46\u9700\u8981\u63a7\u5236\u98ce\u9669');
  return reasons;
}
function formatScoreDiffReason(scoreDiff: number): string {
  if (scoreDiff > 0) return `\u4f60\u9ad8\u51fa\u8be5\u7ebf\u7ea6${scoreDiff}\u5206`;
  if (scoreDiff < 0) return `\u8be5\u7ebf\u9ad8\u51fa\u4f60\u7ea6${Math.abs(scoreDiff)}\u5206`;
  return '\u4e0e\u4f60\u5206\u6570\u6301\u5e73';
}
function getStrategyReason(record: AdmissionRecord, userProfile: UserProfile, rankDiff: number): string | undefined {
  const mode = userProfile.strategyMode || 'safe';
  if (mode === 'safe' && rankDiff >= 0) return '当前策略为稳妥优先，系统优先保留位次安全垫更明确的候选。';
  if (mode === 'major' && isRelatedToPreferences(record, userProfile)) return '当前策略为专业优先，该候选与专业方向更接近。';
  if (mode === 'school' && ['985', '211', 'double_first_class'].includes(record.universityLevel)) return '当前策略为学校层次优先，该校层次对排序有加权。';
  if (mode === 'city' && userProfile.preferredRegions.includes(getRegionByProvince(record.province))) return '当前策略为城市优先，该候选匹配你的地域偏好。';
  return undefined;
}
function generateRiskNotes(rankDiff: number, trend: number, type: RecommendationType): string | undefined {
  if (type === C.sprint) return '\u51b2\u523a\u5fd7\u613f\u5b58\u5728\u4e0d\u786e\u5b9a\u6027\uff0c\u5efa\u8bae\u653e\u5728\u524d\u90e8\u5e76\u642d\u914d\u8db3\u591f\u7a33\u59a5\u548c\u4fdd\u5e95\u5fd7\u613f';
  if (trend < -3000) return '\u8fd1\u5e74\u5f55\u53d6\u4f4d\u6b21\u6536\u7d27\uff0c\u9700\u5173\u6ce8\u5f53\u5e74\u62db\u751f\u8ba1\u5212\u53d8\u5316';
  if (type === C.guarantee) return '\u4fdd\u5e95\u5fd7\u613f\u4ecd\u9700\u786e\u8ba4\u9009\u79d1\u8981\u6c42\u3001\u5b66\u8d39\u548c\u6821\u533a\u7b49\u7ec6\u8282';
  return undefined;
}
function generateRiskWarnings(userProfile: UserProfile, recommendations: Report['recommendations'], rankEstimated: boolean, rankEstimateMethod: NonNullable<Report['positionAnalysis']['rankEstimateMethod']>): string[] {
  const warnings: string[] = [];
  const provinceMeta = getProvinceMeta(userProfile.province);
  if (rankEstimated && rankEstimateMethod === 'admission_db') warnings.push('\u5f53\u524d\u4f4d\u6b21\u7531\u8fd1\u5e74\u540c\u7701\u540c\u9009\u79d1\u5f55\u53d6\u6570\u636e\u4f30\u7b97\uff0c\u5efa\u8bae\u586b\u5199\u771f\u5b9e\u4e00\u5206\u4e00\u6bb5\u4f4d\u6b21\u540e\u91cd\u65b0\u751f\u6210');
  if (rankEstimated && rankEstimateMethod === 'score_only') warnings.push('\u672a\u586b\u5199\u4f4d\u6b21\uff0c\u672c\u6b21\u6ca1\u6709\u4f7f\u7528\u7c97\u7565\u4f4d\u6b21\u4f30\u7b97\uff0c\u6539\u4e3a\u6309\u5206\u6570\u5dee\u5339\u914d\u9662\u6821\u548c\u4e13\u4e1a');
  if (provinceMeta.quality !== 'A') warnings.push(`${provinceMeta.label}当前为${provinceMeta.quality}级数据覆盖：本地库覆盖年份为${provinceMeta.years.join('、')}，共${provinceMeta.recordCount}条记录，建议结合考试院和高校官网复核。`);
  if (recommendations.guarantee.length < 2) warnings.push('\u4fdd\u5e95\u5fd7\u613f\u6570\u91cf\u4e0d\u8db3\uff0c\u5efa\u8bae\u81f3\u5c11\u4fdd\u75592\u4e2a\u66f4\u5b89\u5168\u7684\u4fdd\u5e95\u9009\u62e9');
  if (recommendations.sprint.length > recommendations.stable.length + recommendations.guarantee.length) warnings.push('\u51b2\u523a\u5fd7\u613f\u5360\u6bd4\u504f\u9ad8\uff0c\u5efa\u8bae\u964d\u4f4e\u6574\u4f53\u98ce\u9669');
  if (userProfile.preferredMajors.length > 0 && userProfile.preferredMajors.length < 3) warnings.push('\u4e13\u4e1a\u504f\u597d\u8f83\u7a84\uff0c\u53ef\u80fd\u51cf\u5c11\u53ef\u9009\u9662\u6821\u8303\u56f4');
  warnings.push('\u5f55\u53d6\u7ed3\u679c\u53d7\u62db\u751f\u8ba1\u5212\u3001\u9009\u79d1\u8981\u6c42\u548c\u5f53\u5e74\u62a5\u8003\u70ed\u5ea6\u5f71\u54cd\uff0c\u8bf7\u4ee5\u5b98\u65b9\u53d1\u5e03\u4e3a\u51c6');
  return warnings;
}
function buildStrategyInsights(items: { title: string; category: string; content: string; source: string }[]): Report['strategyInsights'] {
  return items.slice(0, 5).map(item => ({ title: item.title, category: item.category, summary: summarizeKnowledge(item.content), source: item.source }));
}
function summarizeKnowledge(content: string): string {
  const plain = content.replace(/^# .+$/m, '').replace(/\n+/g, ' ').trim();
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
}
function buildRiskDiagnosis(userProfile: UserProfile, recommendations: Report['recommendations'], warnings: string[], rankEstimated: boolean, rankEstimateMethod: NonNullable<Report['positionAnalysis']['rankEstimateMethod']>): Report['riskDiagnosis'] {
  const risks: NonNullable<Report['riskDiagnosis']> = [];
  if (rankEstimated && rankEstimateMethod === 'admission_db') risks.push({ type: 'rank', level: 'medium', message: '\u5f53\u524d\u4f7f\u7528\u6570\u636e\u5e93\u4f30\u7b97\u4f4d\u6b21', suggestion: '\u62ff\u5230\u4e00\u5206\u4e00\u6bb5\u8868\u540e\u7684\u771f\u5b9e\u4f4d\u6b21\u540e\u91cd\u65b0\u751f\u6210\uff0c\u63a8\u8350\u4f1a\u66f4\u51c6\u3002' });
  if (rankEstimated && rankEstimateMethod === 'score_only') risks.push({ type: 'rank', level: 'medium', message: '\u672a\u586b\u5199\u4f4d\u6b21\uff0c\u6309\u5206\u6570\u5339\u914d', suggestion: '\u7cfb\u7edf\u672a\u751f\u6210\u865a\u5047\u4f4d\u6b21\uff0c\u5df2\u6539\u4e3a\u6309\u5f55\u53d6\u5206\u5dee\u5206\u5c42\uff1b\u5efa\u8bae\u8865\u5145\u5b98\u65b9\u4f4d\u6b21\u540e\u590d\u6838\u3002' });
  if (recommendations.guarantee.length < 2) risks.push({ type: 'rank', level: 'high', message: '\u4fdd\u5e95\u5fd7\u613f\u6570\u91cf\u504f\u5c11', suggestion: '\u6269\u5927\u5730\u57df\u6216\u964d\u4f4e\u9662\u6821\u5c42\u7ea7\uff0c\u81f3\u5c11\u8865\u8db32\u4e2a\u53ef\u63a5\u53d7\u7684\u4fdd\u5e95\u9009\u62e9\u3002' });
  if (userProfile.preferredMajors.length > 0 && userProfile.preferredMajors.length < 3) risks.push({ type: 'major', level: 'medium', message: '\u4e13\u4e1a\u504f\u597d\u8fc7\u7a84', suggestion: '\u5728\u4e3b\u4e13\u4e1a\u4e4b\u5916\u589e\u52a0\u76f8\u8fd1\u4e13\u4e1a\uff0c\u4f8b\u5982\u7535\u5b50\u4fe1\u606f\u3001\u81ea\u52a8\u5316\u3001\u6570\u636e\u79d1\u5b66\u7b49\u5907\u9009\u65b9\u5411\u3002' });
  if (userProfile.preferredRegions.length === 0) risks.push({ type: 'region', level: 'low', message: '\u5730\u57df\u504f\u597d\u672a\u660e\u786e', suggestion: '\u786e\u8ba4\u80fd\u63a5\u53d7\u7684\u57ce\u5e02\u548c\u4e0d\u80fd\u63a5\u53d7\u7684\u5730\u533a\uff0c\u907f\u514d\u540e\u7eed\u5f55\u53d6\u540e\u53cd\u6094\u3002' });
  if (warnings.some(item => item.includes('Tavily') || item.includes('\u7f51\u9875'))) risks.push({ type: 'data', level: 'medium', message: '\u5b58\u5728\u7f51\u9875\u8865\u5145\u8bc1\u636e', suggestion: '\u7f51\u9875\u4fe1\u606f\u53ea\u4f5c\u8865\u5145\uff0c\u6700\u7ec8\u4ee5\u7701\u8003\u8bd5\u9662\u548c\u9ad8\u6821\u62db\u751f\u7f51\u53d1\u5e03\u4e3a\u51c6\u3002' });
  return risks.slice(0, 6);
}
function collectDataSources(records: AdmissionRecord[]): Report['dataSources'] {
  const map = new Map<string, Report['dataSources'][number]>();
  for (const record of records) {
    const key = `${record.dataSource}-${record.year}`;
    if (!map.has(key)) map.set(key, { name: record.dataSource, year: record.year, url: record.sourceUrl, collectedAt: record.collectedAt });
  }
  return [...map.values()].sort((a, b) => b.year - a.year).slice(0, 8);
}
function generatePositionDescription(rankPercentile: number, province: Province, rankEstimated: boolean, rankEstimateMethod: NonNullable<Report['positionAnalysis']['rankEstimateMethod']>): string {
  if (rankEstimateMethod === 'score_only') return `\u672a\u586b\u5199\u4f4d\u6b21\uff0c\u4e14\u672c\u5730\u6570\u636e\u672a\u80fd\u7a33\u5b9a\u63a8\u5b9a\u540c\u9009\u79d1\u4f4d\u6b21\uff1b\u7cfb\u7edf\u672a\u4f7f\u7528\u7c97\u7565\u516c\u5f0f\u4f30\u7b97\uff0c\u672c\u6b21\u6309\u5206\u6570\u5dee\u8fdb\u884c\u51b2\u7a33\u4fdd\u5339\u914d\u3002`;
  const prefix = rankEstimated ? '\u6309\u8fd1\u5e74\u5f55\u53d6\u6570\u636e\u4f30\u7b97\uff1a' : '';
  const provinceName = getProvinceLabel(province);
  if (rankPercentile < 5) return `${prefix}\u5728${provinceName}\u7ea6\u5904\u4e8e\u524d${rankPercentile.toFixed(1)}%\uff0c\u53ef\u91cd\u70b9\u5173\u6ce8\u9ad8\u5c42\u6b21\u9662\u6821\u7684\u51b2\u7a33\u7ec4\u5408\u3002`;
  if (rankPercentile < 15) return `${prefix}\u5728${provinceName}\u7ea6\u5904\u4e8e\u524d${rankPercentile.toFixed(1)}%\uff0c\u5efa\u8bae\u517c\u987e\u4f18\u8d28\u9662\u6821\u548c\u4e13\u4e1a\u5339\u914d\u3002`;
  if (rankPercentile < 30) return `${prefix}\u5728${provinceName}\u5904\u4e8e\u4e2d\u4e0a\u533a\u95f4\uff0c\u9002\u5408\u7528\u51b2\u523a\u3001\u7a33\u59a5\u3001\u4fdd\u5e95\u5f62\u6210\u68af\u5ea6\u3002`;
  if (rankPercentile < 50) return `${prefix}\u5728${provinceName}\u5904\u4e8e\u4e2d\u4f4d\u533a\u95f4\uff0c\u5efa\u8bae\u4f18\u5148\u4fdd\u8bc1\u7a33\u59a5\u548c\u4fdd\u5e95\u5fd7\u613f\u6570\u91cf\u3002`;
  return `${prefix}\u5728${provinceName}\u7ade\u4e89\u538b\u529b\u8f83\u9ad8\uff0c\u5e94\u91cd\u70b9\u63a7\u5236\u98ce\u9669\u5e76\u6269\u5927\u9662\u6821\u4e13\u4e1a\u8303\u56f4\u3002`;
}
function getRegionByProvince(province: Province): Region {
  return getProvinceMeta(province).region;
}
function fallbackUniversity(record: AdmissionRecord): University {
  return { code: record.universityCode, name: record.universityName, province: record.province, city: '\u5f85\u8865\u5145', level: record.universityLevel, type: inferUniversityType(record.universityName, record.majorCategory) };
}
function fallbackMajor(record: AdmissionRecord): Major {
  return { code: `major-${record.majorName}`, name: record.majorName, category: record.majorCategory };
}
function inferUniversityType(_schoolName: string, majorCategory: string): University['type'] {
  if (majorCategory === C.medicine) return 'medical';
  if (majorCategory === C.education) return 'normal';
  if (majorCategory === C.economics) return 'financial';
  if (majorCategory === C.law) return 'political';
  if (majorCategory === C.agriculture) return 'agricultural';
  if (majorCategory === C.engineering) return 'engineering';
  return 'comprehensive';
}
