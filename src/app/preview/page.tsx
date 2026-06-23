'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Report, ReportPreviewResponse, UserProfile } from '@/lib/types';
import { getProvinceLabel } from '@/lib/provinces';

export default function PreviewPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      const stored = sessionStorage.getItem('userProfile');
      if (!stored) {
        router.push('/input');
        return;
      }
      try {
        const userProfile: UserProfile = JSON.parse(stored);
        userProfile.createdAt = new Date(userProfile.createdAt);
        const response = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userProfile),
        });
        const payload = (await response.json()) as Partial<ReportPreviewResponse> & { error?: string };
        if (!response.ok || !payload.report || !payload.reportId) throw new Error(payload.error || '报告生成失败');
        sessionStorage.setItem('reportId', payload.reportId);
        sessionStorage.setItem('report', JSON.stringify(payload.report));
        setReport(payload.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : '报告生成失败');
      } finally {
        setLoading(false);
      }
    };
    void generate();
  }, [router]);

  if (loading) return <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-4"><Card className="w-full max-w-md rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-8 text-center"><div className="mx-auto mb-5 h-2 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-blue-700" /></div><p className="font-medium text-slate-900">正在生成智能报告</p><p className="mt-2 text-sm text-slate-500">正在查询本地录取数据库和方法论知识库。</p></CardContent></Card></div>;

  if (error) return <div className="min-h-[100dvh] bg-slate-50"><main className="mx-auto max-w-xl px-4 py-10"><Alert variant="destructive"><AlertTitle>生成失败</AlertTitle><AlertDescription>{error}</AlertDescription></Alert><Button className="mt-6" onClick={() => router.push('/input')}>返回重新填写</Button></main></div>;
  if (!report) return null;

  const provinceName = getProvinceLabel(report.userProfile.province);
  const rankLabel = report.positionAnalysis.rank > 0 ? String(report.positionAnalysis.rank) : '\u672a\u586b\u5199\uff08\u6309\u5206\u6570\u5339\u914d\uff09';
  const isArtSports = report.userProfile.candidateType === 'art' || report.userProfile.candidateType === 'sports';
  const topStable = report.recommendations.stable[0];
  const topOpportunity = report.recommendations.opportunities?.[0];
  const visibleRiskWarnings = report.riskWarnings.filter(warning => !warning.includes('???')).slice(0, 3);

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white">志</div><span className="font-semibold">AI志愿填报</span></Link>
          <Badge variant="secondary" className="rounded-full">智能预览</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8 pb-24">
        <div className="mb-6 text-center"><h1 className="text-2xl font-semibold tracking-tight">智能报告预览</h1><p className="mt-2 text-sm text-slate-500">{provinceName}考生 {report.userProfile.score}分 / 位次{rankLabel}</p></div>
        <Card className="mb-4 rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-6"><h3 className="mb-3 text-lg font-semibold">位次定位</h3><div className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between text-sm"><span className="text-slate-500">省份</span><span className="font-medium">{provinceName}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">分数</span><span className="font-semibold">{report.userProfile.score}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">位次</span><span className="font-semibold">{rankLabel}</span></div><p className="mt-4 border-t pt-4 text-sm leading-6 text-slate-700">{report.positionAnalysis.positionDescription}</p></div></CardContent></Card>
        <Card className="mb-4 rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-6"><h3 className="mb-3 text-lg font-semibold">{report.userProfile.candidateType === 'art' || report.userProfile.candidateType === 'sports' ? '院校专业组概览' : '推荐概览'}</h3><div className="space-y-3 text-sm leading-6 text-slate-700">{topStable && <p>稳妥方向可重点关注 <span className="font-medium text-slate-950">{topStable.university.name} · {topStable.major.name}</span>，参考概率约 {topStable.admissionChance}%。</p>}{topOpportunity && <p>捡漏候选：<span className="font-medium text-slate-950">{topOpportunity.university.name} · {topOpportunity.major.name}</span>，需结合位次波动谨慎判断。</p>}<p className="text-slate-500">{report.userProfile.candidateType === 'art' || report.userProfile.candidateType === 'sports' ? '解锁后可查看院校专业组冲刺、稳妥、保底清单和报告问答；组内具体专业需以招生计划和高校章程为准。' : '解锁后可查看冲刺、稳妥、保底清单和报告问答。'}</p></div></CardContent></Card>
        <Card className="mb-6 rounded-3xl border-slate-200 shadow-sm"><CardContent className="p-6"><h3 className="mb-3 text-lg font-semibold">风险提示</h3><div className="space-y-2">{visibleRiskWarnings.length > 0 ? visibleRiskWarnings.map((warning, idx) => <p key={idx} className="text-sm leading-6 text-slate-700">{warning}</p>) : <p className="text-sm leading-6 text-slate-700">暂无额外风险提示，请以考试院和高校官方发布为准。</p>}</div></CardContent></Card>
        <div className="text-center"><Button size="lg" onClick={() => router.push('/unlock')} className="rounded-full bg-blue-700 px-8 text-white hover:bg-blue-800">解锁完整报告</Button><p className="mt-3 text-xs text-slate-500">完整报告包含数据证据、策略依据和风险诊断。</p></div>
      </main>
    </div>
  );
}
