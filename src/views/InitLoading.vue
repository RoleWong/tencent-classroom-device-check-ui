<template>
    <div class="init-loading">
        <div class="init-loading__content">
            <div class="init-loading__spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
            <p class="init-loading__text">{{ $t('正在初始化...') }}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'InitLoading'
};
</script>

<style lang="scss" scoped>
.init-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    width: 100%;
    padding: 48px 24px;

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }

    &__spinner {
        position: relative;
        width: 64px;
        height: 64px;

        .spinner-ring {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;

            &:nth-child(1) {
                border-top-color: var(--dc-primary);
                animation-delay: 0s;
            }

            &:nth-child(2) {
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                border-right-color: var(--dc-primary-light);
                animation-delay: 0.15s;
                animation-direction: reverse;
            }

            &:nth-child(3) {
                width: 60%;
                height: 60%;
                top: 20%;
                left: 20%;
                border-bottom-color: var(--dc-primary);
                animation-delay: 0.3s;
            }
        }
    }

    &__text {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--dc-text-secondary);
        letter-spacing: 0.5px;
        animation: pulse 2s ease-in-out infinite;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>
