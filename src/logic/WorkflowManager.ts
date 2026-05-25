// ============================================================
// TCIC Device Check SDK - 工作流管理器
// 负责管理检测步骤的流转和状态
// ============================================================

import { LogCollector, generateId } from '@tencent-classroom/device-check-sdk';
import { CHECK_STATUS, CheckStatusType, StepConfig } from './utils';

// ============================================================
// 事件系统类型定义
// ============================================================

/**
 * 工作流事件类型
 */
export type WorkflowEventType =
    | 'stepChange'      // 步骤切换
    | 'stateChange'     // 状态变化
    | 'complete'        // 流程完成
    | 'error';          // 错误发生

/**
 * 事件回调函数类型
 */
export type WorkflowEventCallback<T = unknown> = (payload: T) => void;

/**
 * 步骤变化事件载荷
 */
export interface StepChangePayload {
    currentIndex: number;
    previousIndex: number;
    step: StepConfig | null;
    stepState: StepState | null;
}

/**
 * 状态变化事件载荷
 */
export interface StateChangePayload {
    stepStates: StepState[];
    currentIndex: number;
}

/**
 * 步骤状态接口
 */
export interface StepState {
    key: string;
    name: string;
    status: CheckStatusType;
    result: unknown;
    error: unknown;
    startTime: number | null;
    endTime: number | null;
}

/**
 * 检测结果接口
 */
export interface CheckResult {
    status: CheckStatusType;
    [key: string]: unknown;
}

/**
 * 工作流摘要接口
 */
export interface WorkflowSummary {
    summary: string;
    overallStatus: CheckStatusType;
    total: number;
    completed: number;
    success: number;
    warning: number;
    error: number;
    totalDuration: number;
}

/**
 * 完成结果接口
 * 只包含域名偏好设置和通过检测的设备 ID
 */
export interface FinishResult {
    // 域名偏好设置（来自网络检测，直接输出选优结论）
    domainPreference?: {
        // 当前地域体系
        region?: string;
        // 课堂域名选优结果
        classDomain?: string;
        // 课堂 API 选优结果
        classApi?: string;
        // 白板资源选优结果
        whiteboardRes?: string;
        // 白板接口选优结果
        whiteboardApi?: string;
        // 自定义资源域名选优结果
        resDomain?: string;
    };
    // 通过检测的扬声器设备 ID
    speakerId?: string;
    // 通过检测的麦克风设备 ID
    microphoneId?: string;
    // 通过检测的摄像头设备 ID
    cameraId?: string;
}

/**
 * 工作流管理器配置
 */
export interface WorkflowManagerOptions {
    steps?: StepConfig[];
    logCollector?: LogCollector;
    autoNext?: boolean;
    onStepChange?: (index: number, state: StepState) => void;
    onComplete?: (result: FinishResult) => void;
    onError?: (error: Error) => void;
}

/**
 * 工作流管理器
 * 控制检测步骤的执行顺序和状态流转
 * 支持事件订阅机制，让组件可以响应状态变化
 */
export class WorkflowManager {
    public id: string;
    public steps: StepConfig[];
    public currentIndex: number = 0;
    public results: Record<string, unknown> = {};
    public stepStates: StepState[];

    private logCollector?: LogCollector;
    public autoNext: boolean;
    private onStepChange: (index: number, state: StepState) => void;
    private onComplete: (result: FinishResult) => void;
    private onError: (error: Error) => void;

    // 事件监听器存储
    private eventListeners: Map<WorkflowEventType, Set<WorkflowEventCallback>> = new Map();

    constructor(options: WorkflowManagerOptions = {}) {
        this.id = generateId();
        this.steps = options.steps || [];
        this.logCollector = options.logCollector;
        this.autoNext = options.autoNext ?? true;  // 默认开启自动下一步
        this.onStepChange = options.onStepChange || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onError = options.onError || (() => {});

        // 初始化事件监听器
        this.eventListeners.set('stepChange', new Set());
        this.eventListeners.set('stateChange', new Set());
        this.eventListeners.set('complete', new Set());
        this.eventListeners.set('error', new Set());

        // 初始化每个步骤的状态
        this.stepStates = this.steps.map(step => ({
            key: step.key,
            name: step.name,
            status: CHECK_STATUS.PENDING,
            result: null,
            error: null,
            startTime: null,
            endTime: null
        }));

        this._log('info', 'WorkflowManager 已初始化', {
            totalSteps: this.steps.length,
            steps: this.steps.map(s => s.key),
            autoNext: this.autoNext
        });
    }

    // ============================================================
    // 事件系统方法
    // ============================================================

    /**
     * 订阅事件
     * @param event 事件类型
     * @param callback 回调函数
     * @returns 取消订阅的函数
     */
    on<T = unknown>(event: WorkflowEventType, callback: WorkflowEventCallback<T>): () => void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.add(callback as WorkflowEventCallback);
        }
        // 返回取消订阅的函数
        return () => this.off(event, callback);
    }

    /**
     * 取消订阅事件
     */
    off<T = unknown>(event: WorkflowEventType, callback: WorkflowEventCallback<T>): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback as WorkflowEventCallback);
        }
    }

    /**
     * 触发事件
     */
    private emit<T = unknown>(event: WorkflowEventType, payload: T): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    this._log('error', `事件回调执行出错: ${event}`, error);
                }
            });
        }
    }

    /**
     * 触发状态变化事件
     */
    private emitStateChange(): void {
        const payload: StateChangePayload = {
            stepStates: [...this.stepStates],
            currentIndex: this.currentIndex
        };
        this.emit('stateChange', payload);
    }

    /**
     * 触发步骤变化事件
     */
    private emitStepChange(previousIndex: number): void {
        const payload: StepChangePayload = {
            currentIndex: this.currentIndex,
            previousIndex,
            step: this.getCurrentStep(),
            stepState: this.getCurrentStepState()
        };
        this.emit('stepChange', payload);

        const stepState = this.getCurrentStepState();
        if (stepState) {
            this.onStepChange(this.currentIndex, stepState);
        }
    }

    // ============================================================
    // 状态获取方法
    // ============================================================

    /**
     * 获取当前步骤
     */
    getCurrentStep(): StepConfig | null {
        return this.steps[this.currentIndex] || null;
    }

    /**
     * 获取当前步骤状态
     */
    getCurrentStepState(): StepState | null {
        return this.stepStates[this.currentIndex] || null;
    }

    /**
     * 获取所有步骤状态
     */
    getAllStepStates(): StepState[] {
        return this.stepStates;
    }

    /**
     * 获取当前步骤索引
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }

    // ============================================================
    // 步骤控制方法
    // ============================================================

    /**
     * 开始当前步骤检测
     */
    startCurrentStep(): void {
        const stepState = this.getCurrentStepState();
        if (!stepState) return;

        stepState.status = CHECK_STATUS.RUNNING;
        stepState.startTime = Date.now();

        this._log('info', `开始检测: ${stepState.name}`);
        this.emitStateChange();
        this.onStepChange(this.currentIndex, stepState);
    }

    /**
     * 完成当前步骤
     * @param status 完成状态
     * @param result 检测结果
     * @param autoAdvance 是否自动进入下一步（覆盖全局设置）
     */
    completeCurrentStep(
        status: CheckStatusType,
        result: Record<string, unknown> = {},
        autoAdvance?: boolean
    ): void {
        console.log('completeCurrentStep, status', status, "; rusult: ", result);
        const stepState = this.getCurrentStepState();
        if (!stepState) return;

        stepState.status = status;
        stepState.result = result;

        // 只有非 running 状态才记录结束时间
        if (status !== CHECK_STATUS.RUNNING) {
            stepState.endTime = Date.now();
        } else {
            // running 状态记录开始时间
            stepState.startTime = Date.now();
        }

        // 存储结果（仅在有最终结果时）
        if (this.isStepCompleted(status)) {
            // 如果 result 是数组（设备检测结果），将其放到 devices 字段中
            // 否则直接展开 result 对象
            const resultData = Array.isArray(result)
                ? { devices: result }
                : result;

            this.results[stepState.key] = {
                status,
                ...resultData,
                duration: stepState.endTime! - (stepState.startTime || 0)
            };

            this._log('info', `检测完成: ${stepState.name}`, {
                status,
                duration: `${stepState.endTime! - (stepState.startTime || 0)}ms`
            });

            this.logCollector?.checkResult(stepState.key, status, result);
        } else {
            this._log('info', `检测状态更新: ${stepState.name}`, { status });
        }

        this.emitStateChange();
        this.onStepChange(this.currentIndex, stepState);

        // 自动进入下一步（仅在步骤真正完成时）
        const shouldAutoAdvance = autoAdvance ?? this.autoNext;
        if (shouldAutoAdvance && this.isStepCompleted(status) && !this.isLastStep()) {
            // 使用 setTimeout 确保状态更新后再切换
            setTimeout(() => {
                this.goNext();
            }, 300);  // 短暂延迟，让用户看到完成状态
        }
    }

    /**
     * 前进到下一步
     */
    goNext(): boolean {
        if (this.currentIndex < this.steps.length - 1) {
            const previousIndex = this.currentIndex;
            this.currentIndex++;
            this._log('info', `进入下一步: ${this.getCurrentStep()?.name}`);
            this.emitStepChange(previousIndex);
            return true;
        }
        return false;
    }

    /**
     * 返回上一步
     */
    goPrev(): boolean {
        if (this.currentIndex > 0) {
            const previousIndex = this.currentIndex;
            this.currentIndex--;
            this._log('info', `返回上一步: ${this.getCurrentStep()?.name}`);
            this.emitStepChange(previousIndex);
            return true;
        }
        return false;
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(index: number): void {
        if (index >= 0 && index < this.steps.length && index !== this.currentIndex) {
            const previousIndex = this.currentIndex;
            this.currentIndex = index;
            this._log('info', `跳转到步骤: ${this.getCurrentStep()?.name}`);
            this.emitStepChange(previousIndex);
        }
    }

    /**
     * 重置当前步骤
     */
    resetCurrentStep(): void {
        const stepState = this.getCurrentStepState();
        if (!stepState) return;

        stepState.status = CHECK_STATUS.PENDING;
        stepState.result = null;
        stepState.error = null;
        stepState.startTime = null;
        stepState.endTime = null;

        delete this.results[stepState.key];

        this._log('info', `重置步骤: ${stepState.name}`);
        this.emitStateChange();
        this.onStepChange(this.currentIndex, stepState);
    }

    /**
     * 检查是否为最后一步
     */
    isLastStep(): boolean {
        return this.currentIndex === this.steps.length - 1;
    }

    /**
     * 检查是否为第一步
     */
    isFirstStep(): boolean {
        return this.currentIndex === 0;
    }

    /**
     * 判断步骤是否已完成
     */
    isStepCompleted(status: CheckStatusType): boolean {
        const completedStatuses: CheckStatusType[] = [
            CHECK_STATUS.SUCCESS,
            CHECK_STATUS.WARNING,
            CHECK_STATUS.ERROR,
            CHECK_STATUS.SKIPPED
        ];
        return completedStatuses.includes(status);
    }

    // ============================================================
    // 流程控制方法
    // ============================================================

    /**
     * 完成整个检测流程
     * 只导出域名偏好设置和通过检测的设备 ID
     */
    finish(): FinishResult {
        this._log('info', '检测流程完成，开始生成结果');

        const result: FinishResult = {};

        // 1. 提取域名偏好设置（从网络检测结果中，直接输出选优结论）
        const networkResult = this.results['network'] as Record<string, unknown> | undefined;
        if (networkResult?.domainPreference) {
            const domainPref = networkResult.domainPreference as Record<string, string>;
            result.domainPreference = {
                region: domainPref.region,
                classDomain: domainPref.classDomain,
                classApi: domainPref.classApi,
                // whiteboardRes: domainPref.whiteboardRes,
                // whiteboardApi: domainPref.whiteboardApi,
                resDomain: domainPref.resDomain
            };
        }

        // 2. 提取通过检测的扬声器设备 ID
        const speakerResult = this.results['speaker'] as Record<string, unknown> | undefined;
        if (speakerResult?.devices && Array.isArray(speakerResult.devices)) {
            const passedSpeaker = speakerResult.devices.find(
                (d: Record<string, unknown>) => d.result === 'PASSED'
            );
            if (passedSpeaker?.speakerId) {
                result.speakerId = passedSpeaker.speakerId as string;
            }
        }

        // 3. 提取通过检测的麦克风设备 ID
        const micResult = this.results['microphone'] as Record<string, unknown> | undefined;
        if (micResult?.devices && Array.isArray(micResult.devices)) {
            const passedMic = micResult.devices.find(
                (d: Record<string, unknown>) => d.result === 'PASSED'
            );
            if (passedMic?.micId) {
                result.microphoneId = passedMic.micId as string;
            }
        }

        // 4. 提取通过检测的摄像头设备 ID
        const cameraResult = this.results['camera'] as Record<string, unknown> | undefined;
        if (cameraResult?.devices && Array.isArray(cameraResult.devices)) {
            const passedCamera = cameraResult.devices.find(
                (d: Record<string, unknown>) => d.result === 'PASSED'
            );
            if (passedCamera?.cameraId) {
                result.cameraId = passedCamera.cameraId as string;
            }
        }

        this._log('info', '检测流程完成', { result });

        this.emit('complete', result);
        this.onComplete(result);
        return result;
    }

    /**
     * 获取检测结果
     */
    getResult(): { summary: WorkflowSummary; details: Record<string, unknown>; stepStates: StepState[] } {
        return {
            summary: this._generateSummary(),
            details: this.results,
            stepStates: this.stepStates
        };
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        // 清理所有事件监听器
        this.eventListeners.forEach(listeners => listeners.clear());
        this.eventListeners.clear();

        this.steps = [];
        this.stepStates = [];
        this.results = {};
        this._log('info', 'WorkflowManager 已销毁');
    }

    /**
     * 生成检测摘要
     */
    private _generateSummary(): WorkflowSummary {
        const completedSteps = this.stepStates.filter(
            s => s.status !== CHECK_STATUS.PENDING && s.status !== CHECK_STATUS.RUNNING
        );
        const successSteps = this.stepStates.filter(s => s.status === CHECK_STATUS.SUCCESS);
        const warningSteps = this.stepStates.filter(s => s.status === CHECK_STATUS.WARNING);
        const errorSteps = this.stepStates.filter(s => s.status === CHECK_STATUS.ERROR);

        let overallStatus: CheckStatusType = CHECK_STATUS.SUCCESS;
        let summary = '';

        if (errorSteps.length > 0) {
            overallStatus = CHECK_STATUS.ERROR;
            summary = `检测异常：${errorSteps.map(s => s.name).join('、')} 存在问题`;
        } else if (warningSteps.length > 0) {
            overallStatus = CHECK_STATUS.WARNING;
            summary = `检测通过（有警告）：${warningSteps.map(s => s.name).join('、')} 需要关注`;
        } else if (successSteps.length === this.steps.length) {
            summary = '所有检测项均正常';
        } else {
            summary = `已完成 ${completedSteps.length}/${this.steps.length} 项检测`;
        }

        // 计算总耗时
        const startTimes = this.stepStates.map(s => s.startTime).filter((t): t is number => t !== null);
        const endTimes = this.stepStates.map(s => s.endTime).filter((t): t is number => t !== null);
        const totalDuration =
            startTimes.length > 0 && endTimes.length > 0 ? Math.max(...endTimes) - Math.min(...startTimes) : 0;

        return {
            summary,
            overallStatus,
            total: this.steps.length,
            completed: completedSteps.length,
            success: successSteps.length,
            warning: warningSteps.length,
            error: errorSteps.length,
            totalDuration
        };
    }

    /**
     * 记录日志
     */
    private _log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
        if (this.logCollector) {
            this.logCollector[level]('WorkflowManager', message, data);
        }
    }
}
