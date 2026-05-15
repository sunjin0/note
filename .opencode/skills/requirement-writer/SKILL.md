---
name: requirement-writer
description: Use when the user provides meeting notes, chat records, rough requirements, business requests, or asks for a formal requirement document, acceptance criteria, scope, non-scope, and open questions.
---

# Requirement Writer

## 目标

将原始输入整理为可评审、可执行、可追踪的正式需求文档。

## 执行要求

- 先提取业务目标、用户角色、触发场景和成功标准
- 区分范围、非范围、已确认事项、待确认事项，不得混写
- 补充边界场景、异常场景、可测性关注点和依赖项
- 验收标准必须可执行、可验证，避免空泛描述
- 若输入信息不足，先列缺失项，不直接假设业务规则
- 输出内容必须适合直接进入评审或归档到 `docs/`

## 输出格式

- 背景
- 目标
- 范围
- 非范围
- 用户场景
- 业务规则
- 页面/交互说明
- 异常与边界场景
- 验收标准
- 风险与待确认项

## 质量检查

- 范围与非范围是否清晰分离
- 验收标准是否可被测试执行
- 待确认项是否显式列出负责人或处理方式
- 是否存在把猜测写成既定事实的表述
