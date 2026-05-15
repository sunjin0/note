# docs 快速入口

> 目标：让团队成员在 3 分钟内看懂怎么指导 AI 完成研发工作。
>
> **核心原则**：这些规范文件是 OpenCode AI 的执行依据。人的职责是**审查和确认**，AI 的职责是**生成和执行**。

---

## 1. 怎么指导 AI 处理新需求

**你输入：**

```
请帮我整理这个需求：[粘贴需求描述]
```

**AI 执行：**

1. 读取 `development-execution-workflow.md` 判断阶段
2. 调用 `requirement-writer` Skill
3. 套用 `delivery-templates.md` 中的需求模板
4. 生成 `requirements.md`

**你审查：**

- 范围与非范围是否准确
- 验收标准是否可执行
- 待确认项是否完整

**确认后归档：**

```
归档到 docs/projects/<project-name>/requirements.md
```

---

## 2. 怎么指导 AI 设计原型（页面类需求）

**你输入：**

```
基于已确认的需求文档，输出页面原型
```

**AI 执行：**

1. 读取 `development-execution-workflow.md` 确认是页面类需求
2. 调用 `prototype-designer` 输出页面结构和交互说明
3. 调用 `ui-design-designer` 生成商业级视觉原型
4. 套用 `delivery-templates.md` 中的原型规范

**你审查：**

- 页面清单是否完整
- 空态/加载态/异常态是否覆盖
- 原型链接是否可访问

**确认后归档：**

```
原型代码保存到项目内，归档原型说明到 docs/projects/<project-name>/
```

---

## 3. 怎么指导 AI 输出技术方案

**你输入：**

```
基于已确认的需求文档[和原型]，输出技术方案
```

**AI 执行：**

1. 读取 `development-execution-workflow.md` 确认阶段
2. 调用 `technical-design-writer` Skill
3. 套用 `delivery-templates.md` 中的技术方案模板
4. 生成 `technical-design.md`

**你审查：**

- 改动范围是否明确
- 接口和数据设计是否合理
- 风险项是否完整

---

## 4. 怎么指导 AI 拆解任务

**你输入：**

```
基于技术方案，拆解开发任务和测试任务
```

**AI 执行：**

1. 读取 `development-execution-workflow.md` 确认阶段
2. 拆分开发任务、测试任务、联调点
3. 标识依赖关系和责任人
4. 生成任务清单

**你审查：**

- 每项任务是否有明确责任人
- 每项任务是否有完成标准
- 联调依赖是否说明清楚

---

## 5. 怎么指导 AI 补充测试

**你输入：**

```
请基于技术方案补充测试用例
```

**AI 执行：**

1. 读取 `delivery-templates.md` 中的测试模板
2. 调用 `test-case-writer` Skill
3. 生成 `test-plan.md`

---

## 6. 怎么指导 AI 评审 PR

**你输入：**

```
请评审这个 PR：[粘贴 PR 链接或内容]
```

**AI 执行：**

1. 读取 PR 内容
2. 调用 `pr-review-assistant` Skill
3. 对照 `delivery-templates.md` 中的检查清单
4. 输出 Review 意见和风险点

---

## 7. 怎么指导 AI 生成发布说明

**你输入：**

```
请生成发布说明，版本号 x.x.x
```

**AI 执行：**

1. 读取 `delivery-templates.md` 中的发布说明模板
2. 调用 `release-note-writer` Skill
3. 生成发布说明

---

## 8. 怎么指导 AI 复盘

**你输入：**

```
基于发布记录和线上问题，输出复盘文档
```

**AI 执行：**

1. 读取 `delivery-templates.md` 中的复盘模板
2. 汇总问题、归类根因
3. 生成改进项清单（含责任人、截止时间）
4. 输出复盘文档

**你审查：**

- 问题归因是否准确
- 改进措施是否可执行
- 责任人是否明确

---

## 9. 文档分工

| 文件 | 作用 | 谁读 |
|------|------|------|
| `development-execution-workflow.md` | 定义流程、门禁、职责 | **OpenCode 执行依据** + 团队了解 |
| `delivery-templates.md` | 统一模板、检查清单、SOP | **OpenCode 生成依据** + 团队审查 |
| `opencode-initial-instructions.md` | AI 执行约束、工具优先级 | **OpenCode 读取** |
| `opencode-implementation-guide.md` | OpenCode 配置、Skill、MCP | **OpenCode 读取** |

---

## 10. 最少规则

- **不要手动写文档**：让 AI 生成，你只审查
- **不要跳过确认**：AI 生成后必须人工确认才能归档
- **不要拆模板**：统一复用 `docs/delivery-templates.md`
- **统一归档位置**：`docs/projects/<project-name>/`

---

## 11. 常用指令速查

| 你想让 AI 做什么 | 输入指令 | AI 调用 |
|-----------------|---------|---------|
| 整理需求 | `请帮我整理这个需求` | `requirement-writer` |
| 设计原型 | `基于需求输出页面原型` | `prototype-designer` + `ui-design-designer` |
| 输出方案 | `请输出技术方案` | `technical-design-writer` |
| 拆解任务 | `基于方案拆解任务` | 通用能力 |
| 补充测试 | `请补充测试用例` | `test-case-writer` |
| 评审 PR | `请评审这个 PR` | `pr-review-assistant` |
| 生成发布说明 | `请生成发布说明` | `release-note-writer` |
| 复盘 | `基于问题输出复盘` | 通用能力 |
| 检查阶段 | `当前阶段检查清单` | 读取 `delivery-templates.md` |

---

## 12. 配置指导：规范文件和 Skill 放哪里

### 12.1 目录结构

项目根目录至少包含：

```text
<project-root>/
├── opencode.json                          # OpenCode 配置文件
├── AGENTS.md                              # 项目级 AI 指令（如有）
├── docs/                                  # 规范文档目录
│   ├── README.md                          # 本文档：快速入口
│   ├── development-execution-workflow.md  # 流程主规范
│   ├── delivery-templates.md              # 统一模板手册
│   ├── opencode-initial-instructions.md   # AI 执行约束
│   ├── opencode-implementation-guide.md   # OpenCode 落地指南
│   └── projects/                          # 项目或版本级交付物
│       └── <project-name>/
│           ├── requirements.md
│           ├── technical-design.md
│           ├── test-plan.md
│           ├── release-note.md
│           └── retrospective.md
└── .opencode/                             # OpenCode 配置目录
    └── skills/                            # Skill 定义目录
        ├── requirement-writer/
        │   └── SKILL.md
        ├── prototype-designer/
        │   └── SKILL.md
        ├── ui-design-designer/
        │   └── SKILL.md
        ├── technical-design-writer/
        │   └── SKILL.md
        ├── test-case-writer/
        │   └── SKILL.md
        ├── automation-test-writer/
        │   └── SKILL.md
        ├── pr-review-assistant/
        │   └── SKILL.md
        └── release-note-writer/
            └── SKILL.md
```

### 12.2 最小 `opencode.json`

项目根目录创建 `opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "AGENTS.md",
    "delivery-templates.md",
    "docs/development-execution-workflow.md",
    "docs/opencode-implementation-guide.md",
    "docs/opencode-initial-instructions.md"
  ],
  "skills": {
    "paths": [
      ".opencode/skills"
    ]
  },
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "enabled": true
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

### 12.3 初始化步骤

1. **复制规范文档**：将 `docs/` 下的 4 个核心文件复制到项目
2. **复制 Skill**：将 `.opencode/skills/` 下的 Skill 复制到项目
3. **创建 `opencode.json`**：复制上面的配置到项目根目录
4. **配置环境变量**：设置 `GITHUB_TOKEN`（用于 GitHub MCP）
5. **重启 OpenCode**：配置修改后必须重启才能生效

### 12.4 关键配置说明

- `instructions`：OpenCode 启动时自动加载的规范文件，按顺序读取
- `skills.paths`：Skill 定义目录，OpenCode 会扫描所有 `SKILL.md`
- `mcp.github`：GitHub MCP 配置，用于读取 PR、Issue、Commit 等上下文
- `permission`：权限控制，建议保持保守策略

## 13. 快速入口

- 流程主规范：`docs/development-execution-workflow.md`
- 模板手册：`docs/delivery-templates.md`
- AI 执行约束：`docs/opencode-initial-instructions.md`
- OpenCode 落地指南：`docs/opencode-implementation-guide.md`
