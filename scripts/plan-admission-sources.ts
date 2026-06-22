import fs from 'node:fs';
import path from 'node:path';

interface ProvinceSource {
  province: string;
  status: string;
  officialSite: string;
  keywords: string[];
  targetFiles: string[];
}

const sourcePath = path.join(process.cwd(), 'data', 'province-sources.json');

function main() {
  if (!fs.existsSync(sourcePath)) throw new Error(`省份采集清单不存在：${sourcePath}`);
  const sources = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as ProvinceSource[];
  const statusFilter = process.argv.find(arg => arg.startsWith('--status='))?.slice('--status='.length);
  const rows = statusFilter ? sources.filter(source => source.status === statusFilter) : sources;

  console.log(`采集清单：${sourcePath}`);
  console.log(`省份数量：${rows.length}`);
  console.log('');
  for (const source of rows) {
    const query = source.keywords.join(' ');
    const siteQuery = `site:${new URL(source.officialSite).hostname.replace(/^www\./, '')} ${query}`;
    console.log(`## ${source.province}`);
    console.log(`- 状态：${source.status}`);
    console.log(`- 官网：${source.officialSite}`);
    console.log(`- 目标文件：${source.targetFiles.join('、')}`);
    console.log(`- 搜索式：${siteQuery}`);
    console.log('');
  }
}

main();
