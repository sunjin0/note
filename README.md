# 心情日记 / Mood Journal

<p align="center">
  <strong>一个专注于个人情绪追踪和日记记录的 Web 应用</strong><br>
  <strong>A Web application focused on personal mood tracking and journaling</strong>
</p>

<p align="center">
  <a href="README.md">中文</a> | <a href="README.en.md">English</a>
</p>

---

# 🇨🇳 中文文档

## 📋 项目概述

**心情日记**是一个简洁优雅的心情追踪和日记应用，帮助用户记录每天的心情状态、写日记、标记影响因素，并通过可视化图表了解自己的情绪变化规律。所有数据均存储在本地设备上，确保隐私安全。

### ✨ 核心功能

- 📝 **每日心情记录** - 5种心情等级（很棒、不错、一般、难过、生气）
- 📅 **日历视图** - 月历形式查看历史记录，支持心情热图
- 📊 **数据统计** - 连续记录天数、心情分布统计、趋势分析
- 🏷️ **影响因素标签** - 12个预设标签 + 支持自定义因素
- 😀 **Emoji 选择器** - 11个分类、724+ emoji，支持搜索和最近使用
- 🔒 **密码保护** - 应用锁、安全问题找回
- 🌍 **多语言支持** - 简体中文 / English
- 📷 **照片上传** - 支持多图上传和预览
- 🔍 **智能搜索** - 按内容、心情、因素、日期筛选
- 💾 **数据管理** - 导出备份、数据加密

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 14+ | React 框架，App Router |
| **React** | 18+ | UI 组件库 |
| **TypeScript** | 5+ | 类型安全 |
| **Tailwind CSS** | 3.4+ | 原子化 CSS |
| **Lucide React** | latest | 图标库 |
| **class-variance-authority** | latest | 组件变体管理 |
| **tailwind-merge** | latest | Tailwind 类名合并 |
| **localStorage** | - | 本地数据持久化 |
| **Vitest** | latest | 单元测试 |
| **Playwright** | latest | E2E 测试 |

---

## 📁 项目结构

```
note/
├── app/                          # Next.js App Router
│   ├── globals.css               # 全局样式与 CSS 变量
│   ├── layout.tsx                # 根布局（含 Providers）
│   └── page.tsx                  # 主页面
│
├── components/                   # React 组件
│   ├── ui/                       # 基础 UI 组件
│   │   ├── button.tsx            # 按钮组件（支持变体）
│   │   └── card.tsx              # 卡片组件
│   ├── CalendarView.tsx          # 日历视图组件
│   ├── ConfirmDialog.tsx         # 确认对话框组件
│   ├── Dashboard.tsx             # 仪表盘首页
│   ├── EmojiPicker.tsx           # Emoji 选择器
│   ├── JournalList.tsx           # 日记列表（含筛选分页）
│   ├── MoodEditor.tsx            # 心情编辑器（富文本）
│   ├── PasswordLock.tsx          # 密码锁屏
│   ├── Providers.tsx             # 全局 Provider（i18n + 密码保护）
│   ├── Settings.tsx              # 设置页面
│   └── Sidebar.tsx               # 侧边栏导航
│
├── lib/                          # 工具库
│   ├── i18n/                     # 国际化
│   │   ├── index.tsx             # i18n Provider + Hooks
│   │   ├── zh-CN.json            # 中文翻译
│   │   └── en-US.json            # 英文翻译
│   ├── storage.ts                # 本地存储操作
│   ├── types.ts                  # TypeScript 类型定义
│   └── utils.ts                  # 通用工具函数（cn）
│
├── test/                         # 测试配置
│   └── setup.ts                  # Vitest 配置
│
├── package.json                  # 项目依赖
├── tailwind.config.ts            # Tailwind 配置
├── next.config.mjs               # Next.js 配置
├── tsconfig.json                 # TypeScript 配置
└── vitest.config.ts              # Vitest 配置
```

---

## 🔧 核心模块详解

### 1. MoodEditor.tsx - 心情编辑器

功能丰富的模态弹窗，用于创建和编辑心情记录。

**功能特性：**
- **心情选择**：5种心情等级，每种有 emoji、颜色、背景样式
- **影响因素**：显示预设因素 + 自定义因素，支持多选
- **富文本编辑**：contentEditable 实现，支持格式工具栏
  - 加粗、斜体、下划线、删除线
  - 左中右对齐
  - 插入分隔线
  - 撤销/重做
  - 清除格式
- **可调整高度**：拖拽底部手柄调整编辑器高度（80-500px）
- **字数限制**：最大 5000 字符，超出自动阻止输入
- **照片上传**：多文件选择，Base64 存储，支持预览和删除
- **图片预览**：模态框查看大图，支持左右切换

**Props 接口：**
```typescript
interface MoodEditorProps {
  isOpen: boolean;                    // 控制显示/隐藏
  onClose: () => void;                // 关闭回调
  date: string;                       // 日期 (YYYY-MM-DD)
  initialMood?: Mood;                 // 初始心情
  initialJournal?: string;            // 初始日记内容（HTML）
  initialFactors?: string[];          // 初始选中因素 ID
  initialPhotos?: string[];           // 初始照片数组
  onSave: (data: {                   // 保存回调
    mood: Mood;
    journal: string;
    factors: string[];
    photos: string[];
  }) => void;
}
```

---

### 2. EmojiPicker.tsx - Emoji 选择器

功能完整的 Emoji 选择组件。

**功能特性：**
- **11个分类**：最近使用、工作学习、家庭关系、健康运动、天气自然、饮食、娱乐爱好、动物、交通出行、情感心情、物品手势
- **724+ 个 emoji**：丰富的表情符号库
- **智能搜索**：中英文关键词搜索（如 "工作" / "work"）
- **最近使用**：自动记录最近 16 个选择的 emoji
- **实时同步**：选择后立即更新最近使用列表
- **响应式布局**：10列网格，w-11 h-11 尺寸，悬停放大效果
- **选中状态**：高亮显示当前选中 emoji

**数据结构：**
```typescript
// Emoji 分类
export interface EmojiCategory {
  id: string;           // 分类 ID
  name: string;         // 中文名称
  nameEn: string;       // 英文名称
  emojis: string[];     // emoji 数组
}

// 搜索标签映射
export const EMOJI_TAGS: Record<string, string[]> = {
  '💼': ['工作', 'work', '公文包', 'briefcase'],
  // ... 724+ 个 emoji 的中英文标签
};
```

---

### 3. Dashboard.tsx - 仪表盘

应用首页，展示关键统计数据。

**功能特性：**
- **Hero 横幅**：展示今日心情，快速记录入口
- **统计卡片**：
  - 连续记录天数（Streak）
  - 总记录数
  - 最常见心情
  - 积极心情比例
- **本周心情趋势图**：柱状图展示最近7天心情
- **快速签到**：一键选择今日心情
- **最近记录列表**：显示最近5条日记，支持点击查看详情

---

### 4. CalendarView.tsx - 日历视图

月历形式展示心情记录。

**功能特性：**
- **月历网格**：展示整月日期，标记有记录的日期
- **心情颜色编码**：不同心情用不同背景色区分
- **月份导航**：上一月 / 下一月 / 今天
- **月度统计**：展示当月各心情类型的数量
- **心情热图**：展示最近90天的心情变化趋势（GitHub 风格）
- **点击交互**：点击日期打开编辑器

---

### 5. JournalList.tsx - 日记列表

完整的日记浏览和管理界面。

**功能特性：**
- **搜索功能**：全文搜索（内容、心情、因素、日期）
- **高级筛选**：
  - 日期范围筛选
  - 心情类型多选
  - 影响因素多选
- **智能分组**：
  - 最近（一周内）
  - 按年/月/周归档
- **展开/折叠**：点击卡片展开查看完整内容和照片
- **富文本渲染**：支持 HTML 格式的日记内容
- **分页功能**：支持每页 10/20/50 条
- **编辑/删除**：支持修改和删除记录
- **智能日期显示**：今天、昨天、具体日期

---

### 6. Settings.tsx - 设置页面

应用配置和数据管理。

**功能特性：**
- **语言切换**：简体中文 / English，实时生效
- **隐私保护**：数据加密选项（预留功能）
- **密码保护**：
  - 设置/修改密码
  - 1-5 个安全问题用于密码找回
  - 错误次数锁定机制
- **自定义因素**：
  - 添加因素（名称 + emoji）
  - 编辑现有因素
  - 删除因素（带确认）
  - 拖拽排序
  - EmojiPicker 选择图标
- **数据导出**：将所有记录导出为 JSON 文件
- **清除数据**：一键删除所有记录（带二次确认）
- **关于信息**：应用版本和隐私说明

---

### 7. Sidebar.tsx - 侧边栏导航

响应式侧边栏导航组件。

**功能特性：**
- **导航菜单**：仪表盘、心情日历、日记本、设置
- **移动端适配**：汉堡菜单 + 遮罩层
- **当前高亮**：高亮显示当前所在页面
- **品牌展示**：Logo 和应用名称
- **隐私提示**：底部显示本地存储说明

---

### 8. ConfirmDialog.tsx - 确认对话框

通用的二次确认对话框组件。

**Props 接口：**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;      // 危险操作模式（红色按钮）
  isLoading?: boolean;        // 加载状态
}
```

---

### 9. PasswordLock.tsx - 密码锁屏

应用密码保护组件。

**功能特性：**
- 密码输入验证
- 错误次数限制和锁定
- 安全问题找回密码
- 记住登录状态（会话管理）

---

### 10. Providers.tsx - 全局 Provider

组合所有全局 Provider。

```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {!isUnlocked && <PasswordLock onUnlock={handleUnlock} />}
      {isUnlocked && children}
    </I18nProvider>
  );
}
```

---

## 💾 数据管理

### 存储方案

使用浏览器 **localStorage** 进行本地持久化：

| 存储键 | 内容 | 说明 |
|--------|------|------|
| `mood_journal_entries` | MoodEntry[] | 所有日记条目 |
| `mood_journal_settings` | AppSettings | 应用设置（加密开关） |
| `mood_journal_custom_factors` | FactorOption[] | 自定义影响因素 |
| `mood_journal_security` | SecuritySettings | 密码保护设置 |
| `mood_journal_session` | SessionData | 会话状态 |
| `mood_journal_locale` | Locale | 语言设置 |
| `mood_journal_recent_emojis` | string[] | 最近使用的 emoji |

### 核心数据结构

```typescript
// 心情类型
type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';

// 日记条目
interface MoodEntry {
  id: string;                    // 唯一标识
  date: string;                  // 日期 (YYYY-MM-DD)
  mood: Mood;                    // 心情类型
  journal: string;               // 日记内容（HTML）
  factors: string[];             // 影响因素 ID 数组
  photos: string[];              // 照片 Base64 数组
  createdAt: string;             // 创建时间 ISO
  updatedAt: string;             // 更新时间 ISO
  journalEncrypted?: boolean;    // 是否加密
}

// 影响因素选项
interface FactorOption {
  id: string;                    // 唯一标识
  label: string;                 // 显示名称
  emoji: string;                 // emoji 图标
  isCustom?: boolean;            // 是否为自定义
}

// 心情配置
const MOOD_CONFIG: Record<Mood, {
  emoji: string;
  label: string;
  color: string;                 // 文字颜色类名
  bgClass: string;               // 背景色类名
  ringClass: string;             // 焦点环类名
}>;

// 视图类型
type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';

// 心情统计
interface MoodStats {
  great: number;
  good: number;
  okay: number;
  sad: number;
  angry: number;
}
```

### 存储操作函数 (storage.ts)

```typescript
// 日记条目操作
function getEntries(): MoodEntry[];
function saveEntry(entry: MoodEntry): void;
function deleteEntry(id: string): void;
function getEntryByDate(date: string): MoodEntry | undefined;

// 统计计算
function getStreak(): number;                    // 连续记录天数
function getMoodStats(): MoodStats;              // 心情分布统计

// 自定义因素操作
function getCustomFactors(): FactorOption[];
function saveCustomFactors(factors: FactorOption[]): void;
function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption;
function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null;
function deleteCustomFactor(id: string): boolean;
function reorderCustomFactors(factors: FactorOption[]): void;
function getAllFactors(): FactorOption[];        // 预设 + 自定义

// 数据管理
function exportData(): string;                   // 导出 JSON
function clearAllData(): void;                   // 清除所有数据

// 密码保护
function isPasswordEnabled(): boolean;
function isSessionValid(): boolean;
function validatePassword(password: string): boolean;
function resetPassword(newPassword: string): void;
function checkLockoutStatus(): { isLocked: boolean; remainingMinutes: number };
```

---

## 🎨 设计系统

### 颜色系统

```css
/* 基础颜色 */
--background: 40 33% 98%;       /* 背景 */
--foreground: 263 20% 15%;      /* 前景文字 */
--primary: 263 70% 50%;         /* 主色（紫色） */
--secondary: 263 30% 95%;       /* 次要色 */
--accent: 280 40% 93%;          /* 强调色 */
--destructive: 0 84% 60%;       /* 危险色（红） */
--border: 263 20% 90%;          /* 边框 */

/* 心情颜色 */
--mood-great: 38 92% 50%;       /* 金黄色 */
--mood-good: 152 69% 40%;       /* 绿色 */
--mood-okay: 199 89% 48%;       /* 蓝色 */
--mood-sad: 234 65% 55%;        /* 靛蓝色 */
--mood-angry: 350 80% 58%;      /* 红色 */
```

### 动画效果

| 动画名 | 效果 | 用途 |
|--------|------|------|
| `fade-in` | 淡入 | 页面加载 |
| `scale-in` | 缩放进入 | 弹窗显示 |
| `slide-in` | 滑入 | 侧边栏 |
| `hover:scale-110` | 悬停放大 | Emoji 按钮 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+

### 安装步骤

```bash
# 1. 进入项目目录
cd note

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:3000
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（localhost:3000） |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run test` | 运行单元测试（Vitest） |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:e2e` | 运行 E2E 测试（Playwright） |

---

## 🌍 国际化 (i18n)

### 使用方式

```typescript
import { useTranslation, useLocale } from '@/lib/i18n';

function MyComponent() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('dashboard.streak')}</p>
      <p>{t('journal.recordCount', { count: 5 })}</p>
      <button onClick={() => setLocale('en-US')}>
        Switch to English
      </button>
    </div>
  );
}
```

### 支持的语言

| 语言代码 | 语言 | 文件 |
|----------|------|------|
| `zh-CN` | 简体中文 | `lib/i18n/zh-CN.json` |
| `en-US` | English | `lib/i18n/en-US.json` |

### 翻译文件结构

```json
{
  "app": { "title": "...", "description": "..." },
  "nav": { "dashboard": "...", "calendar": "..." },
  "dashboard": { "streak": "...", "totalEntries": "..." },
  "editor": { "title": "...", "factors": "..." },
  "mood": { "great": "...", "good": "..." },
  "factors": { "work": "...", "family": "..." },
  "settings": { "title": "...", "language": {...} }
}
```

---

## 🧪 测试

### 单元测试 (Vitest)

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 带覆盖率报告
npm run test -- --coverage
```

### E2E 测试 (Playwright)

```bash
# 运行 E2E 测试
npm run test:e2e

# 带 UI 界面
npm run test:e2e -- --ui
```

---

## 📄 许可证

MIT License
