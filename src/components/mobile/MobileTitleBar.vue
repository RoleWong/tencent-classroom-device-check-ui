<template>
    <!-- Mobile 环境下的自定义顶部栏 -->
    <div class="dc-mobile-title-bar" :class="{ 'is-dark': isDark }">
        <!-- 左侧区域：返回按钮 -->
        <div class="dc-mobile-title-bar__left" @click="handleBack">
            <svg class="dc-mobile-title-bar__back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>

        <!-- 中间区域：标题 -->
        <div class="dc-mobile-title-bar__center">
            <span class="dc-mobile-title-bar__title">{{ $t('electron.title') }}</span>
        </div>

        <!-- 右侧区域：占位，保持居中对齐 -->
        <div class="dc-mobile-title-bar__right"></div>

        <!-- 退出确认弹窗 -->
        <CommonDialog
            :visible="showDialog"
            :content="isOnReport() ? $t('mobile.exitConfirmLeave') : $t('mobile.exitConfirmAbort')"
            :confirm-text="$t('mobile.exitConfirm')"
            :cancel-text="$t('mobile.exitCancel')"
            :theme="theme"
            @confirm="confirmExit"
            @cancel="cancelExit"
        />
    </div>
</template>

<script>
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';
import CommonDialog from '../common/CommonDialog.vue';

export default {
    components: {
        CommonDialog
    },
    name: 'MobileTitleBar',

    inject: {
        // 从 DeviceDetect 或上层注入 workflowManager（可选）
        workflowManager: { default: null }
    },

    props: {
        /** 外部传入的 workflowManager（优先级高于 inject） */
        manager: {
            type: Object,
            default: null
        },
        /** 当前主题：light / dark */
        theme: {
            type: String,
            default: 'light'
        }
    },

    data() {
        return {
            showDialog: false
        };
    },

    computed: {
        /**
         * 获取实际使用的 workflowManager
         */
        _manager() {
            return this.manager || this.workflowManager;
        },

        /**
         * 是否为暗色主题
         */
        isDark() {
            return this.theme === 'dark';
        },
    },

    methods: {
        /**
         * 是否已在报告步骤
         */
        isOnReport() {
            if (!this._manager) return false;
            const currentStep = this._manager.getCurrentStep?.();
            return currentStep?.key === 'report';
        },
        /**
         * 点击返回按钮
         */
        handleBack() {
            this.showDialog = true;
        },

        /**
         * 取消退出
         */
        cancelExit() {
            this.showDialog = false;
        },

        /**
         * 确认退出，调用 webviewChannel 关闭 WebView
         */
        confirmExit() {
            this.showDialog = false;
            DeviceCheckSDK.current.close();
        }
    }
};
</script>

<style lang="scss" scoped>
$title-bar-height: 52px;

.dc-mobile-title-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    // 高度 = 安全区顶部间距 + 标题栏本身高度
    height: calc(#{$title-bar-height} + env(safe-area-inset-top, 0px));
    // 用 padding-top 把内容推到安全区下方
    padding-top: env(safe-area-inset-top, 0px);
    background-color: var(--dc-bg-secondary);
    border-bottom: 1px solid var(--dc-border);
    user-select: none;

    &__left,
    &__right {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 100%;
        flex-shrink: 0;
    }

    &__left {
        cursor: pointer;

        &:active {
            opacity: 0.6;
        }
    }

    &__back-icon {
        width: 22px;
        height: 22px;
        color: var(--dc-text-primary);
    }

    &__center {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    &__title {
        font-size: 16px;
        font-weight: 500;
        color: var(--dc-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

</style>
