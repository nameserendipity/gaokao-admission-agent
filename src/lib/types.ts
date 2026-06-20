
export type Province = 'zhejiang' | 'shandong';

export type SubjectCategory =
  | 'physics_chemistry'
  | 'history_politics'
  | 'physics_history'
  | 'chemistry_biology'
  | 'other';

export type Region = 'east' | 'south' | 'north' | 'west' | 'central' | 'northeast';
export type FamilyBackground = 'ordinary' | 'well_off' | 'difficult';
export type CareerGoal = 'employment' | 'postgraduate' | 'stable' | 'flexible';

export interface UserProfile {
  province: Province;
  score: number;
  rank: number | null;
  subjectCategory: SubjectCategory;
  preferredMajors: string[];
  excludedMajors: string[];
  preferredRegions: Region[];
  familyBackground: FamilyBackground;
  careerGoal: CareerGoal;
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
