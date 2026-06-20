'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UnlockPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleUnlock = async () => {
    // Mock支付流程
    setProcessing(true);

    // 模拟支付处理
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 设置解锁状态
    sessionStorage.setItem('unlocked', 'true');

    // 跳转到完整报告页
    router.push('/report');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/preview" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">志</span>
            </div>
            <span className="font-semibold text-lg text-foreground">
              AI志愿填报助手
            </span>
          </Link>
          <Badge variant="secondary" className="text-xs">
            解锁完整报告
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8 pb-24">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2">
            解锁完整志愿分析报告
          </h1>
          <p className="text-sm text-muted-foreground">
            获取冲稳保完整推荐，数据来源可追溯
          </p>
        </div>

        {/* 报告权益 */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">完整报告包含</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">冲稳保完整推荐表</p>
                  <p className="text-xs text-muted-foreground">
                    包含冲刺、稳妥、保底院校详细列表
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">院校专业详细信息</p>
                  <p className="text-xs text-muted-foreground">
                    院校层次、专业类别、录取分数位次
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">数据来源可追溯</p>
                  <p className="text-xs text-muted-foreground">
                    每条推荐标注年份、分数、位次、来源
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">详细推荐理由</p>
                  <p className="text-xs text-muted-foreground">
                    位次匹配度、专业偏好匹配、风险评估
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">风险评估与建议</p>
                  <p className="text-xs text-muted-foreground">
                    每个推荐的风险等级和填报建议
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-sm">完整免责声明</p>
                  <p className="text-xs text-muted-foreground">
                    明确告知仅供参考，不构成录取承诺
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 价格说明 */}
        <Card className="shadow-sm mb-4 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-warning/10 px-3 py-1 rounded-full mb-2">
                <span className="text-xs text-warning font-medium">限时优惠</span>
              </div>
              <div className="text-3xl font-bold text-foreground tabular-nums mb-1">
                ¥99
              </div>
              <p className="text-xs text-muted-foreground">
                原价 ¥199 · MVP测试期特惠
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">当前版本：</span>
                MVP测试版，仅支持浙江/山东
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                后续版本将接入官方数据库和AI深度分析
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 支付方式 */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">支付方式</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl mb-2">💳</div>
                <p className="text-sm font-medium">微信支付</p>
                <p className="text-xs text-muted-foreground">敬请期待</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-sm font-medium">支付宝</p>
                <p className="text-xs text-muted-foreground">敬请期待</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-foreground">
                <span className="font-medium">MVP版本：</span>
                当前为测试阶段，点击下方按钮可免费解锁完整报告查看效果
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 服务保障 */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-sm mb-2">服务保障</h4>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="text-success">✓</span>
              <span>数据真实可靠</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-success">✓</span>
              <span>来源可追溯</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-success">✓</span>
              <span>无AI编造分数</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-success">✓</span>
              <span>明确免责声明</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleUnlock}
            disabled={processing}
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-xl shadow-lg"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                处理中...
              </span>
            ) : (
              '免费解锁完整报告'
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            MVP测试期间可免费查看完整报告
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/preview" className="text-sm text-primary hover:underline">
            返回预览页面
          </Link>
        </div>
      </main>
    </div>
  );
}