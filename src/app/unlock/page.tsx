'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, FileText, LockKeyhole, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reportHighlights = [
  {
    title: '冲稳保完整清单',
    desc: '不是只给几个学校名，而是拆成冲刺、稳妥、保底和捡漏候选，方便直接做志愿梯度。',
  },
  {
    title: '专业避雷诊断',
    desc: '提示选科限制、专业过热、就业稳定性、调剂风险，避免“分够了但不适合”。',
  },
  {
    title: '每条推荐都有证据',
    desc: '展示年份、最低分/位次、来源文件，不用只听一句“系统判断合适”。',
  },
  {
    title: '后续可继续追问',
    desc: '解锁后可以围绕某所学校、某个专业、是否冲刺继续问，不用自己翻几十张表。',
  },
];

const lockedItems = [
  '完整院校/专业名称',
  '录取概率与位次差',
  '冲稳保排序建议',
  '风险原因与替代方案',
  '数据来源与年份证据',
];

export default function UnlockPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleUnlock = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    sessionStorage.setItem('unlocked', 'true');
    router.push('/report');
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#dbeafe_0,#f8fafc_38%,#ffffff_72%)] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/preview" className="flex items-center gap-3 hover:opacity-85">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white">志</div>
            <span className="font-semibold">AI志愿填报助手</span>
          </Link>
          <Badge className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50">
            完整避坑方案
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-28 md:py-12">
        <section className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              预览只显示诊断，完整报告才给可执行方案
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              别只看“能不能上”，更要知道
              <span className="text-blue-700"> 哪些志愿会踩坑</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              完整报告会把院校、专业、位次差、风险原因和替代方案放在一起，帮你从几十个候选里筛出真正能填、值得填、风险可控的志愿。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={handleUnlock}
                disabled={processing}
                className="h-12 rounded-full bg-blue-700 px-7 text-base font-semibold text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800"
              >
                {processing ? '正在生成完整方案...' : '免费查看完整避坑方案'}
                {!processing && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <Link href="/preview">
                <Button size="lg" variant="outline" className="h-12 rounded-full border-slate-300 px-7 text-base">
                  先返回预览
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              当前测试期免费开放，先完整查看报告效果。
            </p>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-blue-100 bg-white shadow-xl shadow-blue-950/10">
            <CardContent className="p-0">
              <div className="border-b bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">完整报告预览</p>
                    <h2 className="mt-1 text-xl font-semibold">志愿风险雷达</h2>
                  </div>
                  <LockKeyhole className="h-6 w-6 text-blue-200" />
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                    <div>
                      <p className="font-semibold text-rose-950">高风险提醒</p>
                      <p className="mt-1 text-sm leading-6 text-rose-800">
                        有些“看起来能冲”的专业，近年位次可能正在收紧，不能只看去年最低分。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-blue-50 p-3">
                    <p className="text-2xl font-bold text-blue-700">6+</p>
                    <p className="text-xs text-slate-600">冲刺候选</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-2xl font-bold text-emerald-700">8+</p>
                    <p className="text-xs text-slate-600">稳妥候选</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-2xl font-bold text-amber-700">6+</p>
                    <p className="text-xs text-slate-600">保底候选</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold">解锁后展示：</p>
                  <div className="space-y-2">
                    {lockedItems.map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-blue-700" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {reportHighlights.map(item => (
            <Card key={item.title} className="rounded-3xl border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">为什么完整报告更值？</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">普通填报方式</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    家长自己翻投档表，只能看到分数，难判断专业限制、梯度是否安全、哪些学校只是“看起来合适”。
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                  <p className="text-sm font-medium text-blue-700">完整报告方式</p>
                  <p className="mt-1 text-sm leading-6 text-slate-800">
                    系统把位次差、专业匹配、风险等级、来源证据合并到同一张表里，直接告诉你哪些能冲、哪些要避、哪些适合保底。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-blue-200 bg-blue-700 text-white shadow-xl shadow-blue-700/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-6 w-6 text-blue-100" />
                <div>
                  <h2 className="text-xl font-semibold">测试期权益</h2>
                  <p className="mt-2 text-sm leading-6 text-blue-50">
                    现在可以免费查看完整报告，用真实生成结果验证产品价值。后续如果加入人工复核、微信答疑和更多省份数据，再升级服务形态。
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl bg-white p-5 text-slate-950">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">测试期权益</p>
                    <p className="mt-1 text-2xl font-bold">免费开放完整报告</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      先查看完整冲稳保、避坑诊断和数据证据，确认产品效果。
                    </p>
                  </div>
                  <Badge className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">当前免费</Badge>
                </div>
                <Button
                  size="lg"
                  onClick={handleUnlock}
                  disabled={processing}
                  className="mt-5 h-12 w-full rounded-full bg-blue-700 text-base font-semibold text-white hover:bg-blue-800"
                >
                  {processing ? '正在解锁...' : '立即查看完整报告'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <div className="flex flex-wrap gap-3">
            <span className="font-medium text-slate-950">服务保障</span>
            <span>✓ 来源可追溯</span>
            <span>✓ 不承诺录取</span>
            <span>✓ 明确风险提示</span>
            <span>✓ 数据不足会主动提醒</span>
          </div>
        </div>
      </main>
    </div>
  );
}
