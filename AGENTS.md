# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 高考志愿填报智能体项目概述

### 产品定位
面向高考家长和学生，提供AI驱动的志愿填报分析服务。用户输入基本信息后，系统基于真实录取数据生成冲稳保志愿推荐报告。

### MVP版本范围（v1）
- **支持省份**：浙江省、山东省
- **数据来源**：省教育考试院官方录取数据（2022-2024年Mock数据）
- **功能范围**：
  - 信息采集（省份、分数、位次、选科、专业偏好等）
  - 免费预览（位次定位、专业方向、风险提示）
  - 付费解锁（完整冲稳保推荐报告）
  - 完整报告（详细推荐、数据来源、免责声明）

### 核心页面路由
```
src/app/
├── page.tsx              # 首页落地页（/）
├── input/page.tsx        # 信息采集页（/input）
├── preview/page.tsx      # 免费预览页（/preview）
├── unlock/page.tsx       # 付费解锁页（/unlock）
├── report/page.tsx       # 完整报告页（/report）
```

### 核心数据结构
```
src/lib/
├── types.ts              # 类型定义（UserProfile, Report, Recommendation等）
├── mock-data.ts          # Mock数据（浙江/山东录取数据）
├── analysis.ts           # 分析逻辑（generateReport等）
```

### 关键约束
- **禁止AI编造分数**：所有录取分数/位次必须来自Mock数据或后续真实数据库
- **数据可追溯**：每条推荐必须显示年份、分数、位次、数据来源
- **必须免责声明**：报告必须包含"仅供参考，不构成录取承诺"声明
- **选科匹配**：推荐必须检查选科要求是否匹配用户选科组合

### 测试与验证
- 静态检查：`pnpm ts-check` + `pnpm lint:build`
- 无后端API路由，无需接口冒烟测试
- 数据流：sessionStorage存储用户数据 → generateReport生成报告 → 页面展示

### 设计规范
- 色彩：深蓝主色(#1e40af) + 青绿辅色(#059669)
- 风格：专业、可信、清爽
- 响应式：移动端优先
- 详细设计规范见 `DESIGN.md`
