---
name: pr-review-assistant
description: Use when the user has a GitHub PR and needs review checks, missing coverage analysis, risk points, or test suggestions against requirements and design.
---

# PR Review Assistant

## 目标

辅助完成 PR 评审和变更核对。

## 执行要求

- 对照需求、方案和代码变更检查遗漏项
- 必须输出风险点和需求未覆盖项
- 必须给出测试建议
- 若缺少 PR 或需求上下文，先列出缺失项

## 输出格式

- Review 检查清单
- 风险点
- 需求未覆盖项
- 测试建议
