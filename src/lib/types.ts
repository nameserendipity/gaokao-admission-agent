
export type Province =
  | 'beijing'
  | 'tianjin'
  | 'hebei'
  | 'shanxi'
  | 'inner_mongolia'
  | 'liaoning'
  | 'jilin'
  | 'heilongjiang'
  | 'shanghai'
  | 'jiangsu'
  | 'zhejiang'
  | 'anhui'
  | 'fujian'
  | 'jiangxi'
  | 'shandong'
  | 'henan'
  | 'hubei'
  | 'hunan'
  | 'guangdong'
  | 'guangxi'
  | 'hainan'
  | 'chongqing'
  | 'sichuan'
  | 'guizhou'
  | 'yunnan'
  | 'xizang'
  | 'shaanxi'
  | 'gansu'
  | 'qinghai'
  | 'ningxia'
  | 'xinjiang';

export type PrimarySubject = 'physics' | 'history';
export type ElectiveSubject = 'chemistry' | 'biology' | 'politics' | 'geography';
export type SubjectCategory =
  | 'physics_chemistry_biology'
  | 'physics_chemistry_politics'
  | 'physics_chemistry_geography'
  | 'physics_biology_politics'
  | 'physics_biology_geography'
  | 'physics_politics_geography'
  | 'history_chemistry_biology'
  | 'history_chemistry_politics'
  | 'history_chemistry_geography'
  | 'history_biology_politics'
  | 'history_biology_geography'
  | 'history_politics_geography';

export type Region = 'east' | 'south' | 'north' | 'west' | 'central' | 'northeast';
export type FamilyBackground = 'ordinary' | 'well_off' | 'difficult';
export type CareerGoal = 'employment' | 'postgraduate' | 'stable' | 'flexible';
export type CandidateType = 'general' | 'art' | 'sports';
export type StrategyMode = 'safe' | 'major' | 'school' | 'city';

export interface UserProfile {
  candidateType?: CandidateType;
  province: Province;
  score: number;
  rank: number | null;
  professionalScore?: number | null;
  compositeScore?: number | null;
  artSportsCategory?: string | null;
  primarySubject: PrimarySubject;
  electiveSubjects: [ElectiveSubject, ElectiveSubject];
  subjectCategory: SubjectCategory;
  preferredMajors: string[];
  excludedMajors: string[];
  preferredRegions: Region[];
  familyBackground: FamilyBackground;
  careerGoal: CareerGoal;
  strategyMode?: StrategyMode;
  createdAt: Date;
}

export interface AdmissionRecord {
  id: string;
  universityCode: string;
  universityName: string;
  universityLevel: '985' | '211' | 'double_first_class' | 'ordinary' | 'vocational';
  province: Province;
  year: number;
  majorName: string;
  majorCategory: string;
  subjectRequirement: SubjectCategory[];
  admissionType: 'parallel' | 'sequential';
  lowestScore: number;
  lowestRank: number;
  averageScore: number;
  highestScore: number;
  dataSource: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  collectedAt?: string;
  batchId?: string;
  notes?: string;
}

export interface University {
  code: string;
  name: string;
  province: Province;
  city: string;
  level: '985' | '211' | 'double_first_class' | 'ordinary' | 'vocational';
  type: 'comprehensive' | 'engineering' | 'normal' | 'medical' | 'agricultural' | 'financial' | 'political' | 'art';
  website?: string;
  features?: string[];
}

export interface Major {
  code: string;
  name: string;
  category: string;
  employmentRate?: number;
  postgraduateRate?: number;
  salaryRange?: [number, number];
  description?: string;
}

export interface RecommendationEvidence {
  year: number;
  lowestScore: number;
  lowestRank: number;
  averageScore: number;
  sourceName: string;
  sourceUrl?: string;
}

export interface Recommendation {
  university: University;
  major: Major;
  admissionRecord: AdmissionRecord;
  recommendationType: string;
  matchScore: number;
  admissionChance?: number;
  rankDiff?: number;
  isOpportunity?: boolean;
  reasons: string[];
  evidence?: RecommendationEvidence[];
  riskLevel: 'low' | 'medium' | 'high';
  riskNotes?: string;
}

export interface StrategyInsight {
  title: string;
  category: string;
  summary: string;
  source: string;
}

export interface RiskDiagnosis {
  type: 'rank' | 'major' | 'region' | 'family' | 'data';
  level: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

export interface Report {
  id: string;
  userProfile: UserProfile;
  generatedAt: Date;
  positionAnalysis: {
    province: Province;
    score: number;
    rank: number;
    rankEstimated?: boolean;
    rankEstimateMethod?: 'user' | 'admission_db' | 'score_only';
    rankPercentile: number;
    positionDescription: string;
  };
  suitableMajors: {
    category: string;
    majors: string[];
    reasons: string[];
  }[];
  recommendations: {
    sprint: Recommendation[];
    stable: Recommendation[];
    guarantee: Recommendation[];
    opportunities?: Recommendation[];
  };
  aiSummary?: string;
  strategyInsights?: StrategyInsight[];
  riskDiagnosis?: RiskDiagnosis[];
  riskWarnings: string[];
  dataSources: {
    name: string;
    year: number;
    url?: string;
    collectedAt?: string;
  }[];
  disclaimer: string;
}

export interface ReportPreviewResponse {
  reportId: string;
  report: Report;
}

export interface ReportChatMessage {
  id: string;
  reportId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
