// ============================================================
// TCIC Device Check SDK - UI 层工具函数
// 仅包含步骤配置和 UI 状态相关的工具
// 底层能力（环境检测、浏览器检测等）已迁移至 @tencent-classroom/sdk-sdk
// ============================================================

/**
 * 步骤配置接口
 */
export interface StepConfig {
    key: string;
    name: string;
    icon: string;
    description: string;
}

/**
 * 步骤配置定义
 * 顺序对应位掩码的位置（从左到右）
 */
export const STEP_CONFIG: StepConfig[] = [
    {
        key: 'speaker',
        name: 'step.speaker.name',
        icon: 'el-icon-headset',
        description: 'step.speaker.description'
    },
    {
        key: 'microphone',
        name: 'step.microphone.name',
        icon: 'el-icon-microphone',
        description: 'step.microphone.description'
    },
    {
        key: 'camera',
        name: 'step.camera.name',
        icon: 'el-icon-video-camera',
        description: 'step.camera.description'
    },
    {
        key: 'network',
        name: 'step.network.name',
        icon: 'el-icon-connection',
        description: 'step.network.description'
    }
];

/**
 * 报告步骤配置
 */
export const REPORT_STEP_CONFIG: StepConfig = {
    key: 'report',
    name: 'step.report.name',
    icon: 'el-icon-document',
    description: 'step.report.description'
};

/**
 * 解析步骤列表位掩码
 * @param stepList - 位掩码字符串，如 '1101'
 * @returns 启用的步骤配置数组
 * @example
 * parseStepList('1101') // 返回 [speaker, microphone, camera, network]
 */
export function parseStepList(stepList: string = '1111'): StepConfig[] {
    // 确保字符串长度正确
    const mask = stepList.padEnd(4, '0').slice(0, 4);

    if (stepList === '0000') {
        return STEP_CONFIG.concat([REPORT_STEP_CONFIG]);
    }

    return STEP_CONFIG.filter((_, index) => mask[index] === '1').concat([REPORT_STEP_CONFIG]);
}

/**
 * 检测状态枚举
 */
export const CHECK_STATUS = {
    PENDING: 'pending',   // 等待检测
    RUNNING: 'running',   // 检测中
    SUCCESS: 'success',   // 检测成功
    WARNING: 'warning',   // 检测通过但有警告
    ERROR: 'error',       // 检测失败
    SKIPPED: 'skipped'    // 跳过
} as const;

export type CheckStatusType = typeof CHECK_STATUS[keyof typeof CHECK_STATUS];
