# 心情日记技术方案

> 版本：v1.1
> 状态：待评审
> 负责人：待确认
> 对应需求：`docs/projects/mood-journal/requirements.md`
> 对应原型：`docs/projects/mood-journal/prototype.md`

## 1. 方案目标

1. 支持 Web 版心情日记的完整核心体验。
2. 尽可能复用核心领域模型、数据处理和校验逻辑，减少实现差异。
3. 保持本地优先的数据体验，同时为后续同步与认证能力保留可扩展入口。
4. 明确富文本、照片、安全、统计和国际化的实现边界，保证可评审、可测试、可迭代。

## 2. 改动范围

### 2.1 本期纳入

1. Web 端继续基于现有 Next.js 技术栈实现。
2. 抽取并统一核心领域层，包括心情记录、模板、因素、统计、导出和安全规则。
3. 统一国际化文案、业务枚举和校验规则。
4. 改造照片存储方案，采用适合大文件的本地持久化方式。
5. 为富文本内容增加安全清洗逻辑。
6. 整理应用锁、导出、清空数据和提醒等交互链路。

### 2.2 本期不纳入

1. 统一账号体系下的完整云端协作写作。
2. 服务端强依赖的在线多人同步编辑。
3. 复杂的企业级权限、审批流或组织管理。

### 2.3 推荐技术分层

1. `domain`：业务类型、规则、计算、校验、模板变量解析。
2. `storage`：本地数据读写、加密、导出、导入、图片持久化。
3. `services`：统计、提醒、同步、认证等流程编排。
4. `ui-web`：Web 端页面和弹窗组件。

## 3. 核心流程

### 3.1 启动与解锁流程

1. 应用启动后读取本地设置、认证和会话状态。
2. 若启用密码保护且会话无效，进入锁屏页。
3. 验证成功后进入主界面。
4. 若启用了语言设置，则在启动阶段完成语言初始化。

### 3.2 新建/编辑记录流程

1. 用户从首页、日历、列表或提醒入口打开编辑器。
2. 编辑器回填日期、心情、因素、富文本内容和照片。
3. 保存前执行校验、HTML 清洗和数据标准化。
4. 保存后写入本地存储，并刷新统计、列表和日历视图。

### 3.3 模板流程

1. 用户选择模板分类或搜索模板。
2. 选择预设或自定义模板后进行变量替换。
3. 回填到编辑器内容区，并保留手动修改能力。

### 3.4 数据管理流程

1. 用户在设置页执行导出、清空、因素管理和密码设置。
2. 导出时生成可恢复的 JSON 数据包。
3. 清空数据前必须二次确认。

## 4. 接口设计

> 说明：以下接口分为“本地领域接口”和“后端能力接口”。本期需求以本地能力为主，后端接口作为预留和同步/认证扩展。

### 4.1 本地领域接口

#### 4.1.1 记录管理

```ts
type SaveEntryInput = {
  date: string;
  mood: Mood;
  journal: string;
  factors: string[];
  photos: string[];
};

function saveEntry(input: SaveEntryInput): void;
function updateEntry(id: string, input: SaveEntryInput): void;
function deleteEntry(id: string): void;
function getEntryByDate(date: string): MoodEntry | undefined;
function getEntriesForMonth(year: number, month: number): MoodEntry[];
```

#### 4.1.2 模板管理

```ts
function getTemplates(): JournalTemplate[];
function saveCustomTemplate(template: CustomTemplate): void;
function updateCustomTemplate(id: string, template: Partial<CustomTemplate>): void;
function deleteCustomTemplate(id: string): void;
function replaceTemplateVariables(content: string, date: string): string;
```

#### 4.1.3 因素管理

```ts
function getAllFactors(): FactorOption[];
function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption;
function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null;
function deleteCustomFactor(id: string): boolean;
function reorderCustomFactors(factors: FactorOption[]): void;
```

#### 4.1.4 统计与导出

```ts
function getStreak(): number;
function getMoodStats(): MoodStats;
function getTotalEntries(): number;
function getAverageMoodScore(): number;
function exportData(): string;
function importData(payload: string): void;
function clearAllData(): void;
```

#### 4.1.5 安全能力

```ts
function getSecuritySettings(): SecuritySettings;
function saveSecuritySettings(settings: SecuritySettings): void;
function setPassword(password: string, questions: SecurityQuestionAnswer[]): void;
function verifyPassword(password: string): boolean;
function verifySecurityAnswers(answers: SecurityQuestionAnswer[]): boolean;
function resetPassword(newPassword: string): PasswordResetResult;
function getLockoutStatus(): LockoutStatus;
```

### 4.2 后端能力接口

> 仅为扩展预留，本期不作为主流程依赖。

#### 4.2.1 认证

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/send-email-code`
- `POST /auth/forgot-password`

#### 4.2.2 同步

- `POST /api/v1/sync`
- `GET /api/v1/sync/status`
- `POST /api/v1/sync/conflicts/:entryId/resolve`

## 5. 数据设计

### 5.1 核心实体

#### 5.1.1 MoodEntry

```ts
type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';

interface MoodEntry {
  id: string;
  date: string;
  mood: Mood;
  journal: string;
  factors: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  contentHash?: string;
  journalEncrypted?: boolean;
}
```

#### 5.1.2 FactorOption

```ts
interface FactorOption {
  id: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}
```

#### 5.1.3 JournalTemplate / CustomTemplate

```ts
interface JournalTemplate {
  id: string;
  category: 'work' | 'study' | 'travel' | 'health' | 'life';
  titleKey: string;
  contentKey: string;
  title?: string;
  content?: string;
  isCustom?: boolean;
  createdAt?: string;
}

interface CustomTemplate extends JournalTemplate {
  isCustom: true;
  createdAt: string;
}
```

#### 5.1.4 设置与安全

```ts
interface AppSettings {
  encrypted: boolean;
  createdAt: string;
  weeklyGoalDays?: number;
}

interface SecuritySettings {
  passwordEnabled: boolean;
  passwordHash: string;
  securityQuestions: SecurityQuestion[];
  lockoutAttempts: number;
  lockoutUntil: string | null;
}
```

### 5.2 存储设计

#### 5.2.1 Web 存储

1. 继续使用浏览器本地存储保存设置、因素、模板、认证状态和同步状态。
2. 记录数据在 Web 端按现有数据结构进行本地持久化。
3. 照片建议迁移至更适合大对象的本地存储方案，不再以 `localStorage` 直接承载。

### 5.3 关键规则

1. 日期唯一约束：同一天仅保留一条主记录。
2. 统计按当前可见的有效记录实时计算。
3. 模板变量替换必须在保存前或插入前完成。
4. 富文本在持久化前必须做 HTML 清洗。
5. 导出包必须保留恢复所需字段和版本信息。

## 6. 风险项

### 6.1 技术风险

1. 富文本 HTML 需要严格清洗，否则会带来 XSS 风险。
2. 照片如果继续以字符串方式存储，会带来体积膨胀和性能问题。
3. 认证与同步虽然在代码中已有模块，但本期需求不把它们作为主依赖，避免范围失控。

### 6.2 兼容性风险

1. 国际化文案需要保证 key 一致，否则容易出现显示不齐。
2. 数据导入导出格式一旦变更，需要兼容旧版本。

### 6.3 风险应对

1. 抽离统一业务层，避免页面层重复实现规则。
2. 对富文本做白名单清洗并在测试中覆盖恶意输入样例。
3. 对照片做大小、数量和格式限制，并提供清晰提示。
4. 对导出格式加入 `schemaVersion`，为后续迁移预留空间。

## 7. 测试范围

### 7.1 功能测试

1. 记录的新建、编辑、删除、回填和覆盖规则。
2. 仪表盘、日历、列表和设置四大模块的联动刷新。
3. 模板选择、自定义模板和变量替换。
4. 自定义因素管理与排序。
5. 富文本编辑、清洗和渲染。
6. 照片上传、预览、删除和超限提示。
7. 语言切换和文案同步。
8. 密码保护、错误锁定和找回流程。
9. 数据导出、清空和恢复。

### 7.2 Web 专项测试

1. 桌面宽屏下侧边栏、弹窗和主内容区的布局正确性。
2. 搜索、筛选和分页的交互稳定性。
3. 月历和热图同屏时的可读性。

### 7.3 安全与性能测试

1. 富文本 XSS 输入校验。
2. 密码错误次数与锁定时长。
3. 大量记录下的统计性能与页面响应时间。
4. 大批量照片存储下的数据容量和导出耗时。

## 8. 待确认项

1. 照片持久化采用 `本地文件系统/Blob 存储 + 元数据索引`，不再使用 `Base64` 作为主存储方案。
2. 同步/认证写入技术方案作为 `预留联调范围`，本期不作为主交付阻塞项，但需保留接口、状态和错误处理约定。
