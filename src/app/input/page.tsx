'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import type { UserProfile, Province, SubjectCategory, Region, CareerGoal, CandidateType, StrategyMode } from '@/lib/types';
import { SELECTABLE_PROVINCES, getProvinceMeta } from '@/lib/provinces';

const T = {
  appName: '\u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b',
  step: '\u6b65\u9aa4',
  basic: '\u57fa\u672c\u4fe1\u606f',
  subject: '\u9009\u79d1\u7c7b\u578b',
  major: '\u4e13\u4e1a\u504f\u597d',
  region: '\u5730\u57df\u504f\u597d',
  career: '\u5c31\u4e1a\u8bc9\u6c42',
  basicHint: '\u9009\u62e9\u8003\u751f\u7c7b\u578b\u3001\u7701\u4efd\u5e76\u586b\u5199\u5206\u6570\u3002',
  candidateType: '\u8003\u751f\u7c7b\u578b',
  general: '\u666e\u901a\u7c7b\u8003\u751f',
  generalDesc: '\u4f7f\u7528\u6587\u5316\u5206\u3001\u4f4d\u6b21\u3001\u9009\u79d1\u548c\u666e\u901a\u6279\u5f55\u53d6\u4f4d\u6b21\u8fdb\u884c\u5fd7\u613f\u5206\u6790',
  art: '\u827a\u672f\u7c7b\u8003\u751f',
  artDesc: '\u6c5f\u897f\u827a\u672f\u672c\u79d1\u6279\uff1a\u586b\u5199\u6587\u5316\u5206\u3001\u4e13\u4e1a\u5206\u3001\u7efc\u5408\u5206/\u6295\u6863\u5206\u540e\u76f4\u63a5\u751f\u6210\u827a\u4f53\u62a5\u544a',
  sports: '\u4f53\u80b2\u7c7b\u8003\u751f',
  sportsDesc: '\u6c5f\u897f\u4f53\u80b2\u672c\u79d1\u6279\uff1a\u586b\u5199\u6587\u5316\u5206\u3001\u4e13\u4e1a\u5206\u3001\u7efc\u5408\u5206/\u6295\u6863\u5206\u540e\u76f4\u63a5\u751f\u6210\u827a\u4f53\u62a5\u544a',
  artNotice: '\u827a\u4f53\u7c7b\u5c06\u6309\u6c5f\u897f\u827a\u672f/\u4f53\u80b2\u672c\u79d1\u6279\u6295\u6863\u7ebf\u72ec\u7acb\u751f\u6210\u62a5\u544a\uff0c\u4e0d\u5957\u7528\u666e\u901a\u7c7b\u4f4d\u6b21\u6a21\u578b\u3002\u5f53\u524d\u4ec5\u652f\u6301\u6c5f\u897f\u3002',
  province: '\u7701\u4efd',
  trial: '\u8bd5\u7528',
  jiangxiOnly: '\u5f53\u524d\u827a\u4f53\u62a5\u544a\u4ec5\u652f\u6301\u6c5f\u897f\u7701\uff0c\u8bf7\u9009\u62e9\u6c5f\u897f\u3002',
  score: '\u6587\u5316\u5206/\u9ad8\u8003\u5206\u6570',
  scorePh: '\u8bf7\u8f93\u5165\u6587\u5316\u5206',
  chooseProvince: '\u8bf7\u5148\u9009\u62e9\u7701\u4efd',
  fullScore: '\u6ee1\u5206\u6309\u0037\u0035\u0030\u5206\u5904\u7406',
  artCategory: '\u827a\u4f53\u7c7b\u522b',
  sportsCat: '\u4f53\u80b2\u7c7b',
  professionalScore: '\u4e13\u4e1a\u5206',
  compositeScore: '\u7efc\u5408\u5206/\u6295\u6863\u5206',
  rank: '\u4f4d\u6b21\uff08\u53ef\u9009\uff09',
  rankPh: '\u5982\u6709\u4f4d\u6b21\u8bf7\u586b\u5199',
  artRank: '\u827a\u4f53\u7efc\u5408\u5206\u6392\u540d/\u6295\u6863\u6392\u540d\uff08\u53ef\u9009\uff09',
  artRankPh: '\u5982\u6709\u827a\u4f53\u4e00\u5206\u4e00\u6bb5\u6392\u540d\u8bf7\u586b\u5199',
  subjectTitle: '\u9009\u79d1\u7c7b\u578b',
  majorTitle: '\u4e13\u4e1a\u504f\u597d',
  majorOptionalHint: '\u53ef\u4e0d\u9009\u62e9\u4e13\u4e1a\u504f\u597d\uff1b\u7559\u7a7a\u65f6\u7cfb\u7edf\u4f1a\u6309\u5206\u6570\u3001\u4f4d\u6b21\u548c\u9009\u79d1\u4f18\u5148\u505a\u5e7f\u8c31\u9662\u6821\u63a8\u8350\u3002',
  excludedMajor: '\u4e0d\u559c\u6b22\u7684\u4e13\u4e1a',
  regionTitle: '\u5730\u57df\u504f\u597d',
  regionOptionalHint: '\u5730\u57df\u504f\u597d\u4e5f\u662f\u53ef\u9009\u9879\uff1b\u4e0d\u9009\u65f6\u4e0d\u4f1a\u51cf\u5c11\u63a8\u8350\u6570\u91cf\uff0c\u7cfb\u7edf\u4f1a\u4f18\u5148\u4fdd\u8bc1\u51b2\u7a33\u4fdd\u68af\u5ea6\u5b8c\u6574\u3002',
  careerTitle: '\u5c31\u4e1a\u8bc9\u6c42',
  strategyTitle: '\u586b\u62a5\u7b56\u7565',
  prev: '\u4e0a\u4e00\u6b65',
  next: '\u4e0b\u4e00\u6b65',
  generate: '\u751f\u6210\u62a5\u544a',
} as const;

const STEPS = [{ id: 1, title: T.basic }, { id: 2, title: T.subject }, { id: 3, title: T.major }, { id: 4, title: T.region }, { id: 5, title: T.career }];
const CANDIDATE_TYPES: { value: CandidateType; label: string; desc: string }[] = [
  { value: 'general', label: T.general, desc: T.generalDesc },
  { value: 'art', label: T.art, desc: T.artDesc },
  { value: 'sports', label: T.sports, desc: T.sportsDesc },
];
const ART_CATEGORIES = ['\u7f8e\u672f\u4e0e\u8bbe\u8ba1\u7c7b', '\u97f3\u4e50\u7c7b', '\u821e\u8e48\u7c7b', '\u4e66\u6cd5\u7c7b', '\u64ad\u97f3\u4e0e\u4e3b\u6301\u7c7b', '\u8868(\u5bfc)\u6f14\u7c7b', '\u620f\u5267\u5f71\u89c6\u5bfc\u6f14\u7c7b', '\u670d\u88c5\u8868\u6f14\u7c7b'];
const SUBJECT_CATEGORIES: { value: SubjectCategory; label: string; desc: string }[] = [
  { value: 'physics_chemistry', label: '\u7269\u7406+\u5316\u5b66', desc: '\u5de5\u79d1\u3001\u7406\u79d1\u7c7b\u4e13\u4e1a' },
  { value: 'history_politics', label: '\u5386\u53f2+\u653f\u6cbb', desc: '\u6587\u79d1\u3001\u6cd5\u5b66\u7c7b\u4e13\u4e1a' },
  { value: 'physics_history', label: '\u7269\u7406+\u5386\u53f2', desc: '\u90e8\u5206\u5de5\u79d1\u548c\u6587\u79d1\u4e13\u4e1a' },
  { value: 'chemistry_biology', label: '\u5316\u5b66+\u751f\u7269', desc: '\u533b\u5b66\u3001\u519c\u5b66\u7c7b\u4e13\u4e1a' },
  { value: 'other', label: '\u5176\u4ed6\u7ec4\u5408', desc: '\u6309\u5b9e\u9645\u60c5\u51b5\u9009\u62e9' },
];
const REGIONS: { value: Region; label: string }[] = [
  { value: 'east', label: '\u534e\u4e1c\u5730\u533a' }, { value: 'south', label: '\u534e\u5357\u5730\u533a' }, { value: 'north', label: '\u534e\u5317\u5730\u533a' },
  { value: 'west', label: '\u897f\u90e8\u5730\u533a' }, { value: 'central', label: '\u534e\u4e2d\u5730\u533a' }, { value: 'northeast', label: '\u4e1c\u5317\u5730\u533a' },
];
const CAREER_GOALS: { value: CareerGoal; label: string; desc: string }[] = [
  { value: 'employment', label: '\u5c31\u4e1a\u4f18\u5148', desc: '\u4f18\u5148\u8003\u8651\u5c31\u4e1a\u7387\u9ad8\u3001\u85aa\u8d44\u8f83\u597d\u7684\u4e13\u4e1a' },
  { value: 'postgraduate', label: '\u8003\u7814\u6df1\u9020', desc: '\u4f18\u5148\u8003\u8651\u5b66\u672f\u6027\u5f3a\u3001\u6df1\u9020\u673a\u4f1a\u591a\u7684\u4e13\u4e1a' },
  { value: 'stable', label: '\u7a33\u5b9a\u5c31\u4e1a', desc: '\u4f18\u5148\u8003\u8651\u6559\u5e08\u3001\u533b\u751f\u3001\u516c\u52a1\u5458\u7b49\u7a33\u5b9a\u65b9\u5411' },
  { value: 'flexible', label: '\u7efc\u5408\u8003\u8651', desc: '\u7efc\u5408\u8003\u8651\u5c31\u4e1a\u3001\u5347\u5b66\u3001\u5174\u8da3\u7b49\u56e0\u7d20' },
];

const STRATEGY_MODES: { value: StrategyMode; label: string; desc: string }[] = [
  { value: 'safe', label: '稳妥优先', desc: '优先保证录取安全垫，适合不想冒较大风险的家庭' },
  { value: 'major', label: '专业优先', desc: '更看重专业方向匹配，适合已有明确兴趣的考生' },
  { value: 'school', label: '学校层次优先', desc: '适度提高院校层次权重，兼顾冲刺空间' },
  { value: 'city', label: '城市地域优先', desc: '更看重地域偏好，适合对城市有明确要求的家庭' },
];

const POPULAR_MAJORS = ['\u8ba1\u7b97\u673a\u79d1\u5b66\u4e0e\u6280\u672f', '\u8f6f\u4ef6\u5de5\u7a0b', '\u4eba\u5de5\u667a\u80fd', '\u7535\u5b50\u4fe1\u606f\u5de5\u7a0b', '\u7535\u6c14\u5de5\u7a0b\u53ca\u5176\u81ea\u52a8\u5316', '\u4e34\u5e8a\u533b\u5b66', '\u6c49\u8bed\u8a00\u6587\u5b66(\u5e08\u8303)', '\u6570\u5b66\u4e0e\u5e94\u7528\u6570\u5b66(\u5e08\u8303)', '\u6cd5\u5b66', '\u7ecf\u6d4e\u5b66', '\u91d1\u878d\u5b66', '\u4f1a\u8ba1\u5b66'];

export default function InputPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({ preferredMajors: [], excludedMajors: [], preferredRegions: [] });
  const isArtSports = formData.candidateType === 'art' || formData.candidateType === 'sports';
  const totalSteps = isArtSports ? 1 : STEPS.length;
  const progress = ((currentStep - 1) / totalSteps) * 100;
  const updateFormData = (updates: Partial<UserProfile>) => setFormData(prev => ({ ...prev, ...updates }));
  const canProceed = () => {
    if (currentStep === 1 && isArtSports) return formData.province === 'jiangxi' && Number(formData.score) > 0 && Number(formData.professionalScore) > 0 && (formData.candidateType === 'sports' || Number(formData.compositeScore) > 0) && (formData.candidateType === 'sports' || Boolean(formData.artSportsCategory));
    if (currentStep === 1) return formData.candidateType === 'general' && Boolean(formData.province) && Number(formData.score) > 0;
    if (currentStep === 2) return Boolean(formData.subjectCategory);
    if (currentStep === 5) return Boolean(formData.careerGoal);
    return true;
  };
  const handleSubmit = () => {
    const completeData: UserProfile = {
      candidateType: formData.candidateType || 'general', province: formData.province!, score: formData.score!, rank: formData.rank || null,
      professionalScore: formData.professionalScore || null, compositeScore: formData.compositeScore || null, artSportsCategory: formData.candidateType === 'sports' ? T.sportsCat : formData.artSportsCategory || null,
      subjectCategory: formData.subjectCategory || 'other', preferredMajors: formData.preferredMajors || [], excludedMajors: formData.excludedMajors || [], preferredRegions: formData.preferredRegions || [], familyBackground: formData.familyBackground || 'ordinary', careerGoal: formData.careerGoal || 'flexible', strategyMode: formData.strategyMode || 'safe', createdAt: new Date(),
    };
    sessionStorage.setItem('userProfile', JSON.stringify(completeData));
    router.push('/preview');
  };
  const handleNext = () => { if (isArtSports || currentStep === STEPS.length) handleSubmit(); else setCurrentStep(currentStep + 1); };
  const toggleMajor = (major: string, key: 'preferredMajors' | 'excludedMajors') => { const current = formData[key] || []; updateFormData({ [key]: current.includes(major) ? current.filter(m => m !== major) : [...current, major] }); };
  const toggleRegion = (region: Region) => { const current = formData.preferredRegions || []; updateFormData({ preferredRegions: current.includes(region) ? current.filter(r => r !== region) : [...current, region] }); };
  return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4"><Link href="/" className="font-semibold text-lg">{T.appName}</Link><span className="text-sm text-muted-foreground">{T.step} {currentStep}/{totalSteps}</span></div></header>
    <div className="mx-auto max-w-4xl px-4 py-4"><Progress value={progress} className="h-2" /><div className="mt-2 flex justify-between text-xs text-muted-foreground">{(isArtSports ? [STEPS[0]] : STEPS).map((step, idx) => <span key={step.id} className={idx + 1 <= currentStep ? 'font-medium text-primary' : ''}>{step.title}</span>)}</div></div>
    <main className="mx-auto max-w-xl px-4 pb-24"><Card className="shadow-sm"><CardContent className="p-6 md:p-8">
      {currentStep === 1 && <div className="space-y-6"><div><h2 className="mb-2 text-xl font-semibold">{T.basic}</h2><p className="text-sm text-muted-foreground">{T.basicHint}</p></div>
        <div><Label className="text-base font-medium">{T.candidateType}</Label><RadioGroup value={formData.candidateType} onValueChange={(value: CandidateType) => updateFormData({ candidateType: value })} className="mt-2 space-y-2">{CANDIDATE_TYPES.map(type => <div key={type.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={type.value} id={`candidate-${type.value}`} className="mt-1" /><div className="ml-3"><Label htmlFor={`candidate-${type.value}`} className="cursor-pointer font-medium">{type.label}</Label><p className="mt-1 text-xs text-muted-foreground">{type.desc}</p></div></div>)}</RadioGroup>{isArtSports && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">{T.artNotice}</div>}</div>
        <div><Label className="text-base font-medium">{T.province}</Label><RadioGroup value={formData.province} onValueChange={(value: Province) => updateFormData({ province: value })} className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">{(isArtSports ? SELECTABLE_PROVINCES.filter(prov => prov.value === 'jiangxi') : SELECTABLE_PROVINCES).map(prov => <div key={prov.value} className="flex items-center"><RadioGroupItem value={prov.value} id={prov.value} /><Label htmlFor={prov.value} className="ml-2 cursor-pointer">{prov.label}{prov.status === 'limited' && !isArtSports ? <span className="ml-1 text-[10px] text-amber-600">{T.trial}</span> : null}</Label></div>)}</RadioGroup>{isArtSports ? <p className="mt-2 text-xs text-emerald-700">{T.jiangxiOnly}</p> : null}</div>
        <div><Label htmlFor="score" className="text-base font-medium">{T.score}</Label><Input id="score" type="number" placeholder={T.scorePh} value={formData.score ?? ''} onChange={e => updateFormData({ score: parseFloat(e.target.value) || undefined })} className="mt-2" /><p className="mt-1 text-xs text-muted-foreground">{formData.province ? `${getProvinceMeta(formData.province).label}${T.fullScore}` : T.chooseProvince}</p></div>
        {isArtSports && <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><div><Label className="text-base font-medium">{T.artCategory}</Label>{formData.candidateType === 'art' ? <RadioGroup value={formData.artSportsCategory || undefined} onValueChange={(value: string) => updateFormData({ artSportsCategory: value })} className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">{ART_CATEGORIES.map(category => <div key={category} className="flex items-center rounded-lg border bg-white p-2"><RadioGroupItem value={category} id={`art-${category}`} /><Label htmlFor={`art-${category}`} className="ml-2 cursor-pointer text-sm">{category}</Label></div>)}</RadioGroup> : <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700">{T.sportsCat}</p>}</div><div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="professionalScore">{formData.candidateType === 'sports' ? '体育专业投档分/专业分' : T.professionalScore}</Label><Input id="professionalScore" type="number" step="0.001" value={formData.professionalScore ?? ''} onChange={e => updateFormData({ professionalScore: parseFloat(e.target.value) || undefined })} className="mt-2 bg-white" /></div>{formData.candidateType === 'art' && <div><Label htmlFor="compositeScore">{T.compositeScore}</Label><Input id="compositeScore" type="number" step="0.001" value={formData.compositeScore ?? ''} onChange={e => updateFormData({ compositeScore: parseFloat(e.target.value) || undefined })} className="mt-2 bg-white" /></div>}</div><div><Label htmlFor="artRank">{T.artRank}</Label><Input id="artRank" type="number" placeholder={T.artRankPh} value={formData.rank ?? ''} onChange={e => updateFormData({ rank: parseInt(e.target.value) || null })} className="mt-2 bg-white" /></div></div>}
        {!isArtSports && <div><Label htmlFor="rank" className="text-base font-medium">{T.rank}</Label><Input id="rank" type="number" placeholder={T.rankPh} value={formData.rank ?? ''} onChange={e => updateFormData({ rank: parseInt(e.target.value) || null })} className="mt-2" /></div>}
      </div>}
      {currentStep === 2 && <div className="space-y-6"><h2 className="text-xl font-semibold">{T.subjectTitle}</h2><RadioGroup value={formData.subjectCategory} onValueChange={(value: SubjectCategory) => updateFormData({ subjectCategory: value })} className="space-y-3">{SUBJECT_CATEGORIES.map(cat => <div key={cat.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={cat.value} id={cat.value} className="mt-1" /><div className="ml-3"><Label htmlFor={cat.value} className="cursor-pointer font-medium">{cat.label}</Label><p className="mt-1 text-xs text-muted-foreground">{cat.desc}</p></div></div>)}</RadioGroup></div>}
      {currentStep === 3 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">{T.majorTitle}</h2><p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{T.majorOptionalHint}</p></div><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{POPULAR_MAJORS.map(major => <Button key={major} type="button" variant={(formData.preferredMajors || []).includes(major) ? 'default' : 'outline'} onClick={() => toggleMajor(major, 'preferredMajors')} className="h-auto justify-start whitespace-normal text-left text-xs">{major}</Button>)}</div><Label>{T.excludedMajor}</Label><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{POPULAR_MAJORS.slice(0, 8).map(major => <Button key={major} type="button" variant={(formData.excludedMajors || []).includes(major) ? 'destructive' : 'outline'} onClick={() => toggleMajor(major, 'excludedMajors')} className="h-auto justify-start whitespace-normal text-left text-xs">{major}</Button>)}</div></div>}
      {currentStep === 4 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">{T.regionTitle}</h2><p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{T.regionOptionalHint}</p></div><div className="grid grid-cols-2 gap-3">{REGIONS.map(region => <div key={region.value} onClick={() => toggleRegion(region.value)} className={`cursor-pointer rounded-lg border p-4 ${(formData.preferredRegions || []).includes(region.value) ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}><div className="flex items-center gap-2"><Checkbox checked={(formData.preferredRegions || []).includes(region.value)} className="pointer-events-none" /><span className="font-medium">{region.label}</span></div></div>)}</div></div>}
      {currentStep === 5 && <div className="space-y-8"><div className="space-y-4"><h2 className="text-xl font-semibold">{T.careerTitle}</h2><RadioGroup value={formData.careerGoal} onValueChange={(value: CareerGoal) => updateFormData({ careerGoal: value })} className="space-y-3">{CAREER_GOALS.map(goal => <div key={goal.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={goal.value} id={goal.value} className="mt-1" /><div className="ml-3"><Label htmlFor={goal.value} className="cursor-pointer font-medium">{goal.label}</Label><p className="mt-1 text-xs text-muted-foreground">{goal.desc}</p></div></div>)}</RadioGroup></div><div className="space-y-4"><h2 className="text-xl font-semibold">{T.strategyTitle}</h2><RadioGroup value={formData.strategyMode || 'safe'} onValueChange={(value: StrategyMode) => updateFormData({ strategyMode: value })} className="grid gap-3 md:grid-cols-2">{STRATEGY_MODES.map(mode => <div key={mode.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={mode.value} id={`strategy-${mode.value}`} className="mt-1" /><div className="ml-3"><Label htmlFor={`strategy-${mode.value}`} className="cursor-pointer font-medium">{mode.label}</Label><p className="mt-1 text-xs text-muted-foreground">{mode.desc}</p></div></div>)}</RadioGroup></div></div>}
    </CardContent></Card></main>
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 md:p-6"><div className="mx-auto flex max-w-xl gap-3">{currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">{T.prev}</Button>}<Button onClick={handleNext} disabled={!canProceed()} className="flex-1 bg-primary hover:bg-primary/90">{isArtSports || currentStep === STEPS.length ? T.generate : T.next}</Button></div></div>
  </div>;
}
