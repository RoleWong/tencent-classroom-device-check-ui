# @tencent-classroom/device-check-ui

**中文** | [English](#english)

腾讯云实时互动-教育版设备检测 UI 组件库。提供开箱即用的完整设备检测界面，支持扬声器、麦克风、摄像头、网络质量的逐步引导检测，并在检测完成后通过回调返回结果。

## 功能特性

- 🎤 **麦克风检测** — 音量可视化、录音回放验证
- 🔊 **扬声器检测** — 播放测试音频、用户确认
- 📷 **摄像头检测** — 实时画面预览
- 🌐 **网络检测** — 多项并行检测，实时进度展示
- 📋 **检测报告** — 汇总所有检测结果，支持重新检测
- 🌍 **国际化** — 支持中文/英文，可自动检测浏览器语言
- 🎨 **主题** — 支持 `light` / `dark` 双主题
- 📱 **多端适配** — Web、Electron、移动端 WebView

## 安装

```bash
npm install @tencent-classroom/device-check-ui
# 或
pnpm add @tencent-classroom/device-check-ui
```

### Peer Dependencies

```bash
npm install vue@^2.6.14 element-ui@^2.15.14 i18next@^25.8.0
```

---

## 使用方式

### 1. NPM 包集成（推荐）

适合将设备检测嵌入到已有项目中。

**HTML 准备**

在页面中准备一个容器节点：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <!-- SDK 将挂载到此节点 -->
    <div id="device-check-container" style="width: 100%; height: 100vh;"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

**基础用法**

```typescript
import TCICDeviceCheck from '@tencent-classroom/device-check-ui';
// 必须引入样式
import '@tencent-classroom/device-check-ui/style.css';

const checker = new TCICDeviceCheck({
  container: '#device-check-container',  // CSS 选择器或 DOM 元素
  stepList: '1111',                       // 启用全部 4 项检测
  theme: 'light',                         // 'light' | 'dark'
  language: 'auto',                       // 'auto' | 'zh' | 'en'
  onResult: (result) => {
    console.log('检测完成:', result);
    // result.speakerId      — 通过检测的扬声器设备 ID
    // result.microphoneId   — 通过检测的麦克风设备 ID
    // result.cameraId       — 通过检测的摄像头设备 ID
    // result.classCdnUsedBackup        — 是否使用了备用 CDN 域名
    // result.classApiUsedBackup        — 是否使用了备用课堂接口域名
    // result.whiteboardResUsedBackup   — 是否使用了备用白板资源域名
    // result.whiteboardApiUsedBackup   — 是否使用了备用白板接口域名
  },
  onError: (error) => {
    console.error('检测出错:', error);
  }
});

// 挂载到 DOM（异步）
await checker.mount();
```

**传入 DOM 元素**

除了 CSS 选择器，也可以直接传入 DOM 元素：

```typescript
const container = document.getElementById('device-check-container');

const checker = new TCICDeviceCheck({
  container,   // 直接传入 HTMLElement
  stepList: '1111',
  onResult: (result) => console.log(result)
});

await checker.mount();
```

---

### 2. Iframe 集成

将设备检测页面嵌入到 Iframe 中，通过 `postMessage` 接收结果。

**父页面**

```html
<iframe
  id="device-check-frame"
  src="https://your-domain.com/device-check?list=1111&theme=light&language=zh"
  style="width: 100%; height: 100vh; border: none;"
></iframe>

<script>
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TIC_DEVICE_CHECK_RESULT') {
    const result = event.data.payload;
    console.log('检测结果:', result);
    // result.speakerId / microphoneId / cameraId / classCdnUsedBackup ...
  }

  if (event.data?.type === 'TIC_DEVICE_CHECK_ERROR') {
    console.error('检测错误:', event.data.payload.message);
  }
});
</script>
```

**URL 参数说明**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `list` | `string` | `1111` | 步骤位掩码（见下方说明） |
| `theme` | `light \| dark` | `light` | 主题 |
| `language` | `auto \| zh \| en` | `auto` | 语言 |
| `debug` | `boolean` | `false` | 开启调试模式 |

---

### 3. LocalStorage 读取结果

设备检测完成后，结果会自动写入 `localStorage`，同域页面可直接读取：

如果您部署的设备检测页面, 和课堂页面同域, 课堂会自动应用设备检测选优的结果.

```typescript
const raw = localStorage.getItem('tic_last_check_result');
if (raw) {
  const result = JSON.parse(raw);
  // result.speakerId / microphoneId / cameraId
  // result.classCdnUsedBackup / classApiUsedBackup ...
  // result.timestamp — 检测完成时间戳
  // result.version   — SDK 版本
}
```

---

## 配置项说明

### TCICDeviceCheckOptions

```typescript
interface TCICDeviceCheckOptions {
  /** 挂载容器，CSS 选择器或 DOM 元素，默认 '#app' */
  container?: string | HTMLElement;

  /**
   * 检测步骤位掩码，4 位字符串，每位对应一个检测项
   * 位置顺序：扬声器 | 麦克风 | 摄像头 | 网络
   * '1' 表示启用，'0' 表示跳过
   * 默认 '1111'（全部启用）
   *
   * 示例：
   *   '1111' — 全部检测
   *   '1100' — 仅检测扬声器和麦克风
   *   '0001' — 仅检测网络
   *   '0000' — 跳过所有检测，直接显示报告页
   */
  stepList?: string;

  /** 主题，'light'（默认）或 'dark' */
  theme?: 'light' | 'dark';

  /**
   * 语言配置
   * 'auto' — 自动检测浏览器语言（默认）
   * 'zh'   — 强制中文
   * 'en'   — 强制英文
   */
  language?: 'auto' | 'zh' | 'en';

  /** 检测完成回调，接收最终检测结果 */
  onResult?: (result: FinalResult) => void;

  /**
   * 步骤变化回调
   * @param index 当前步骤索引（从 0 开始）
   * @param state 当前步骤状态对象
   */
  onStepChange?: (index: number, state: StepState) => void;

  /** 错误回调 */
  onError?: (error: Error) => void;
}
```

### FinalResult（检测结果）

```typescript
interface FinalResult {
  // 通过检测的设备 ID（用于进入课堂时预设设备）
  speakerId?: string;       // 扬声器设备 ID
  microphoneId?: string;    // 麦克风设备 ID
  cameraId?: string;        // 摄像头设备 ID

  // 域名偏好设置（用于课堂主项目选择最优域名）
  classCdnUsedBackup?: boolean;        // 是否使用备用 CDN 域名
  classApiUsedBackup?: boolean;        // 是否使用备用课堂接口域名
  whiteboardResUsedBackup?: boolean;   // 是否使用备用白板资源域名
  whiteboardApiUsedBackup?: boolean;   // 是否使用备用白板接口域名
}
```

---

## 回调与事件监听

### onResult — 检测完成

所有步骤完成后触发，返回最终检测结果：

```typescript
const checker = new TCICDeviceCheck({
  container: '#app',
  stepList: '1111',
  onResult: (result) => {
    // 将设备 ID 传递给课堂主项目
    enterClassroom({
      speakerId: result.speakerId,
      microphoneId: result.microphoneId,
      cameraId: result.cameraId,
      // 域名偏好
      classCdnUsedBackup: result.classCdnUsedBackup,
      classApiUsedBackup: result.classApiUsedBackup
    });
  }
});
```

### onStepChange — 步骤变化

每次切换检测步骤时触发：

```typescript
const checker = new TCICDeviceCheck({
  container: '#app',
  onStepChange: (index, state) => {
    console.log(`当前步骤: ${index}`);
    console.log(`步骤名称: ${state.name}`);
    console.log(`步骤状态: ${state.status}`);
    // state.status: 'pending' | 'running' | 'success' | 'warning' | 'error' | 'skipped'
  }
});
```

### onError — 错误处理

初始化或检测过程中发生错误时触发：

```typescript
const checker = new TCICDeviceCheck({
  container: '#app',
  onError: (error) => {
    console.error('错误信息:', error.message);
    // 可以在此处上报错误日志
    reportError(error);
  }
});
```

---

## 实例方法

```typescript
// 挂载到 DOM（必须调用）
await checker.mount();

// 销毁实例，释放所有资源
checker.destroy();

// 检查是否初始化完成
const ready = checker.isInitialized();  // boolean

// 检查是否初始化失败
const failed = checker.hasInitError();  // boolean

// 获取初始化错误信息
const errMsg = checker.getInitErrorMessage();  // string

// 获取当前检测结果（包含摘要和详情）
const result = checker.getResult();
// result.summary    — 摘要（总数、成功数、警告数、错误数、耗时）
// result.details    — 各步骤详细结果
// result.stepStates — 各步骤状态列表

// 导出完整日志（用于问题排查）
const logs = checker.getLogs();  // 格式化文本

// 获取底层 SDK 实例（高级用法）
const sdk = checker.getSDK();
```

---

## 完整示例

### Vue 2 项目集成

```typescript
// DeviceCheck.vue
<template>
  <div ref="container" class="device-check-wrapper"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref } from 'vue';
import TCICDeviceCheck, { FinalResult } from '@tencent-classroom/device-check-ui';
import '@tencent-classroom/device-check-ui/style.css';

export default defineComponent({
  name: 'DeviceCheck',
  emits: ['result', 'error'],
  setup(_, { emit }) {
    const container = ref<HTMLElement | null>(null);
    let checker: TCICDeviceCheck | null = null;

    onMounted(async () => {
      if (!container.value) return;

      checker = new TCICDeviceCheck({
        container: container.value,
        stepList: '1111',
        theme: 'light',
        language: 'auto',
        onResult: (result: FinalResult) => emit('result', result),
        onError: (error: Error) => emit('error', error)
      });

      await checker.mount();
    });

    onBeforeUnmount(() => {
      checker?.destroy();
    });

    return { container };
  }
});
</script>

<style scoped>
.device-check-wrapper {
  width: 100%;
  height: 100vh;
}
</style>
```

### React 项目集成

```tsx
import { useEffect, useRef } from 'react';
import TCICDeviceCheck, { FinalResult } from '@tencent-classroom/device-check-ui';
import '@tencent-classroom/device-check-ui/style.css';

function DeviceCheckPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkerRef = useRef<TCICDeviceCheck | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const checker = new TCICDeviceCheck({
      container: containerRef.current,
      stepList: '1111',
      theme: 'light',
      language: 'auto',
      onResult: (result: FinalResult) => {
        console.log('检测完成:', result);
      },
      onError: (error: Error) => {
        console.error('检测出错:', error);
      }
    });

    checker.mount();
    checkerRef.current = checker;

    return () => {
      checkerRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

### 原生 HTML 集成

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>设备检测</title>
  <link rel="stylesheet" href="./node_modules/@tencent-classroom/device-check-ui/dist/style.css" />
</head>
<body>
  <div id="app" style="width: 100%; height: 100vh;"></div>

  <script type="module">
    import TCICDeviceCheck from '@tencent-classroom/device-check-ui';

    const checker = new TCICDeviceCheck({
      container: '#app',
      stepList: '1111',
      theme: 'light',
      language: 'auto',
      onResult: (result) => {
        console.log('检测完成:', result);
        // 跳转到课堂主页
        window.location.href = `/classroom?speakerId=${result.speakerId || ''}`;
      }
    });

    checker.mount();
  </script>
</body>
</html>
```

---

## 二次开发指南

### 环境准备

```bash
# 克隆仓库
git clone <repo-url>
cd tic-device-check-monorepo

# 安装依赖（使用 pnpm）
pnpm install

# 启动 UI 包开发服务器（含热重载）
pnpm --filter @tencent-classroom/device-check-ui dev

# 或在 monorepo 根目录启动所有包
pnpm dev
```

### 项目结构

```
packages/ui/
├── src/
│   ├── index.ts                  # 主入口，导出 TCICDeviceCheck 类
│   ├── types/
│   │   └── index.ts              # 类型定义（TCICDeviceCheckOptions、FinalResult 等）
│   ├── logic/
│   │   ├── WorkflowManager.ts    # 检测流程状态机（步骤流转、事件系统）
│   │   ├── I18nController.ts     # 国际化控制器
│   │   └── utils.ts              # 步骤配置（STEP_CONFIG、parseStepList）
│   ├── views/
│   │   ├── MainContainer.vue     # 主容器（步骤导航 + 内容区域）
│   │   ├── SpeakerCheck.vue      # 扬声器检测页
│   │   ├── MicCheck.vue          # 麦克风检测页
│   │   ├── CameraCheck.vue       # 摄像头检测页
│   │   ├── NetworkCheck.vue      # 网络检测页
│   │   └── ReportView.vue        # 检测报告页
│   ├── components/               # 公共组件
│   └── styles/
│       └── index.scss            # 全局样式（命名空间 .tic-dc-sdk）
├── package.json
└── vite.config.js
```

### 新增检测步骤

**1. 在 `utils.ts` 中注册步骤**

```typescript
// packages/ui/src/logic/utils.ts
export const STEP_CONFIG: StepConfig[] = [
  // ... 现有步骤
  {
    key: 'my-custom-step',
    name: 'step.myCustom.name',       // i18n key
    icon: 'el-icon-setting',
    description: 'step.myCustom.description'
  }
];
```

**2. 创建检测页面组件**

```vue
<!-- packages/ui/src/views/MyCustomCheck.vue -->
<template>
  <div class="my-custom-check">
    <h2>{{ $t('step.myCustom.name') }}</h2>
    <!-- 检测 UI -->
    <el-button @click="startCheck">开始检测</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { WorkflowManager } from '../logic/WorkflowManager';
import { CHECK_STATUS } from '../logic/utils';

export default defineComponent({
  name: 'MyCustomCheck',
  setup() {
    const workflowManager = inject<WorkflowManager>('workflowManager');

    async function startCheck() {
      workflowManager?.startCurrentStep();

      try {
        // 执行检测逻辑...
        const passed = await doMyCheck();

        workflowManager?.completeCurrentStep(
          passed ? CHECK_STATUS.SUCCESS : CHECK_STATUS.WARNING,
          { myResult: passed }
        );
      } catch (error) {
        workflowManager?.completeCurrentStep(CHECK_STATUS.ERROR, {
          error: (error as Error).message
        });
      }
    }

    return { startCheck };
  }
});
</script>
```

**3. 在 `MainContainer.vue` 中注册路由**

```vue
<!-- 在步骤渲染逻辑中添加新步骤 -->
<component
  :is="currentStepComponent"
  v-bind="stepProps"
/>

<!-- computed 中添加映射 -->
const STEP_COMPONENTS = {
  speaker: SpeakerCheck,
  microphone: MicCheck,
  camera: CameraCheck,
  network: NetworkCheck,
  'my-custom-step': MyCustomCheck,  // 新增
  report: ReportView
};
```

### 修改样式主题

所有样式都包裹在 `.tic-dc-sdk` 命名空间下，可以通过覆盖 CSS 变量来自定义主题：

```css
/* 覆盖亮色主题变量 */
.tic-dc-sdk[data-theme="light"] {
  --dc-primary: #your-brand-color;
  --dc-bg: #f0f0f0;
  --dc-text: #333333;
}

/* 覆盖暗色主题变量 */
.tic-dc-sdk[data-theme="dark"] {
  --dc-primary: #your-brand-color-dark;
  --dc-bg: #1a1a2e;
  --dc-text: #e0e0e0;
}
```

### 国际化扩展

在 `I18nController.ts` 中添加新的翻译词条：

```typescript
// 中文
zh: {
  'step.myCustom.name': '自定义检测',
  'step.myCustom.description': '自定义检测项说明'
}

// 英文
en: {
  'step.myCustom.name': 'Custom Check',
  'step.myCustom.description': 'Custom check description'
}
```

### 构建与发布

```bash
# 构建 UI 包
pnpm --filter @tencent-classroom/device-check-ui build

# 构建产物在 packages/ui/dist/
# - device-check-ui.mjs  (ESM)
# - device-check-ui.cjs  (CommonJS)
# - index.d.ts           (类型声明)
# - style.css            (样式文件)

# 发布到 npm（需要 2FA 或 Granular Access Token）
cd packages/ui
npm publish --access public
```

### 调试技巧

```typescript
// 开发环境下，通过 getSDK() 访问底层 SDK 进行调试
const sdk = checker.getSDK();

// 查看完整日志
console.log(checker.getLogs());

// 查看当前检测结果
console.log(checker.getResult());

// 访问底层设备管理器
const devices = sdk.device.getMicrophones();
console.log('可用麦克风:', devices);
```

---

## 环境要求

- Node.js >= 16.0.0
- pnpm >= 7.0.0（开发环境）
- 浏览器：Chrome 80+（需支持 WebRTC）
- 可选：Electron 环境、移动端 WebView

---

<a name="english"></a>

## English

Tencent Cloud Interactive Classroom Device Check UI component library. Provides a ready-to-use device detection interface with step-by-step guidance for speaker, microphone, camera, and network quality checks.

## Installation

```bash
npm install @tencent-classroom/device-check-ui
# or
pnpm add @tencent-classroom/device-check-ui
```

### Peer Dependencies

```bash
npm install vue@^2.6.14 element-ui@^2.15.14 i18next@^25.8.0
```

## Quick Start

```typescript
import TCICDeviceCheck from '@tencent-classroom/device-check-ui';
import '@tencent-classroom/device-check-ui/style.css';

const checker = new TCICDeviceCheck({
  container: '#app',
  stepList: '1111',    // Enable all 4 checks
  theme: 'light',      // 'light' | 'dark'
  language: 'auto',    // 'auto' | 'zh' | 'en'
  onResult: (result) => {
    console.log('Check complete:', result);
    // result.speakerId / microphoneId / cameraId
    // result.classCdnUsedBackup / classApiUsedBackup ...
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

await checker.mount();
```

## stepList Parameter

The `stepList` is a 4-character bitmask string. Each position corresponds to a check item:

| Position | Check Item | Example |
|----------|-----------|---------|
| 1st | Speaker | `1000` — speaker only |
| 2nd | Microphone | `0100` — mic only |
| 3rd | Camera | `0010` — camera only |
| 4th | Network | `0001` — network only |
| All | All checks | `1111` — all enabled |

## Callbacks

```typescript
const checker = new TCICDeviceCheck({
  container: '#app',

  // Called when all checks complete
  onResult: (result) => {
    // Use device IDs to pre-select devices in classroom
    enterClassroom({
      speakerId: result.speakerId,
      microphoneId: result.microphoneId,
      cameraId: result.cameraId
    });
  },

  // Called on each step change
  onStepChange: (index, state) => {
    console.log(`Step ${index}: ${state.name} — ${state.status}`);
  },

  // Called on error
  onError: (error) => {
    console.error(error.message);
  }
});
```

## Iframe Integration

```html
<iframe
  src="https://your-domain.com/device-check?list=1111&theme=light&language=en"
  style="width: 100%; height: 100vh; border: none;"
></iframe>

<script>
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TIC_DEVICE_CHECK_RESULT') {
    const result = event.data.payload;
    console.log('Result:', result);
  }
});
</script>
```

## Instance Methods

| Method | Return | Description |
|--------|--------|-------------|
| `mount()` | `Promise<void>` | Mount to DOM |
| `destroy()` | `void` | Destroy instance and release resources |
| `isInitialized()` | `boolean` | Check if initialization is complete |
| `hasInitError()` | `boolean` | Check if initialization failed |
| `getInitErrorMessage()` | `string` | Get initialization error message |
| `getResult()` | `object` | Get current check results with summary |
| `getLogs()` | `string` | Export full logs for debugging |
| `getSDK()` | `DeviceCheckSDK` | Get underlying SDK instance (advanced) |

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm --filter @tencent-classroom/device-check-ui dev

# Build
pnpm --filter @tencent-classroom/device-check-ui build
```

## Requirements

- Node.js >= 16.0.0
- Browser: Chrome 80+ (WebRTC required)
- Optional: Electron, Mobile WebView

## License

MIT
