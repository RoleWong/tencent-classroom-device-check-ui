<template>
    <div class="control-panel-wrapper">
        <div class="controls-panel">
            <!-- 主题切换 -->
            <div class="control-item" @click="toggleTheme">
                <div class="control-icon">
                    <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="18" height="18">
                        <path d="M12 3V1M12 23V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="18" height="18">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="currentColor"/>
                    </svg>
                </div>
                <span class="control-label">{{ theme === 'light' ? '深色' : '浅色' }}</span>
            </div>

            <!-- 语言切换 -->
            <div class="control-item" @click="toggleLanguage">
                <div class="control-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
                    </svg>
                </div>
                <span class="control-label">{{ currentLanguage === 'zh' ? 'EN' : '中' }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { i18nController } from '../logic/I18nController';

export default {
    name: 'ControlPanel',

    props: {
        theme: {
            type: String,
            default: 'light'
        }
    },

    data() {
        return {
            currentLanguage: 'zh'
        };
    },

    async mounted() {
        // 获取当前语言
        this.currentLanguage = i18nController.getLanguage() || 'zh';
    },

    methods: {
        /**
         * 切换主题
         */
        toggleTheme() {
            const newTheme = this.theme === 'light' ? 'dark' : 'light';
            this.$emit('theme-change', newTheme);
        },
        /**
         * 切换语言
         */
        async toggleLanguage() {
            try {
                const newLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh';
                await i18nController.setLanguage(newLanguage);
                this.currentLanguage = newLanguage;
                this.$emit('language-change', newLanguage);
            } catch (error) {
                console.error('Failed to change language:', error);
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.control-panel-wrapper {
    .controls-panel {
        display: flex;
        gap: 8px;
        padding: 8px;
        background-color: var(--dc-bg-secondary);
        border: 1px solid var(--dc-border);
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;

        &:hover {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
    }

    .control-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: transparent;
        color: var(--dc-text-secondary);
        font-size: 13px;
        font-weight: 500;
        user-select: none;
        min-width: 60px;
        justify-content: center;

        &:hover {
            background-color: var(--dc-bg);
            color: var(--dc-text-primary);
            transform: translateY(-1px);
        }

        &:active {
            transform: translateY(0);
        }

        .control-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            flex-shrink: 0;

            svg {
                width: 100%;
                height: 100%;
                transition: all 0.2s ease;
            }
        }

        .control-label {
            font-weight: 500;
            white-space: nowrap;
        }
    }
}

@media (max-width: 768px) {
    .control-panel-wrapper {
        .controls-panel {
            padding: 6px;
            gap: 6px;
        }

        .control-item {
            padding: 6px 10px;
            font-size: 12px;
            min-width: 50px;

            .control-icon {
                width: 16px;
                height: 16px;
            }
        }
    }
}

@media (max-width: 480px) {
    .control-panel-wrapper {
        .control-item {
            .control-label {
                display: none;
            }
        }
    }
}



</style>
