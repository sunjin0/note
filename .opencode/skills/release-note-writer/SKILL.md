---
name: release-note-writer
description: Use when the user needs release notes, impact scope, pre-release checks, verification steps, or rollback instructions for a deployment.
---

# Release Note Writer

## 目标

整理可执行的发布说明、验证步骤和回滚方案。

## 执行要求

- 必须说明发布内容和影响范围
- 必须包含发布前检查项
- 必须包含上线验证步骤和回滚步骤
- 若发布信息不足，先列出缺失项
- 必须标识版本范围、依赖变更和风险提醒
- 验证步骤需覆盖核心链路、监控观察点和失败处理
- 回滚说明必须可执行，不能只写“回滚到上一版本”

## 输出格式

- 发布内容
- 影响范围
- 发布前检查项
- 发布步骤
- 上线验证步骤
- 回滚步骤

## 质量检查

- 是否能被发布负责人直接执行
- 是否明确了上线后看什么、谁确认、何时停止
- 回滚路径是否与发布内容一一对应
