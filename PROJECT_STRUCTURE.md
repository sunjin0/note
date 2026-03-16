# 项目目录结构重构方案

## 概述

本项目采用模块化架构，将相关功能的文件按模块进行分组，创建清晰的目录层次结构，便于维护和扩展。

## 新目录结构

```
note/
├── app/                          # Next.js App Router 入口
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── favicon.ico
│   └── favicon.svg
│
├── src/                          # 源代码目录
│   ├── types/                    # 全局类型定义
│   │   └── index.ts              # Mood, MoodEntry, ViewType 等类型
│   │
│   ├── core/                     # 核心基础设施
│   │   ├── ui/                   # 基础UI组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── index.ts          # UI组件统一导出
│   │   │   └── ...               # 其他基础UI组件
│   │   │
│   │   ├── utils/                # 通用工具函数
│   │   │   ├── index.ts          # cn() 等工具函数
│   │   │   └── pinyin.ts         # 拼音映射和搜索
│   │   │
│   │   ├── config/               # 配置文件
│   │   │   ├── mood.ts           # 心情配置、因素选项
│   │   │   ├── templates.ts      # 日记模板配置
│   │   │   └── index.ts          # 配置统一导出
│   │   │
│   │   ├── storage/              # 存储管理
│   │   │   ├── index.ts          # localStorage 操作
│   │   │   ├── types.ts          # 存储相关类型
│   │   │   └── __tests__/        # 存储模块测试
│   │   │
│   │   ├── i18n/                 # 国际化
│   │   │   ├── index.ts          # i18n 统一导出
│   │   │   ├── provider.tsx      # i18n Provider 组件
│   │   │   ├── types.ts          # i18n 类型定义
│   │   │   └── locales/          # 语言文件
│   │   │       ├── zh-CN.json
│   │   │       └── en-US.json
│   │   │
│   │   └── index.ts              # core 模块统一导出
│   │
│   └── modules/                  # 功能模块
│       ├── common/               # 通用/共享模块
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── ConfirmDialog.tsx
│       │   │   ├── EmojiPicker.tsx
│       │   │   ├── Providers.tsx
│       │   │   └── index.ts      # 统一导出
│       │   └── hooks/
│       │
│       ├── journal/              # 日记编辑模块
│       │   ├── components/
│       │   │   ├── JournalList.tsx
│       │   │   ├── MoodEditor.tsx
│       │   │   ├── TemplatePicker.tsx
│       │   │   ├── CustomTemplateEditor.tsx
│       │   │   ├── SmartReminder.tsx
│       │   │   └── index.ts      # 统一导出
│       │   ├── hooks/
│       │   └── utils/
│       │
│       ├── dashboard/            # 仪表板模块
│       │   ├── components/
│       │   │   ├── Dashboard.tsx
│       │   │   └── index.ts      # 统一导出
│       │   └── hooks/
│       │
│       ├── calendar/             # 日历模块
│       │   ├── components/
│       │   │   ├── CalendarView.tsx
│       │   │   └── index.ts      # 统一导出
│       │   └── hooks/
│       │
│       └── settings/             # 设置模块
│           ├── components/
│           │   ├── Settings.tsx
│           │   ├── PasswordLock.tsx
│           │   └── index.ts      # 统一导出
│           └── hooks/
│
├── public/                       # 静态资源
├── .next/                        # Next.js 构建输出
└── [配置文件]                    # next.config.mjs, tsconfig.json 等
```

## 模块说明

### 1. 核心层 (src/core/)

包含应用的基础设施和共享资源：

- **ui/**: 基础UI组件，不依赖业务逻辑
- **utils/**: 通用工具函数
- **config/**: 应用配置（心情、模板等）
- **storage/**: 数据持久化管理
- **i18n/**: 国际化支持

### 2. 模块层 (src/modules/)

按功能划分的业务模块：

#### Journal 模块
- **职责**: 日记条目的创建、编辑、展示
- **组件**: JournalList, MoodEditor, TemplatePicker 等
- **依赖**: core/config, core/storage, core/i18n

#### Dashboard 模块
- **职责**: 数据概览、统计展示
- **组件**: Dashboard
- **依赖**: core/config, core/storage

#### Calendar 模块
- **职责**: 日历视图、日期选择
- **组件**: CalendarView
- **依赖**: core/config

#### Settings 模块
- **职责**: 应用设置、安全功能
- **组件**: Settings, PasswordLock
- **依赖**: core/storage

#### Common 模块
- **职责**: 共享的UI组件和布局
- **组件**: Sidebar, ConfirmDialog, EmojiPicker, Providers
- **依赖**: core/i18n

## 导入路径规范

使用 TypeScript 路径别名 `@/` 指向 `src/` 目录：

```typescript
// 类型导入
import type { Mood, MoodEntry } from '@/types';

// 核心模块导入
import { cn } from '@/core/utils';
import { MOOD_CONFIG } from '@/core/config/mood';
import { useTranslation } from '@/core/i18n';

// 功能模块导入
import JournalList from '@/modules/journal/components/JournalList';
import Dashboard from '@/modules/dashboard/components/Dashboard';
```

## 迁移清单

### 已完成的迁移

- [x] 创建新的目录结构
- [x] 迁移类型定义 (lib/types.ts → src/types/index.ts)
- [x] 迁移工具函数 (lib/utils.ts, lib/pinyin-map.ts → src/core/utils/)
- [x] 迁移配置文件 (lib/mood-config.ts, lib/templates.ts → src/core/config/)
- [x] 迁移存储管理 (lib/storage.ts → src/core/storage/)
- [x] 迁移国际化 (lib/i18n/ → src/core/i18n/)
- [x] 迁移UI组件 (components/ui/ → src/core/ui/)
- [x] 迁移日记模块组件 (JournalList, MoodEditor, TemplatePicker, CustomTemplateEditor, SmartReminder)
- [x] 迁移通用组件 (ConfirmDialog, EmojiPicker, Sidebar, Providers)
- [x] 迁移仪表板模块 (Dashboard)
- [x] 迁移日历模块 (CalendarView)
- [x] 迁移设置模块 (Settings, PasswordLock)
- [x] 迁移核心配置 (templates.ts)
- [x] 更新 tsconfig.json 路径别名
- [x] 验证和测试 (构建成功)

## 依赖关系图

```
app/
  └── page.tsx
       ├── @/modules/common/components/Providers
       ├── @/modules/common/components/Sidebar
       ├── @/modules/dashboard/components/Dashboard (默认视图)
       ├── @/modules/journal/components/JournalList
       ├── @/modules/calendar/components/CalendarView
       └── @/modules/settings/components/Settings

modules/
  ├── common/
  │   └── 依赖: @/core/*
  ├── journal/
  │   └── 依赖: @/core/*, @/modules/common/*
  ├── dashboard/
  │   └── 依赖: @/core/*
  ├── calendar/
  │   └── 依赖: @/core/*
  └── settings/
      └── 依赖: @/core/*, @/modules/common/*
```

## 最佳实践

1. **模块内聚**: 每个模块应该高内聚，包含完成特定功能所需的所有组件和逻辑
2. **依赖方向**: 模块可以依赖 core/，但 core/ 不应该依赖模块
3. **共享代码**: 多个模块共享的代码应该放在 common/ 或 core/ 中
4. **类型定义**: 全局类型放在 src/types/，模块特定类型可以放在模块目录内

## 注意事项

1. 迁移过程中保持旧文件不动，直到新结构验证通过
2. 逐步更新导入路径，避免一次性大规模修改
3. 确保所有测试在迁移后仍然通过
4. 更新构建配置以支持新的路径别名
