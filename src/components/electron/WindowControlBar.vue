<template>
    <!-- Windows 风格窗口控制栏：最小化、最大化/还原、关闭 -->
    <div class="dc-win-control-bar">
        <!-- 最小化按钮 -->
        <button
            class="dc-win-control-btn"
            :title="$t('electron.minimize')"
            @click="handleMinimize"
        >
            <svg class="dc-win-control-icon" viewBox="0 0 10 10">
                <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
            </svg>
        </button>

        <!-- 最大化/还原按钮 -->
        <button
            class="dc-win-control-btn"
            :title="isMaximized ? $t('electron.restore') : $t('electron.maximize')"
            @click="handleMaximize"
        >
            <!-- 还原图标 -->
            <svg v-if="isMaximized" class="dc-win-control-icon" viewBox="0 0 10 10">
                <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    d="M2,3 L2,8 L7,8 L7,3 Z M3,3 L3,1 L8,1 L8,6 L7,6"
                />
            </svg>
            <!-- 最大化图标 -->
            <svg v-else class="dc-win-control-icon" viewBox="0 0 10 10">
                <rect
                    x="1"
                    y="1"
                    width="8"
                    height="8"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                />
            </svg>
        </button>

        <!-- 关闭按钮 -->
        <button
            class="dc-win-control-btn dc-win-control-btn--close"
            :title="$t('electron.close')"
            @click="handleClose"
        >
            <svg class="dc-win-control-icon" viewBox="0 0 10 10">
                <path
                    stroke="currentColor"
                    stroke-width="1.2"
                    d="M1,1 L9,9 M9,1 L1,9"
                />
            </svg>
        </button>
    </div>
</template>

<script>
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';

export default {
    name: 'WindowControlBar',

    data() {
        return {
            isMaximized: false
        };
    },

    methods: {
        handleMinimize() {
            DeviceCheckSDK.current.minimizeElectron();
        },

        handleMaximize() {
            DeviceCheckSDK.current.maximizeElectron();
            this.isMaximized = !this.isMaximized;
        },

        handleClose() {
            DeviceCheckSDK.current.close();
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-win-control-bar {
    display: flex;
    height: 100%;
    -webkit-app-region: no-drag;
}

.dc-win-control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--dc-text-primary);
    cursor: pointer;
    transition: background-color 0.15s ease;
    -webkit-app-region: no-drag;

    &:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    &:active {
        background: rgba(0, 0, 0, 0.15);
    }

    // 关闭按钮特殊样式
    &--close {
        &:hover {
            background: #e81123;
            color: #fff;
        }

        &:active {
            background: #c41020;
            color: #fff;
        }
    }
}

.dc-win-control-icon {
    width: 10px;
    height: 10px;
}

// 暗色主题适配
.theme-dark {
    .dc-win-control-btn {
        &:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        &:active {
            background: rgba(255, 255, 255, 0.15);
        }

        &--close {
            &:hover {
                background: #e81123;
                color: #fff;
            }
        }
    }
}
</style>
