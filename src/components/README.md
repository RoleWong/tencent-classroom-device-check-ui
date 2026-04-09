# TCIC Device Check - Components

此目录包含 SDK 的原子级 UI 组件。

## 文件说明

### 基础设施

- `BaseStepMixin.js` - 步骤组件基础混入，提供公共的 props、methods 和常量
- `../styles/step-common.scss` - 步骤组件公共样式

### 步骤组件

- `steps/SpeakerCheck.vue` - 扬声器检测组件
- `StepPlaceholder.vue` - 步骤占位组件（开发中的临时组件）

### 通用组件

- `WorkflowHeader.vue` - 顶部步骤展示器组件
- `WelcomeScreen.vue` - 欢迎页面组件

## 开发新步骤组件

所有检测步骤组件应使用 `BaseStepMixin` 以保持一致性。

### 使用示例

```vue
<template>
    <div class="dc-step-panel dc-xxx-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('xxx.title') }}</h2>

        <!-- 提示信息 -->
        <div class="dc-step-hint">
            <span>{{ $t('xxx.hint') }}</span>
            <i class="el-icon-time dc-step-hint__icon" />
        </div>

        <!-- 内容区域 -->
        <div class="dc-step-content">
            <!-- 自定义内容 -->
        </div>

        <!-- 操作按钮 -->
        <div class="dc-step-actions">
            <el-button class="dc-step-btn dc-step-btn--secondary" @click="handleNo">
                否
            </el-button>
            <el-button class="dc-step-btn dc-step-btn--primary" @click="handleYes">
                是
            </el-button>
        </div>
    </div>
</template>

<script>
import { BaseStepMixin, DeviceTestResult, CHECK_STATUS } from './BaseStepMixin';

export default {
    name: 'XxxCheck',
    mixins: [BaseStepMixin],

    methods: {
        handleYes() {
            this.emitAction('点击是');
            this.markAsSuccess({ message: '检测通过' });
        },
        handleNo() {
            this.emitAction('点击否');
            this.markAsError({ message: '检测失败' });
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../styles/step-common.scss';

.dc-xxx-check {
    // 组件特有样式
}
</style>
```

### BaseStepMixin 提供的功能

#### Props（自动继承）

| Prop | 类型 | 说明 |
|------|------|------|
| step | Object | 当前步骤配置 |
| stepState | Object | 当前步骤状态 |
| logCollector | Object | 日志收集器实例 |

#### Computed

| 属性 | 类型 | 说明 |
|------|------|------|
| stepKey | string | 步骤标识符 |
| stepName | string | 步骤名称 |
| isRunning | boolean | 是否正在运行 |
| isCompleted | boolean | 是否已完成 |

#### Methods

| 方法 | 参数 | 说明 |
|------|------|------|
| emitComplete | (status, result) | 触发完成事件 |
| emitAction | (actionName, data) | 触发用户操作事件 |
| markAsRunning | () | 标记为运行中 |
| markAsSuccess | (result) | 标记为成功 |
| markAsError | (result) | 标记为失败 |
| markAsWarning | (result) | 标记为警告 |
| logInfo | (message, data) | 记录信息日志 |
| logWarn | (message, data) | 记录警告日志 |
| logError | (message, data) | 记录错误日志 |

#### 常量

- `CHECK_STATUS` - 检测状态枚举
- `DeviceTestResult` - 设备测试结果枚举（PASSED/FAILED/SKIPPED）

### 公共样式类

| 类名 | 说明 |
|------|------|
| `.dc-step-panel` | 步骤面板容器 |
| `.dc-step-title` | 步骤标题 |
| `.dc-step-hint` | 提示信息 |
| `.dc-step-content` | 内容区域 |
| `.dc-step-actions` | 按钮区域 |
| `.dc-step-btn` | 按钮基础样式 |
| `.dc-step-btn--primary` | 主要按钮 |
| `.dc-step-btn--secondary` | 次要按钮 |
| `.dc-step-form` | 表单布局 |
| `.dc-step-form__item` | 表单项 |
| `.dc-step-form__label` | 表单标签 |
| `.dc-volume-bar` | 音量条组件 |
| `.dc-device-select` | 设备选择器 |

## 待实现

- `MicrophoneCheck.vue` - 麦克风检测组件
- `CameraCheck.vue` - 摄像头检测组件
- `NetworkCheck.vue` - 网络检测组件
- `ReportView.vue` - 报告展示组件
