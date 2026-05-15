# OpenCode 与 Claude 落地操作方案

> **文档版本**: v1.0  
> **适用对象**: 项目负责人、技术负责人、研发、测试  
> **适用工具**: OpenCode、Claude、GitHub、HTML 原型 / 组件原型  
> **模型策略**: 模型可按团队需要独立配置，不绑定特定模型

---

## 一、目标

本文档用于说明如何基于 `OpenCode` 与 `Claude` 建立可执行的协作流程，内容包括：

- 必要的 `Skill` 和 `MCP` 设计
- OpenCode 配置文件如何添加
- Skill 和 MCP 如何在实际工作中使用
- 按研发执行规范落地的标准工作流

本文档以当前仓库的执行规范为基础，优先采用最小可运行方案，不追求一次性引入过多能力。

说明：流程阶段、门禁、交付物定义以 `docs/development-execution-workflow.md` 为准。本文只负责说明 OpenCode 配置、Skill/MCP 落地方式和典型使用路径。

---

## 二、推荐落地方式

推荐采用以下组合：

- `OpenCode` 作为执行与配置工具
- `Claude` 作为协作与交互工具
- 模型层独立于工具层配置，可按团队要求选择任意可用模型
- `GitHub` 作为代码、评审、任务和发布记录的留痕载体
- `HTML 原型` 或 `组件原型` 作为设计稿、交互稿和页面状态说明载体
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
│   ├── ui-design-designer
│   ├── technical-design-writer
│   ├── test-case-writer
│   ├── automation-test-writer
│   ├── release-note-writer
│   └── pr-review-assistant
└── MCP
    └── github
```

说明：

- `OpenCode` 和 `Claude` 均属于工具层
- `模型` 由项目配置决定，可使用任意符合团队要求的模型
- `Skill` 负责约束每类任务的输出格式和执行方式
- `MCP` 负责连接 GitHub 等外部上下文

---

## 四、必要 Skill 设计

针对当前执行规范，建议先配置以下 `8` 个 Skill。

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

用于方案设计阶段，在原型已确认后按团队模板生成技术方案文档。

### 触发场景

- 需求已经确认且原型已完成
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
- 需要根据需求直接产出 HTML 原型或组件原型
- 需要补充页面状态、页面流、交互说明

### 主要输出

- 页面清单
- 页面流转关系
- 页面模块结构
- 空态、异常态、加载态说明
- 表单和交互说明
- HTML 原型结构建议

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

当前场景下，建议先启用以下 `1` 个 MCP。

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

## 5.2 设计原型上下文

### 用途

接入 HTML 原型或组件原型，为 AI 提供页面、交互和状态说明上下文。

### 主要用途

- 读取页面结构和命名
- 对照原型输出需求文档
- 根据需求结果生成原型结构和页面层级
- 生成页面测试点
- 生成自动化测试关注点
- 对照原型检查实现偏差

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
- 实际落地时必须替换为团队已经部署的 GitHub MCP 服务地址或本地可执行包名
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
    "docs/opencode-implementation-guide.md"
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
- `mcp` 中先配置 `github`
- `permission` 采用保守策略，编辑和高风险命令使用 `ask`

---

## 6.2 添加步骤

1. 在仓库根目录创建 `opencode.json`
2. 在仓库根目录创建 `.opencode/skills/`
3. 为每个 Skill 创建独立目录和 `SKILL.md`
4. 配置 `GITHUB_TOKEN`
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
description: Use when the user wants to generate prototype structure, page flow, wireframe description, page states, or HTML/component-ready layout from a confirmed requirement document.
---

# Prototype Designer

## 目标

根据需求文档输出可用于 HTML 或组件搭建的原型说明。

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
- HTML / 组件搭建建议
```

---

## 4.4 ui-design-designer

### 用途

用于将确认后的需求和原型进一步输出为商业级视觉设计页面、页面级布局和可落地的 HTML / 组件原型。

### 触发场景

- 需求已确认，且需要更高完成度的页面视觉原型
- 需要输出更像成品的页面布局、视觉层级、留白和状态区块
- 需要原型通过后直接落仓库并可通过页面配置访问

### 主要输出

- 设计目标
- 信息架构
- 视觉原则
- 页面布局
- 组件规范
- 状态设计
- 交互说明
- 原型产物链接
- 项目内原型代码位置

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
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
```

---

## 九、典型使用路径

详细流程、阶段门禁和交付物要求请直接查看 `docs/development-execution-workflow.md`。本节只保留 OpenCode 落地时最常见的使用路径。

### 9.1 需求到原型

- 页面类需求：`requirement-writer` -> `prototype-designer` -> `ui-design-designer` -> `technical-design-writer`
- 非页面类需求：`requirement-writer` -> `technical-design-writer`
- 相关文档结构优先复用 `docs/delivery-templates.md`

### 9.2 开发到评审

- 开发实现阶段按任务类型使用已有 Skill，必要时直接执行
- 提交 PR 时优先复用 `docs/delivery-templates.md` 中的 PR 模板
- PR 评审和测试补充优先使用 `pr-review-assistant`、`test-case-writer`、`automation-test-writer`

### 9.3 发布到复盘

- 发布说明优先使用 `release-note-writer`
- 发布、验证、回滚、复盘文档统一复用 `docs/delivery-templates.md`
- 如果问题在 GitHub 留痕，复盘阶段优先结合 PR、Issue、评论和提交记录整理上下文

### 9.4 常见输入示例

需求整理：

```text
请根据以下会议纪要整理需求文档，并按团队模板输出范围、非范围、业务规则、验收标准和待确认项。
```

技术方案：

```text
请基于已确认的需求文档和原型说明，输出技术方案，包含改动范围、接口设计、数据设计、风险项和测试范围。
```

PR 评审：

```text
请结合 PR、需求文档和技术方案，检查风险点、遗漏项、测试覆盖不足和上线风险。
```

---

## 十、推荐的实际使用顺序

建议按以下顺序落地：

1. 先创建 `opencode.json`
2. 先落 `requirement-writer`、`prototype-designer`、`ui-design-designer`、`technical-design-writer`、`test-case-writer`、`automation-test-writer`
3. 再接入 `github MCP`
4. 再接入原型上下文（如有）
5. 最后补 `release-note-writer` 和 `pr-review-assistant`

原因：

- 文档类、测试类和自动化测试类 Skill 最容易标准化
- 原型 Skill 可将需求直接转换为页面结构初稿，`ui-design-designer` 可进一步收敛商业级视觉页面方案
- GitHub 上下文对开发和评审价值最高
- 原型上下文适合在前期需求和测试阶段补强
- 每个阶段都应形成自动化动作或检查清单

---

## 十一、使用注意事项

- Skill 应只约束输出格式和执行要求，不要写成过长的业务文档
- MCP 先接最常用的系统，不建议一次引入过多外部上下文
- 原型直出适合页面结构、交互草图和商业级视觉原型，最终视觉设计仍需设计角色确认
- PR 审查、测试结论、自动化回归门禁和发布批准仍需人工负责
- 配置文件、Skill、MCP 修改后，必须重启 OpenCode
- 任何自动生成内容进入正式文档前，都必须由责任人审核
- 模板和检查清单优先复用 `docs/delivery-templates.md`，避免在多个文档中维护重复模板

---

## 十二、建议的最小落地结果

当以下条件满足时，可视为 `OpenCode + Claude` 工具方案的最小落地已完成：

- 项目根目录存在 `opencode.json`
- `.opencode/skills/` 下已配置至少 `4` 个 Skill
- `github MCP` 已可读取 PR 或 Issue
- 原型文件已可用于读取页面结构或写入原型结构
- 团队已能用 AI 生成需求文档、原型说明、技术方案、测试用例
- GitHub PR 中已开始关联需求、方案和测试说明

达到上述状态后，再继续扩展发布说明、复盘、更多自动化能力即可。
