'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Recommendation, Report, ReportChatMessage, ReportPreviewResponse } from '@/lib/types';

const subjectLabel: Record<string, string> = {
  physics_chemistry: '物理 / 化学',
  history_politics: '历史 / 政治',
  physics_history: '物理 / 历史',
  chemistry_biology: '化学 / 生物',
  other: '其他组合',
};

const riskTone = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  high: 'border-rose-200 bg-rose-50 text-rose-800',
};

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<ReportChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unlocked = sessionStorage.getItem('unlocked');
    if (!unlocked) {
      router.push('/unlock');
      return;
    }

    const load = async () => {
      const reportId = sessionStorage.getItem('reportId');
      if (!reportId) {
        const cached = sessionStorage.getItem('report');
        if (cached) {
          setReport(JSON.parse(cached) as Report);
          return;
        }
        router.push('/input');
        return;
      }

      try {
        const response = await fetch(`/api/reports/${reportId}`);
        const payload = (await response.json()) as Partial<ReportPreviewResponse> & { error?: string };
        if (!response.ok || !payload.report) throw new Error(payload.error || '报告读取失败');
        setReport(payload.report);
        sessionStorage.setItem('report', JSON.stringify(payload.report));

        const chatResponse = await fetch(`/api/reports/${reportId}/chat`);
        if (chatResponse.ok) {
          const chatPayload = (await chatResponse.json()) as { messages?: ReportChatMessage[] };
          setMessages(chatPayload.messages || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '报告读取失败');
      }
    };
    void load();
  }, [router]);

  const allRecommendations = useMemo(() => {
    if (!report) return [];
    return [...report.recommendations.sprint, ...report.recommendations.stable, ...report.recommendations.guarantee];
  }, [report]);

  const handleAsk = async () => {
    if (!report || !question.trim() || chatLoading) return;
    const reportId = sessionStorage.getItem('reportId') || report.id;
    setChatLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports/${reportId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as { messages?: ReportChatMessage[]; error?: string };
      if (!response.ok || !payload.messages) throw new Error(payload.error || '追问失败');
      setMessages(prev => [...prev, ...payload.messages!]);
      setQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '追问失败');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRestart = () => {
    const confirmed = window.confirm('\u786e\u5b9a\u8981\u91cd\u65b0\u586b\u5199\u5417\uff1f\u65b0\u63d0\u4ea4\u540e\u4f1a\u751f\u6210\u4e00\u4efd\u65b0\u62a5\u544a\u3002');
    if (!confirmed) return;
    sessionStorage.removeItem('reportId');
    sessionStorage.removeItem('report');
    sessionStorage.removeItem('unlocked');
    router.push('/input');
  };


  if (!report && !error) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 h-2 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" /></div>
            <p className="font-medium text-slate-900">正在读取完整报告</p>
            <p className="mt-2 text-sm text-slate-500">正在整理录取数据、策略依据和风险诊断。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-[100dvh] bg-slate-50">
        <main className="mx-auto max-w-xl px-4 py-10">
          <Alert variant="destructive"><AlertTitle>读取失败</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          <Button className="mt-6" onClick={() => router.push('/input')}>返回重新填写</Button>
        </main>
      </div>
    );
  }

  if (!report) return null;
  const provinceName = report.userProfile.province === 'zhejiang' ? '浙江' : '山东';
  const topRisk = report.riskDiagnosis?.find(item => item.level === 'high') || report.riskDiagnosis?.[0];

  return (
    <div className="min-h-[100dvh] bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white shadow-sm">志</div>
            <div><p className="text-sm font-semibold leading-none">AI志愿填报</p><p className="mt-1 text-xs text-slate-500">数据证据 + 方法论分析</p></div>
          </Link>
          <Badge className="rounded-full bg-emerald-600 px-3 text-white">已解锁完整报告</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <section className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{provinceName}</Badge><Badge variant="outline" className="rounded-full">{subjectLabel[report.userProfile.subjectCategory] || report.userProfile.subjectCategory}</Badge><Badge variant="outline" className="rounded-full">报告ID {report.id.slice(-10)}</Badge></div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">完整志愿推荐报告</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{report.positionAnalysis.positionDescription}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleRestart} variant="outline" className="rounded-full border-slate-200 bg-white">{'\u4fe1\u606f\u586b\u9519\u4e86\uff0c\u91cd\u65b0\u751f\u6210'}</Button>
                <Button onClick={() => router.push('/preview')} variant="ghost" className="rounded-full text-slate-600">{'\u8fd4\u56de\u9884\u89c8'}</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-3xl bg-slate-50 p-3"><Metric label="分数" value={String(report.userProfile.score)} /><Metric label="位次" value={String(report.positionAnalysis.rank)} /><Metric label="推荐" value={String(allRecommendations.length)} /></div>
          </div>
        </section>

        {error && <Alert variant="destructive" className="mb-6"><AlertTitle>提示</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {report.aiSummary && <Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6 md:p-7"><SectionTitle title="智能总判断" subtitle="结合录取数据库与方法论知识库生成" /><div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{report.aiSummary}</div></CardContent></Card>}
            <Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6 md:p-7"><SectionTitle title="冲稳保推荐" subtitle="按位次差、趋势和专业匹配度分层" /><div className="mt-6 space-y-8"><RecommendationSection title="冲刺" description="争取上限，风险最高" tone="blue" items={report.recommendations.sprint} /><RecommendationSection title="稳妥" description="主体选择，优先保证匹配" tone="emerald" items={report.recommendations.stable} /><RecommendationSection title="保底" description="防止滑档，必须可接受" tone="amber" items={report.recommendations.guarantee} /></div></CardContent></Card>
            <Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6 md:p-7"><SectionTitle title="报告追问 Agent" subtitle="继续问哪个更稳、是否值得冲、专业风险是什么" /><div className="mt-5 max-h-96 space-y-3 overflow-auto rounded-2xl bg-slate-50 p-4">{messages.length === 0 && <p className="text-sm text-slate-500">可以问：哪几个志愿最稳？计算机要不要换成电子信息？保底还缺不缺？</p>}{messages.map(message => <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-2xl bg-blue-700 p-3 text-white' : 'max-w-[85%] rounded-2xl bg-white p-3 text-slate-700 shadow-sm'}><p className="mb-1 text-xs opacity-70">{message.role === 'user' ? '你' : 'Agent'}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p></div>)}</div><div className="mt-4"><Textarea value={question} onChange={event => setQuestion(event.target.value)} placeholder="例如：我更想保专业，应该删掉哪些冲刺？" className="min-h-24 rounded-2xl border-slate-200 bg-white" /><Button onClick={handleAsk} disabled={chatLoading || !question.trim()} className="mt-3 rounded-full bg-blue-700 px-5 text-white hover:bg-blue-800">{chatLoading ? '分析中...' : '提交追问'}</Button></div></CardContent></Card>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start"><Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6"><SectionTitle title="风险诊断" subtitle={topRisk ? topRisk.message : '当前未发现高风险项'} compact /><div className="mt-5 space-y-3">{(report.riskDiagnosis || []).length === 0 && <p className="text-sm text-slate-500">暂无额外风险诊断。</p>}{(report.riskDiagnosis || []).map((risk, index) => <div key={`${risk.type}-${index}`} className={`rounded-2xl border p-4 ${riskTone[risk.level]}`}><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold">{risk.message}</span><span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{risk.level}</span></div><p className="text-sm leading-6 opacity-90">{risk.suggestion}</p></div>)}</div></CardContent></Card><Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6"><SectionTitle title="策略依据" subtitle="来自项目内老师方法论知识库" compact /><div className="mt-5 space-y-3">{(report.strategyInsights || []).map(item => <div key={`${item.category}-${item.title}`} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className="rounded-full">{item.category}</Badge><p className="text-sm font-semibold">{item.title}</p></div><p className="text-xs leading-5 text-slate-500">{item.summary}</p></div>)}</div></CardContent></Card><Card className="rounded-[1.5rem] border-slate-200 shadow-sm"><CardContent className="p-6"><SectionTitle title="数据来源" subtitle="所有录取数据都可回溯" compact /><div className="mt-5 space-y-3">{report.dataSources.map((source, idx) => <div key={`${source.name}-${source.year}-${idx}`} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-medium text-slate-800">{source.name}</p><p className="mt-1 text-xs text-slate-500">{source.year}年录取数据{source.collectedAt ? ` · ${new Date(source.collectedAt).toLocaleDateString('zh-CN')}` : ''}</p>{source.url && <Link href={source.url} target="_blank" className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline">查看来源</Link>}</div>)}</div></CardContent></Card></aside>
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><p className="font-semibold">免责声明</p><p className="mt-1">{report.disclaimer}</p></div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{value}</p></div>; }
function SectionTitle({ title, subtitle, compact = false }: { title: string; subtitle: string; compact?: boolean }) { return <div><h2 className={compact ? 'text-lg font-semibold tracking-tight' : 'text-xl font-semibold tracking-tight md:text-2xl'}>{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p></div>; }
function RecommendationSection({ title, description, tone, items }: { title: string; description: string; tone: 'blue' | 'emerald' | 'amber'; items: Recommendation[] }) { const toneClass = tone === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'; return <section><div className="mb-3 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Badge variant="outline" className={`rounded-full ${toneClass}`}>{title}</Badge><p className="text-sm text-slate-500">{description}</p></div><span className="text-xs text-slate-400">{items.length} 个</span></div>{items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">暂无{title}推荐。建议扩大专业、地域或位次窗口后重新生成。</div> : <div className="grid gap-3">{items.map((rec, idx) => <RecommendationCard key={`${rec.university.code}-${rec.major.name}-${idx}`} rec={rec} />)}</div>}</section>; }
function RecommendationCard({ rec }: { rec: Recommendation }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{rec.university.name}</h3><Badge variant="outline" className="rounded-full text-xs">{rec.university.level === 'double_first_class' ? '双一流' : rec.university.level}</Badge>{rec.isOpportunity && <Badge className="rounded-full bg-blue-700 text-xs text-white">捡漏候选</Badge>}</div><p className="mt-2 text-sm text-slate-700">{rec.major.name}{' ? '}{rec.major.category}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>{rec.admissionRecord.year}年</span><span>最低分 {rec.admissionRecord.lowestScore}</span><span>最低位次 {rec.admissionRecord.lowestRank}</span><span>位次差 {rec.rankDiff ?? '-'}</span><span>参考概率 {rec.admissionChance ?? '-'}%</span></div></div><div className="rounded-2xl bg-slate-50 px-4 py-3 text-right"><p className="text-xs text-slate-500">匹配分</p><p className="text-2xl font-semibold text-slate-950">{rec.matchScore}</p></div></div><Separator className="my-4" /><div className="grid gap-4 md:grid-cols-2"><div><p className="mb-2 text-xs font-medium text-slate-500">推荐理由</p><div className="space-y-1.5">{rec.reasons.slice(0, 3).map((reason, index) => <p key={index} className="text-sm leading-6 text-slate-700">{reason}</p>)}</div></div><div><p className="mb-2 text-xs font-medium text-slate-500">数据证据</p><div className="space-y-1.5">{(rec.evidence || []).slice(0, 2).map(item => <p key={`${item.year}-${item.lowestRank}`} className="text-xs leading-5 text-slate-500">{item.year}年{' · '}{item.lowestScore}分{' · '}{item.lowestRank}位{' · '}{item.sourceName}</p>)}</div></div></div>{rec.riskNotes && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{rec.riskNotes}</p>}</div>; }
