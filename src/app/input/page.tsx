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
import type { UserProfile, Province, Region, CareerGoal, CandidateType, StrategyMode, PrimarySubject, ElectiveSubject, SubjectCategory } from '@/lib/types';
import { SELECTABLE_PROVINCES, getProvinceMeta } from '@/lib/provinces';
import { ELECTIVE_SUBJECT_OPTIONS, PRIMARY_SUBJECT_OPTIONS, filterMajorsBySubject, getAllowedMajorNames, getSubjectCategoryFromSelection, getSubjectCombinationLabel } from '@/lib/subject-rules';

type InputFormData = Partial<Omit<UserProfile, 'electiveSubjects'>> & { electiveSubjects?: ElectiveSubject[] };

const T = {
  appName: '\u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b', step: '\u6b65\u9aa4', basic: '\u57fa\u672c\u4fe1\u606f', subject: '\u9009\u79d1\u7ec4\u5408', major: '\u4e13\u4e1a\u504f\u597d', region: '\u5730\u57df\u504f\u597d', career: '\u5c31\u4e1a\u8bc9\u6c42',
  basicHint: '\u9009\u62e9\u8003\u751f\u7c7b\u578b\u3001\u7701\u4efd\u5e76\u586b\u5199\u5206\u6570\u3002', candidateType: '\u8003\u751f\u7c7b\u578b', general: '\u666e\u901a\u7c7b\u8003\u751f', generalDesc: '\u4f7f\u7528\u6587\u5316\u5206\u3001\u4f4d\u6b21\u3001\u9009\u79d1\u548c\u666e\u901a\u6279\u5f55\u53d6\u4f4d\u6b21\u8fdb\u884c\u5fd7\u613f\u5206\u6790',
  art: '\u827a\u672f\u7c7b\u8003\u751f', artDesc: '\u6c5f\u897f\u827a\u672f\u672c\u79d1\u6279\uff1a\u586b\u5199\u6587\u5316\u5206\u3001\u4e13\u4e1a\u5206\u3001\u7efc\u5408\u5206/\u6295\u6863\u5206\u540e\u76f4\u63a5\u751f\u6210\u827a\u4f53\u62a5\u544a', sports: '\u4f53\u80b2\u7c7b\u8003\u751f', sportsDesc: '\u6c5f\u897f\u4f53\u80b2\u672c\u79d1\u6279\uff1a\u586b\u5199\u6587\u5316\u5206\u3001\u4f53\u80b2\u4e13\u4e1a\u6295\u6863\u5206/\u4e13\u4e1a\u5206\u540e\u76f4\u63a5\u751f\u6210\u827a\u4f53\u62a5\u544a',
  artNotice: '\u827a\u4f53\u7c7b\u5c06\u6309\u6c5f\u897f\u827a\u672f/\u4f53\u80b2\u672c\u79d1\u6279\u6295\u6863\u7ebf\u72ec\u7acb\u751f\u6210\u62a5\u544a\uff0c\u4e0d\u5957\u7528\u666e\u901a\u7c7b\u4f4d\u6b21\u6a21\u578b\u3002\u5f53\u524d\u4ec5\u652f\u6301\u6c5f\u897f\u3002', province: '\u7701\u4efd', trial: '\u8bd5\u7528', jiangxiOnly: '\u5f53\u524d\u827a\u4f53\u62a5\u544a\u4ec5\u652f\u6301\u6c5f\u897f\u7701\uff0c\u8bf7\u9009\u62e9\u6c5f\u897f\u3002',
  score: '\u6587\u5316\u5206/\u9ad8\u8003\u5206\u6570', scorePh: '\u8bf7\u8f93\u5165\u6587\u5316\u5206', chooseProvince: '\u8bf7\u5148\u9009\u62e9\u7701\u4efd', fullScore: '\u6ee1\u5206\u6309\u0037\u0035\u0030\u5206\u5904\u7406', artCategory: '\u827a\u4f53\u7c7b\u522b', sportsCat: '\u4f53\u80b2\u7c7b', professionalScore: '\u4e13\u4e1a\u5206', compositeScore: '\u7efc\u5408\u5206/\u6295\u6863\u5206',
  rank: '\u4f4d\u6b21\uff08\u53ef\u9009\uff09', rankPh: '\u5982\u6709\u4f4d\u6b21\u8bf7\u586b\u5199', artRank: '\u827a\u4f53\u7efc\u5408\u5206\u6392\u540d/\u6295\u6863\u6392\u540d\uff08\u53ef\u9009\uff09', artRankPh: '\u5982\u6709\u827a\u4f53\u4e00\u5206\u4e00\u6bb5\u6392\u540d\u8bf7\u586b\u5199',
  subjectTitle: '\u9009\u79d1\u7ec4\u5408', primarySubject: '\u9996\u9009\u79d1\u76ee', electiveSubjects: '\u518d\u9009\u79d1\u76ee\uff08\u8bf7\u9009\u62e92\u95e8\uff09', subjectHint: '\u666e\u901a\u7c7b\u7edf\u4e00\u63093+1+2\u5904\u7406\uff1a\u5148\u9009\u7269\u7406\u7ec4/\u5386\u53f2\u7ec4\uff0c\u518d\u4ece\u5316\u5b66\u3001\u751f\u7269\u3001\u653f\u6cbb\u3001\u5730\u7406\u4e2d\u8865\u90092\u95e8\u3002\u4e13\u4e1a\u504f\u597d\u4f1a\u4e25\u683c\u6309\u5b8c\u6574\u7ec4\u5408\u8fc7\u6ee4\u3002',
  majorTitle: '\u4e13\u4e1a\u504f\u597d', majorOptionalHint: '\u53ef\u4e0d\u9009\u62e9\u4e13\u4e1a\u504f\u597d\uff1b\u7559\u7a7a\u65f6\u7cfb\u7edf\u4e5f\u53ea\u4f1a\u5728\u5f53\u524d\u9009\u79d1\u7ec4\u5408\u5141\u8bb8\u7684\u4e13\u4e1a\u8303\u56f4\u5185\u6309\u5206\u6570\u3001\u4f4d\u6b21\u505a\u63a8\u8350\u3002', excludedMajor: '\u4e0d\u559c\u6b22\u7684\u4e13\u4e1a', noSubjectMajorHint: '\u8bf7\u5148\u5b8c\u6210\u9009\u79d1\u7ec4\u5408\uff0c\u7cfb\u7edf\u4f1a\u5c55\u793a\u8be5\u7ec4\u5408\u53ef\u9009\u7684\u4e13\u4e1a\u3002',
  regionTitle: '\u5730\u57df\u504f\u597d', regionOptionalHint: '\u5730\u57df\u504f\u597d\u4e5f\u662f\u53ef\u9009\u9879\uff1b\u4e0d\u9009\u65f6\u4e0d\u4f1a\u51cf\u5c11\u63a8\u8350\u6570\u91cf\uff0c\u7cfb\u7edf\u4f1a\u4f18\u5148\u4fdd\u8bc1\u51b2\u7a33\u4fdd\u68af\u5ea6\u5b8c\u6574\u3002', careerTitle: '\u5c31\u4e1a\u8bc9\u6c42', strategyTitle: '\u586b\u62a5\u7b56\u7565', prev: '\u4e0a\u4e00\u6b65', next: '\u4e0b\u4e00\u6b65', generate: '\u751f\u6210\u62a5\u544a',
} as const;

const STEPS = [{ id: 1, title: T.basic }, { id: 2, title: T.subject }, { id: 3, title: T.major }, { id: 4, title: T.region }, { id: 5, title: T.career }];
const CANDIDATE_TYPES: { value: CandidateType; label: string; desc: string }[] = [
  { value: 'general', label: T.general, desc: T.generalDesc }, { value: 'art', label: T.art, desc: T.artDesc }, { value: 'sports', label: T.sports, desc: T.sportsDesc },
];
const ART_CATEGORIES = ['\u7f8e\u672f\u4e0e\u8bbe\u8ba1\u7c7b', '\u97f3\u4e50\u7c7b', '\u821e\u8e48\u7c7b', '\u4e66\u6cd5\u7c7b', '\u64ad\u97f3\u4e0e\u4e3b\u6301\u7c7b', '\u8868(\u5bfc)\u6f14\u7c7b', '\u620f\u5267\u5f71\u89c6\u5bfc\u6f14\u7c7b', '\u670d\u88c5\u8868\u6f14\u7c7b'];
const REGIONS: { value: Region; label: string }[] = [
  { value: 'east', label: '\u534e\u4e1c\u5730\u533a' }, { value: 'south', label: '\u534e\u5357\u5730\u533a' }, { value: 'north', label: '\u534e\u5317\u5730\u533a' }, { value: 'west', label: '\u897f\u90e8\u5730\u533a' }, { value: 'central', label: '\u534e\u4e2d\u5730\u533a' }, { value: 'northeast', label: '\u4e1c\u5317\u5730\u533a' },
];
const CAREER_GOALS: { value: CareerGoal; label: string; desc: string }[] = [
  { value: 'employment', label: '\u5c31\u4e1a\u4f18\u5148', desc: '\u4f18\u5148\u8003\u8651\u5c31\u4e1a\u7387\u9ad8\u3001\u85aa\u8d44\u8f83\u597d\u7684\u4e13\u4e1a' }, { value: 'postgraduate', label: '\u8003\u7814\u6df1\u9020', desc: '\u4f18\u5148\u8003\u8651\u5b66\u672f\u6027\u5f3a\u3001\u6df1\u9020\u673a\u4f1a\u591a\u7684\u4e13\u4e1a' }, { value: 'stable', label: '\u7a33\u5b9a\u5c31\u4e1a', desc: '\u4f18\u5148\u8003\u8651\u6559\u5e08\u3001\u533b\u751f\u3001\u516c\u52a1\u5458\u7b49\u7a33\u5b9a\u65b9\u5411' }, { value: 'flexible', label: '\u7efc\u5408\u8003\u8651', desc: '\u7efc\u5408\u8003\u8651\u5c31\u4e1a\u3001\u5347\u5b66\u3001\u5174\u8da3\u7b49\u56e0\u7d20' },
];
const STRATEGY_MODES: { value: StrategyMode; label: string; desc: string }[] = [
  { value: 'safe', label: '\u7a33\u59a5\u4f18\u5148', desc: '\u4f18\u5148\u4fdd\u8bc1\u5f55\u53d6\u5b89\u5168\u57ab\uff0c\u9002\u5408\u4e0d\u60f3\u5192\u8f83\u5927\u98ce\u9669\u7684\u5bb6\u5ead' }, { value: 'major', label: '\u4e13\u4e1a\u4f18\u5148', desc: '\u66f4\u770b\u91cd\u4e13\u4e1a\u65b9\u5411\u5339\u914d\uff0c\u9002\u5408\u5df2\u6709\u660e\u786e\u5174\u8da3\u7684\u8003\u751f' }, { value: 'school', label: '\u5b66\u6821\u5c42\u6b21\u4f18\u5148', desc: '\u9002\u5ea6\u63d0\u9ad8\u9662\u6821\u5c42\u6b21\u6743\u91cd\uff0c\u517c\u987e\u51b2\u523a\u7a7a\u95f4' }, { value: 'city', label: '\u57ce\u5e02\u5730\u57df\u4f18\u5148', desc: '\u66f4\u770b\u91cd\u5730\u57df\u504f\u597d\uff0c\u9002\u5408\u5bf9\u57ce\u5e02\u6709\u660e\u786e\u8981\u6c42\u7684\u5bb6\u5ead' },
];

export default function InputPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InputFormData>({ preferredMajors: [], excludedMajors: [], preferredRegions: [] });
  const isArtSports = formData.candidateType === 'art' || formData.candidateType === 'sports';
  const totalSteps = isArtSports ? 1 : STEPS.length;
  const progress = totalSteps === 1 ? 100 : ((currentStep - 1) / (totalSteps - 1)) * 100;
  const selectedSubjectCategory = getSubjectCategoryFromSelection(formData.primarySubject, formData.electiveSubjects);
  const allowedMajors = selectedSubjectCategory ? getAllowedMajorNames(selectedSubjectCategory) : [];

  const updateFormData = (updates: InputFormData) => setFormData(prev => ({ ...prev, ...updates }));
  const applySubjectSelection = (primarySubject: PrimarySubject | undefined, electiveSubjects: ElectiveSubject[] | undefined) => {
    const subjectCategory = getSubjectCategoryFromSelection(primarySubject, electiveSubjects);
    updateFormData({
      primarySubject,
      electiveSubjects,
      subjectCategory,
      preferredMajors: filterMajorsBySubject(formData.preferredMajors || [], subjectCategory),
      excludedMajors: filterMajorsBySubject(formData.excludedMajors || [], subjectCategory),
    });
  };
  const toggleElective = (subject: ElectiveSubject) => {
    const current = formData.electiveSubjects || [];
    const next = current.includes(subject) ? current.filter(item => item !== subject) : [...current, subject].slice(0, 2);
    applySubjectSelection(formData.primarySubject, next);
  };
  const canProceed = () => {
    if (currentStep === 1 && isArtSports) return formData.province === 'jiangxi' && Number(formData.score) > 0 && Number(formData.professionalScore) > 0 && (formData.candidateType === 'sports' || Number(formData.compositeScore) > 0) && (formData.candidateType === 'sports' || Boolean(formData.artSportsCategory));
    if (currentStep === 1) return formData.candidateType === 'general' && Boolean(formData.province) && Number(formData.score) > 0;
    if (currentStep === 2) return Boolean(selectedSubjectCategory);
    if (currentStep === 5) return Boolean(formData.careerGoal);
    return true;
  };
  const handleSubmit = () => {
    const subjectCategory = selectedSubjectCategory || formData.subjectCategory;
    if (!isArtSports && !subjectCategory) return;
    const selection = subjectCategory ? { primarySubject: formData.primarySubject!, electiveSubjects: formData.electiveSubjects as [ElectiveSubject, ElectiveSubject], subjectCategory: subjectCategory as SubjectCategory } : { primarySubject: 'physics' as PrimarySubject, electiveSubjects: ['chemistry', 'biology'] as [ElectiveSubject, ElectiveSubject], subjectCategory: 'physics_chemistry_biology' as SubjectCategory };
    const completeData: UserProfile = {
      candidateType: formData.candidateType || 'general', province: formData.province!, score: formData.score!, rank: formData.rank || null,
      professionalScore: formData.professionalScore || null, compositeScore: formData.compositeScore || null, artSportsCategory: formData.candidateType === 'sports' ? T.sportsCat : formData.artSportsCategory || null,
      primarySubject: selection.primarySubject, electiveSubjects: selection.electiveSubjects, subjectCategory: selection.subjectCategory,
      preferredMajors: filterMajorsBySubject(formData.preferredMajors || [], selection.subjectCategory), excludedMajors: filterMajorsBySubject(formData.excludedMajors || [], selection.subjectCategory),
      preferredRegions: formData.preferredRegions || [], familyBackground: formData.familyBackground || 'ordinary', careerGoal: formData.careerGoal || 'flexible', strategyMode: formData.strategyMode || 'safe', createdAt: new Date(),
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
        <div><Label htmlFor="score" className="text-base font-medium">{T.score}</Label><Input id="score" type="number" placeholder={T.scorePh} value={formData.score ?? ''} onChange={e => updateFormData({ score: parseFloat(e.target.value) || undefined })} className="mt-2" /><p className="mt-1 text-xs text-muted-foreground">{formData.province ? `${getProvinceMeta(formData.province).label}${T.fullScore}` : T.chooseProvince}</p>{isArtSports && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">注意：请先确认文化分已达到当年对应艺体本科批文化控制线；若文化分未过线，即使专业分/投档分接近，也存在无法投档或录取的风险。</p>}</div>
        {isArtSports && <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"><div><Label className="text-base font-medium">{T.artCategory}</Label>{formData.candidateType === 'art' ? <RadioGroup value={formData.artSportsCategory || undefined} onValueChange={(value: string) => updateFormData({ artSportsCategory: value })} className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">{ART_CATEGORIES.map(category => <div key={category} className="flex items-center rounded-lg border bg-white p-2"><RadioGroupItem value={category} id={`art-${category}`} /><Label htmlFor={`art-${category}`} className="ml-2 cursor-pointer text-sm">{category}</Label></div>)}</RadioGroup> : <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700">{T.sportsCat}</p>}</div><div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="professionalScore">{formData.candidateType === 'sports' ? '\u4f53\u80b2\u4e13\u4e1a\u6295\u6863\u5206/\u4e13\u4e1a\u5206' : T.professionalScore}</Label><Input id="professionalScore" type="number" step="0.001" value={formData.professionalScore ?? ''} onChange={e => updateFormData({ professionalScore: parseFloat(e.target.value) || undefined })} className="mt-2 bg-white" />{formData.candidateType === 'sports' && <p className="mt-2 text-xs leading-5 text-emerald-700">当前江西体育类按公开表中的体育专业投档分和体育投档排名匹配，不使用普通类综合分模型。</p>}</div>{formData.candidateType === 'art' && <div><Label htmlFor="compositeScore">{T.compositeScore}</Label><Input id="compositeScore" type="number" step="0.001" value={formData.compositeScore ?? ''} onChange={e => updateFormData({ compositeScore: parseFloat(e.target.value) || undefined })} className="mt-2 bg-white" /></div>}</div><div><Label htmlFor="artRank">{formData.candidateType === 'sports' ? '体育投档排名（可选）' : T.artRank}</Label><Input id="artRank" type="number" placeholder={formData.candidateType === 'sports' ? '\u5982\u6709\u4f53\u80b2\u7c7b\u6295\u6863\u6392\u540d\u8bf7\u586b\u5199' : T.artRankPh} value={formData.rank ?? ''} onChange={e => updateFormData({ rank: parseInt(e.target.value) || null })} className="mt-2 bg-white" /></div></div>}
        {!isArtSports && <div><Label htmlFor="rank" className="text-base font-medium">{T.rank}</Label><Input id="rank" type="number" placeholder={T.rankPh} value={formData.rank ?? ''} onChange={e => updateFormData({ rank: parseInt(e.target.value) || null })} className="mt-2" /></div>}
      </div>}
      {currentStep === 2 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">{T.subjectTitle}</h2><p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{T.subjectHint}</p></div><div><Label className="text-base font-medium">{T.primarySubject}</Label><RadioGroup value={formData.primarySubject} onValueChange={(value: PrimarySubject) => applySubjectSelection(value, [])} className="mt-3 space-y-3">{PRIMARY_SUBJECT_OPTIONS.map(option => <div key={option.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={option.value} id={`primary-${option.value}`} className="mt-1" /><div className="ml-3"><Label htmlFor={`primary-${option.value}`} className="cursor-pointer font-medium">{option.label}</Label><p className="mt-1 text-xs text-muted-foreground">{option.desc}</p></div></div>)}</RadioGroup></div><div><Label className="text-base font-medium">{T.electiveSubjects}</Label><div className="mt-3 grid grid-cols-2 gap-3">{ELECTIVE_SUBJECT_OPTIONS.map(option => { const checked = (formData.electiveSubjects || []).includes(option.value); const disabled = !checked && (formData.electiveSubjects || []).length >= 2; return <label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${disabled ? 'opacity-50' : 'hover:bg-muted/50'}`}><Checkbox checked={checked} disabled={disabled} onCheckedChange={() => toggleElective(option.value)} />{option.label}</label>; })}</div>{selectedSubjectCategory && <p className="mt-3 text-sm text-blue-700">{'\u5f53\u524d\u7ec4\u5408\uff1a'}{getSubjectCombinationLabel(selectedSubjectCategory)}</p>}</div></div>}
      {currentStep === 3 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">{T.majorTitle}</h2><p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{selectedSubjectCategory ? T.majorOptionalHint : T.noSubjectMajorHint}</p></div>{selectedSubjectCategory && <><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{allowedMajors.map(major => <Button key={major} type="button" variant={(formData.preferredMajors || []).includes(major) ? 'default' : 'outline'} onClick={() => toggleMajor(major, 'preferredMajors')} className="h-auto justify-start whitespace-normal text-left text-xs">{major}</Button>)}</div><Label>{T.excludedMajor}</Label><div className="grid grid-cols-2 gap-2 md:grid-cols-3">{allowedMajors.map(major => <Button key={major} type="button" variant={(formData.excludedMajors || []).includes(major) ? 'destructive' : 'outline'} onClick={() => toggleMajor(major, 'excludedMajors')} className="h-auto justify-start whitespace-normal text-left text-xs">{major}</Button>)}</div></>}</div>}
      {currentStep === 4 && <div className="space-y-6"><div><h2 className="text-xl font-semibold">{T.regionTitle}</h2><p className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{T.regionOptionalHint}</p></div><div className="grid grid-cols-2 gap-3">{REGIONS.map(region => <div key={region.value} className="flex items-center space-x-2 rounded-lg border p-3"><Checkbox id={region.value} checked={(formData.preferredRegions || []).includes(region.value)} onCheckedChange={() => toggleRegion(region.value)} /><Label htmlFor={region.value} className="cursor-pointer">{region.label}</Label></div>)}</div></div>}
      {currentStep === 5 && <div className="space-y-6"><h2 className="text-xl font-semibold">{T.careerTitle}</h2><RadioGroup value={formData.careerGoal} onValueChange={(value: CareerGoal) => updateFormData({ careerGoal: value })} className="space-y-3">{CAREER_GOALS.map(goal => <div key={goal.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={goal.value} id={goal.value} className="mt-1" /><div className="ml-3"><Label htmlFor={goal.value} className="cursor-pointer font-medium">{goal.label}</Label><p className="mt-1 text-xs text-muted-foreground">{goal.desc}</p></div></div>)}</RadioGroup><div className="space-y-3"><Label className="text-base font-medium">{T.strategyTitle}</Label><RadioGroup value={formData.strategyMode || 'safe'} onValueChange={(value: StrategyMode) => updateFormData({ strategyMode: value })} className="space-y-3">{STRATEGY_MODES.map(mode => <div key={mode.value} className="flex items-start rounded-lg border p-3 hover:bg-muted/50"><RadioGroupItem value={mode.value} id={`strategy-${mode.value}`} className="mt-1" /><div className="ml-3"><Label htmlFor={`strategy-${mode.value}`} className="cursor-pointer font-medium">{mode.label}</Label><p className="mt-1 text-xs text-muted-foreground">{mode.desc}</p></div></div>)}</RadioGroup></div></div>}
    </CardContent></Card></main>
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 md:p-6"><div className="mx-auto flex max-w-xl gap-3">{currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">{T.prev}</Button>}<Button onClick={handleNext} disabled={!canProceed()} className="flex-1 bg-primary hover:bg-primary/90">{isArtSports || currentStep === STEPS.length ? T.generate : T.next}</Button></div></div>
  </div>;
}
