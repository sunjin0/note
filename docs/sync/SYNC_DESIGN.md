# 数据同步方案设计

## 概述

本方案支持多设备离线编辑、增量同步、冲突自动处理（时间戳优先）与手动调整。

### 核心原则

1. **仅同步日记条目（entries）**，配置类数据（settings/factors/templates）保持本地存储
2. **增量同步**：仅传输自上次同步后变更的数据
3. **时间戳优先**：默认保留较新的版本，冲突时提示用户手动选择
4. **离线友好**：支持离线编辑，网络恢复后自动同步

---

## 1. 实体设计

### MoodEntry（日记条目）

```typescript
interface MoodEntry {
  id: string;                    // 全局唯一标识
  date: string;                  // 日期 YYYY-MM-DD
  mood: number;                  // 心情值 1-5
  factors: string[];             // 影响因素ID数组
  journal: string;               // 日记内容
  photos: string[];              // 照片URL数组
  
  // 同步相关字段
  createdAt: string;             // 创建时间 ISO8601
  updatedAt: string;             // 最后修改时间 ISO8601
  deletedAt?: string;            // 删除时间（软删除标记）
  
  // 可选：用于冲突检测
  contentHash?: string;          // 内容哈希，用于快速判断是否变更
}
```

### SyncState（同步状态 - 客户端）

```typescript
interface SyncState {
  lastSyncAt: string | null;     // 上次同步完成时间
  lastSyncedAt?: string;         // 上次同步的服务端时间戳（可选）
  
  // 待同步数据
  pendingEntryIds: string[];     // 待上传的条目ID
  pendingDeletes: Array<{        // 待上传的删除操作
    id: string;
    deletedAt: string;
  }>;
  
  // 同步状态
  isSyncing: boolean;
  lastError?: string;
}
```

---

## 2. 接口设计

### 2.1 双向同步

**POST /api/v1/sync**

请求：
```json
{
  "deviceId": "device_123",
  "lastSyncAt": "2026-04-01T10:00:00Z",
  "entries": [
    {
      "id": "entry_1",
      "date": "2026-04-02",
      "mood": 4,
      "factors": ["work", "exercise"],
      "journal": "今天心情不错",
      "photos": [],
      "createdAt": "2026-04-02T08:00:00Z",
      "updatedAt": "2026-04-02T09:30:00Z"
    }
  ],
  "deletes": [
    {
      "id": "entry_old",
      "deletedAt": "2026-04-02T10:00:00Z"
    }
  ]
}
```

响应：
```json
{
  "success": true,
  "data": {
    "serverTime": "2026-04-02T10:05:00Z",
    
    "entries": [
      {
        "id": "entry_2",
        "date": "2026-04-01",
        "mood": 3,
        "factors": ["study"],
        "journal": "...",
        "photos": [],
        "createdAt": "2026-04-01T08:00:00Z",
        "updatedAt": "2026-04-01T20:00:00Z"
      }
    ],
    
    "deletes": [
      {
        "id": "entry_3",
        "deletedAt": "2026-04-01T15:00:00Z"
      }
    ],
    
    "conflicts": [
      {
        "id": "entry_1",
        "clientUpdatedAt": "2026-04-02T09:30:00Z",
        "serverUpdatedAt": "2026-04-02T09:35:00Z",
        "clientEntry": { /* 客户端版本 */ },
        "serverEntry": { /* 服务端版本 */ },
        "autoResolution": "server"
      }
    ],
    
    "stats": {
      "uploaded": 1,
      "downloaded": 1,
      "deleted": 1,
      "conflicts": 1
    }
  }
}
```

### 2.2 解决冲突

**POST /api/v1/sync/conflicts/:entryId/resolve**

请求：
```json
{
  "resolution": "client",
  "entry": {
    "id": "entry_1",
    "date": "2026-04-02",
    "mood": 4,
    "factors": ["work", "exercise"],
    "journal": "今天心情不错（手动修改）",
    "photos": [],
    "createdAt": "2026-04-02T08:00:00Z",
    "updatedAt": "2026-04-02T10:10:00Z"
  }
}
```

响应：
```json
{
  "success": true
}
```

### 2.3 获取同步状态（可选）

**GET /api/v1/sync/status**

响应：
```json
{
  "success": true,
  "data": {
    "lastSyncAt": "2026-04-02T10:05:00Z",
    "pendingChanges": 5
  }
}
```

---

## 3. 同步协议

### 3.1 增量同步规则

**客户端上传**：
- `entries`：仅包含 `updatedAt > lastSyncAt` 的条目
- `deletes`：仅包含 `deletedAt > lastSyncAt` 的删除操作

**服务端下发**：
- `entries`：仅包含 `updatedAt > client.lastSyncAt` 的条目
- `deletes`：仅包含 `deletedAt > client.lastSyncAt` 的删除操作

### 3.2 冲突检测与处理

**冲突定义**：
同一 `entryId` 满足以下所有条件：
1. 客户端有更新（`client.updatedAt > lastSyncAt`）
2. 服务端有更新（`server.updatedAt > lastSyncAt`）
3. 内容不同（通过 `updatedAt` 或 `contentHash` 判断）

**自动解决**（默认）：
```
if (|client.updatedAt - server.updatedAt| < 5分钟) {
  // 时间接近，标记为冲突，需手动解决
  return { needManualResolution: true };
} else {
  // 时间戳优先
  return client.updatedAt > server.updatedAt ? 'client' : 'server';
}
```

### 3.3 删除同步

**删除 vs 更新冲突**：
```
if (entry.deletedAt && entry.updatedAt) {
  return deletedAt > updatedAt ? 'delete' : 'keep';
}
```

---

## 4. 客户端流程

### 4.1 正常同步流程

```
1. 检查网络和认证状态
2. 收集待同步数据：
   - pendingEntryIds 对应的条目
   - pendingDeletes 中的删除操作
3. 发送 POST /sync
4. 处理响应：
   a. 应用下载的条目（合并到本地）
   b. 应用删除操作（删除本地条目）
   c. 保存冲突列表（如有）
   d. 清理已同步的 pending 数据
5. 更新 lastSyncAt
6. 如有冲突，提示用户
```

### 4.2 冲突处理流程

```
1. 用户查看冲突列表
2. 选择解决方案：
   - 保留本地版本
   - 保留服务端版本
   - 手动合并
3. 调用 POST /sync/conflicts/:id/resolve
4. 重新触发同步
```

### 4.3 本地数据变更追踪

```typescript
// 保存/更新条目时
function saveEntry(entry) {
  // ... 保存到本地
  syncState.pendingEntryIds.push(entry.id);
  saveSyncState();
}

// 删除条目时
function deleteEntry(id) {
  // ... 从本地删除
  syncState.pendingDeletes.push({
    id,
    deletedAt: new Date().toISOString()
  });
  saveSyncState();
}
```

---

## 5. 实现要点

### 5.1 服务端

1. **幂等性**：同一 `entry.id` 多次上传不会重复
2. **并发控制**：同一设备同时只能有一个同步请求
3. **时间戳**：使用服务端时间作为 `serverTime`
4. **软删除**：删除操作写入 `deletedAt`，不物理删除
5. **冲突记录**：保存冲突的双方版本，供用户查看

### 5.2 客户端

1. **离线队列**：所有变更先写入本地，标记为 pending
2. **指数退避**：同步失败后延迟重试（1s, 2s, 4s...）
3. **网络监听**：online 事件触发同步
4. **定时同步**：可配置间隔（默认 30 分钟）
5. **进度展示**：同步过程中显示进度条

---

## 6. 数据迁移

如果现有数据没有 `deletedAt` 字段：

```sql
-- 添加 deletedAt 字段
ALTER TABLE mood_entries ADD COLUMN deleted_at TIMESTAMP;

-- 已删除的记录可以保留在历史表中或定期清理
CREATE INDEX idx_deleted_at ON mood_entries(deleted_at) 
WHERE deleted_at IS NOT NULL;
```

---

## 7. 监控与日志

### 关键指标

- 同步成功率
- 平均同步时间
- 冲突发生率
- 待同步数据量

### 日志示例

```json
{
  "event": "sync_completed",
  "userId": "user_123",
  "deviceId": "device_456",
  "uploaded": 5,
  "downloaded": 3,
  "conflicts": 1,
  "duration": 234,
  "timestamp": "2026-04-02T10:05:00Z"
}
```

---

## 8. 扩展考虑

### 未来可扩展

1. **批量同步**：大量数据时分页同步
2. **差异同步**：基于 contentHash 仅同步变更字段
3. **版本历史**：保留条目的修改历史
4. **协作编辑**：支持多用户共享编辑（需重新设计）

### 安全考虑

1. **传输加密**：HTTPS
2. **数据加密**：敏感字段（journal）可端到端加密
3. **权限验证**：每个请求验证用户身份和设备归属
