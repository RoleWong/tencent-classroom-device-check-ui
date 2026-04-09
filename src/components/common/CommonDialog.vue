<template>
    <transition name="dc-dialog-fade">
        <div
            v-if="visible"
            class="dc-common-dialog-overlay"
            :class="{ 'is-dark': isDark }"
            @click.self="handleCancel"
        >
            <transition name="dc-dialog-zoom" appear>
                <div v-if="visible" class="dc-common-dialog">
                    <!-- 标题（可选） -->
                    <div v-if="title" class="dc-common-dialog__header">
                        {{ title }}
                    </div>

                    <!-- 内容区域 -->
                    <div class="dc-common-dialog__body">
                        <slot>{{ content }}</slot>
                    </div>

                    <!-- 底部按钮 -->
                    <div class="dc-common-dialog__footer">
                        <button
                            v-if="showCancel"
                            class="dc-common-dialog__btn dc-common-dialog__btn--cancel"
                            @click="handleCancel"
                        >
                            {{ cancelText }}
                        </button>
                        <button
                            class="dc-common-dialog__btn dc-common-dialog__btn--confirm"
                            @click="handleConfirm"
                        >
                            {{ confirmText }}
                        </button>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

<script>
export default {
    name: 'CommonDialog',

    props: {
        /** 是否显示弹窗 */
        visible: {
            type: Boolean,
            default: false
        },
        /** 弹窗标题（可选，不传则不显示标题栏） */
        title: {
            type: String,
            default: ''
        },
        /** 弹窗内容文本（也可通过默认 slot 传入自定义内容） */
        content: {
            type: String,
            default: ''
        },
        /** 确认按钮文案 */
        confirmText: {
            type: String,
            default: '确定'
        },
        /** 取消按钮文案 */
        cancelText: {
            type: String,
            default: '取消'
        },
        /** 是否显示取消按钮 */
        showCancel: {
            type: Boolean,
            default: true
        },
        /** 当前主题：light / dark */
        theme: {
            type: String,
            default: 'light'
        }
    },

    computed: {
        isDark() {
            return this.theme === 'dark';
        }
    },

    methods: {
        handleConfirm() {
            this.$emit('confirm');
            this.$emit('update:visible', false);
        },

        handleCancel() {
            this.$emit('cancel');
            this.$emit('update:visible', false);
        }
    }
};
</script>

<style lang="scss" scoped>
/* ==================== 遮罩层渐变动画 ==================== */
.dc-dialog-fade-enter-active,
.dc-dialog-fade-leave-active {
    transition: opacity 0.25s ease;
}

.dc-dialog-fade-enter-from,
.dc-dialog-fade-leave-to {
    opacity: 0;
}

/* ==================== 弹窗缩放 + 渐变动画 ==================== */
.dc-dialog-zoom-enter-active {
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dc-dialog-zoom-leave-active {
    transition: all 0.2s ease-in;
}

.dc-dialog-zoom-enter-from {
    opacity: 0;
    transform: scale(0.85);
}

.dc-dialog-zoom-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

/* ==================== 遮罩层 ==================== */
.dc-common-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;

    &.is-dark {
        background-color: rgba(0, 0, 0, 0.7);
    }
}

/* ==================== 弹窗主体 ==================== */
.dc-common-dialog {
    width: 280px;
    background-color: var(--dc-bg-secondary, #fff);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    .is-dark & {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    &__header {
        padding: 18px 20px 0;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--dc-text-primary);
    }

    &__body {
        padding: 24px 20px 20px;
        text-align: center;
        font-size: 15px;
        line-height: 1.5;
        color: var(--dc-text-primary);
    }

    /* 有标题时，body 的上间距缩小 */
    &__header + &__body {
        padding-top: 12px;
    }

    &__footer {
        display: flex;
        border-top: 1px solid var(--dc-border);
    }

    &__btn {
        flex: 1;
        height: 44px;
        border: none;
        background: none;
        font-size: 16px;
        cursor: pointer;
        outline: none;
        transition: opacity 0.2s;

        &:active {
            opacity: 0.6;
        }

        &--cancel {
            color: var(--dc-text-secondary);
            border-right: 1px solid var(--dc-border);
        }

        &--confirm {
            color: var(--dc-primary);
            font-weight: 500;
        }
    }
}
</style>
