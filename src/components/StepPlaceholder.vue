<template>
    <div class="dc-step-placeholder">
        <div class="dc-step-placeholder__icon">
            <i :class="step.icon || 'el-icon-setting'" />
        </div>
        <h2 class="dc-step-placeholder__title">
            {{ $t(step.name) }}
        </h2>
        <p class="dc-step-placeholder__desc">
            {{ $t(step.description) }}
        </p>

        <div class="dc-step-placeholder__status">
            <template v-if="stepState.status === 'pending'">
                <el-button type="primary" @click="handleStart">{{ $t('placeholder.startCheck') }}</el-button>
            </template>
            <template v-else-if="stepState.status === 'running'">
                <i class="el-icon-loading" />
                <span>{{ $t('placeholder.checking') }}</span>
            </template>
            <template v-else-if="stepState.status === 'success'">
                <div class="dc-result dc-result--success">
                    <i class="el-icon-circle-check" />
                    <span>{{ $t('placeholder.checkPassed') }}</span>
                </div>
                <el-button size="small" @click="handleRetry">{{ $t('placeholder.recheckButton') }}</el-button>
            </template>
            <template v-else-if="stepState.status === 'error'">
                <div class="dc-result dc-result--error">
                    <i class="el-icon-circle-close" />
                    <span>{{ $t('placeholder.checkFailed') }}</span>
                </div>
                <el-button type="primary" size="small" @click="handleRetry">{{ $t('placeholder.retryButton') }}</el-button>
            </template>
        </div>

        <div class="dc-step-placeholder__hint">
            <p>{{ $t('placeholder.hint') }}</p>
            <p>
                Step Key:
                <code>{{ stepKey }}</code>
            </p>
        </div>
    </div>
</template>

<script>
import { BaseStepMixin, CHECK_STATUS } from './BaseStepMixin';

export default {
    name: 'StepPlaceholder',

    mixins: [BaseStepMixin],

    methods: {
        /**
         * 开始检测（模拟）
         */
        handleStart() {
            this.emitAction('点击开始检测');

            // 模拟检测过程
            this.markAsRunning();

            // 模拟检测完成
            setTimeout(() => {
                const isSuccess = Math.random() > 0.3;
                if (isSuccess) {
                    this.markAsSuccess({
                        message: '检测通过',
                        timestamp: Date.now()
                    });
                } else {
                    this.markAsError({
                        message: '检测失败（模拟）',
                        timestamp: Date.now()
                    });
                }
            }, 1500);
        },

        /**
         * 重新检测
         */
        handleRetry() {
            this.emitAction('点击重新检测');
            this.handleStart();
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-step-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $dc-spacing-xxl $dc-spacing-lg;
    text-align: center;
    min-height: 360px;

    &__icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: $dc-spacing-lg;

        i {
            font-size: 48px;
            color: var(--dc-primary);
        }
    }

    &__title {
        margin: 0 0 $dc-spacing-sm;
        font-size: 20px;
        font-weight: 500;
        color: var(--dc-text-primary);
    }

    &__desc {
        margin: 0 0 $dc-spacing-lg;
        font-size: $dc-font-size-sm;
        color: var(--dc-text-secondary);
    }

    &__status {
        display: flex;
        align-items: center;
        gap: $dc-spacing-md;
        margin-bottom: $dc-spacing-lg;

        .el-icon-loading {
            font-size: 20px;
            color: var(--dc-primary);
            animation: rotating 1s linear infinite;
        }

        // 优化按钮样式
        .el-button--primary {
            min-width: 120px;
            height: 40px;
            border-radius: 20px;
            font-size: $dc-font-size-sm;
        }
    }

    &__hint {
        margin-top: $dc-spacing-xl;
        padding: $dc-spacing-md $dc-spacing-lg;
        background-color: var(--dc-bg);
        border-radius: $dc-radius-md;
        font-size: $dc-font-size-xs;
        color: var(--dc-text-secondary);

        p {
            margin: $dc-spacing-xs 0;
        }

        code {
            background-color: rgba(0, 0, 0, 0.04);
            padding: 2px 8px;
            border-radius: $dc-radius-sm;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            color: var(--dc-text-primary);
        }
    }
}

.dc-result {
    display: flex;
    align-items: center;
    gap: $dc-spacing-sm;
    font-size: $dc-font-size-md;
    font-weight: 500;

    &--success {
        color: var(--dc-success);
    }

    &--error {
        color: var(--dc-error);
    }

    i {
        font-size: 24px;
    }
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
