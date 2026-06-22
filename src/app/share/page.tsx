import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: '高考志愿风险预览 H5',
  description:
    '适合从微信、抖音、小红书打开的高考志愿 H5 测评入口。输入分数、位次和选科，先生成免费预览。',
  alternates: { canonical: '/share' },
  openGraph: {
    title: '高考志愿风险预览 H5',
    description: '输入分数、位次和选科，先看冲稳保参考与专业方向风险。',
    url: '/share',
    type: 'website',
  },
};

const painPoints = ['不确定当前位次能冲哪些学校', '担心历史组/物理组专业错配', '想先看风险，再决定是否深入咨询'];
const promises = ['基于真实录取记录', '选科要求硬校验', '免费生成预览报告'];

export default function SharePage() {
  return (
    <main className="min-h-[100dvh] bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] px-4 py-5 text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label="云研志愿首页">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground">
              云
            </div>
            <span className="font-semibold tracking-tight">云研志愿</span>
          </Link>
          <Badge variant="secondary" className="rounded-full">
            H5 测评入口
          </Badge>
        </header>

        <section className="rounded-[2rem] border bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                无需注册
              </Badge>
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950">
                填志愿前，先做一次风险预览
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                输入省份、分数、位次和选科组合，系统先给出位次定位、专业方向边界和冲稳保参考。
              </p>
            </div>
            <Button size="lg" className="h-12 rounded-full text-base font-semibold shadow-lg shadow-primary/20" asChild>
              <Link href="/input">
                立即测一测
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">适合微信、抖音、小红书打开 · 先预览再决策</p>
          </div>
        </section>

        <section className="grid gap-3">
          {painPoints.map(item => (
            <Card key={item} className="rounded-3xl bg-white/90 py-4 shadow-sm">
              <CardContent className="flex items-start gap-3 px-4">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ClipboardCheck />
                </div>
                <div className="text-sm font-medium leading-6">{item}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-300/50">
          <CardHeader>
            <CardTitle>系统会先拦住明显不该推荐的方向</CardTitle>
            <CardDescription className="text-white/60">
              例如历史组不推首选物理记录，物理组不推纯文史哲主干方向。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {promises.map(item => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3 ring-1 ring-white/10">
                <CheckCircle2 />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Alert className="rounded-3xl bg-white">
          <ShieldCheck />
          <AlertTitle>重要说明</AlertTitle>
          <AlertDescription>
            本工具只提供志愿填报辅助分析，不承诺录取；最终以省考试院、高校招生章程和当年招生计划为准。
          </AlertDescription>
        </Alert>

      </div>
    </main>
  );
}
