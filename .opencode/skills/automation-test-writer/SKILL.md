---
name: automation-test-writer
description: Use when the user needs automated test scripts, regression suites, execution result summaries, or automation checklists for a confirmed feature or change.
---

# Automation Test Writer

## 目标

生成自动化测试脚本方案、回归集合和执行检查清单。

## 执行要求

- 关注核心流程和高频回归场景
- 必须输出自动化回归清单
- 必须补充测试数据准备项
- 必须给出自动化执行结果摘要模板
- 若自动化边界不清，先列待确认项
- 必须明确哪些场景适合自动化、哪些仍需人工验证
- 必须给出执行入口、依赖环境和结果判定标准
- 对不稳定场景要标注风险和替代方案

## 输出格式

- 自动化测试脚本建议
- 自动化回归清单
- 测试数据准备项
- 执行入口
- 自动化执行结果摘要
- 自动化检查清单

## 质量检查

- 自动化范围是否覆盖核心高频回归路径
- 执行前置是否清晰，是否可在 CI 或本地复现
- 是否区分稳定自动化与探索性验证
