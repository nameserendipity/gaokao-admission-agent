import type { Province, SubjectCategory } from '@/lib/types';

export type EvidenceSource = 'sqlite' | 'tavily';

export interface AdmissionEvidence {
  id: string;
  source: EvidenceSource;
  province: Province;
  provinceName: string;
  year: number;
  category: string;
  batch: string;
  schoolName: string;
  majorName: string;
  score: number;
  rank: number;
  quota?: number;
  sourceFile?: string;
  sourceUrl?: string;
  subjectRequirement: SubjectCategory[];
  majorCategory: string;
  schoolLevel: '985' | '211' | 'double_first_class' | 'ordinary' | 'vocational';
}

export interface KnowledgeSearchInput {
  province: Province;
  score: number;
  rank: number;
  subjectCategory: SubjectCategory;
  preferredMajors: string[];
  excludedMajors: string[];
  limit?: number;
  balancedYears?: boolean;
}

export interface KnowledgeSearchResult {
  records: AdmissionEvidence[];
  source: EvidenceSource;
  warnings: string[];
}
