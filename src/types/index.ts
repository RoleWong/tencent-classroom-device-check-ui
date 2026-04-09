// ============================================================
// TCIC Device Check SDK - 类型定义
// 集中管理所有接口和类型定义
// ============================================================

import { FinishResult } from '../logic/WorkflowManager';

/**
 * SDK 配置选项
 */
export interface TCICDeviceCheckOptions {
    /** 挂载容器（选择器或 DOM 元素） */
    container?: string | HTMLElement;
    /** 检测步骤位掩码 */
    stepList?: string;
    /** 主题：light/dark */
    theme?: 'light' | 'dark';
    /** 语言：auto/zh/en */
    language?: string;
    /** 检测完成回调 */
    onResult?: (result: FinalResult) => void;
    /** 步骤变化回调 */
    onStepChange?: (index: number, state: unknown) => void;
    /** 错误回调 */
    onError?: (error: Error) => void;
}

/**
 * 最终结果接口
 * 只包含域名偏好和设备ID，用于拼接到URL中传递给课堂主项目
 */
export interface FinalResult {
    // 域名偏好设置（扁平化）
    classCdnUsedBackup?: boolean;
    classApiUsedBackup?: boolean;
    whiteboardResUsedBackup?: boolean;
    whiteboardApiUsedBackup?: boolean;
    // 通过检测的设备ID
    speakerId?: string;
    microphoneId?: string;
    cameraId?: string;
}

// 重新导出 UI 层模块的类型
export type { StepConfig, CheckStatusType } from '../logic/utils';
export type {
    StepState,
    FinishResult,
    WorkflowSummary,
    WorkflowEventType,
    WorkflowEventCallback,
    StepChangePayload,
    StateChangePayload,
    WorkflowManagerOptions
} from '../logic/WorkflowManager';

// 重新导出底层 SDK 的类型
export type { LogEntry, LogExportJSON } from '@tencent-classroom/device-check-sdk';
