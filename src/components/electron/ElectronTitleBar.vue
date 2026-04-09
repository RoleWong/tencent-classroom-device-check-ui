<template>
    <!-- Electron 环境下的自定义顶部栏 -->
    <div class="dc-electron-title-bar" :class="{ 'dc-electron-title-bar--mac': isMacOS }">
        <!-- 左侧区域 -->
        <div class="dc-electron-title-bar__left">
            <!-- Mac 端：控制按钮在左侧 -->
            <MacControlBar v-if="isMacOS" />
        </div>

        <!-- 中间区域：标题 -->
        <div class="dc-electron-title-bar__center">
            <span class="dc-electron-title-bar__title">{{ $t('electron.title') }}</span>
        </div>

        <!-- 右侧区域 -->
        <div class="dc-electron-title-bar__right">
            <!-- Windows/Linux 端：控制按钮在右侧 -->
            <WindowControlBar v-if="!isMacOS" />
        </div>
    </div>
</template>

<script>
import WindowControlBar from './WindowControlBar.vue';
import MacControlBar from './MacControlBar.vue';
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';

export default {
    name: 'ElectronTitleBar',

    components: {
        WindowControlBar,
        MacControlBar
    },

    data() {
        return {
            isMacOS: DeviceCheckSDK.current?.platform?.isMac ?? false
        };
    }
};
</script>

<style lang="scss" scoped>
// 顶部栏高度
$title-bar-height: 32px;
$title-bar-height-mac: 28px;

.dc-electron-title-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: $title-bar-height;
    background-color: var(--dc-bg-secondary);
    border-bottom: 1px solid var(--dc-border);
    user-select: none;
    // 整个顶部栏可拖拽
    -webkit-app-region: drag;

    &__left,
    &__right {
        display: flex;
        align-items: center;
        height: 100%;
        min-width: 70px;
    }

    &__left {
        justify-content: flex-start;
    }

    &__right {
        justify-content: flex-end;
    }

    &__center {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    &__title {
        font-size: 13px;
        font-weight: 500;
        color: var(--dc-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    // Mac 样式调整
    &--mac {
        height: $title-bar-height-mac;

        .dc-electron-title-bar__title {
            font-size: 12px;
        }
    }
}
</style>
