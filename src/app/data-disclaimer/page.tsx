import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PROVINCES } from '@/lib/provinces';

export const metadata = {
  title: '数据说明与免责声明 - AI志愿填报助手',
  description: '说明录取数据来源、覆盖质量、位次估算、院校专业组和免责声明。',
};

const qualityText = {
  A: '覆盖较完整：可用于生成主要推荐，但仍需结合官方招生计划复核。',
  B: '覆盖中等：适合作为试用参考，部分年份、分数或位次字段可能不完整。',
  C: '覆盖有限：样本较少或字段缺失明显，仅可作为辅助参考。',
} as const;

export default function DataDisclaimerPage() {
  const available = PROVINCES.filter(province => province.status !== 'collecting');
  const collecting = PROVINCES.filter(province => province.status === 'collecting');

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold">AI志愿填报助手</Link>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/input">开始生成报告</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <section className="mb-8">
          <Badge variant="outline" className="mb-4 rounded-full border-blue-200 bg-blue-50 text-blue-700">数据透明说明</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">数据说明与免责声明</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            本工具基于本地录取数据、公开招生信息和规则模型生成志愿参考建议。高考录取受招生计划、选科要求、报考热度、政策调整等多因素影响，报告不构成录取承诺。
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <h2 className="text-xl font-semibold">数据来源与更新口径</h2>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <p>录取数据主要来自省级教育考试院、高校招生信息、公开投档线文件及项目内整理后的本地 SQLite 数据库。</p>
                  <p>不同省份公开字段不完全一致：有的省份公布最低分，有的公布最低位次，有的按院校专业组公布投档线。因此系统会根据可用字段进行匹配和提示。</p>
                  <p>当某省份缺少真实位次字段时，系统可能按分数和已有样本估算位次用于排序，并在报告风险提示中说明。</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <h2 className="text-xl font-semibold">A / B / C 数据质量含义</h2>
                <div className="mt-4 grid gap-3">
                  {(['A', 'B', 'C'] as const).map(level => (
                    <div key={level} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full bg-blue-700 text-white">{level}级</Badge>
                        <p className="font-medium text-slate-900">{qualityText[level]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <h2 className="text-xl font-semibold">院校专业组说明</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  部分省份按“院校专业组”投档。报告中的“院校专业组”代表该组投档线，并不直接等同于某一个具体专业。正式填报前，请务必核对招生计划中的组内专业、选科要求、校区、学费和体检限制。
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <h2 className="text-xl font-semibold text-amber-950">免责声明</h2>
                <p className="mt-4 text-sm leading-7 text-amber-900">
                  本报告仅供参考，不构成录取承诺、填报指令或法律意见。最终志愿填报应以各省教育考试院、高校招生章程、当年招生计划和官方志愿填报系统为准。建议考生和家长结合自身兴趣、家庭情况、城市偏好、专业限制和官方信息谨慎决策。
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">当前可试用省份</h2>
                <div className="mt-4 max-h-[520px] space-y-2 overflow-auto pr-1">
                  {available.map(province => (
                    <div key={province.value} className="rounded-2xl bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{province.label}</span>
                        <Badge variant={province.quality === 'A' ? 'default' : 'secondary'} className="rounded-full">{province.quality}级</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{province.years.length > 0 ? province.years.join('、') : '暂无'} · {province.recordCount}条</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">补充中省份</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">以下省份本地数据仍在补充，暂不生成正式报告。</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {collecting.map(province => <Badge key={province.value} variant="outline" className="rounded-full">{province.label}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
