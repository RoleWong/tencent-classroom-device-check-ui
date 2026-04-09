<template>
    <aside class="dc-sidebar">
        <div class="dc-sidebar-notice">{{ $t('workflow.notice') }}</div>
        <nav class="dc-sidebar__nav">
            <div
                class="dc-sidebar-progress-bar-bottom"
            />
            <div
                class="dc-sidebar-progress-bar"
                :style="progressBarStyle"
            />
            <ul class="dc-step-list">
                <li
                    v-for="(step, index) in steps"
                    :key="step.key"
                    class="dc-step-item"
                    :class="{
                            'is-active': index === currentStepIndex,
                            'is-completed': stepStates[index] && isStepCompleted(stepStates[index].status),
                            'is-error': stepStates[index] && stepStates[index].status === 'error'
                        }"
                >
                        <span class="dc-step-item__indicator">
                            <i
                                v-if="stepStates[index] && stepStates[index].status === 'success'"
                                class="el-icon-check"
                            />
                            <i
                                v-else-if="stepStates[index] && stepStates[index].status === 'error'"
                                class="el-icon-close"
                            />
                            <i
                                v-else-if="stepStates[index] && stepStates[index].status === 'warning'"
                                class="el-icon-warning"
                            />
                            <span v-else>
                                <i :class="step.icon || 'el-icon-setting'" />
                            </span>
                        </span>
                    <span class="dc-step-item__content">
                            <span class="dc-step-item__name">{{ $t(step.name) }}</span>
                    </span>
                </li>
            </ul>
        </nav>
    </aside>
</template>

<script>
import { CHECK_STATUS } from "../logic/utils";

export default {
    name: 'WorkflowHeader',

    props: {
        /**
         * 步骤配置列表
         */
        steps: {
            type: Array,
            required: true
        },
        /**
         * 当前步骤索引（由 WorkflowManager 管理）
         */
        currentStepIndex: {
            type: Number,
            required: true
        },
        /**
         * 步骤状态列表（由 WorkflowManager 管理）
         */
        stepStates: {
            type: Array,
            required: true
        },
    },

    computed: {
        progressBarStyle() {
            const totalSteps = this.steps.length - 1;
            if (totalSteps === 0) return { width: '0%' };

            const stepWidth = 100 / totalSteps;
            const progressWidth = 1 + this.currentStepIndex * stepWidth;

            return {
                width: `${Math.min(progressWidth, 100)}%`
            };
        }
    },

    methods: {
        isStepCompleted(status) {
            return [
                CHECK_STATUS.SUCCESS,
                CHECK_STATUS.WARNING,
                CHECK_STATUS.ERROR,
                CHECK_STATUS.SKIPPED
            ].includes(status);
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-sidebar {
    width: 100%;
    min-width: 100%;
    height: auto;
    border-right: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    box-sizing: border-box;
    padding: 0 24px;

    &-notice {
        padding: $dc-spacing-lg 0 $dc-spacing-md;
        font-size: $dc-font-size-sm;
        color: var(--dc-text-secondary);
        text-align: center;
    }

    &__nav {
        box-sizing: border-box;
        padding: 0;
        width: 100%;
        min-width: 100%;
        position: relative;
    }

    &__header {
        padding: $dc-spacing-lg;
        border-bottom: 1px solid var(--dc-border);
    }

    &__title {
        margin: 0;
        font-size: $dc-font-size-lg;
        font-weight: 600;
        color: var(--dc-text-primary);
    }
}

.dc-sidebar-progress-bar-bottom {
    position: absolute;
    height: 4px;
    width: 100%;
    background-color: var(--dc-progress-bg, #e5e6eb);
    top: 32px;
    z-index: 0;
    border-radius: 2px;
}

.dc-sidebar-progress-bar {
    position: absolute;
    transition: width 0.4s ease-in-out;
    height: 4px;
    background-color: var(--dc-primary);
    top: 32px;
    z-index: 1;
    border-radius: 2px;
}

.dc-step-list {
    display: flex;
    overflow-x: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    justify-content: space-between;
    z-index: 2;
    position: relative;
}

.dc-step-item {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: background-color $dc-transition-fast;
    cursor: default;

    .dc-step-item__name {
        font-weight: 400;
    }

    &.is-active {
        .dc-step-item__indicator {
            background-color: var(--dc-primary);
            border-color: var(--dc-primary);
            color: #fff;
        }

        .dc-step-item__name {
            color: var(--dc-primary);
            font-weight: 500;
        }
    }

    &.is-completed {
        .dc-step-item__indicator {
            background-color: var(--dc-success-secondary);
            border-color: var(--dc-success);
            color: var(--dc-success);
        }
        .dc-step-item__name {
            color: var(--dc-success);
        }
    }

    &.is-error {
        .dc-step-item__indicator {
            background-color: var(--dc-error-secondary);
            border-color: var(--dc-error);
            color: var(--dc-error);
        }
        .dc-step-item__name {
            color: var(--dc-error);
        }
    }

    &__indicator {
        margin-bottom: $dc-spacing-sm;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--dc-bg);
        border: 2px solid var(--dc-border);
        color: var(--dc-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 400;
        transition: all $dc-transition-fast;

        i {
            font-size: 16px;
            font-weight: bold;
        }
    }

    &__content {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    &__name {
        font-size: $dc-font-size-sm;
        color: var(--dc-text-secondary);
        line-height: 1.4;
        transition: color $dc-transition-fast;
        text-align: center;
    }

    &__desc {
        font-size: $dc-font-size-xs;
        color: var(--dc-text-secondary);
        margin-top: 2px;
        line-height: 1.4;
    }
}
</style>
