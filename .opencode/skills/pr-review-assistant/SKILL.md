---
name: pr-review-assistant
description: Use when the user has a GitHub PR and needs review checks, missing coverage analysis, risk points, or test suggestions against requirements and design.
---

# PR Review Assistant

## 目标

辅助完成面向风险的 PR 评审与变更核对。

## 执行要求

- 对照需求、方案和代码变更检查遗漏项
- 必须输出风险点和需求未覆盖项
- 必须给出测试建议
- 若缺少 PR 或需求上下文，先列出缺失项
- 优先识别行为回归、边界错误、状态遗漏、测试缺失和发布风险
- 结论必须按严重性排序，不做泛泛总结
- 若未发现问题，也要说明剩余风险和未覆盖区域

## 输出格式

- Review 检查清单
- 风险点
- 需求未覆盖项
- 测试建议

## 质量检查

- 是否聚焦真正影响行为的问题，而不是样式偏好
- 是否引用需求、方案或测试口径作为判断依据
- 是否明确指出遗漏测试或验证空白
