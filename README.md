# final-mem

基于 FinalizationRegistry 的轻量级内存泄漏检测工具，支持 Vue/React/原生 JavaScript，自动追踪对象生命周期，检测并报告内存泄漏。

## 特性

- 🎯 **全局监听**：只需一次配置，自动追踪所有组件
- 📚 **堆栈捕获**：自动捕获对象创建时的调用堆栈
- 🔍 **GC 监听**：使用 FinalizationRegistry 监听对象回收
- 🔄 **存活巡检**：WeakRef + 定时轮询主动检测
- ⚠️ **泄漏告警**：结构化控制台输出
- 🎛️ **框架适配**：Vue/React/原生封装
- 🚀 **生产隔离**：自动检测生产环境并关闭，影响最小化

## 安装

### npm/yarn 安装

```bash
npm install final-mem
# 或
yarn add final-mem
```

### CDN 引用

```html
<!-- 引入 UMD 版本 -->
<script src="https://unpkg.com/final-mem@1.0.0/dist/index.umd.js"></script>

<!-- 自动全局可用 -->
<script>
  // 全局变量 FinalMem 已自动挂载到 window
  FinalMem.init({ enabled: true })
</script>
```

## 快速开始

### 原生 JavaScript

```javascript
import { install } from 'final-mem'

// 全局初始化，只需调用一次
install({
  enabled: true,        // 是否启用检测
  threshold: 5000,      // 泄漏判定阈值(毫秒)
  interval: 2000,       // 巡检间隔(毫秒)
  ignorePatterns: [     // 忽略的文件模式
    /node_modules/,
    /@vue/,
    /@react/
  ]
})

// 手动追踪特定对象（可选）
import { track, destroy } from 'final-mem'

const obj = { name: 'test' }
const id = track(obj, { type: 'object', name: 'TestObject' })
destroy(id)  // 标记对象已销毁
```

### Vue 项目（全局自动监听）

```javascript
// main.js
import { createApp } from 'vue'
import { MemGuardVuePlugin } from 'final-mem'
import App from './App.vue'

const app = createApp(App)

// 安装插件，自动追踪所有组件
app.use(MemGuardVuePlugin, {
  enabled: true,
  threshold: 5000,
  trackComponents: true  // 自动追踪所有组件
})

app.mount('#app')
```

### Vue 单个组件使用

```vue
<!-- MyComponent.vue -->
<template>
  <div>
    <!-- 组件内容 -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { track, destroy } from 'final-mem'

let trackId = ''

onMounted(() => {
  // 手动追踪当前组件实例
  trackId = track({ name: 'MyComponent' }, { 
    type: 'component', 
    name: 'MyComponent' 
  })
})

onUnmounted(() => {
  // 标记组件已销毁
  destroy(trackId)
})
</script>
```

### React 项目（全局自动监听）

```jsx
// index.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemGuardProvider } from 'final-mem'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <MemGuardProvider
    enabled={true}
    threshold={5000}
  >
    <App />
  </MemGuardProvider>
)
```

### React 单个组件使用

```jsx
// MyComponent.jsx
import { useEffect, useRef } from 'react'
import { track, destroy } from 'final-mem'

function MyComponent() {
  const componentRef = useRef(null)
  
  useEffect(() => {
    // 追踪组件实例
    const id = track(componentRef.current || {}, { 
      type: 'component', 
      name: 'MyComponent' 
    })
    
    return () => {
      // 标记组件已销毁
      destroy(id)
    }
  }, [])
  
  return <div ref={componentRef}>组件内容</div>
}

export default MyComponent
```

### 原生 JS 单个页面使用

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/final-mem@1.0.0/dist/index.umd.js"></script>
</head>
<body>
  <button id="createBtn">创建对象</button>
  <button id="destroyBtn">销毁对象</button>
  
  <script>
    // 初始化配置
    FinalMem.init({ enabled: true })
    
    let trackedObject = null
    let trackId = ''
    
    document.getElementById('createBtn').addEventListener('click', () => {
      // 创建并追踪对象
      trackedObject = { 
        name: 'MyObject', 
        data: 'some data' 
      }
      trackId = FinalMem.track(trackedObject, { 
        type: 'object', 
        name: 'MyObject' 
      })
      console.log('对象已创建并追踪:', trackId)
    })
    
    document.getElementById('destroyBtn').addEventListener('click', () => {
      // 标记对象已销毁
      FinalMem.destroy(trackId)
      trackedObject = null
      console.log('对象已标记销毁')
    })
  </script>
</body>
</html>
```

### 使用 Hook（React/Vue 通用）

```jsx
// React 示例
import { useReactMemGuard } from 'final-mem'

function MyComponent() {
  const myDataRef = useRef({ items: [] })
  
  // 自动追踪对象，组件卸载时自动标记销毁
  useReactMemGuard(myDataRef.current, { 
    type: 'object', 
    name: 'MyComponentData' 
  })
  
  return <div>组件内容</div>
}
```

## API 文档

### 核心 API

#### `install(options?)`

全局初始化，只需调用一次

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | 自动判断 | 是否启用检测（默认自动判断：开发环境 `true`，生产环境 `false`） |
| `threshold` | `number` | 5000 | 泄漏判定阈值（毫秒） |
| `interval` | `number` | 2000 | 巡检间隔（毫秒） |
| `ignorePatterns` | `RegExp[]` | [/node_modules/, /@vue/, /@react/, /react-dom/] | 忽略的文件模式 |
| `trackComponents` | `boolean` | true | 是否自动追踪组件 |

> ⚠️ **生产环境建议**：虽然工具会自动检测 `NODE_ENV === 'production'` 来判断环境，但不同框架的构建配置可能不一致。为了确保生产环境完全关闭，建议生产部署时显式设置 `enabled: false`，以避免任何潜在的性能影响。

#### `track(obj, options?)`

手动追踪一个对象

| 参数 | 类型 | 说明 |
|------|------|------|
| `obj` | `object` | 要追踪的对象 |
| `options.type` | `string` | 对象类型（如 'component', 'object'） |
| `options.name` | `string` | 对象名称 |

**返回值**：唯一追踪 ID（字符串）

#### `destroy(id)`

标记对象已销毁

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | track 返回的 ID |

#### `untrack(id)`

取消追踪对象

#### `clearAll()`

清除所有追踪记录

#### `getTrackedCount()`

获取当前追踪的对象数量

### 配置 API

#### `setConfig(config)`

动态配置检测参数

#### `getConfig()`

获取当前配置

#### `isEnabled()`

检查是否已启用

### Vue 适配层

#### `MemGuardVuePlugin`

Vue 插件，自动追踪所有组件

```javascript
app.use(MemGuardVuePlugin, {
  enabled: true,
  threshold: 5000,
  trackComponents: true
})
```

#### `useVueMemGuard()`

组合式 API，用于手动追踪

#### `createMemGuardDirective()`

创建自定义指令

### React 适配层

#### `MemGuardProvider`

React Provider 组件，自动追踪所有组件

```jsx
<MemGuardProvider
  enabled={true}
  threshold={5000}
  trackComponents={true}
>
  <App />
</MemGuardProvider>
```

#### `useReactMemGuard(obj, options?)`

React Hook，用于手动追踪

#### `withMemGuard(Component, options?)`

高阶组件，用于手动包装组件

#### `useMemGuardContext()`

获取上下文 API

### 原生 JS

#### `memGuard`

便捷 API 对象

```javascript
import { memGuard } from 'final-mem'

memGuard.init({ enabled: true })
memGuard.track(obj)
memGuard.destroy(id)
```

## 告警输出格式

当检测到内存泄漏时，控制台会输出如下格式的警告：

```
[MEMGUARD 内存泄漏] 类型: component | 名称: MyComponent | 存活: 8200ms
文件: /path/to/file.ts | 行: 45
完整堆栈:
  1. at Object.render (file:///path/to/file.ts:45:10)
  2. at Component.mount (file:///path/to/component.ts:20:5)
```

## 工作原理

1. **全局初始化**：调用 install/init 初始化检测系统
2. **组件自动追踪**：通过框架钩子自动追踪所有组件实例
3. **捕获堆栈**：使用 `new Error().stack` 捕获调用堆栈
4. **解析堆栈**：提取文件路径、行号、调用栈信息
5. **创建 WeakRef**：使用 WeakRef 引用对象，不阻止 GC
6. **注册回调**：使用 FinalizationRegistry 监听对象回收
7. **定时巡检**：定期检查已标记销毁的对象是否仍存活
8. **判定泄漏**：超过阈值时间未回收则判定为泄漏并告警

## 边界规则

- ✅ 不阻塞 GC：全程使用 WeakRef/FinalizationRegistry
- ✅ 不抛错：所有逻辑包 try/catch
- ✅ 生产环境静默：自动检测 `NODE_ENV === 'production'` 判断环境并关闭检测
- ✅ 可忽略内置对象：支持 ignorePatterns 过滤
- ✅ 无内存泄漏：已回收对象自动从池子删除

## 生产环境部署

### 自动检测机制

工具会自动通过以下方式判断当前环境：

1. **Node.js 环境**：检测 `process.env.NODE_ENV === 'production'`
2. **浏览器环境**：检测 `import.meta.env.NODE_ENV` 或 `window.NODE_ENV`
3. **框架构建**：Vite、Webpack、Rollup 等构建工具通常会自动注入 `NODE_ENV`

当检测到生产环境时，工具会：
- 自动禁用所有检测功能
- 停止定时巡检
- 不执行任何堆栈捕获
- 最大程度减少性能影响

### 推荐的生产配置

生产环境有两种安全方式：**关闭检测** 或 **完全不初始化**（推荐）

#### 方式一：显式关闭检测

```javascript
// Vue 项目
app.use(MemGuardVuePlugin, {
  enabled: false,  // 生产环境显式关闭
  threshold: 5000,
  trackComponents: true
})

// React 项目
<MemGuardProvider
  enabled={false}  // 生产环境显式关闭
  threshold={5000}
>
  <App />
</MemGuardProvider>

// 原生 JS
install({
  enabled: false  // 生产环境显式关闭
})
```

#### 方式二：生产环境不初始化（推荐）

最安全的做法是生产环境完全不调用初始化方法：

```javascript
// 根据环境决定是否初始化
const isProduction = process.env.NODE_ENV === 'production'

// 仅在开发环境初始化
if (!isProduction) {
  install({
    threshold: 5000,
    ignorePatterns: [/node_modules/, /@vue/, /@react/]
  })
}

// Vue 项目
if (!isProduction) {
  app.use(MemGuardVuePlugin, {
    threshold: 5000,
    trackComponents: true
  })
}

// React 项目
if (!isProduction) {
  // 使用条件渲染
  root.render(
    <MemGuardProvider threshold={5000}>
      <App />
    </MemGuardProvider>
  )
} else {
  root.render(<App />)
}
```

### 安全设置示例

根据不同环境自动配置：

```javascript
const isProduction = process.env.NODE_ENV === 'production'

install({
  enabled: !isProduction,  // 开发环境启用，生产环境禁用
  threshold: 5000,
  ignorePatterns: [/node_modules/, /@vue/, /@react/]
})
```

## 浏览器兼容性

| 浏览器 | 版本要求 |
|--------|----------|
| Chrome | 84+ |
| Firefox | 79+ |
| Safari | 14.1+ |
| Edge | 84+ |

## 许可证

MIT License
