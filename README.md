# 高考志愿填报智能体

面向高考考生与家长的 AI 志愿填报辅助系统。用户填写省份、分数、位次、选科、专业偏好、地域偏好等信息后，系统基于本地录取数据库、规则引擎与可选大模型能力，生成包含“冲 / 稳 / 保”推荐、风险诊断、数据来源与免责声明的志愿分析报告。

> 重要声明：本项目生成内容仅供志愿填报参考，不构成录取承诺或保证。最终招生计划、录取规则、投档线与录取结果以各省教育考试院和高校官方发布为准。

## 项目特点

- **真实数据优先**：推荐结果优先来自本地 SQLite 录取知识库，避免凭空编造分数与位次。
- **数据可追溯**：报告中的推荐会保留年份、最低分、最低位次、来源文件等证据字段。
- **规则 + AI 结合**：先通过确定性规则完成匹配、分层、风险判断，再使用 DeepSeek 生成可选摘要与追问回答。
- **支持多省数据扩展**：项目已内置全国省份枚举、原始数据目录与数据导入脚本，可持续补充录取数据。
- **支持普通类与艺体类场景**：普通类面向 3+1+2 选科组合；艺体类当前主要通过专门报告引擎处理。
- **移动端优先体验**：包含首页、信息采集、免费预览、付费解锁、完整报告、分享页等 H5 路由。

## 技术栈

- **框架**：Next.js 16 App Router
- **前端**：React 19、TypeScript 5
- **样式**：Tailwind CSS 4
- **组件库**：shadcn/ui + Radix UI
- **图表与可视化**：Recharts
- **数据层**：SQLite 知识库（`sql.js`）+ 可选 PostgreSQL/Supabase（Drizzle ORM）
- **AI 能力**：DeepSeek 可选接入；Tavily 可选作为本地证据不足时的搜索兜底
- **包管理器**：pnpm（项目已限制禁止 npm / yarn）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

常用配置：

```env
# 可选：DeepSeek，用于报告摘要和报告追问
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat

# 可选：Tavily，仅在本地知识库证据不足时作为兜底搜索
TAVILY_API_KEY=

# 可选：本地录取数据库路径；留空默认使用 data/admission_clean.db
ADMISSION_DB_PATH=

# 可选：Postgres / Supabase，用于保存报告或后续用户数据
DATABASE_URL=
DB_SSL=true

# 自定义服务端端口
PORT=5000
```

如果不配置 DeepSeek，系统仍可使用规则引擎生成确定性报告，只是 AI 摘要和追问能力会降级。

### 3. 启动开发环境

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:5000
```

### 4. 构建生产版本

```bash
pnpm build
```

构建前会自动执行：

```bash
node scripts/prepare-admission-db.mjs
```

用于准备部署所需的录取数据库文件。

### 5. 启动生产服务

```bash
pnpm start
```

## 常用命令

```bash
# 开发服务器
pnpm dev

# 生产构建
pnpm build

# 生产启动
pnpm start

# ESLint 检查
pnpm lint

# 构建级静态检查
pnpm lint:build

# TypeScript 检查
pnpm ts-check

# 并行执行 ts-check 与 lint:build
pnpm validate

# 准备本地录取数据库
pnpm prepare:data

# 检查录取数据库
pnpm db:check

# 查看录取数据库表结构
pnpm db:check:tables

# 检查本地知识库
pnpm kb:check

# 检查教师经验知识库
pnpm teacher:check

# 导入 CSV 录取数据
pnpm db:import:csv
```

## 项目结构

```text
.
├── assets/                         # 项目资源与设计素材
├── data/                           # 本地录取数据、SQLite 数据库、教师知识库、原始资料
│   ├── admission_clean.db           # 默认本地录取知识库
│   ├── province-sources.json        # 省份数据来源配置
│   ├── raw-admissions/              # 原始录取数据与解析中间文件
│   ├── teacher-knowledge/           # 志愿填报经验知识库
│   └── vendor-2026/                 # 2026 数据包与省份资料
├── docs/                           # 项目过程文档与部署说明
├── public/                         # 静态资源、二维码、图标等
├── scripts/                        # 数据处理、导入、检查、部署准备脚本
├── src/
│   ├── app/                        # Next.js App Router 页面与 API
│   ├── components/ui/              # shadcn/ui 基础组件
│   ├── hooks/                      # 自定义 Hooks
│   ├── lib/                        # 核心业务逻辑、类型、规则、数据访问
│   └── server.ts                   # 自定义服务端入口
├── drizzle.config.ts               # Drizzle 配置
├── next.config.ts                  # Next.js 配置
├── package.json                    # 依赖与脚本
├── tsconfig.json                   # TypeScript 配置
└── README.md
```

## 页面路由

```text
/                    首页落地页
/input               考生信息采集页
/preview             免费预览页
/unlock              付费解锁页
/report              完整报告页
/share               分享页
/data-disclaimer     数据免责声明页
```

核心页面文件位于：

```text
src/app/page.tsx
src/app/input/page.tsx
src/app/preview/page.tsx
src/app/unlock/page.tsx
src/app/report/page.tsx
src/app/share/page.tsx
src/app/data-disclaimer/page.tsx
```

## API 路由

```text
POST /api/reports/generate
```

根据用户画像生成报告，并尝试保存报告。

```text
GET /api/reports/:id
```

按报告 ID 获取已生成报告。

```text
GET /api/reports/:id/chat
POST /api/reports/:id/chat
```

获取或提交报告追问。追问回答会优先基于已生成报告内容与历史消息生成。

相关文件：

```text
src/app/api/reports/generate/route.ts
src/app/api/reports/[id]/route.ts
src/app/api/reports/[id]/chat/route.ts
```

## 核心业务模块

```text
src/lib/types.ts
```

定义用户画像、录取记录、推荐项、报告、追问消息等核心类型。

```text
src/lib/provinces.ts
```

维护省份枚举、展示名称、数据库名称、考生规模与数据状态。

```text
src/lib/subject-rules.ts
```

处理 3+1+2 选科组合、专业选科要求匹配、专业类别过滤。

```text
src/lib/server/report-engine.ts
```

普通类报告生成主引擎，包括用户输入校验、位次估算、录取数据检索、冲稳保分层、风险诊断、数据来源聚合与 AI 摘要。

```text
src/lib/server/art-sports-report.ts
```

艺体类报告生成逻辑。

```text
src/lib/knowledge/admission-sqlite.ts
```

本地 SQLite 录取知识库访问层，负责按省份、分数、位次、选科、专业偏好等条件检索录取证据。

```text
src/lib/knowledge/admission-source.ts
```

录取数据来源协调层，负责整合本地数据库与可选搜索兜底。

```text
src/lib/knowledge/teacher-knowledge.ts
```

教师经验知识库检索，用于补充策略建议、风险提示和填报建议。

```text
src/lib/server/deepseek.ts
```

DeepSeek 接入，用于报告摘要和报告追问。

```text
src/lib/db/
```

Drizzle/Postgres 数据模型与报告持久化逻辑。当前本地知识库 MVP 不强依赖远程数据库。

## 数据目录说明

```text
data/admission_clean.db
```

默认本地录取数据库。若 `ADMISSION_DB_PATH` 为空，系统会读取该文件。

```text
data/raw-admissions/
```

原始录取资料、解析结果和中间文件。

```text
data/vendor-2026/
```

按省份整理的 2026 数据包、招生计划、一分一段、历年投档/录取数据等资料。

```text
data/teacher-knowledge/
```

教师经验、填报策略、风险判断等知识材料。

```text
data/province-sources.json
```

省份数据来源配置。

## 报告生成流程

```text
用户填写信息
  ↓
validateUserProfile 校验省份、分数、位次、选科、考生类型
  ↓
普通类：读取本地 SQLite 录取库，必要时估算位次
艺体类：进入专门艺体报告引擎
  ↓
按省份、位次、分数、选科、偏好专业、排除专业检索录取记录
  ↓
规则引擎完成专业匹配、冲稳保分层、风险诊断、证据聚合
  ↓
可选调用 DeepSeek 生成报告摘要
  ↓
返回并保存报告
```

## 数据与推荐约束

开发和维护时必须遵守以下约束：

1. **不得编造录取分数、位次、招生来源**。
2. **所有推荐必须来自本地数据、已导入数据或明确标记的外部搜索证据**。
3. **每条推荐应尽量保留年份、最低分、最低位次、来源文件或来源名称**。
4. **必须检查选科要求是否与用户选科组合匹配**。
5. **报告必须展示免责声明**：仅供参考，不构成录取承诺或保证。
6. **当数据不足时，应提示数据覆盖风险，而不是强行生成确定结论**。

## 开发规范

- 仅使用 `pnpm` 管理依赖。
- 新页面默认放在 `src/app/`。
- 通用 UI 优先复用 `src/components/ui/` 中的 shadcn/ui 组件。
- 通用业务类型统一维护在 `src/lib/types.ts`。
- 涉及录取推荐逻辑时优先修改 `src/lib/server/report-engine.ts` 或知识库访问层，不要在页面组件中堆业务规则。
- 涉及选科、专业限制时优先使用 `src/lib/subject-rules.ts`。
- 不要在 JSX 首屏渲染中直接使用 `Date.now()`、`Math.random()`、`window` 等容易导致 hydration mismatch 的动态值。
- 不要提交 `.env.local`、构建产物、临时日志和大体积非必要中间文件。

## 数据导入与检查

常用脚本位于 `scripts/`：

```text
seed-admissions.ts                 种子数据 / dry-run 检查
check-db.ts                        数据库可用性与统计检查
inspect-admission-sqlite.ts        SQLite 录取库检查
plan-admission-sources.ts          省份数据来源规划
import-admission-csv.ts            CSV 录取数据导入
prepare-admission-db.mjs           构建/部署前准备录取数据库
check-knowledge-base.ts            本地知识库检查
check-teacher-knowledge.ts         教师知识库检查
```

示例：

```bash
pnpm db:check
pnpm db:check:tables
pnpm kb:check
pnpm teacher:check
pnpm agent:check
```

## 部署说明

项目可按标准 Next.js 应用部署。部署时需要关注：

1. 确保生产环境存在可用的录取数据库文件，或设置 `ADMISSION_DB_PATH` 指向正确路径。
2. 如需 AI 摘要和追问，配置 `DEEPSEEK_API_KEY`。
3. 如需远程报告持久化，配置 `DATABASE_URL` 或对应 Supabase/Postgres 环境变量。
4. 构建阶段会执行 `prebuild`，请确保 `scripts/prepare-admission-db.mjs` 能访问所需数据文件。
5. 若部署平台限制大文件，需要使用压缩数据库、外部对象存储或构建时解压策略。

更多部署过程记录可参考：

```text
docs/mvp-deploy.md
DEPLOYMENT_PROGRESS.md
```

## 相关文档

```text
AGENTS.md                         项目开发约束与上下文
DESIGN.md                         视觉设计规范
docs/agent-progress-2026-06-20.md 阶段开发记录
docs/h5-platform-entry.md         H5 平台入口说明
docs/mvp-deploy.md                MVP 部署说明
```

## 许可与责任

本项目为高考志愿填报辅助工具。系统输出不能替代官方招生政策、招生章程、考试院公告或专业升学顾问的一对一判断。使用者应结合最新官方信息、家庭情况、院校招生章程、专业限制、体检要求、单科要求等因素综合决策。
