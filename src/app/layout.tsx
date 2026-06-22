import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yunyanagent.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: '云研志愿',
  title: {
    default: '云研志愿｜高考志愿 H5 决策助手',
    template: '%s | 云研志愿',
  },
  description:
    '面向手机端和社交平台入口的高考志愿填报辅助工具，基于本地录取数据、选科硬规则和 AI 分析生成冲稳保参考报告。',
  keywords: ['高考志愿填报', 'AI志愿填报', '高考志愿H5', '录取数据', '冲稳保', '选科要求'],
  authors: [{ name: 'gaokao-admission-agent' }],
  generator: 'Next.js',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    title: '云研志愿',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '云研志愿｜高考志愿 H5 决策助手',
    description:
      '输入省份、分数、位次和选科，基于真实录取数据生成冲稳保参考报告，严格拦截选科和专业方向错配。',
    url: '/',
    siteName: '云研志愿',
    locale: 'zh_CN',
    type: 'website',
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: '云研志愿' }],
  },
  twitter: {
    card: 'summary',
    title: '云研志愿｜高考志愿 H5 决策助手',
    description: '手机端打开即可生成高考志愿风险预览。',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e40af',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
