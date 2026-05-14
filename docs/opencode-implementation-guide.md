# OpenCode 与 Claude 落地操作方案

> **文档版本**: v1.0  
> **适用对象**: 项目负责人、技术负责人、研发、测试  
> **适用工具**: OpenCode、Claude、GitHub、Figma  
> **模型策略**: 模型可按团队需要独立配置，不绑定特定模型

---

## 一、目标

本文档用于说明如何基于 `OpenCode` 与 `Claude` 建立可执行的协作流程，内容包括：

- 必要的 `Skill` 和 `MCP` 设计
- OpenCode 配置文件如何添加
- Skill 和 MCP 如何在实际工作中使用
- 按研发执行规范落地的标准工作流

本文档以当前仓库的执行规范为基础，优先采用最小可运行方案，不追求一次性引入过多能力。

---

## 二、推荐落地方式

推荐采用以下组合：

- `OpenCode` 作为执行与配置工具
- `Claude` 作为协作与交互工具
- 模型层独立于工具层配置，可按团队要求选择任意可用模型
- `GitHub` 作为代码、评审、任务和发布记录的留痕载体
- `Figma` 作为设计稿、交互稿和页面状态说明载体
- 每个阶段都应有对应的自动化动作、脚本或检查清单，人工仅保留决策和审查职责

推荐原则：

- 先配置最小能力集
- 先覆盖需求、方案、开发、测试 4 个核心环节
- Skill 优先解决“标准动作复用”问题
- MCP 优先解决“上下文接入”问题

---

## 三、最小可用架构

```text
OpenCode
├── Model: configurable
├── Skills
│   ├── requirement-writer
│   ├── prototype-designer
│   ├── technical-design-writer
│   ├── test-case-writer
│   ├── automation-test-writer
│   ├── release-note-writer
│   └── pr-review-assistant
└── MCP
    ├── github
    └── figma
```

说明：

- `OpenCode` 和 `Claude` 均属于工具层
- `模型` 由项目配置决定，可使用任意符合团队要求的模型
- `Skill` 负责约束每类任务的输出格式和执行方式
- `MCP` 负责连接 GitHub、Figma 等外部上下文

---

## 四、必要 Skill 设计

针对当前执行规范，建议先配置以下 `7` 个 Skill。

## 4.1 requirement-writer

### 用途

用于需求澄清阶段，按团队模板生成正式需求文档。

### 触发场景

- 用户提供会议纪要、口头需求、聊天记录
- 需要输出 `需求文档`、`验收标准`、`待确认项`

### 主要输出

- 需求背景
- 范围与非范围
- 用户场景
- 业务规则
- 验收标准
- 风险与待确认项

---

## 4.2 technical-design-writer

### 用途

用于方案设计阶段，按团队模板生成技术方案文档。

### 触发场景

- 需求已经确认
- 需要输出接口设计、数据设计、技术改动范围、风险控制方案

### 主要输出

- 方案目标
- 改动范围
- 核心流程
- 接口设计
- 数据设计
- 风险项
- 测试范围

---

## 4.3 prototype-designer

### 用途

用于将需求文档直接转换为页面原型、页面流和交互说明。

### 触发场景

- 需求文档已经确认
- 需要根据需求直接产出 Figma 原型或线框结构
- 需要补充页面状态、页面流、交互说明

### 主要输出

- 页面清单
- 页面流转关系
- 页面模块结构
- 空态、异常态、加载态说明
- 表单和交互说明
- Figma 原型结构建议

---

## 4.4 test-case-writer

### 用途

用于测试设计和评审测试阶段，生成测试用例、回归范围和自动化测试输入。

### 触发场景

- 技术方案已确认
- 代码提交后需要补充测试场景
- 需要对需求变更重新评估测试范围

### 主要输出

- 功能测试用例
- 异常测试用例
- 回归范围
- 测试结论草稿
- 自动化测试输入项

---

## 4.5 automation-test-writer

### 用途

用于自动化测试脚本、回归集合、执行结果整理和自动化检查清单生成。

### 触发场景

- 核心流程需要纳入自动化回归
- 功能变更后需要更新自动化脚本
- 需要把人工验证结果转为持续回归能力

### 主要输出

- 自动化测试脚本建议
- 自动化回归清单
- 测试数据准备项
- 自动化执行结果摘要
- 自动化检查清单

---

## 4.6 release-note-writer

### 用途

用于发布上线阶段，整理版本发布说明和回滚说明。

### 触发场景

- 测试结论已确认
- 需要整理发布内容、影响范围、上线验证步骤

### 主要输出

- 发布内容
- 影响范围
- 发布前检查项
- 上线验证步骤
- 回滚步骤

---

## 4.7 pr-review-assistant

### 用途

用于 PR 提交前后，辅助完成 Review 检查和变更核对。

### 触发场景

- 有 GitHub PR 待评审
- 需要对照需求、方案和代码变更确认遗漏项

### 主要输出

- Review 检查清单
- 风险点
- 需求未覆盖项
- 测试建议

---

## 五、必要 MCP 设计

当前场景下，建议先启用以下 `2` 个 MCP。

## 5.1 github MCP

### 用途

接入 GitHub 的仓库、分支、PR、Issue、提交记录等信息，为 AI 提供真实开发上下文。

### 主要用途

- 读取 PR 信息
- 读取 Issue 或任务描述
- 获取代码变更范围
- 获取 Review 评论
- 生成发布说明时引用 PR/Commit

### 使用阶段

- 任务拆解
- 开发实现
- 评审测试
- 发布上线

---

## 5.2 figma MCP

### 用途

接入 Figma 设计稿和页面结构，为 AI 提供页面、交互和状态说明上下文。

### 主要用途

- 读取页面结构和命名
- 对照设计稿输出需求文档
- 根据需求结果生成原型结构和页面层级
- 生成页面测试点
- 生成自动化测试关注点
- 对照设计稿检查实现偏差

### 使用阶段

- 需求澄清
- 方案设计
- 任务拆解
- 评审测试

---

## 六、OpenCode 中如何添加配置

推荐使用项目级配置，文件放在仓库根目录：`opencode.json`

说明：

- 文中的 MCP 地址和本地包名仅为配置结构示例，不代表可直接使用的真实服务地址
- 实际落地时必须替换为团队已经部署的 GitHub MCP、Figma MCP 服务地址或本地可执行包名
- 若当前团队尚未具备 MCP 服务，可先只配置 Skill，后续再补 MCP

## 6.1 最小 `opencode.json` 示例

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "your-provider/your-model",
  "small_model": "your-provider/your-small-model",
  "instructions": [
    "AGENTS.md",
    "docs/development-execution-workflow.md",
    "docs/opencode-tool-implementation-guide.md"
  ],
  "skills": {
    "paths": [
      ".opencode/skills"
    ]
  },
  "mcp": {
    "github": {
      "type": "remote",
      "url": "https://your-github-mcp-server.example.com",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "figma": {
      "type": "remote",
      "url": "https://your-figma-mcp-server.example.com",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer ${FIGMA_TOKEN}"
      }
    }
  },
  "permission": {
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "edit": "ask",
    "bash": {
      "git *": "allow",
      "gh *": "allow",
      "*": "ask"
    },
    "webfetch": "ask",
    "task": "allow",
    "skill": "allow"
  }
}
```

说明：

- `model` 和 `small_model` 由团队按实际可用模型配置
- `instructions` 引入团队执行规范和本实施文档
- `skills.paths` 指向项目级 Skill 目录
- `mcp` 中先配置 `github` 和 `figma`
- `permission` 采用保守策略，编辑和高风险命令使用 `ask`

---

## 6.2 添加步骤

1. 在仓库根目录创建 `opencode.json`
2. 在仓库根目录创建 `.opencode/skills/`
3. 为每个 Skill 创建独立目录和 `SKILL.md`
4. 配置 `GITHUB_TOKEN` 和 `FIGMA_TOKEN`
5. 重启 OpenCode，使配置生效

注意：OpenCode 配置修改后需要重启才能生效。

---

## 七、Skill 如何添加

目录结构示例：

```text
.opencode/
└── skills/
    ├── requirement-writer/
    │   └── SKILL.md
    ├── prototype-designer/
    │   └── SKILL.md
    ├── technical-design-writer/
    │   └── SKILL.md
    ├── test-case-writer/
    │   └── SKILL.md
    ├── release-note-writer/
    │   └── SKILL.md
    └── pr-review-assistant/
        └── SKILL.md
```

## 7.1 Skill 文件格式

示例：`requirement-writer/SKILL.md`

```markdown
---
name: requirement-writer
description: Use when the user provides meeting notes, chat records, rough requirements, or asks to write a requirement document, acceptance criteria, scope, and open questions.
---

# Requirement Writer

## 目标

将原始需求整理为正式需求文档。

## 执行要求

- 按项目模板输出
- 必须包含范围、非范围、业务规则、验收标准、待确认项
- 若输入信息不足，先列出缺失项

## 输出格式

- 背景
- 目标
- 范围
- 非范围
- 用户场景
- 业务规则
- 验收标准
- 风险与待确认项
```

其他 Skill 按同样方式添加。

## 7.2 prototype-designer 示例

示例：`prototype-designer/SKILL.md`

```markdown
---
name: prototype-designer
description: Use when the user wants to generate prototype structure, page flow, wireframe description, page states, or Figma-ready layout from a confirmed requirement document.
---

# Prototype Designer

## 目标

根据需求文档输出可用于 Figma 搭建的原型说明。

## 执行要求

- 先提取页面清单和用户路径
- 明确每个页面的模块结构
- 必须补充空态、异常态、加载态
- 必须输出关键交互和跳转关系
- 若需求信息不足，先列缺失项，不直接假设

## 输出格式

- 页面清单
- 页面流程
- 页面结构说明
- 交互说明
- 状态说明
- Figma 搭建建议
```

---

## 八、MCP 如何添加

MCP 配置在 `opencode.json` 中的 `mcp` 字段下。

## 8.1 GitHub MCP 添加方式

若公司已有 GitHub MCP 服务，直接配置远程地址：

```json
"github": {
  "type": "remote",
  "url": "https://your-github-mcp-server.example.com",
  "enabled": true,
  "headers": {
    "Authorization": "Bearer ${GITHUB_TOKEN}"
  }
}
```

若公司使用本地启动方式，则改为：

```json
"github": {
  "type": "local",
  "command": ["npx", "-y", "your-github-mcp-package"],
  "enabled": true,
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

---

## 8.2 Figma MCP 添加方式

远程方式示例：

```json
"figma": {
  "type": "remote",
  "url": "https://your-figma-mcp-server.example.com",
  "enabled": true,
  "headers": {
    "Authorization": "Bearer ${FIGMA_TOKEN}"
  }
}
```

本地方式示例：

```json
"figma": {
  "type": "local",
  "command": ["npx", "-y", "your-figma-mcp-package"],
  "enabled": true,
  "env": {
    "FIGMA_TOKEN": "${FIGMA_TOKEN}"
  }
}
```

---

## 九、具体工作流使用流程

以下流程与 `AI 赋能研发执行规范` 中的 `7` 个阶段对应。

## 9.0 需求直出原型流程

在 `Figma MCP` 可用的前提下，可增加如下流程：

```text
需求文档 -> prototype-designer -> Figma MCP -> 原型初稿 -> 设计确认 -> 技术方案
```

### 操作流程

1. 产品提供已确认的需求文档
2. 在 OpenCode 中调用 `prototype-designer`
3. AI 输出页面清单、页面流、模块布局、状态说明
4. 通过 `figma MCP` 将原型结构同步到 Figma，或生成可直接落地到 Figma 的说明
5. 设计确认原型结构、交互和视觉方向
6. 技术负责人基于原型进入技术方案设计

### 使用到的能力

- Skill：`prototype-designer`
- MCP：`figma`

### 适用前提

- 需求文档已确认
- Figma MCP 已可用
- 团队允许先出低保真原型，再进入视觉设计或技术设计

## 9.1 需求澄清阶段

### 操作流程

1. 产品提供原始需求、会议纪要或聊天记录
2. 在 OpenCode 中调用 `requirement-writer`
3. 如涉及页面，使用 `figma MCP` 读取设计稿上下文
4. AI 输出需求文档初稿
5. 产品、技术负责人、测试共同确认
6. 文档落到 `docs/` 中
7. 若需求已稳定且需要页面方案，可继续进入 `prototype-designer`

### OpenCode 使用方式

典型输入：

```text
请根据以下会议纪要整理需求文档，并按团队模板输出范围、非范围、业务规则、验收标准和待确认项。
```

### 使用到的能力

- Skill：`requirement-writer`
- MCP：`figma`（如有设计稿）

---

## 9.2 方案设计阶段

### 操作流程

1. 技术负责人提供需求文档
2. 如需先出原型，先调用 `prototype-designer`
3. 调用 `technical-design-writer`
4. 如有设计稿或原型稿，接入 `figma MCP`
5. AI 输出技术方案初稿
5. 技术负责人补充改动范围、接口设计、风险项
6. 测试补充测试范围

### 使用到的能力

- Skill：`prototype-designer`、`technical-design-writer`
- MCP：`figma`

---

## 9.3 任务拆解阶段

### 操作流程

1. 提供需求文档和技术方案
2. 让 AI 输出开发任务、测试任务、联调点、依赖关系
3. 技术负责人确认颗粒度和排期
4. 测试确认回归范围
5. 在 GitHub Issue/Projects 中建立任务

### 使用到的能力

- Skill：`technical-design-writer` 或通用执行指令
- MCP：`github`

---

## 9.4 开发实现阶段

### 操作流程

1. 研发提供任务背景、技术方案、目标文件
2. AI 辅助生成代码骨架、测试草稿、变更说明
3. 研发完成人工实现和自测
4. 提交 GitHub PR

### 使用到的能力

- Skill：按任务类型使用已有 Skill，必要时直接让 AI 执行
- MCP：`github`

---

## 9.5 评审测试阶段

### 操作流程

1. 提供 PR 链接、需求文档、技术方案
2. 调用 `pr-review-assistant`
3. 调用 `test-case-writer` 补充测试用例和回归范围
4. 若为页面需求，对照 `figma MCP` 检查实现与原型一致性
4. 测试执行验证并形成测试结论
5. 对缺陷进行修复和回归

### 使用到的能力

- Skill：`pr-review-assistant`、`test-case-writer`
- MCP：`github`、`figma`

---

## 9.6 发布上线阶段

### 操作流程

1. 提供 PR、测试结论、发布范围
2. 调用 `release-note-writer`
3. AI 生成发布说明、回滚步骤和发布检查项
4. 发布负责人审查后执行上线
5. 自动执行上线验证清单并记录结果

### 使用到的能力

- Skill：`release-note-writer`
- MCP：`github`

---

## 9.7 监控复盘阶段

### 操作流程

1. 提供发布记录、日志、问题单、用户反馈
2. AI 汇总问题和复盘初稿
3. 自动生成问题归类和改进项清单
4. 项目负责人审查并组织复盘
5. 输出改进项并更新模板或流程

### 使用到的能力

- Skill：可先不单独配置，使用通用 AI 能力即可
- MCP：`github`（如问题在 Issue/PR 中留痕）

---

## 十、推荐的实际使用顺序

建议按以下顺序落地：

1. 先创建 `opencode.json`
2. 先落 `requirement-writer`、`prototype-designer`、`technical-design-writer`、`test-case-writer`、`automation-test-writer`
3. 再接入 `github MCP`
4. 再接入 `figma MCP`
5. 最后补 `release-note-writer` 和 `pr-review-assistant`

原因：

- 文档类、测试类和自动化测试类 Skill 最容易标准化
- 原型 Skill 可将需求直接转换为 Figma 初稿，适合前期快速收敛页面方案
- GitHub 上下文对开发和评审价值最高
- Figma 上下文适合在前期需求和测试阶段补强
- 每个阶段都应形成自动化动作或检查清单

---

## 十一、使用注意事项

- Skill 应只约束输出格式和执行要求，不要写成过长的业务文档
- MCP 先接最常用的系统，不建议一次引入过多外部上下文
- 原型直出仅适合低保真原型、页面结构和交互草图，最终视觉设计仍需设计角色确认
- PR 审查、测试结论、自动化回归门禁和发布批准仍需人工负责
- 配置文件、Skill、MCP 修改后，必须重启 OpenCode
- 任何自动生成内容进入正式文档前，都必须由责任人审核

---

## 十二、建议的最小落地结果

当以下条件满足时，可视为 `OpenCode + Claude` 工具方案的最小落地已完成：

- 项目根目录存在 `opencode.json`
- `.opencode/skills/` 下已配置至少 `4` 个 Skill
- `github MCP` 已可读取 PR 或 Issue
- `figma MCP` 已可用于读取设计稿或写入原型结构
- 团队已能用 AI 生成需求文档、原型说明、技术方案、测试用例
- GitHub PR 中已开始关联需求、方案和测试说明

达到上述状态后，再继续扩展发布说明、复盘、更多自动化能力即可。
