import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '云研志愿｜高考志愿 H5 决策助手',
    short_name: '云研志愿',
    description: '输入分数、位次和选科，生成高考志愿风险预览和冲稳保参考报告。',
    start_url: '/share',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fbff',
    theme_color: '#1e40af',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
