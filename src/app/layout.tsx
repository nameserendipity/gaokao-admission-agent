import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '\u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b',
    template: '%s | \u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b',
  },
  description:
    '\u57fa\u4e8e\u672c\u5730\u5f55\u53d6\u6570\u636e\u3001\u8001\u5e08\u65b9\u6cd5\u8bba\u548c\u0041\u0049\u5206\u6790\u7684\u9ad8\u8003\u5fd7\u613f\u586b\u62a5\u8f85\u52a9\u5de5\u5177\uff0c\u5e2e\u52a9\u8003\u751f\u751f\u6210\u51b2\u7a33\u4fdd\u63a8\u8350\u62a5\u544a\u3002',
  keywords: [
    '\u9ad8\u8003\u5fd7\u613f\u586b\u62a5',
    '\u0041\u0049\u5fd7\u613f\u586b\u62a5',
    '\u5f55\u53d6\u6570\u636e',
    '\u51b2\u7a33\u4fdd',
    '\u9662\u6821\u63a8\u8350',
  ],
  authors: [{ name: 'gaokao-admission-agent' }],
  generator: 'Next.js',
  openGraph: {
    title: '\u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b',
    description:
      '\u8f93\u5165\u7701\u4efd\u3001\u5206\u6570\u3001\u4f4d\u6b21\u548c\u4e13\u4e1a\u504f\u597d\uff0c\u57fa\u4e8e\u672c\u5730\u771f\u5b9e\u5f55\u53d6\u6570\u636e\u751f\u6210\u5fd7\u613f\u63a8\u8350\u62a5\u544a\u3002',
    siteName: '\u0041\u0049\u5fd7\u613f\u586b\u62a5\u52a9\u624b',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
