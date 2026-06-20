import 'dotenv/config';
import { inspectAdmissionDatabase, searchAdmissionKnowledge } from '../src/lib/knowledge/admission-sqlite';

async function main() {
  const info = await inspectAdmissionDatabase();
  console.log(`知识库路径：${info.path}`);
  console.log(`录取记录数：${info.count}`);
  console.log(`年份分布：${info.years.map(item => `${item.year}:${item.count}`).join(', ')}`);
  console.log(`省份 Top：${info.provinces.slice(0, 10).map(item => `${item.province}:${item.count}`).join(', ')}`);

  const sample = await searchAdmissionKnowledge({
    province: 'zhejiang',
    score: 666,
    rank: 12000,
    subjectCategory: 'physics_chemistry',
    preferredMajors: [],
    excludedMajors: [],
    limit: 20,
  });
  console.log(`浙江样例检索命中：${sample.records.length}`);
  console.log(sample.records.slice(0, 5).map(item => `${item.year} ${item.schoolName} ${item.majorName} ${item.score}/${item.rank}`).join('\n'));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
