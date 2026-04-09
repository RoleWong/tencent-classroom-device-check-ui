<template>
    <div class="dc-step-panel dc-network-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('network.title') }}</h2>

        <!-- 提示信息 -->
        <div class="dc-step-hint">
            <span>{{ $t('network.hint') }}</span>
            <i class="el-icon-time dc-step-hint__icon" />
        </div>

        <!-- 检测列表 -->
        <div class="dc-step-content dc-network-list">
            <div
                v-for="item in checkItems"
                :key="item.id"
                class="dc-network-item"
            >
                <span class="dc-network-item__name">{{ getItemName(item.id) }}：</span>
                <span
                    class="dc-network-item__status"
                    :class="getStatusClass(item.status)"
                >
                    <template v-if="item.status === 'pending'">
                        <span class="dc-network-item__pending">{{ $t('network.pending') }}</span>
                    </template>
                    <template v-else-if="item.status === 'checking'">
                        <i class="el-icon-loading dc-network-item__loading" />
                        <span>{{ $t('network.checking') }}</span>
                    </template>
                    <template v-else-if="item.status === 'completed'">
                        <i class="el-icon-success dc-network-item__success" />
                        <span>{{ $t('network.completed') }}</span>
                    </template>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { BaseStepMixin, CHECK_STATUS } from '../BaseStepMixin';
import {
    CheckItemStatus,
    CheckItemResult,
    DeviceCheckSDK
} from '@tencent-classroom/device-check-sdk';

export default {
    name: 'NetworkCheck',

    mixins: [BaseStepMixin],

    data() {
        return {
            // 检测项列表
            checkItems: [],
            // 检测报告
            checkReport: null,
            // 检测报告 Promise（由 SDK 返回）
            reportPromise: null
        };
    },

    created() {
        // 在 created 中启动检测，尽早开始异步流程
        this.initAndStartCheck();
    },

    mounted() {
        // 通知父组件状态变为运行中
        this.markAsRunning();
        // 等待检测完成
        this.waitForReport();
    },

    beforeDestroy() {
        // 无需清理，检测器由 SDK 内部管理
    },

    methods: {
        initAndStartCheck() {
            const sdk = DeviceCheckSDK.current;
            if (!sdk) {
                this.logError('未找到 SDK 实例');
                return;
            }

            const { items, report } = sdk.startNetworkCheck({
                onItemUpdate: this.handleItemUpdate.bind(this),
                onComplete: this.handleCheckComplete.bind(this)
            });

            this.checkItems = items;
            this.reportPromise = report;

            this.logInfo('网络检测已启动', {
                itemCount: this.checkItems.length
            });
        },

        async waitForReport() {
            if (!this.reportPromise) return;

            try {
                const fullReport = await this.reportPromise;
                this.checkReport = fullReport;

                this.logInfo('网络检测完成', {
                    success: fullReport.summary.success,
                    successCount: fullReport.summary.successCount,
                    warningCount: fullReport.summary.warningCount,
                    failedCount: fullReport.summary.failedCount,
                    totalDuration: fullReport.summary.totalDuration
                });
            } catch (error) {
                this.logError('网络检测异常', { error: error.message });
            }
        },

        /**
         * 处理检测项更新
         */
        handleItemUpdate(item) {
            // 更新检测项状态
            const index = this.checkItems.findIndex(i => i.id === item.id);
            if (index !== -1) {
                this.$set(this.checkItems, index, { ...item });
            }

            this.logInfo(`检测项状态更新: ${item.name}`, {
                id: item.id,
                status: item.status,
                result: item.result,
                duration: item.duration
            });
        },

        /**
         * 处理检测完成
         */
        handleCheckComplete(report) {
            this.logInfo('网络检测完成', {
                reportId: report.reportId
            });
            setTimeout(() => {
                this.handleComplete();
            }, 500);
        },

        /**
         * 处理完成按钮点击
         */
        handleComplete() {
            this.emitAction('点击完成', {
                report: this.checkReport
            });

            // 根据检测结果判断状态
            if (!this.checkReport) {
                this.markAsError(null);
                return;
            }

            const { summary } = this.checkReport;

            if (summary.failedCount > 0) {
                // 有失败项，标记为错误
                this.markAsError({
                    report: this.checkReport,
                    domainPreference: this.checkReport.domainPreference
                });
            } else if (summary.warningCount > 0) {
                // 有警告项，标记为警告
                this.markAsWarning({
                    report: this.checkReport,
                    domainPreference: this.checkReport.domainPreference
                });
            } else {
                // 全部成功
                this.markAsSuccess({
                    report: this.checkReport,
                    domainPreference: this.checkReport.domainPreference
                });
            }

            this.logInfo('网络检测步骤完成', {
                success: summary.success,
                status: summary.failedCount > 0 ? 'error' : (summary.warningCount > 0 ? 'warning' : 'success')
            });
        },

        /**
         * 获取检测项名称
         */
        getItemName(id) {
            const nameMap = {
                network: this.$t('network.item.network'),
                cdn: this.$t('network.item.cdn'),
                classroom: this.$t('network.item.classroom'),
                im: this.$t('network.item.im'),
                trtc: this.$t('network.item.trtc'),
                system: this.$t('network.item.system')
            };
            return nameMap[id] || id;
        },

        /**
         * 获取状态样式类
         */
        getStatusClass(status) {
            const classMap = {
                [CheckItemStatus.PENDING]: 'is-pending',
                [CheckItemStatus.CHECKING]: 'is-checking',
                [CheckItemStatus.COMPLETED]: 'is-completed'
            };
            return classMap[status] || '';
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../../styles/step-common.scss';

// 网络检测组件特有样式
.dc-network-check {
    // 检测列表
    .dc-network-list {
        display: flex;
        flex-direction: column;
        gap: $dc-spacing-md;
        padding: $dc-spacing-lg 0;
    }

    // 检测项
    .dc-network-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $dc-spacing-sm $dc-spacing-md;
        background-color: var(--dc-bg-secondary);
        border-radius: $dc-radius-sm;
        min-height: 44px;

        &__name {
            font-size: $dc-font-size-md;
            color: var(--dc-text-primary);
        }

        &__status {
            display: flex;
            align-items: center;
            gap: $dc-spacing-xs;
            font-size: $dc-font-size-sm;

            &.is-pending {
                color: var(--dc-text-tertiary);
            }

            &.is-checking {
                color: var(--dc-warning, #e6a23c);
            }

            &.is-completed {
                color: var(--dc-success, #67c23a);
            }
        }

        &__pending {
            color: var(--dc-text-tertiary);
        }

        &__loading {
            animation: rotate 1s linear infinite;
        }

        &__success {
            font-size: 16px;
        }
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
