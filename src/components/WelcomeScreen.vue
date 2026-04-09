<template>
    <div class="dc-welcome">
        <div class="dc-welcome__content">
            <!-- 图标 -->
            <div class="dc-welcome__icon">
                <i class="el-icon-monitor" />
            </div>
            <!-- 标题 -->
            <h1 class="dc-welcome__title">{{ $t('welcome.title') }}</h1>
            <!-- 说明文字 -->
            <p class="dc-welcome__desc">{{ $t('welcome.description') }}</p>
            <!-- 检测项列表 -->
            <ul class="dc-welcome__checklist">
                <li v-for="step in steps" :key="step.key" class="dc-welcome__checklist-item">
                    <i class="el-icon-check" />
                    <span>{{ $t(step.name) }}</span>
                </li>
            </ul>
            <!-- 开始按钮 -->
            <el-button
                type="primary"
                class="dc-welcome__btn"
                @click="handleStart"
            >
                {{ $t('welcome.startButton') }}
                <i class="el-icon-arrow-right" />
            </el-button>
            <!-- 提示信息 -->
            <p class="dc-welcome__hint">
                <i class="el-icon-info" />
                {{ $t('welcome.hint') }}
            </p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WelcomeScreen',

    props: {
        /**
         * 检测步骤配置数组
         */
        steps: {
            type: Array,
            required: true
        }
    },

    methods: {
        /**
         * 处理开始检测按钮点击
         */
        handleStart() {
            this.$emit('start');
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-welcome {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $dc-spacing-xl;

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        width: 100%;
        text-align: center;
    }

    &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: $dc-spacing-lg;
        font-size: 48px;
        color: var(--dc-primary);
    }

    &__title {
        margin: 0 0 $dc-spacing-md;
        font-size: 28px;
        font-weight: 600;
        color: var(--dc-text-primary);
    }

    &__desc {
        margin: 0 0 $dc-spacing-lg;
        font-size: $dc-font-size-md;
        color: var(--dc-text-secondary);
        line-height: 1.6;
    }

    &__checklist {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: $dc-spacing-sm $dc-spacing-lg;
        margin: 0 0 $dc-spacing-xl;
        padding: 0;
        list-style: none;
    }

    &__checklist-item {
        display: flex;
        align-items: center;
        gap: $dc-spacing-xs;
        padding: $dc-spacing-xs $dc-spacing-md;
        background-color: var(--dc-bg-secondary);
        border-radius: $dc-radius-sm;
        font-size: $dc-font-size-sm;
        color: var(--dc-text-primary);

        i {
            color: var(--dc-success, #67c23a);
            font-weight: bold;
        }
    }

    &__btn {
        min-width: 200px;
        height: 48px;
        font-size: $dc-font-size-md;
        border-radius: $dc-radius-md;
        margin-bottom: $dc-spacing-lg;
        background-color: var(--dc-primary);
        border-color: var(--dc-primary);
        color: #fff;

        &:hover,
        &:focus {
            background-color: var(--dc-primary);
            border-color: var(--dc-primary);
            opacity: 0.9;
        }

        i {
            margin-left: $dc-spacing-xs;
        }
    }

    &__hint {
        display: flex;
        align-items: center;
        gap: $dc-spacing-xs;
        margin: 0;
        font-size: $dc-font-size-xs;
        color: var(--dc-text-tertiary, #909399);

        i {
            font-size: 14px;
        }
    }
}
</style>
