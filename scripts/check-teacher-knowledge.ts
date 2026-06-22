import 'dotenv/config';
import { inspectTeacherKnowledge, searchTeacherKnowledge } from '../src/lib/knowledge/teacher-knowledge';
import type { UserProfile } from '../src/lib/types';

const info = inspectTeacherKnowledge();
console.log(`??????????${info.path}`);
console.log(`????${info.count}`);
console.log(`???${JSON.stringify(info.byCategory, null, 2)}`);
console.log('???');
for (const item of info.items) console.log(`- ${item.title} [${item.category}] ${item.tags.join('?')}`);

const profile: UserProfile = {
  province: 'zhejiang',
  score: 666,
  rank: 12000,
  primarySubject: 'physics',
  electiveSubjects: ['chemistry', 'biology'],
  subjectCategory: 'physics_chemistry_biology',
  preferredMajors: ['???'],
  excludedMajors: [],
  preferredRegions: ['east'],
  familyBackground: 'ordinary',
  careerGoal: 'employment',
  createdAt: new Date(),
};
const hit = searchTeacherKnowledge(profile, ['????????']);
console.log(`?????${hit.items.length}`);
console.log(hit.items.map(item => item.title).join(' / '));
