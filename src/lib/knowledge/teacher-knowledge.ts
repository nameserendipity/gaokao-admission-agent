import fs from 'node:fs';
import path from 'node:path';
import type { Province, UserProfile } from '@/lib/types';

const KNOWLEDGE_DIR = process.env.TEACHER_KNOWLEDGE_DIR || path.join(process.cwd(), 'data', 'teacher-knowledge');

export interface TeacherKnowledgeItem {
  id: string;
  title: string;
  category: string;
  province: Province | 'all';
  tags: string[];
  source: string;
  content: string;
  path: string;
}

export interface TeacherKnowledgeResult {
  items: TeacherKnowledgeItem[];
  promptContext: string;
  warnings: string[];
}

let cache: TeacherKnowledgeItem[] | null = null;

export function getTeacherKnowledgeDir(): string {
  return KNOWLEDGE_DIR;
}

export function loadTeacherKnowledge(): TeacherKnowledgeItem[] {
  if (cache) return cache;
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    cache = [];
    return cache;
  }
  const files = walkMarkdown(KNOWLEDGE_DIR);
  cache = files.map(file => parseKnowledgeFile(file)).filter((item): item is TeacherKnowledgeItem => Boolean(item));
  return cache;
}

export function searchTeacherKnowledge(profile: UserProfile, riskWarnings: string[] = []): TeacherKnowledgeResult {
  const all = loadTeacherKnowledge();
  const queryTerms = buildTerms(profile, riskWarnings);
  const scored = all
    .map(item => ({ item, score: scoreItem(item, profile.province, queryTerms) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(entry => entry.item);

  const promptContext = scored.map(item => [
    `标题：${item.title}`,
    `分类：${item.category}；省份：${item.province}；标签：${item.tags.join('、')}；来源：${item.source}`,
    item.content.slice(0, 1800),
  ].join('\n')).join('\n\n');

  return {
    items: scored,
    promptContext,
    warnings: scored.length === 0 ? ['未命中老师方法论知识库'] : [],
  };
}

export function inspectTeacherKnowledge() {
  const items = loadTeacherKnowledge();
  const byCategory = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  return { path: KNOWLEDGE_DIR, count: items.length, byCategory, items: items.map(item => ({ id: item.id, title: item.title, category: item.category, province: item.province, tags: item.tags })) };
}

function walkMarkdown(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(full);
    return entry.isFile() && entry.name.endsWith('.md') ? [full] : [];
  });
}

function parseKnowledgeFile(file: string): TeacherKnowledgeItem | null {
  const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const frontMatter = parseFrontMatter(match[1]);
  const content = match[2].trim();
  const rel = path.relative(KNOWLEDGE_DIR, file).replace(/\\/g, '/');
  return {
    id: rel.replace(/\.md$/, ''),
    title: frontMatter.title || path.basename(file, '.md'),
    category: frontMatter.category || 'general',
    province: isProvince(frontMatter.province) ? frontMatter.province : 'all',
    tags: parseTags(frontMatter.tags),
    source: frontMatter.source || '项目内老师方法论知识库',
    content,
    path: rel,
  };
}

function parseFrontMatter(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return result;
}

function parseTags(value?: string): string[] {
  if (!value) return [];
  return value.replace(/^\[/, '').replace(/\]$/, '').split(',').map(item => item.trim()).filter(Boolean);
}

function isProvince(value?: string): value is Province {
  return value === 'zhejiang' || value === 'shandong';
}

function buildTerms(profile: UserProfile, riskWarnings: string[]): string[] {
  const terms = new Set<string>();
  profile.preferredMajors.forEach(item => terms.add(item));
  profile.excludedMajors.forEach(item => terms.add(item));
  riskWarnings.forEach(item => item.split(/[，。；、\\s]+/).forEach(token => token && terms.add(token)));
  if (profile.careerGoal === 'employment') terms.add('就业');
  if (profile.careerGoal === 'stable') terms.add('稳定');
  if (profile.careerGoal === 'postgraduate') terms.add('考研');
  if (profile.familyBackground === 'ordinary') terms.add('普通家庭');
  if (profile.familyBackground === 'difficult') terms.add('困难家庭');
  terms.add('位次');
  terms.add('冲稳保');
  terms.add('专业');
  return [...terms];
}

function scoreItem(item: TeacherKnowledgeItem, province: Province, terms: string[]): number {
  let score = item.province === province ? 20 : item.province === 'all' ? 8 : 0;
  if (item.category === 'prompt') score += 12;
  if (item.category === 'strategy') score += 10;
  if (item.category === 'family') score += 6;
  const haystack = `${item.title}\n${item.tags.join(' ')}\n${item.content}`;
  for (const term of terms) {
    if (term.length >= 2 && haystack.includes(term)) score += 4;
  }
  return score;
}
