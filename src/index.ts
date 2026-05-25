// ============================================================
// TCIC Device Check SDK - 主入口
// 提供 TICDeviceCheck 类，支持 mount/destroy 生命周期
// 基于 @tencent-classroom/sdk-sdk 底层 SDK
// ============================================================

import ElementUI from 'element-ui';
import i18next from 'i18next';
import I18NextVue from 'i18next-vue';
import Vue from 'vue';
import {
    DeviceCheckSDK,
    LogCollector,
    isMobile,
} from '@tencent-classroom/device-check-sdk';
import { i18nController } from './logic/I18nController';
import { parseStepList, StepConfig } from './logic/utils';
import { FinishResult, WorkflowManager } from './logic/WorkflowManager';
import './styles/index.scss';
import {
    FinalResult,
    TCICDeviceCheckOptions
} from './types';
import MainContainer from './views/MainContainer.vue';

Vue.use(ElementUI);
Vue.use(I18NextVue, { i18next });

/**
 * TCIC 设备检测 SDK 主类
 * @example
 * const checker = new TICDeviceCheck({
 *   container: '#app',
 *   stepList: '1111',
 *   theme: 'light',
 *   language: 'auto',  // 自动检测浏览器语言（默认），可选: 'auto', 'zh', 'en'
 *   onResult: (result) => console.log(result)
 * });
 * checker.mount();
 */
export default class TCICDeviceCheck {
    private options: Required<TCICDeviceCheckOptions>;
    private steps: StepConfig[];
    private logCollector: LogCollector;
    private sdk: DeviceCheckSDK;
    private workflowManager: WorkflowManager;
    private vm: Vue | null = null;
    private initialized: boolean = false;
    private initError: boolean = false;
    private initErrorMessage: string = '';

    constructor(options: TCICDeviceCheckOptions = {}) {
        this.options = {
            container: options.container || '#app',
            stepList: options.stepList || '1111',
            theme: options.theme || 'light',
            language: options.language || 'auto',
            onResult: options.onResult || (() => {}),
            onStepChange: options.onStepChange || (() => {}),
            onError: options.onError || (() => {})
        };

        // 解析步骤配置
        this.steps = parseStepList(this.options.stepList);

        // 初始化日志收集器（通过底层 SDK）
        this.sdk = new DeviceCheckSDK({
            logger: { enableConsole: true },
            language: (options.language === 'zh' || options.language === 'en') ? options.language : 'zh',
        });
        this.logCollector = this.sdk.logger;

        // 初始化工作流管理器
        this.workflowManager = new WorkflowManager({
            steps: this.steps,
            logCollector: this.logCollector,
            onStepChange: this.options.onStepChange,
            onComplete: (result) => this._handleComplete(result),
            onError: this.options.onError
        });

        this.logCollector.info('SDK', 'TICDeviceCheck 实例已创建', {
            stepList: this.options.stepList,
            theme: this.options.theme,
            steps: this.steps.map(s => s.key)
        });
    }

    /**
     * 挂载 SDK 到 DOM
     */
    async mount(): Promise<void> {
        try {
            await i18nController.init(this.options.language);

            // Mobile 环境下，确保 viewport meta 包含 viewport-fit=cover
            // 这是 env(safe-area-inset-*) 生效的前提条件
            // 由于 Native 壳工程的 HTML 不由 SDK 控制，需要动态补充
            if (isMobile()) {
                this._ensureViewportFitCover();
            }

            const el =
                typeof this.options.container === 'string'
                    ? document.querySelector(this.options.container)
                    : this.options.container;

            if (!el) {
                throw new Error(`Container not found: ${this.options.container}`);
            }

            this.logCollector.info('SDK', '开始挂载 SDK');

            this.initialized = false;
            this.initError = false;
            this.initErrorMessage = '';
            this.vm = new Vue({
                data: () => ({
                    initialized: this.initialized,
                    initError: this.initError,
                    initErrorMessage: this.initErrorMessage
                }),
                render: (h) =>
                    h(MainContainer, {
                        props: {
                            steps: this.steps,
                            theme: this.options.theme,
                            workflowManager: this.workflowManager,
                            logCollector: this.logCollector,
                            initialized: (this.vm as any)?._data?.initialized ?? false,
                            initError: (this.vm as any)?._data?.initError ?? false,
                            initErrorMessage: (this.vm as any)?._data?.initErrorMessage ?? ''
                        },
                        on: {
                            finish: (result: FinishResult) => this._handleComplete(result),
                            retry: () => this._handleRetry()
                        }
                    })
            }).$mount();

            // 清空容器并挂载
            el.innerHTML = '';
            el.appendChild(this.vm.$el);

            this.logCollector.info('SDK', 'SDK 挂载完成，开始异步初始化');

            // 异步执行初始化流程（不阻塞页面）
            this._runAsyncInit();
        } catch (error) {
            this.logCollector.error('SDK', '挂载失败', error);
            this.options.onError(error as Error);
            throw error;
        }
    }

    /**
     * 标记初始化完成，同步更新 Vue 实例状态
     */
    private _markInitDone(logMessage: string): void {
        this.initialized = true;
        this.initError = false;
        this.initErrorMessage = '';

        if (this.vm) {
            (this.vm as any)._data.initialized = true;
            (this.vm as any)._data.initError = false;
            (this.vm as any)._data.initErrorMessage = '';
            this.vm.$forceUpdate();
        }

        this.logCollector.info('SDK', logMessage);
    }

    /**
     * 执行初始化流程
     * 通过底层 SDK 的统一 init 方法完成，认证等内部细节完全由底层 SDK 管理
     * - 移动端：完整初始化（等待认证 + 设备进房）
     * - 非移动端：快速初始化（仅设备枚举，认证在后台继续）
     */
    private async _runAsyncInit(): Promise<void> {
        try {
            const mobile = isMobile();
            this.logCollector.info('SDK', '开始执行初始化');

            await this.sdk.init({ deviceOnly: !mobile });

            this._markInitDone(mobile ? '初始化完成（完整模式）' : '初始化完成（快速模式）');
        } catch (error) {
            this.logCollector.error('SDK', '初始化失败', error);
            this.initialized = false;
            this.initError = true;
            this.initErrorMessage = error instanceof Error ? error.message : String(error);

            if (this.vm) {
                (this.vm as any)._data.initialized = false;
                (this.vm as any)._data.initError = true;
                (this.vm as any)._data.initErrorMessage = this.initErrorMessage;
                this.vm.$forceUpdate();
            }

            this.options.onError(error as Error);
        }
    }

    /**
     * 处理重试初始化
     */
    private async _handleRetry(): Promise<void> {
        this.logCollector.info('SDK', '用户触发重试初始化');

        // 重置状态
        this.initError = false;
        this.initErrorMessage = '';
        this.initialized = false;

        // 更新 Vue 实例状态为 loading
        if (this.vm) {
            (this.vm as any)._data.initError = false;
            (this.vm as any)._data.initErrorMessage = '';
            (this.vm as any)._data.initialized = false;
            this.vm.$forceUpdate();
        }

        // 重新执行异步初始化
        await this._runAsyncInit();
    }

    /**
     * 检查是否已完成初始化
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 检查是否初始化失败
     */
    hasInitError(): boolean {
        return this.initError;
    }

    /**
     * 获取初始化错误信息
     */
    getInitErrorMessage(): string {
        return this.initErrorMessage;
    }

    /**
     * 销毁 SDK 实例
     */
    destroy(): void {
        if (this.vm) {
            this.logCollector.info('SDK', '开始销毁 SDK');
            this.vm.$destroy();
            if (this.vm.$el && this.vm.$el.parentNode) {
                this.vm.$el.parentNode.removeChild(this.vm.$el);
            }
            this.vm = null;
        }

        // 清理工作流管理器
        if (this.workflowManager) {
            this.workflowManager.destroy();
        }

        // 销毁底层 SDK（内部会清理认证等资源）
        this.sdk.destroy();

        // 重置初始化状态
        this.initialized = false;
        this.initError = false;
        this.initErrorMessage = '';

        this.logCollector.info('SDK', 'SDK 已销毁');
    }

    /**
     * 获取当前检测结果
     */
    getResult() {
        return this.workflowManager.getResult();
    }

    /**
     * 获取详细日志
     */
    getLogs(): string {
        return this.logCollector.export();
    }

    /**
     * 获取底层 DeviceCheckSDK 实例
     * 允许高级用户直接操作底层 SDK
     */
    getSDK(): DeviceCheckSDK {
        return this.sdk;
    }

    /**
     * 确保 viewport meta 标签包含 viewport-fit=cover
     * 这是 CSS env(safe-area-inset-*) 生效的前提条件
     */
    private _ensureViewportFitCover(): void {
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            const content = meta.getAttribute('content') || '';
            if (!content.includes('viewport-fit')) {
                meta.setAttribute('content', content + ', viewport-fit=cover');
            }
        } else {
            // 如果不存在 viewport meta 标签，创建一个
            const newMeta = document.createElement('meta');
            newMeta.name = 'viewport';
            newMeta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
            document.head.appendChild(newMeta);
        }
    }

    /**
     * 处理检测完成
     */
    private _handleComplete(result: FinishResult): void {
        // 将 FinishResult 转换为扁平化的 FinalResult
        const finalResult: FinalResult = {
            // 扁平化域名偏好设置
            region: result.domainPreference?.region,
            classDomain: result.domainPreference?.classDomain,
            classApi: result.domainPreference?.classApi,
            whiteboardRes: result.domainPreference?.whiteboardRes,
            whiteboardApi: result.domainPreference?.whiteboardApi,
            resDomain: result.domainPreference?.resDomain,
            // 设备ID
            speakerId: result.speakerId,
            microphoneId: result.microphoneId,
            cameraId: result.cameraId
        };

        this.logCollector.info('SDK', '检测流程完成', { result: finalResult });
        this.options.onResult(finalResult);
    }
}

export const version = '1.0.0';
export { WorkflowManager } from './logic/WorkflowManager';
export { LogCollector } from '@tencent-classroom/device-check-sdk';
export { parseStepList, STEP_CONFIG } from './logic/utils';
export { i18nController, i18n, detectLanguage } from './logic/I18nController';
export { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';
export * from './types';
