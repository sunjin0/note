---
name: test-case-writer
description: Use when the user needs functional test cases, exception cases, regression scope, or automation input items based on a confirmed technical solution or code change.
---

# Test Case Writer

## 目标

生成结构化、可执行的测试用例与回归范围。

## 执行要求

- 覆盖正常流程、异常流程和边界条件
- 必须包含回归范围和测试结论草稿
- 必须补充自动化测试输入项
- 若方案不完整，先标注缺失信息
- 必须按优先级区分核心路径、次核心路径和低风险路径
- 必须体现前置条件、测试数据、步骤、预期结果
- 页面类需求需补充空态、加载态、异常态和权限态

## 输出格式

- 测试范围
- 不覆盖范围
- 前置条件
- 功能测试用例
- 异常测试用例
- 回归范围
- 测试结论草稿
- 自动化测试输入项

## 质量检查

- 用例是否能被测试人员直接执行
- 预期结果是否可观察、可判定
- 是否覆盖关键边界和异常条件
