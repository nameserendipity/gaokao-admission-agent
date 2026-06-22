import type { ElectiveSubject, PrimarySubject, SubjectCategory } from './types';

export const PRIMARY_SUBJECT_OPTIONS: { value: PrimarySubject; label: string; desc: string }[] = [
  { value: 'physics', label: '\u7269\u7406\u7ec4', desc: '\u4ee5\u7269\u7406\u4e3a\u9996\u9009\u79d1\u76ee\uff0c\u4fdd\u7559\u7406\u5de5\u533b\u548c\u90e8\u5206\u7ecf\u7ba1\u65b9\u5411\u3002' },
  { value: 'history', label: '\u5386\u53f2\u7ec4', desc: '\u4ee5\u5386\u53f2\u4e3a\u9996\u9009\u79d1\u76ee\uff0c\u9002\u5408\u6587\u53f2\u3001\u6cd5\u5b66\u3001\u6559\u80b2\u3001\u7ecf\u7ba1\u7b49\u65b9\u5411\u3002' },
];

export const ELECTIVE_SUBJECT_OPTIONS: { value: ElectiveSubject; label: string }[] = [
  { value: 'chemistry', label: '\u5316\u5b66' },
  { value: 'biology', label: '\u751f\u7269' },
  { value: 'politics', label: '\u653f\u6cbb' },
  { value: 'geography', label: '\u5730\u7406' },
];

const ELECTIVE_ORDER: ElectiveSubject[] = ['chemistry', 'biology', 'politics', 'geography'];
const SUBJECT_LABEL: Record<PrimarySubject | ElectiveSubject, string> = { physics: '\u7269\u7406', history: '\u5386\u53f2', chemistry: '\u5316\u5b66', biology: '\u751f\u7269', politics: '\u653f\u6cbb', geography: '\u5730\u7406' };

export const SUBJECT_COMBINATIONS = [
  'physics_chemistry_biology', 'physics_chemistry_politics', 'physics_chemistry_geography',
  'physics_biology_politics', 'physics_biology_geography', 'physics_politics_geography',
  'history_chemistry_biology', 'history_chemistry_politics', 'history_chemistry_geography',
  'history_biology_politics', 'history_biology_geography', 'history_politics_geography',
] as const satisfies readonly SubjectCategory[];

export interface SubjectSelection { primarySubject: PrimarySubject; electiveSubjects: [ElectiveSubject, ElectiveSubject]; subjectCategory: SubjectCategory; }
export interface MajorOption { name: string; aliases: string[]; category: string; }

const M = {
  literature: '\u6587\u5b66', economics: '\u7ecf\u6d4e\u5b66', management: '\u7ba1\u7406\u5b66', engineering: '\u5de5\u5b66', science: '\u7406\u5b66', medicine: '\u533b\u5b66', law: '\u6cd5\u5b66', history: '\u5386\u53f2\u5b66',
};

const GENERAL_OPTIONS: MajorOption[] = [
  { name: '\u6c49\u8bed\u8a00\u6587\u5b66(\u5e08\u8303)', aliases: ['\u6c49\u8bed\u8a00\u6587\u5b66', '\u4e2d\u6587', '\u5e08\u8303'], category: M.literature },
  { name: '\u82f1\u8bed(\u5e08\u8303)', aliases: ['\u82f1\u8bed', '\u5916\u56fd\u8bed\u8a00', '\u5e08\u8303'], category: M.literature },
  { name: '\u7ecf\u6d4e\u5b66', aliases: ['\u7ecf\u6d4e\u5b66', '\u7ecf\u6d4e\u7edf\u8ba1'], category: M.economics },
  { name: '\u91d1\u878d\u5b66', aliases: ['\u91d1\u878d\u5b66', '\u91d1\u878d\u5de5\u7a0b'], category: M.economics },
  { name: '\u4f1a\u8ba1\u5b66', aliases: ['\u4f1a\u8ba1\u5b66', '\u8d22\u52a1\u7ba1\u7406', '\u5ba1\u8ba1\u5b66'], category: M.management },
  { name: '\u516c\u5171\u4e8b\u4e1a\u7ba1\u7406', aliases: ['\u516c\u5171\u4e8b\u4e1a\u7ba1\u7406', '\u884c\u653f\u7ba1\u7406', '\u516c\u5171\u7ba1\u7406'], category: M.management },
];

const PHYSICS_CHEMISTRY_OPTIONS: MajorOption[] = [
  { name: '\u8ba1\u7b97\u673a\u79d1\u5b66\u4e0e\u6280\u672f', aliases: ['\u8ba1\u7b97\u673a', '\u6570\u636e\u79d1\u5b66', '\u7f51\u7edc\u5de5\u7a0b'], category: M.engineering },
  { name: '\u8f6f\u4ef6\u5de5\u7a0b', aliases: ['\u8f6f\u4ef6\u5de5\u7a0b'], category: M.engineering },
  { name: '\u4eba\u5de5\u667a\u80fd', aliases: ['\u4eba\u5de5\u667a\u80fd', '\u667a\u80fd\u79d1\u5b66'], category: M.engineering },
  { name: '\u7535\u5b50\u4fe1\u606f\u5de5\u7a0b', aliases: ['\u7535\u5b50\u4fe1\u606f', '\u901a\u4fe1\u5de5\u7a0b', '\u5fae\u7535\u5b50'], category: M.engineering },
  { name: '\u7535\u6c14\u5de5\u7a0b\u53ca\u5176\u81ea\u52a8\u5316', aliases: ['\u7535\u6c14\u5de5\u7a0b', '\u81ea\u52a8\u5316'], category: M.engineering },
  { name: '\u673a\u68b0\u8bbe\u8ba1\u5236\u9020\u53ca\u5176\u81ea\u52a8\u5316', aliases: ['\u673a\u68b0', '\u8f66\u8f86\u5de5\u7a0b', '\u667a\u80fd\u5236\u9020'], category: M.engineering },
  { name: '\u6750\u6599\u79d1\u5b66\u4e0e\u5de5\u7a0b', aliases: ['\u6750\u6599', '\u9ad8\u5206\u5b50'], category: M.engineering },
  { name: '\u571f\u6728\u5de5\u7a0b', aliases: ['\u571f\u6728', '\u5efa\u7b51\u73af\u5883'], category: M.engineering },
  { name: '\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66(\u5e08\u8303)', aliases: ['\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66', '\u6570\u5b66\u7c7b', '\u5e08\u8303'], category: M.science },
  { name: '\u4e34\u5e8a\u533b\u5b66', aliases: ['\u4e34\u5e8a\u533b\u5b66'], category: M.medicine },
  { name: '\u53e3\u8154\u533b\u5b66', aliases: ['\u53e3\u8154\u533b\u5b66'], category: M.medicine },
  { name: '\u836f\u5b66', aliases: ['\u836f\u5b66', '\u836f\u7269\u5236\u5242'], category: M.medicine },
];

const PHYSICS_NON_CHEMISTRY_OPTIONS: MajorOption[] = [
  { name: '\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66(\u5e08\u8303)', aliases: ['\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66', '\u6570\u5b66\u7c7b', '\u5e08\u8303'], category: M.science },
  { name: '\u5730\u7406\u4fe1\u606f\u79d1\u5b66', aliases: ['\u5730\u7406\u4fe1\u606f', '\u6d4b\u7ed8', '\u9065\u611f'], category: M.science },
  { name: '\u5fc3\u7406\u5b66', aliases: ['\u5fc3\u7406\u5b66', '\u5e94\u7528\u5fc3\u7406'], category: M.science },
];

const POLITICS_OPTIONS: MajorOption[] = [
  { name: '\u6cd5\u5b66', aliases: ['\u6cd5\u5b66', '\u77e5\u8bc6\u4ea7\u6743'], category: M.law },
  { name: '\u653f\u6cbb\u5b66\u4e0e\u884c\u653f\u5b66', aliases: ['\u653f\u6cbb\u5b66', '\u56fd\u9645\u653f\u6cbb'], category: M.law },
  { name: '\u9a6c\u514b\u601d\u4e3b\u4e49\u7406\u8bba', aliases: ['\u9a6c\u514b\u601d\u4e3b\u4e49\u7406\u8bba', '\u601d\u60f3\u653f\u6cbb\u6559\u80b2'], category: M.law },
];

const HISTORY_CORE_OPTIONS: MajorOption[] = [
  { name: '\u5386\u53f2\u5b66(\u5e08\u8303)', aliases: ['\u5386\u53f2\u5b66', '\u5e08\u8303'], category: M.history },
  { name: '\u65b0\u95fb\u4f20\u64ad\u5b66', aliases: ['\u65b0\u95fb', '\u4f20\u64ad', '\u5e7f\u544a\u5b66'], category: M.literature },
];
const LAW_OPTION: MajorOption = { name: '\u6cd5\u5b66', aliases: ['\u6cd5\u5b66', '\u77e5\u8bc6\u4ea7\u6743'], category: M.law };

function uniqueOptions(options: MajorOption[]): MajorOption[] { const seen = new Set<string>(); return options.filter(option => seen.has(option.name) ? false : (seen.add(option.name), true)); }
function includesElective(subjectCategory: SubjectCategory, elective: ElectiveSubject): boolean { return subjectCategory.split('_').includes(elective); }
export function isSubjectCategory(value: unknown): value is SubjectCategory { return typeof value === 'string' && (SUBJECT_COMBINATIONS as readonly string[]).includes(value); }
export function getSubjectCategoryFromSelection(primary: PrimarySubject | undefined, electives: ElectiveSubject[] | undefined): SubjectCategory | undefined { if (!primary || !electives || electives.length !== 2) return undefined; const normalized = [...new Set(electives)].filter((item): item is ElectiveSubject => ELECTIVE_ORDER.includes(item as ElectiveSubject)).sort((a, b) => ELECTIVE_ORDER.indexOf(a) - ELECTIVE_ORDER.indexOf(b)); if (normalized.length !== 2) return undefined; const value = `${primary}_${normalized[0]}_${normalized[1]}`; return isSubjectCategory(value) ? value : undefined; }
export function getSubjectSelection(subjectCategory: SubjectCategory): SubjectSelection { const [primary, first, second] = subjectCategory.split('_') as [PrimarySubject, ElectiveSubject, ElectiveSubject]; return { primarySubject: primary, electiveSubjects: [first, second], subjectCategory }; }
export function normalizeSubjectCategory(raw: unknown): SubjectCategory | undefined { if (isSubjectCategory(raw)) return raw; if (raw === 'physics_chemistry') return 'physics_chemistry_biology'; if (raw === 'history_politics') return 'history_politics_geography'; return undefined; }
export function getSubjectCombinationLabel(subjectCategory: SubjectCategory | string): string { const normalized = normalizeSubjectCategory(subjectCategory); if (!normalized) return '\u672a\u9009\u62e9\u9009\u79d1\u7ec4\u5408'; const [primary, first, second] = normalized.split('_') as [PrimarySubject, ElectiveSubject, ElectiveSubject]; return `${SUBJECT_LABEL[primary]} / ${SUBJECT_LABEL[first]} / ${SUBJECT_LABEL[second]}`; }
export function getAllowedMajorOptions(subjectCategory: SubjectCategory): MajorOption[] { const isPhysics = subjectCategory.startsWith('physics'); const hasChemistry = includesElective(subjectCategory, 'chemistry'); const hasPolitics = includesElective(subjectCategory, 'politics'); if (isPhysics && hasChemistry) return uniqueOptions([...PHYSICS_CHEMISTRY_OPTIONS, ...GENERAL_OPTIONS, ...(hasPolitics ? POLITICS_OPTIONS : [LAW_OPTION])]); if (isPhysics) return uniqueOptions([...PHYSICS_NON_CHEMISTRY_OPTIONS, ...GENERAL_OPTIONS, ...(hasPolitics ? POLITICS_OPTIONS : [LAW_OPTION])]); return uniqueOptions([...HISTORY_CORE_OPTIONS, ...GENERAL_OPTIONS, ...(hasPolitics ? POLITICS_OPTIONS : [LAW_OPTION])]); }
export function getAllowedMajorNames(subjectCategory: SubjectCategory): string[] { return getAllowedMajorOptions(subjectCategory).map(option => option.name); }
export function getAllowedMajorCategories(subjectCategory: SubjectCategory): string[] { return [...new Set(getAllowedMajorOptions(subjectCategory).map(option => option.category))]; }
export function isMajorAllowedForSubject(majorName: string, subjectCategory: SubjectCategory): boolean { const text = majorName.trim(); if (!text) return false; if (/\u9662\u6821\u4e13\u4e1a\u7ec4|\u672a\u6ce8\u660e\u4e13\u4e1a/.test(text)) return true; return getAllowedMajorOptions(subjectCategory).some(option => option.aliases.some(alias => text.includes(alias) || alias.includes(text))); }
export function filterMajorsBySubject(majors: string[], subjectCategory: SubjectCategory | undefined): string[] { if (!subjectCategory) return []; return majors.filter(major => isMajorAllowedForSubject(major, subjectCategory)); }
