<template>
<div class="tic-dc-sdk" :class="[`theme-${currentTheme}`, { 'is-electron': isElectronEnv, 'is-mobile': isMobile }]">
        <!-- Electron 环境下的自定义顶部栏 -->
        <ElectronTitleBar v-if="isElectronEnv" />

        <!-- Mobile 环境下的自定义顶部栏 -->
        <MobileTitleBar v-if="isMobile" :manager="workflowManager" :theme="currentTheme" />

        <!-- 右上角控制面板 -->
        <!-- <div class="tic-dc-sdk-controls">
            <ControlPanel
                :theme="currentTheme"
                @theme-change="handleThemeChange"
                @language-change="handleLanguageChange"
            />
        </div> -->

        <div class="tic-dc-sdk-container">
            <InitError
                v-if="initError"
                :error-message="initErrorMessage"
                @retry="handleRetry"
            />
            <InitLoading v-else-if="!initialized" />
            <DeviceDetect
                v-else
                :steps="steps"
                :workflow-manager="workflowManager"
                :log-collector="logCollector"
                @finish="handleFinish"
            />
        </div>
    </div>
</template>

<script>
import ElectronTitleBar from '../components/electron/ElectronTitleBar.vue';
import MobileTitleBar from "../components/mobile/MobileTitleBar.vue";
import { DeviceCheckSDK, isMobile } from '@tencent-classroom/device-check-sdk';
import DeviceDetect from './DeviceDetect.vue';
import InitError from './InitError.vue';
import InitLoading from './InitLoading.vue';

export default {
    name: 'MainContainer',

    components: {
        MobileTitleBar,
        DeviceDetect,
        InitLoading,
        InitError,
        ElectronTitleBar
    },

    props: {
        /**
         * 检测步骤配置数组
         */
        steps: {
            type: Array,
            required: true
        },
        /**
         * 主题：light/dark
         */
        theme: {
            type: String,
            default: 'light'
        },
        /**
         * 工作流管理器实例
         */
        workflowManager: {
            type: Object,
            required: true
        },
        /**
         * 日志收集器实例
         */
        logCollector: {
            type: Object,
            required: true
        },
        /**
         * 是否已完成异步初始化
         */
        initialized: {
            type: Boolean,
            default: false
        },
        /**
         * 是否初始化失败
         */
        initError: {
            type: Boolean,
            default: false
        },
        /**
         * 初始化错误信息
         */
        initErrorMessage: {
            type: String,
            default: ''
        }
    },

    data() {
        return {
            currentTheme: this.theme,
            isMobile: isMobile(),
            isElectronEnv: DeviceCheckSDK.current?.platform?.isElectron ?? false
        };
    },

    watch: {
        theme(newVal) {
            this.currentTheme = newVal;
        }
    },

    methods: {
        /**
         * 处理完成检测
         */
        handleFinish(result) {
            this.$emit('finish', result);
        },
        /**
         * 处理重试初始化
         */
        handleRetry() {
            this.$emit('retry');
        },
        /**
         * 处理主题变更
         */
        handleThemeChange(newTheme) {
            // 更新内部状态，实现动态主题切换
            this.currentTheme = newTheme;
            // 同时向上emit，让外部也能感知主题变化
            this.$emit('theme-change', newTheme);
        },
        /**
         * 处理语言变更
         */
        handleLanguageChange(newLanguage) {
            this.$emit('language-change', newLanguage);
        }
    }
};
</script>

<style lang="scss" scoped>
// Electron 顶部栏高度变量
$electron-title-bar-height: 32px;

$mobile-title-bar-height: 52px;

.tic-dc-sdk {
    position: relative;
    min-height: 100vh;
    width: 100%;

    // Electron 环境下为 fixed header 预留空间
    &.is-electron {
        padding-top: $electron-title-bar-height;
    }

    // 所有移动端统一处理：
    // 1. 为 fixed header 预留空间（标题栏高度 + 安全区顶部间距）
    // 2. 外层容器固定为视口尺寸，禁止页面级滚动
    // 3. 滚动由内部 .dc-main-container 的 overflow-y: auto 处理
    // 这样 iOS（WKWebView scroll=NO）和 Android 都使用同一套滚动机制
    &.is-mobile {
        padding-top: calc(#{$mobile-title-bar-height} + env(safe-area-inset-top, 0px));
        height: 100vh;
        min-height: 100vh;
        max-height: 100vh;
        overflow: hidden;

        .tic-dc-sdk-container {
            height: calc(100vh - #{$mobile-title-bar-height} - env(safe-area-inset-top, 0px));
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
    }
}

.tic-dc-sdk-container {
    width: 100%;
    max-width: 672px;
    margin: 0 auto;
}

.tic-dc-sdk-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

// Electron 环境下控制面板位置调整（fixed header + padding-top 后，absolute 基于 padding 内容区）
.is-electron {
    .tic-dc-sdk-controls {
        top: 52px; // 32px (title bar padding) + 20px
    }
}

// 响应式设计
@media (max-width: 768px) {
    .tic-dc-sdk-controls {
        top: 16px;
        right: 16px;
    }

    .is-electron {
        .tic-dc-sdk-controls {
            top: 48px;
        }
    }
}

@media (max-width: 480px) {
    .tic-dc-sdk-controls {
        top: 12px;
        right: 12px;
    }

    .is-electron {
        .tic-dc-sdk-controls {
            top: 44px;
        }
    }
}
</style>
