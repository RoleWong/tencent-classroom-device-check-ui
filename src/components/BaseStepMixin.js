/**
 * BaseStepMixin - 检测步骤组件基础混入
 *
 * 提供所有检测步骤组件通用的功能：
 * - 公共 Props: step, stepState, logCollector
 * - 公共方法: emitComplete, emitAction, logInfo, logError, logWarn
 * - 公共常量: CHECK_STATUS, DeviceTestResult
 *
 * 使用方式：
 * ```javascript
 * import { BaseStepMixin } from './BaseStepMixin';
 *
 * export default {
 *     name: 'SpeakerCheck',
 *     mixins: [BaseStepMixin],
 *     // ... 组件特定逻辑
 * }
 * ```
 */

import { CHECK_STATUS } from '../logic/utils';

/**
 * 设备测试结果状态枚举
 * @enum {string}
 */
export const DeviceTestResult = {
    /** 测试通过 */
    PASSED: 'PASSED',
    /** 测试失败 */
    FAILED: 'FAILED',
    /** 未测试/跳过 */
    SKIPPED: 'SKIPPED'
};

/**
 * 基础步骤组件混入
 */
export const BaseStepMixin = {
    data() {
        return {
            /**
             * 标记完成操作是否已被触发（用于节流）
             * @type {boolean}
             */
            _completionTriggered: false
        };
    },

    props: {
        /**
         * 当前步骤配置
         * @type {Object}
         * @property {string} key - 步骤唯一标识
         * @property {string} name - 步骤名称
         * @property {string} icon - 步骤图标
         * @property {string} description - 步骤描述
         */
        step: {
            type: Object,
            required: true
        },
        /**
         * 当前步骤状态
         * @type {Object}
         * @property {string} status - 步骤状态
         * @property {Object} result - 步骤结果
         */
        stepState: {
            type: Object,
            required: true
        },
        /**
         * 日志收集器实例
         * @type {Object}
         */
        logCollector: {
            type: Object,
            required: true
        },
        /**
         * 工作流管理器实例（可选）
         * @type {Object}
         */
        workflowManager: {
            type: Object,
            required: false,
            default: null
        }
    },

    computed: {
        /**
         * 步骤标识符
         * @returns {string}
         */
        stepKey() {
            return this.step?.key || '';
        },

        /**
         * 步骤名称
         * @returns {string}
         */
        stepName() {
            return this.step?.name || '';
        },

        /**
         * 当前步骤是否正在运行
         * @returns {boolean}
         */
        isRunning() {
            return this.stepState?.status === CHECK_STATUS.RUNNING;
        },

        /**
         * 当前步骤是否已完成
         * @returns {boolean}
         */
        isCompleted() {
            return [
                CHECK_STATUS.SUCCESS,
                CHECK_STATUS.WARNING,
                CHECK_STATUS.ERROR
            ].includes(this.stepState?.status);
        }
    },

    methods: {
        /**
         * 触发步骤完成事件（带节流保护）
         * @param {string} status - 完成状态 (CHECK_STATUS 中的值)
         * @param {Object|Array} result - 检测结果数据
         * @returns {boolean} - 是否成功触发（被节流时返回 false）
         */
        emitComplete(status, result = null) {
            // 如果是最终完成状态（非 RUNNING），需要进行节流检查
            const isFinalStatus = [
                CHECK_STATUS.SUCCESS,
                CHECK_STATUS.WARNING,
                CHECK_STATUS.ERROR
            ].includes(status);

            if (isFinalStatus) {
                // 节流检查：如果已经触发过完成操作，直接返回
                if (this._completionTriggered) {
                    this.logWarn('步骤完成操作被节流拦截（重复点击）', { status });
                    return false;
                }
                // 标记为已触发
                this._completionTriggered = true;
            }

            this.$emit('complete', {
                status,
                result
            });
            return true;
        },

        /**
         * 重置节流状态（用于步骤重新开始检测时）
         */
        resetCompletionThrottle() {
            this._completionTriggered = false;
        },

        /**
         * 触发用户操作事件
         * @param {string} actionName - 操作名称
         * @param {Object} data - 附加数据
         */
        emitAction(actionName, data = {}) {
            this.$emit('action', actionName, {
                step: this.stepKey,
                ...data
            });
        },

        /**
         * 记录信息日志
         * @param {string} message - 日志消息
         * @param {Object} data - 附加数据
         */
        logInfo(message, data = {}) {
            this.logCollector?.info?.(`[${this.stepName}] ${message}`, data);
        },

        /**
         * 记录警告日志
         * @param {string} message - 日志消息
         * @param {Object} data - 附加数据
         */
        logWarn(message, data = {}) {
            this.logCollector?.warn?.(`[${this.stepName}] ${message}`, data);
        },

        /**
         * 记录错误日志
         * @param {string} message - 日志消息
         * @param {Object} data - 附加数据
         */
        logError(message, data = {}) {
            this.logCollector?.error?.(`[${this.stepName}] ${message}`, data);
        },

        /**
         * 标记步骤为运行中状态
         * 同时重置节流状态，允许新一轮的完成操作
         */
        markAsRunning() {
            this.resetCompletionThrottle();
            this.emitComplete(CHECK_STATUS.RUNNING);
        },

        /**
         * 标记步骤为成功状态（带节流保护）
         * @param {Object|Array} result - 检测结果
         * @returns {boolean} - 是否成功触发
         */
        markAsSuccess(result = null) {
            return this.emitComplete(CHECK_STATUS.SUCCESS, result);
        },

        /**
         * 标记步骤为失败状态（带节流保护）
         * @param {Object|Array} result - 检测结果
         * @returns {boolean} - 是否成功触发
         */
        markAsError(result = null) {
            return this.emitComplete(CHECK_STATUS.ERROR, result);
        },

        /**
         * 标记步骤为警告状态（带节流保护）
         * @param {Object|Array} result - 检测结果
         * @returns {boolean} - 是否成功触发
         */
        markAsWarning(result = null) {
            return this.emitComplete(CHECK_STATUS.WARNING, result);
        }
    }
};

// 导出检测状态常量，方便组件直接使用
export { CHECK_STATUS };

export default BaseStepMixin;
