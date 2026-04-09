<template>
  <div class="init-error">
    <div class="init-error__container">
      <!-- 错误图标 -->
      <div class="init-error__icon">
        <svg viewBox="0 0 24 24" width="64" height="64">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>

      <!-- 错误标题 -->
      <h2 class="init-error__title">{{ $t('init.error.title') }}</h2>

      <!-- 错误详情 -->
      <div class="init-error__details" v-if="errorMessage">
        <div class="init-error__details-content">
          <pre>{{ errorMessage }}</pre>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="init-error__actions">
        <button
          class="init-error__button init-error__button--primary"
          @click="handleRetry"
          :disabled="retrying"
        >
          <svg v-if="retrying" class="init-error__button-spinner" viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M12,2 A10,10 0 0,1 22,12" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ retrying ? $t('init.error.retrying') : $t('init.error.retry') }}
        </button>

        <button
          class="init-error__button init-error__button--secondary"
          @click="handleRefresh"
        >
          {{ $t('init.error.refresh') }}
        </button>
      </div>

      <!-- 帮助信息 -->
      <div class="init-error__help">
        <p>{{ $t('init.error.help') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InitError',
  props: {
    errorMessage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      showDetails: false,
      retrying: false
    };
  },
  methods: {
    async handleRetry() {
      this.retrying = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // 模拟延迟
        this.$emit('retry');
      } finally {
        this.retrying = false;
      }
    },

    handleRefresh() {
      window.location.reload();
    }
  }
};
</script>

<style lang="scss" scoped>
.init-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
  background-color: var(--dc-bg);
  color: var(--dc-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;

  &__container {
    text-align: center;
    max-width: 480px;
    width: 100%;
    padding: 40px;
    background-color: var(--dc-bg-secondary);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--dc-border);
  }

  &__icon {
    margin-bottom: 24px;

    svg {
      color: var(--dc-error);
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: var(--dc-text-primary);
  }

  &__description {
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 24px 0;
    color: var(--dc-text-secondary);
  }

  &__details {
    margin-bottom: 32px;
    text-align: left;

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      background-color: var(--dc-bg);
      border: 1px solid var(--dc-border);
      color: var(--dc-text-primary);

      &:hover {
        background-color: var(--dc-bg-secondary);
        border-color: var(--dc-primary);
      }
    }

    &-arrow {
      transition: transform 0.2s ease;
      color: var(--dc-text-secondary);

      &--expanded {
        transform: rotate(180deg);
      }
    }

    &-content {
      margin-top: 8px;
      padding: 16px;
      border-radius: 8px;
      font-size: 12px;
      background-color: var(--dc-bg);
      border: 1px solid var(--dc-border);
      color: var(--dc-text-primary);

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: var(--dc-text-secondary);
      }
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
  }

  &__button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--primary {
      background-color: var(--dc-primary);
      color: white;

      &:hover:not(:disabled) {
        background-color: var(--dc-primary-light);
      }
    }

    &--secondary {
      background-color: transparent;
      color: var(--dc-text-secondary);
      border: 1px solid var(--dc-border);

      &:hover:not(:disabled) {
        background-color: var(--dc-bg);
        color: var(--dc-text-primary);
        border-color: var(--dc-primary);
      }
    }

    &-spinner {
      animation: spin 1s linear infinite;
    }
  }

  &__help {
    font-size: 14px;
    color: var(--dc-text-secondary);

    p {
      margin: 0;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
