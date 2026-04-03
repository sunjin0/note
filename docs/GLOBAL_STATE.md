# 全局状态管理

## 概述

使用 React Context API 实现的全局状态管理系统，实现一处修改，多处同步更新。

## 架构

```
GlobalProvider (全局状态提供者)
├── useGlobal() - 访问所有全局状态
├── useSync() - 同步状态管理
└── useAuth() - 用户认证状态管理
```

## 使用方法

### 1. 在组件中使用同步状态

```tsx
import { useSync } from '@/core/context';

function MyComponent() {
  const { 
    syncSettings,     // 同步设置
    syncState,        // 同步状态
    conflicts,        // 冲突列表
    enableSync,       // 启用同步
    disableSync,      // 禁用同步
    syncNow,          // 立即同步
    refreshState      // 刷新状态
  } = useSync();

  const handleSync = async () => {
    const result = await syncNow();
    if (result.success) {
      console.log('同步成功');
    }
  };

  return (
    <div>
      <p>同步状态: {syncState?.status}</p>
      <button onClick={handleSync}>立即同步</button>
    </div>
  );
}
```

### 2. 在组件中使用认证状态

```tsx
import { useAuth } from '@/core/context';

function MyComponent() {
  const { 
    user,           // 用户信息
    isLoggedIn,     // 是否已登录
    logout,         // 登出
    refreshState    // 刷新状态
  } = useAuth();

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <p>欢迎, {user?.username}</p>
          <button onClick={logout}>退出登录</button>
        </div>
      ) : (
        <p>请登录</p>
      )}
    </div>
  );
}
```

### 3. 访问所有全局状态

```tsx
import { useGlobal } from '@/core/context';

function MyComponent() {
  const {
    user,
    isLoggedIn,
    syncSettings,
    syncState,
    conflicts,
    refreshState,
    updateUser,
    updateSyncSettings,
    enableSync,
    disableSync,
    logout
  } = useGlobal();

  return <div>...</div>;
}
```

## 核心特性

### 自动同步更新

当任何组件调用状态更新函数时，所有使用该状态的组件会自动重新渲染：

```tsx
// 组件 A
const { enableSync } = useSync();
enableSync(); // 启用同步

// 组件 B (会自动更新)
const { syncSettings } = useSync();
console.log(syncSettings?.enabled); // true
```

### 定期状态刷新

全局状态每 3 秒自动从 localStorage 刷新一次，确保与本地存储保持同步。

### 网络状态监听

自动监听网络状态变化，在网络断开/恢复时更新状态。

## 迁移指南

### 从旧代码迁移

**旧代码（本地状态）：**
```tsx
const [syncState, setSyncState] = useState(null);

useEffect(() => {
  setSyncState(getSyncState());
}, []);
```

**新代码（全局状态）：**
```tsx
const { syncState } = useSync();
// 自动同步，无需 useEffect
```

## 最佳实践

1. **优先使用专用 hooks**：优先使用 `useSync()` 和 `useAuth()`，而不是 `useGlobal()`
2. **避免过度刷新**：只在必要时调用 `refreshState()`
3. **及时清理**：组件卸载时不需要手动清理，React Context 会自动处理

## 实现细节

### GlobalProvider

在 `src/modules/common/components/Providers.tsx` 中包裹整个应用：

```tsx
<GlobalProvider>
  <ThemeProvider>
    <I18nProvider>
      {children}
    </I18nProvider>
  </ThemeProvider>
</GlobalProvider>
```

### 状态持久化

所有状态仍然保存在 localStorage 中，全局状态只是内存中的缓存层，提供响应式更新能力。
