import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">志</span>
            </div>
            <span className="font-semibold text-lg text-foreground">
              AI志愿填报助手
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            专业 · 可信 · 清爽
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            用AI帮你科学填报高考志愿
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            基于历年真实录取数据，智能分析您的位次与专业偏好，
            <br className="hidden md:block" />
            给出冲稳保志愿建议，让每一分都用得其所
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
          <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI智能分析</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    综合考虑分数位次、选科要求、专业偏好、地域倾向和就业诉求，
                    为您量身定制志愿方案
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-success text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">冲稳保推荐</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    根据历年录取数据，科学划分冲刺、稳妥、保底院校，
                    每条推荐都标注录取风险
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">数据来源可追溯</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    所有录取数据均来自省教育考试院官方发布，
                    每条推荐都标注年份、分数、位次和来源
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-warning/30 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-warning text-2xl">👀</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">先免费预览</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    输入信息后即可免费查看位次定位和风险提示，
                    确认满意后再解锁完整志愿报告
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="bg-muted/50 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                2
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                支持省份（浙江/山东）
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                2024
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                最新录取数据年份
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div>
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                官方
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                教育考试院数据来源
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/input">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-xl text-base md:text-lg shadow-lg hover:shadow-xl transition-all"
            >
              开始志愿分析
            </Button>
          </Link>
          <p className="text-xs md:text-sm text-muted-foreground mt-4">
            免费预览 · 无需注册 · 先看再决定
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            本系统仅供参考，最终以各省教育考试院和高校官方信息为准，
            不构成录取承诺。高考志愿填报涉及多方面因素，建议结合自身实际情况谨慎决策。
          </p>
        </div>

        {/* Province Notice */}
        <div className="mt-6 bg-blue-50 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-sm text-foreground">
            <span className="font-semibold">当前版本支持：</span>
            浙江省、山东省普通类考生
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            后续将陆续开放更多省份，敬请期待
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 AI志愿填报助手 · 数据来源：各省教育考试院
          </p>
        </div>
      </footer>
    </div>
  );
}