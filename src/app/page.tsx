import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  ShieldCheck,
  Smartphone,
  Sparkles,
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
import { SELECTABLE_PROVINCES } from '@/lib/provinces';

const features = [
  {
    title: '先验资格，再谈推荐',
    description: '严格校验首选科目、再选科目和专业方向，宁可少推，不做错配推荐。',
    icon: ShieldCheck,
  },
  {
    title: '真实录取数据支撑',
    description: '每条候选记录保留年份、分数、位次和来源，方便家长复核。',
    icon: Database,
  },
  {
    title: '冲稳保结构清晰',
    description: '按位次安全垫、专业匹配度和院校层次生成可解释的梯度方案。',
    icon: CheckCircle2,
  },
  {
    title: '适合手机直接使用',
    description: '为微信、抖音、小红书等移动端入口优化，填写和查看更顺手。',
    icon: Smartphone,
  },
];

const steps = ['选择省份与考生类型', '填写分数、位次和选科', '选择专业与地区偏好', '生成预览报告'];

export default function Home() {
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.12),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f7fafc_100%)] text-foreground">
      <header className="sticky top-0 z-50 border-b bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="云研志愿首页">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-sm">
              云
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight">云研志愿</div>
              <div className="hidden text-xs text-muted-foreground sm:block">高考志愿 H5 决策助手</div>
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/data-disclaimer">数据说明</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/input">开始测评</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-8 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:pb-16 md:pt-14">
          <div className="flex flex-col justify-center gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                手机 H5 可直接打开
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                2022-2025 录取数据
              </Badge>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
                给自己一个更稳的志愿
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                输入省份、分数、位次和选科组合，系统基于本地真实录取数据生成冲稳保参考报告，并严格拦截选科冲突和专业方向错配。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-full px-6 text-base font-semibold shadow-lg shadow-primary/20"
                asChild
              >
                <Link href="/input">
                  立即生成预览
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-6 text-base" asChild>
                <Link href="/share">查看 H5 分享页</Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-3xl border bg-white/80 shadow-sm">
              <div className="flex flex-col gap-1 border-r px-4 py-4 text-center">
                <span className="text-2xl font-black tabular-nums">{SELECTABLE_PROVINCES.length}</span>
                <span className="text-xs text-muted-foreground">开放省份</span>
              </div>
              <div className="flex flex-col gap-1 border-r px-4 py-4 text-center">
                <span className="text-2xl font-black tabular-nums">3+1+2</span>
                <span className="text-xs text-muted-foreground">选科校验</span>
              </div>
              <div className="flex flex-col gap-1 px-4 py-4 text-center">
                <span className="text-2xl font-black">保守</span>
                <span className="text-xs text-muted-foreground">推荐原则</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 top-8 size-40 rounded-full bg-primary/10 blur-3xl" />
            <Card className="relative rounded-[2rem] border-white/80 bg-white/90 p-0 shadow-2xl shadow-slate-200/70 backdrop-blur">
              <CardHeader className="gap-3 border-b p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Sparkles />
                    </div>
                    <div>
                      <CardTitle className="text-lg">预览报告示例</CardTitle>
                      <CardDescription>手机端重点信息优先展示</CardDescription>
                    </div>
                  </div>
                  <Badge>H5</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="rounded-3xl bg-slate-950 p-5 text-white">
                  <div className="text-sm text-white/60">位次定位</div>
                  <div className="mt-2 text-3xl font-black">中上区间</div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[62%] rounded-full bg-white" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['冲刺', '稳妥', '保底'].map((item, index) => (
                    <div key={item} className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-muted-foreground">{item}</div>
                      <div className="mt-2 text-2xl font-black">{[6, 8, 6][index]}</div>
                      <div className="mt-1 text-xs text-muted-foreground">候选方案</div>
                    </div>
                  ))}
                </div>
                <Alert className="rounded-2xl bg-primary/5">
                  <ShieldCheck />
                  <AlertTitle>硬规则已启用</AlertTitle>
                  <AlertDescription>
                    凡与招生记录选科要求或专业方向冲突的记录，一律不进入推荐池。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex flex-col gap-2">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              为什么适合从短视频和微信入口进入
            </Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">少填信息，先拿到可复核的判断</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="rounded-3xl bg-white/90 shadow-sm transition-transform hover:-translate-y-0.5">
                  <CardHeader className="gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="leading-6">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Card className="rounded-[2rem] border-primary/10 bg-primary text-primary-foreground shadow-xl shadow-primary/15">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
              <div className="flex flex-col gap-3">
                <Badge variant="secondary" className="w-fit rounded-full">
                  4 步完成预览
                </Badge>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  从视频、群聊点进来，也能快速完成测评
                </h2>
                <p className="text-sm leading-6 text-primary-foreground/80">
                  适合投放、私域社群、公众号菜单和家长转发场景。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div key={step} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                    <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-white text-sm font-black text-primary">
                      {index + 1}
                    </div>
                    <div className="font-semibold">{step}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 md:pb-16">
          <div className="rounded-[2rem] border bg-white p-6 text-center shadow-sm md:p-8">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              先生成一份免费预览，再决定是否深入咨询
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              本系统只提供数据分析和风险提示，不承诺录取。最终填报仍应以省考试院、高校招生章程和家庭实际情况为准。
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-full px-8 text-base font-semibold" asChild>
                <Link href="/input">开始填写信息</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base" asChild>
                <Link href="/data-disclaimer">查看数据说明</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <span>云研志愿 · 高考志愿 H5 决策助手</span>
          <span>仅供参考，不构成录取承诺。</span>
        </div>
      </footer>
    </div>
  );
}
