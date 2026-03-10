# 心情日记 - 项目文档

## 1. 项目概述

**心情日记**是一个专注于个人情绪追踪和日记记录的 Web 应用程序。它帮助用户记录每天的心情状态、写日记、标记影响因素，并通过可视化图表了解自己的情绪变化规律。所有数据均存储在本地设备上，确保隐私安全。

### 主要功能
- 📝 每日心情记录（5种心情等级）
- 📅 日历视图查看历史记录
- 📊 心情统计与趋势分析
- 🏷️ 影响因素标签
- 📷 照片上传与保存
- 🔍 日记搜索功能
- 💾 数据导出与备份

---

## 2. 技术栈

| 技术 | 用途 |
|------|------|
| **Next.js 14** | React 框架，使用 App Router |
| **TypeScript** | 类型安全的 JavaScript |
| **Tailwind CSS** | 原子化 CSS 样式 |
| **React 18** | UI 组件库 |
| **Lucide React** | 图标库 |
| **localStorage** | 本地数据持久化 |
| **Vitest** | 单元测试框架 |
| **Playwright** | E2E 测试工具 |

---

## 3. 项目结构

```
note/
├── app/                    # Next.js App Router 主应用
│   ├── globals.css         # 全局样式与主题变量
│   ├── layout.tsx          # 根布局组件
│   └── page.tsx            # 主页面（应用入口）
├── components/             # React 组件
│   ├── ui/                 # 基础 UI 组件
│   │   ├── button.tsx      # 按钮组件
│   │   └── card.tsx        # 卡片组件
│   ├── CalendarView.tsx    # 日历视图
│   ├── Dashboard.tsx       # 仪表盘
│   ├── JournalList.tsx     # 日记列表
│   ├── MoodEditor.tsx      # 心情编辑器（弹窗）
│   ├── Settings.tsx        # 设置页面
│   └── Sidebar.tsx         # 侧边栏导航
├── lib/                    # 工具库
│   ├── storage.ts          # 本地存储操作
│   ├── types.ts            # TypeScript 类型定义
│   └── utils.ts            # 通用工具函数
├── test/                   # 测试配置
│   └── setup.ts            # Vitest 测试配置
├── package.json            # 项目依赖
├── tailwind.config.ts      # Tailwind 配置
└── vitest.config.ts        # Vitest 测试配置
```

---

## 4. 核心功能模块说明

### 4.1 MoodEditor.tsx - 心情编辑器

一个模态弹窗组件，用于创建和编辑心情记录。

**主要功能：**
- **心情选择**：5种心情等级（很棒😊、不错🙂、一般😐、难过😢、生气😡）
- **影响因素标签**：12个预设标签（工作、家庭、健康、天气、运动、饮食、睡眠、社交、爱好、学习、旅行、感情）
- **富文本编辑**：支持加粗、斜体、下划线格式
- **照片上传**：支持多图上传，本地预览
- **自动保存草稿**：编辑时自动保存到组件状态

**关键接口：**
```typescript
interface MoodEditorProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialMood?: Mood;
  initialJournal?: string;
  initialFactors?: string[];
  initialPhotos?: string[];
  onSave: (data) => void;
}
```

---

### 4.2 Sidebar.tsx - 侧边栏导航

响应式侧边栏导航组件。

**主要功能：**
- **导航菜单**：仪表盘、心情日历、日记本、设置
- **移动端适配**：汉堡菜单 + 遮罩层
- **品牌展示**：Logo 和应用名称
- **隐私提示**：底部显示本地存储说明

**导航项配置：**
```typescript
const NAV_ITEMS = [
  { view: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { view: 'calendar', label: '心情日历', icon: Calendar },
  { view: 'journal', label: '日记本', icon: BookOpen },
  { view: 'settings', label: '设置', icon: Settings },
];
```

---

### 4.3 Dashboard.tsx - 仪表盘

应用首页，展示关键统计数据和快捷操作。

**主要功能：**
- **Hero 横幅**：展示今日心情状态，快速记录入口
- **统计卡片**：
  - 连续记录天数（Streak）
  - 总记录数
  - 最常见心情
  - 积极心情比例
- **本周心情趋势图**：柱状图展示最近7天心情
- **快速签到**：一键选择今日心情
- **最近记录列表**：显示最近5条日记

---

### 4.4 CalendarView.tsx - 日历视图

月历形式展示心情记录。

**主要功能：**
- **月历网格**：展示整月日期，标记有记录的日期
- **心情颜色编码**：不同心情用不同背景色区分
- **月份导航**：上一月/下一月/今天
- **月度统计**：展示当月各心情类型的数量
- **心情热图**：展示最近90天的心情变化趋势（GitHub 风格）

---

### 4.5 JournalList.tsx - 日记列表

完整的日记浏览和管理界面。

**主要功能：**
- **搜索功能**：支持按内容、心情、因素、日期搜索
- **展开/折叠**：点击卡片展开查看完整内容
- **富文本渲染**：支持 HTML 格式的日记内容
- **照片展示**：展开后显示关联照片
- **编辑/删除**：支持修改和删除记录
- **智能日期显示**：今天、昨天、具体日期

---

### 4.6 Settings.tsx - 设置页面

应用配置和数据管理。

**主要功能：**
- **隐私保护开关**：数据加密选项（UI 开关）
- **数据导出**：将所有记录导出为 JSON 文件
- **清除数据**：一键删除所有记录（带确认）
- **关于信息**：应用版本和隐私说明

---

## 5. 用户界面特点

### 5.1 响应式设计
- **桌面端**：侧边栏固定显示，内容区自适应
- **移动端**：侧边栏可折叠，汉堡菜单触发

### 5.2 暗色主题支持
通过 CSS 变量实现，在 `globals.css` 中定义：
```css
:root { /* 浅色主题 */ }
.dark { /* 深色主题 */ }
```

### 5.3 动画效果
- `fade-in`：页面淡入
- `scale-in`：弹窗缩放进入
- `slide-in`：侧边栏滑入
- 按钮和卡片的悬停过渡效果

### 5.4 心情色彩系统
| 心情 | 颜色 | CSS 变量 |
|------|------|----------|
| 很棒 | 金黄色 | `--mood-great: 38 92% 50%` |
| 不错 | 绿色 | `--mood-good: 152 69% 40%` |
| 一般 | 蓝色 | `--mood-okay: 199 89% 48%` |
| 难过 | 靛蓝色 | `--mood-sad: 234 65% 55%` |
| 生气 | 红色 | `--mood-angry: 350 80% 58%` |

---

## 6. 数据管理

### 6.1 存储方案
使用浏览器 **localStorage** 进行本地持久化：

| 存储键 | 内容 |
|--------|------|
| `mood_journal_entries` | 所有日记条目（JSON 数组） |
| `mood_journal_settings` | 应用设置（加密开关等） |

### 6.2 数据结构

**MoodEntry（日记条目）：**
```typescript
interface MoodEntry {
  id: string;           // 唯一标识
  date: string;         // 日期 (YYYY-MM-DD)
  mood: Mood;           // 心情类型
  journal: string;      // 日记内容（HTML）
  factors: string[];    // 影响因素 ID 数组
  photos: string[];     // 照片 Base64 数组
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

### 6.3 存储操作函数（storage.ts）

| 函数 | 功能 |
|------|------|
| `getEntries()` | 获取所有条目（按日期倒序） |
| `saveEntry()` | 保存/更新条目 |
| `deleteEntry()` | 删除指定条目 |
| `getEntryByDate()` | 按日期查询 |
| `getStreak()` | 计算连续记录天数 |
| `getMoodStats()` | 获取心情统计 |
| `exportData()` | 导出所有数据为 JSON |
| `clearAllData()` | 清除所有数据 |

---

## 7. 快速开始指南

### 7.1 环境要求
- Node.js 18+
- npm 或 yarn

### 7.2 安装步骤

```bash
# 1. 克隆项目
cd note

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 7.3 运行命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（localhost:3000） |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:e2e` | 运行 E2E 测试 |

---

## 8. 功能特性详解

### 8.1 心情记录系统
- **5级心情量表**：从"很棒"到"生气"，覆盖完整情绪范围
- **心情配置**：每种心情有对应的 emoji、标签、颜色和样式类

### 8.2 日历可视化
- **月历视图**：直观查看整月心情分布
- **心情热图**：90天趋势图，类似 GitHub 贡献图
- **颜色编码**：不同心情用不同颜色区分

### 8.3 富文本编辑
- 使用 `contentEditable` 实现
- 支持基础格式：加粗、斜体、下划线
- 使用 `document.execCommand` 执行格式命令

### 8.4 图片上传
- 支持多文件选择
- FileReader 读取为 Base64
- 本地预览和删除
- 与日记条目一起存储

### 8.5 数据隐私
- 纯本地存储，不上传服务器
- 支持数据加密选项（预留功能）
- 一键导出备份
- 完全清除数据功能

---

## 9. 类型定义汇总

**心情类型：**
```typescript
type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';
```

**视图类型：**
```typescript
type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';
```

**影响因素选项：**
包含 12 个预设标签，每个有 ID、标签名和 emoji。
