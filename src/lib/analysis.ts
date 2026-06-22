import { getAllowedMajorCategories, isMajorAllowedForSubject } from './subject-rules';
import type {
  UserProfile,
  AdmissionRecord,
  Recommendation,
  Report,
  Province,
  SubjectCategory,
  CareerGoal
} from './types';
import {
  getAdmissionsByProvince,
  getUniversityByCode,
  getMajorByName,
  universities
} from './mock-data';
import { getProvinceLabel, getProvinceMeta } from './provinces';

/**
 * 根据用户输入分析并生成志愿推荐报告
 */
export function generateReport(userProfile: UserProfile): Report {
  const admissions = getAdmissionsByProvince(userProfile.province);

  // 1. 计算位次定位
  const rank = userProfile.rank || estimateRankFromScore(userProfile);
  const totalStudents = userProfile.province === 'zhejiang' ? 260000 : 350000;
  const rankPercentile = (rank / totalStudents) * 100;

  // 2. 确定适合的专业方向
  const suitableMajors = determineSuitableMajors(userProfile);

  // 3. 筛选匹配的录取记录
  const matchedAdmissions = filterAdmissions(admissions, userProfile, suitableMajors);

  // 4. 生成冲稳保推荐
  const recommendations = generateRecommendations(matchedAdmissions, userProfile, rank);

  // 5. 生成风险提示
  const riskWarnings = generateRiskWarnings(userProfile, recommendations);

  // 6. 构建报告
  const report: Report = {
    id: `report-${Date.now()}`,
    userProfile,
    generatedAt: new Date(),
    positionAnalysis: {
      province: userProfile.province,
      score: userProfile.score,
      rank,
      rankPercentile,
      positionDescription: generatePositionDescription(rankPercentile, userProfile.province)
    },
    suitableMajors,
    recommendations,
    riskWarnings,
    dataSources: [
      {
        name: userProfile.province === 'zhejiang'
          ? '浙江省教育考试院'
          : '山东省教育招生考试院',
        year: 2024,
        url: userProfile.province === 'zhejiang'
          ? 'https://www.zjzs.net'
          : 'https://www.sdzs.gov.cn'
      },
      {
        name: userProfile.province === 'zhejiang'
          ? '浙江省教育考试院'
          : '山东省教育招生考试院',
        year: 2023,
        url: userProfile.province === 'zhejiang'
          ? 'https://www.zjzs.net'
          : 'https://www.sdzs.gov.cn'
      }
    ],
    disclaimer: '本报告仅供参考，最终以各省教育考试院和高校官方信息为准，不构成录取承诺。高考志愿填报涉及多方面因素，建议结合自身实际情况谨慎决策。'
  };

  return report;
}

/**
 * 根据分数估算位次（如果没有用户提供位次）
 */
function estimateRankFromScore(userProfile: UserProfile): number {
  // 基于分数的大致位次估算（简化模型）
  if (userProfile.province === 'zhejiang') {
    // 浙江满分750
    const scoreRatio = userProfile.score / 750;
    const totalStudents = 260000;
    // 高分段位次更密集，低分段位次更分散
    if (scoreRatio > 0.9) {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.3);
    } else if (scoreRatio > 0.8) {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.5);
    } else {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.8);
    }
  } else {
    // 山东满分750
    const scoreRatio = userProfile.score / 750;
    const totalStudents = 350000;
    if (scoreRatio > 0.85) {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.4);
    } else if (scoreRatio > 0.75) {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.6);
    } else {
      return Math.round(totalStudents * (1 - scoreRatio) * 0.9);
    }
  }
}

/**
 * 确定适合的专业方向
 */
function determineSuitableMajors(userProfile: UserProfile): Report['suitableMajors'] {
  const suitableMajors: Report['suitableMajors'] = [];

  // 基于选科和就业诉求推荐专业类别
  const subjectBasedCategories = getMajorCategoriesBySubject(userProfile.subjectCategory);
  const goalBasedMajors = getMajorCategoriesByCareerGoal(userProfile.careerGoal);

  // 合并推荐
  const recommendedCategories = [...new Set([...subjectBasedCategories, ...goalBasedMajors])];

  // 排除用户不喜欢的专业
  const excludedCategories = userProfile.excludedMajors.map(m => getMajorCategory(m));

  recommendedCategories.forEach(category => {
    if (!excludedCategories.includes(category)) {
      const majorsInCategory = getMajorsByCategory(category, userProfile.preferredMajors);
      if (majorsInCategory.length > 0) {
        suitableMajors.push({
          category,
          majors: majorsInCategory,
          reasons: generateCategoryReasons(category, userProfile)
        });
      }
    }
  });

  return suitableMajors;
}

/**
 * 根据选科类型获取适合的专业类别
 */
function getMajorCategoriesBySubject(subject: SubjectCategory): string[] {
  return getAllowedMajorCategories(subject);
}

/**
 * 根据就业诉求获取适合的专业类别
 */
function getMajorCategoriesByCareerGoal(goal: CareerGoal): string[] {
  const categories: Record<CareerGoal, string[]> = {
    'employment': ['工学', '管理学', '经济学'],
    'postgraduate': ['理学', '医学', '工学'],
    'stable': ['法学', '教育学', '医学'],
    'flexible': ['工学', '理学', '管理学', '文学']
  };
  return categories[goal] || [];
}

/**
 * 获取专业所属类别
 */
function getMajorCategory(majorName: string): string {
  // 简化的专业类别映射
  const categoryMap: Record<string, string> = {
    '计算机': '工学',
    '软件': '工学',
    '电气': '工学',
    '电子': '工学',
    '机械': '工学',
    '土木': '工学',
    '化工': '工学',
    '材料': '工学',
    '医学': '医学',
    '临床': '医学',
    '师范': '教育学',
    '文学': '文学',
    '法学': '法学',
    '经济': '经济学',
    '管理': '管理学',
    '会计': '管理学',
    '数学': '理学',
    '物理': '理学',
    '化学': '理学'
  };

  for (const [key, category] of Object.entries(categoryMap)) {
    if (majorName.includes(key)) return category;
  }
  return '工学';
}

/**
 * 获取某类别下的推荐专业
 */
function getMajorsByCategory(category: string, preferredMajors: string[]): string[] {
  // 如果用户有偏好专业，优先展示
  const preferredInCategory = preferredMajors.filter(m => getMajorCategory(m) === category);
  if (preferredInCategory.length > 0) return preferredInCategory;

  // 否则返回该类别下的热门专业
  const popularMajors: Record<string, string[]> = {
    '工学': ['计算机科学与技术', '软件工程', '电气工程及其自动化', '电子信息工程'],
    '理学': ['数学与应用数学', '物理学', '化学', '生物科学'],
    '医学': ['临床医学', '口腔医学', '预防医学', '药学'],
    '文学': ['汉语言文学', '英语', '新闻传播学'],
    '法学': ['法学', '知识产权'],
    '管理学': ['工商管理', '会计学', '财务管理'],
    '经济学': ['经济学', '金融学', '国际经济与贸易']
  };

  return popularMajors[category] || [];
}

/**
 * 生成推荐理由
 */
function generateCategoryReasons(category: string, userProfile: UserProfile): string[] {
  const reasons: string[] = [];

  // 选科匹配
  reasons.push(`您的选科组合符合${category}类专业要求`);

  // 就业诉求匹配
  if (userProfile.careerGoal === 'employment' && ['工学', '管理学', '经济学'].includes(category)) {
    reasons.push(`${category}类专业就业率高，符合您的就业优先诉求`);
  }
  if (userProfile.careerGoal === 'postgraduate' && ['理学', '医学'].includes(category)) {
    reasons.push(`${category}类专业考研深造机会多，符合您的升学诉求`);
  }
  if (userProfile.careerGoal === 'stable' && ['法学', '医学'].includes(category)) {
    reasons.push(`${category}类专业就业稳定性强，符合您的稳定就业诉求`);
  }

  return reasons;
}

/**
 * 筛选匹配的录取记录
 */
function filterAdmissions(
  admissions: AdmissionRecord[],
  userProfile: UserProfile,
  suitableMajors: Report['suitableMajors']
): AdmissionRecord[] {
  const suitableMajorNames = suitableMajors.flatMap(s => s.majors);
  const suitableCategories = suitableMajors.map(s => s.category);

  return admissions.filter(record => {
    // 1. 选科要求匹配
    const subjectMatch = isMajorAllowedForSubject(record.majorName, userProfile.subjectCategory);

    // 2. 专业偏好匹配
    const majorMatch =
      suitableMajorNames.includes(record.majorName) ||
      suitableCategories.includes(record.majorCategory) ||
      userProfile.preferredMajors.length === 0; // 如果用户没有明确偏好，展示所有匹配选科的

    // 3. 排除不喜欢专业
    const notExcluded = !userProfile.excludedMajors.some(excluded =>
      record.majorName.includes(excluded) || getMajorCategory(record.majorName) === getMajorCategory(excluded)
    );

    // 4. 分数范围合理（+-30分范围内）
    const scoreRange = Math.abs(record.lowestScore - userProfile.score) <= 50;

    return subjectMatch && majorMatch && notExcluded && scoreRange;
  });
}

/**
 * 生成冲稳保推荐
 */
function generateRecommendations(
  admissions: AdmissionRecord[],
  userProfile: UserProfile,
  userRank: number
): Report['recommendations'] {
  // 按位次排序
  const sortedAdmissions = [...admissions].sort((a, b) => b.lowestRank - a.lowestRank);

  // 分为冲刺、稳妥、保底三类
  const sprint: Recommendation[] = [];
  const stable: Recommendation[] = [];
  const guarantee: Recommendation[] = [];

  sortedAdmissions.forEach(record => {
    const rankDiff = record.lowestRank - userRank;

    const recommendation = createRecommendation(record, userProfile, rankDiff);

    // 位次区间划分
    if (rankDiff > 3000) {
      // 冲刺：位次高于用户5000+
      if (sprint.length < 5) sprint.push(recommendation);
    } else if (rankDiff < -5000) {
      // 保底：位次低于用户5000+
      if (guarantee.length < 5) guarantee.push(recommendation);
    } else {
      // 稳妥：位次差距在±5000内
      if (stable.length < 6) stable.push(recommendation);
    }
  });

  return { sprint, stable, guarantee };
}

/**
 * 创建单个推荐项
 */
function createRecommendation(
  record: AdmissionRecord,
  userProfile: UserProfile,
  rankDiff: number
): Recommendation {
  const university = getUniversityByCode(record.universityCode) || {
    code: record.universityCode,
    name: record.universityName,
    province: record.province,
    city: '未知',
    level: record.universityLevel,
    type: 'comprehensive'
  };

  const major = getMajorByName(record.majorName) || {
    code: 'unknown',
    name: record.majorName,
    category: record.majorCategory
  };

  // 判断推荐类型
  let recommendationType: '冲刺' | '稳妥' | '保底';
  if (rankDiff > 3000) recommendationType = '冲刺';
  else if (rankDiff < -5000) recommendationType = '保底';
  else recommendationType = '稳妥';

  // 计算匹配分数
  const matchScore = calculateMatchScore(record, userProfile, rankDiff);

  // 生成推荐理由
  const reasons = generateRecommendationReasons(record, userProfile, rankDiff);

  // 评估风险
  const riskLevel = assessRisk(record, rankDiff);
  const riskNotes = generateRiskNotes(record, rankDiff);

  return {
    university,
    major,
    admissionRecord: record,
    recommendationType,
    matchScore,
    reasons,
    riskLevel,
    riskNotes
  };
}

/**
 * 计算匹配分数（0-100）
 */
function calculateMatchScore(
  record: AdmissionRecord,
  userProfile: UserProfile,
  rankDiff: number
): number {
  let score = 70; // 基础分

  // 位次匹配加分
  if (Math.abs(rankDiff) < 1000) score += 15;
  else if (Math.abs(rankDiff) < 3000) score += 10;
  else if (Math.abs(rankDiff) < 5000) score += 5;

  // 专业偏好加分
  if (userProfile.preferredMajors.includes(record.majorName)) score += 10;

  // 院校层次加分
  if (record.universityLevel === '985') score += 5;
  if (record.universityLevel === '211') score += 3;
  if (record.universityLevel === 'double_first_class') score += 3;

  // 地域偏好加分
  const universityProvince = record.province;
  if (userProfile.preferredRegions.length > 0) {
    const regionMatch = userProfile.preferredRegions.some(region =>
      getRegionByProvince(universityProvince) === region
    );
    if (regionMatch) score += 5;
  }

  return Math.min(100, score);
}

/**
 * 生成推荐理由
 */
function generateRecommendationReasons(
  record: AdmissionRecord,
  userProfile: UserProfile,
  rankDiff: number
): string[] {
  const reasons: string[] = [];

  // 位次匹配
  if (Math.abs(rankDiff) < 1000) {
    reasons.push('您的位次与该专业历年录取位次高度匹配');
  } else if (rankDiff > 0) {
    reasons.push(`该专业${record.year}年最低位次${record.lowestRank}名，您的位次${userProfile.rank || estimateRankFromScore(userProfile)}名有一定差距`);
  } else {
    reasons.push(`您的位次明显高于该专业${record.year}年录取位次，录取概率较大`);
  }

  // 专业偏好
  if (userProfile.preferredMajors.includes(record.majorName)) {
    reasons.push(`${record.majorName}是您明确偏好的专业方向`);
  }

  // 院校层次
  if (record.universityLevel === '985') {
    reasons.push(`${record.universityName}是985工程高校，综合实力强`);
  } else if (record.universityLevel === '211') {
    reasons.push(`${record.universityName}是211工程高校，办学质量优秀`);
  }

  // 就业诉求
  if (userProfile.careerGoal === 'employment' && ['工学', '经济学'].includes(record.majorCategory)) {
    reasons.push(`${record.majorCategory}类专业就业前景好，符合您的就业优先诉求`);
  }

  return reasons;
}

/**
 * 评估风险等级
 */
function assessRisk(record: AdmissionRecord, rankDiff: number): 'low' | 'medium' | 'high' {
  if (rankDiff > 5000) return 'high';
  if (rankDiff > 2000) return 'medium';
  return 'low';
}

/**
 * 生成风险提示
 */
function generateRiskNotes(record: AdmissionRecord, rankDiff: number): string | undefined {
  if (rankDiff > 5000) {
    return `历年位次差距较大(${Math.abs(rankDiff)}名)，录取风险较高，建议谨慎填报`;
  }
  if (rankDiff > 2000) {
    return `有一定位次差距，建议放在志愿表靠前位置冲刺`;
  }
  return undefined;
}

/**
 * 根据省份获取所属区域
 */
function getRegionByProvince(province: Province): string {
  return getProvinceMeta(province).region;
}

/**
 * 生成位次描述
 */
function generatePositionDescription(rankPercentile: number, province: Province): string {
  const provinceName = getProvinceLabel(province);

  if (rankPercentile < 5) {
    return `在${provinceName}省考生中处于顶尖水平（前${rankPercentile.toFixed(1)}%），可冲击985/211顶尖高校`;
  } else if (rankPercentile < 15) {
    return `在${provinceName}省考生中处于优秀水平（前${rankPercentile.toFixed(1)}%），可报考985/211及双一流高校`;
  } else if (rankPercentile < 30) {
    return `在${provinceName}省考生中处于中上水平（前${rankPercentile.toFixed(1)}%），可报考省内重点高校及部分211`;
  } else if (rankPercentile < 50) {
    return `在${provinceName}省考生中处于中等水平（前${rankPercentile.toFixed(1)}%），可报考省重点和普通本科院校`;
  } else {
    return `在${provinceName}省考生中处于中下水平，建议重点关注省内普通本科院校`;
  }
}

/**
 * 生成整体风险提示
 */
function generateRiskWarnings(userProfile: UserProfile, recommendations: Report['recommendations']): string[] {
  const warnings: string[] = [];

  // 冲刺院校过多
  if (recommendations.sprint.length > recommendations.stable.length) {
    warnings.push('冲刺院校数量较多，建议适当增加稳妥和保底院校，降低落榜风险');
  }

  // 保底院校过少
  if (recommendations.guarantee.length < 2) {
    warnings.push('保底院校较少，建议增加2-3所保底院校确保录取');
  }

  // 专业偏好过窄
  if (userProfile.preferredMajors.length > 0 && userProfile.preferredMajors.length < 3) {
    warnings.push('专业偏好范围较窄，可能限制选择空间，建议适当放宽专业偏好');
  }

  // 分数波动风险
  warnings.push('历年录取分数线存在波动，请结合近3年数据综合判断');

  return warnings;
}
