import type { Province, Region } from './types';

export type ProvinceQuality = 'A' | 'B' | 'C';
export type ProvinceStatus = 'open' | 'limited' | 'collecting';

export interface ProvinceMeta {
  value: Province;
  label: string;
  shortName: string;
  dbName: string;
  region: Region;
  totalStudents: number;
  recordCount: number;
  years: number[];
  quality: ProvinceQuality;
  status: ProvinceStatus;
  note: string;
  officialSite?: string;
}

export const PROVINCES: ProvinceMeta[] = [
  { value: 'beijing', label: '北京', shortName: '北京', dbName: '北京', region: 'north', totalStudents: 70000, recordCount: 4420, years: [2024, 2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2024-2025, 4420 records; rank mostly missing, use with caution.', officialSite: 'https://www.bjeea.cn/' },
  { value: 'tianjin', label: '天津', shortName: '天津', dbName: '天津', region: 'north', totalStudents: 70000, recordCount: 466, years: [2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024, 466 records; limited sample, use with caution.', officialSite: 'http://www.zhaokao.net/' },
  { value: 'hebei', label: '河北', shortName: '河北', dbName: '河北', region: 'north', totalStudents: 750000, recordCount: 96524, years: [2024, 2025], quality: 'A', status: 'open', note: 'SQLite coverage: 2024-2025, 96524 records; score complete, rank mostly missing.', officialSite: 'https://www.hebeea.edu.cn/' },
  { value: 'shanxi', label: '山西', shortName: '山西', dbName: '山西', region: 'north', totalStudents: 340000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'http://www.sxkszx.cn/' },
  { value: 'inner_mongolia', label: '内蒙古', shortName: '内蒙古', dbName: '内蒙古', region: 'north', totalStudents: 210000, recordCount: 182, years: [2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024, 182 records; limited sample, use with caution.', officialSite: 'https://www.nm.zsks.cn/' },
  { value: 'liaoning', label: '辽宁', shortName: '辽宁', dbName: '辽宁', region: 'northeast', totalStudents: 190000, recordCount: 1621, years: [2023, 2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2023-2024, 1621 records; limited sample, use with caution.', officialSite: 'https://www.lnzsks.com/' },
  { value: 'jilin', label: '吉林', shortName: '吉林', dbName: '吉林', region: 'northeast', totalStudents: 130000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'http://www.jleea.edu.cn/' },
  { value: 'heilongjiang', label: '黑龙江', shortName: '黑龙江', dbName: '黑龙江', region: 'northeast', totalStudents: 190000, recordCount: 9504, years: [2024, 2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2024-2025, 9504 records; partial rank missing.', officialSite: 'https://www.hljea.org.cn/' },
  { value: 'shanghai', label: '上海', shortName: '上海', dbName: '上海', region: 'east', totalStudents: 55000, recordCount: 1643, years: [2024, 2025], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024-2025, 1643 records; rank missing and estimated from score.', officialSite: 'https://www.shmeea.edu.cn/' },
  { value: 'jiangsu', label: '江苏', shortName: '江苏', dbName: '江苏', region: 'east', totalStudents: 480000, recordCount: 8657, years: [2024, 2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2024-2025, 8657 records; rank mostly missing.', officialSite: 'https://www.jseea.cn/' },
  { value: 'zhejiang', label: '浙江', shortName: '浙江', dbName: '浙江', region: 'east', totalStudents: 260000, recordCount: 46595, years: [2024, 2025], quality: 'A', status: 'open', note: 'SQLite coverage: 2024-2025, 46595 records; score/rank coverage relatively strong.', officialSite: 'https://www.zjzs.net/' },
  { value: 'anhui', label: '安徽', shortName: '安徽', dbName: '安徽', region: 'east', totalStudents: 650000, recordCount: 76, years: [2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024, 76 records; very limited sample.', officialSite: 'https://www.ahzsks.cn/' },
  { value: 'fujian', label: '福建', shortName: '福建', dbName: '福建', region: 'east', totalStudents: 240000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.eeafj.cn/' },
  { value: 'jiangxi', label: '江西', shortName: '江西', dbName: '江西', region: 'central', totalStudents: 530000, recordCount: 5249, years: [2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2025, 5249 records; includes local ordinary/art-sports related data.', officialSite: 'http://www.jxeea.cn/' },
  { value: 'shandong', label: '山东', shortName: '山东', dbName: '山东', region: 'east', totalStudents: 350000, recordCount: 52395, years: [2024, 2025], quality: 'A', status: 'open', note: 'SQLite coverage: 2024-2025, 52395 records; rank complete, score mostly missing.', officialSite: 'https://www.sdzk.cn/' },
  { value: 'henan', label: '河南', shortName: '河南', dbName: '河南', region: 'central', totalStudents: 980000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.haeea.cn/' },
  { value: 'hubei', label: '湖北', shortName: '湖北', dbName: '湖北', region: 'central', totalStudents: 520000, recordCount: 4379, years: [2024], quality: 'B', status: 'limited', note: 'SQLite coverage: 2024, 4379 records; rank mostly missing.', officialSite: 'https://www.hbea.edu.cn/' },
  { value: 'hunan', label: '湖南', shortName: '湖南', dbName: '湖南', region: 'central', totalStudents: 500000, recordCount: 7089, years: [2024, 2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2024-2025, 7089 records; rank mostly missing.', officialSite: 'https://jyt.hunan.gov.cn/sjyt/hnsjyksy/' },
  { value: 'guangdong', label: '广东', shortName: '广东', dbName: '广东', region: 'south', totalStudents: 760000, recordCount: 202, years: [2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024, 202 records; very limited sample.', officialSite: 'https://eea.gd.gov.cn/' },
  { value: 'guangxi', label: '广西', shortName: '广西', dbName: '广西', region: 'south', totalStudents: 460000, recordCount: 5050, years: [2025], quality: 'B', status: 'limited', note: 'SQLite coverage: 2025, 5050 records; rank mostly missing.', officialSite: 'https://www.gxeea.cn/' },
  { value: 'hainan', label: '海南', shortName: '海南', dbName: '海南', region: 'south', totalStudents: 70000, recordCount: 117, years: [2024, 2025], quality: 'C', status: 'limited', note: 'SQLite coverage: 2024-2025, 117 records; very limited sample.', officialSite: 'https://ea.hainan.gov.cn/' },
  { value: 'chongqing', label: '重庆', shortName: '重庆', dbName: '重庆', region: 'west', totalStudents: 350000, recordCount: 29548, years: [2024], quality: 'A', status: 'open', note: 'SQLite coverage: 2024, 29548 records; score complete, rank mostly missing.', officialSite: 'https://www.cqksy.cn/' },
  { value: 'sichuan', label: '四川', shortName: '四川', dbName: '四川', region: 'west', totalStudents: 600000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.sceea.cn/' },
  { value: 'guizhou', label: '贵州', shortName: '贵州', dbName: '贵州', region: 'west', totalStudents: 470000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://zsksy.guizhou.gov.cn/' },
  { value: 'yunnan', label: '云南', shortName: '云南', dbName: '云南', region: 'west', totalStudents: 390000, recordCount: 737, years: [2022, 2023, 2024], quality: 'C', status: 'limited', note: 'SQLite coverage: 2022-2024, 737 records; limited sample.', officialSite: 'https://www.ynzs.cn/' },
  { value: 'xizang', label: '西藏', shortName: '西藏', dbName: '西藏', region: 'west', totalStudents: 30000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'http://zsks.edu.xizang.gov.cn/' },
  { value: 'shaanxi', label: '陕西', shortName: '陕西', dbName: '陕西', region: 'west', totalStudents: 260000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'http://www.sneea.cn/' },
  { value: 'gansu', label: '甘肃', shortName: '甘肃', dbName: '甘肃', region: 'west', totalStudents: 240000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.ganseea.cn/' },
  { value: 'qinghai', label: '青海', shortName: '青海', dbName: '青海', region: 'west', totalStudents: 50000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'http://www.qhjyks.com/' },
  { value: 'ningxia', label: '宁夏', shortName: '宁夏', dbName: '宁夏', region: 'west', totalStudents: 70000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.nxjyks.cn/' },
  { value: 'xinjiang', label: '新疆', shortName: '新疆', dbName: '新疆', region: 'west', totalStudents: 220000, recordCount: 0, years: [], quality: 'C', status: 'collecting', note: 'No local SQLite admission records yet; data collecting.', officialSite: 'https://www.xjzk.gov.cn/' },
];

export const OPEN_PROVINCES = PROVINCES.filter(province => province.status === 'open');
export const SELECTABLE_PROVINCES = PROVINCES.filter(province => province.status === 'open' || province.status === 'limited');

export function isProvince(value: unknown): value is Province {
  return typeof value === 'string' && PROVINCES.some(province => province.value === value);
}

export function getProvinceMeta(province: Province): ProvinceMeta {
  const meta = PROVINCES.find(item => item.value === province);
  if (!meta) throw new Error(`Unsupported province: ${province}`);
  return meta;
}

export function getProvinceLabel(province: Province): string {
  return getProvinceMeta(province).shortName;
}
