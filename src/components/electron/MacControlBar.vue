<template>
    <!-- Mac 风格窗口控制栏：红黄绿三个圆形按钮 -->
    <div class="dc-mac-control-bar" @mouseenter="hovered = true" @mouseleave="hovered = false">
        <!-- 关闭按钮（红色） -->
        <button
            class="dc-mac-control-btn dc-mac-control-btn--close"
            :title="$t('electron.close')"
            @click="handleClose"
        >
            <svg v-show="hovered" class="dc-mac-control-icon" viewBox="0 0 10 10">
                <path stroke="currentColor" stroke-width="1.5" d="M2,2 L8,8 M8,2 L2,8" />
            </svg>
        </button>

        <!-- 最小化按钮（黄色） -->
        <button
            class="dc-mac-control-btn dc-mac-control-btn--minimize"
            :title="$t('electron.minimize')"
            @click="handleMinimize"
        >
            <svg v-show="hovered" class="dc-mac-control-icon" viewBox="0 0 10 10">
                <rect x="1" y="4.5" width="8" height="1.5" fill="currentColor" />
            </svg>
        </button>

        <!-- 最大化/还原按钮（绿色） -->
        <button
            class="dc-mac-control-btn dc-mac-control-btn--maximize"
            :title="isMaximized ? $t('electron.restore') : $t('electron.maximize')"
            @click="handleMaximize"
        >
            <!-- 还原图标（两个小三角） -->
            <svg v-if="isMaximized && hovered" class="dc-mac-control-icon" viewBox="0 0 10 10">
                <path fill="currentColor" d="M2,7 L5,4 L2,4 Z M8,3 L5,6 L8,6 Z" />
            </svg>
            <!-- 最大化图标（两个大三角） -->
            <svg v-else-if="hovered" class="dc-mac-control-icon" viewBox="0 0 10 10">
                <path fill="currentColor" d="M2,8 L2,2 L8,8 Z M8,2 L8,8 L2,2 Z" />
            </svg>
        </button>
    </div>
</template>

<script>
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';

export default {
    name: 'MacControlBar',

    data() {
        return {
            isMaximized: false,
            hovered: false
        };
    },

    methods: {
        handleClose() {
            DeviceCheckSDK.current.close();
        },

        handleMinimize() {
            DeviceCheckSDK.current.minimizeElectron();
        },

        handleMaximize() {
            DeviceCheckSDK.current.maximizeElectron();
            this.isMaximized = !this.isMaximized;
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-mac-control-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    padding: 0 8px;
    -webkit-app-region: no-drag;
}

.dc-mac-control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: opacity 0.15s ease;
    -webkit-app-region: no-drag;

    // 关闭按钮（红色）
    &--close {
        background: #ff5f56;
        color: #4d0000;

        &:hover {
            background: #ff4136;
        }

        &:active {
            background: #e6453c;
        }
    }

    // 最小化按钮（黄色）
    &--minimize {
        background: #ffbd2e;
        color: #995700;

        &:hover {
            background: #ffa500;
        }

        &:active {
            background: #e69500;
        }
    }

    // 最大化按钮（绿色）
    &--maximize {
        background: #27c93f;
        color: #006400;

        &:hover {
            background: #1db82f;
        }

        &:active {
            background: #18a528;
        }
    }
}

.dc-mac-control-icon {
    width: 8px;
    height: 8px;
}
</style>
