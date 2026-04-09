this.markAsSuccess(this.testResults);
<template>
    <div class="dc-step-panel dc-report-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('report.title') }}</h2>

        <!-- 操作按钮 -->
        <div class="dc-report-actions">
            <el-button
                class="dc-report-btn dc-report-btn--secondary"
                @click="handleRestart"
            >
                {{ $t('report.restart') }}
            </el-button>
            <el-button
                type="primary"
                class="dc-report-btn dc-report-btn--primary"
                @click="handleCopyResult"
            >
                {{ $t('report.copyResult') }}
            </el-button>
        </div>

        <!-- 检测结果列表 -->
        <div class="dc-report-list">
            <!-- 扬声器检测结果 -->
            <div v-if="isStepConfigured('speaker')" class="dc-report-item">
                <span class="dc-report-item__name">{{ $t('report.speaker') }}</span>
                <div class="dc-report-item__result" :class="getResultClass('speaker')">
                    <template v-if="getDeviceStatus('speaker') === 'success'">
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('speaker') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('speaker') === 'warning'">
                        <i class="el-icon-s-tools dc-report-item__icon--fixed" />
                        <span>{{ $t('report.status.fixed') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('speaker') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('speaker') === 'error'">
                        <i class="el-icon-error dc-report-item__icon--error" />
                        <span>{{ getErrorCount('speaker') }}{{ $t('report.status.abnormalCount') }}</span>
                        <div class="dc-report-item__details">
                            <span
                                v-for="(issue, idx) in getIssues('speaker')"
                                :key="idx"
                                class="dc-report-item__issue"
                            >{{ issue }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <i class="el-icon-warning dc-report-item__icon--pending" />
                        <span>{{ $t('report.status.incomplete') }}</span>
                    </template>
                </div>
            </div>

            <!-- 麦克风检测结果 -->
            <div v-if="isStepConfigured('microphone')" class="dc-report-item">
                <span class="dc-report-item__name">{{ $t('report.microphone') }}</span>
                <div class="dc-report-item__result" :class="getResultClass('microphone')">
                    <template v-if="getDeviceStatus('microphone') === 'success'">
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('microphone') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('microphone') === 'warning'">
                        <i class="el-icon-s-tools dc-report-item__icon--fixed" />
                        <span>{{ $t('report.status.fixed') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('microphone') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('microphone') === 'error'">
                        <i class="el-icon-error dc-report-item__icon--error" />
                        <span>{{ getErrorCount('microphone') }}{{ $t('report.status.abnormalCount') }}</span>
                        <div class="dc-report-item__details">
                            <span
                                v-for="(issue, idx) in getIssues('microphone')"
                                :key="idx"
                                class="dc-report-item__issue"
                            >{{ issue }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <i class="el-icon-warning dc-report-item__icon--pending" />
                        <span>{{ $t('report.status.incomplete') }}</span>
                    </template>
                </div>
            </div>

            <!-- 摄像头检测结果 -->
            <div v-if="isStepConfigured('camera')" class="dc-report-item">
                <span class="dc-report-item__name">{{ $t('report.camera') }}</span>
                <div class="dc-report-item__result" :class="getResultClass('camera')">
                    <template v-if="getDeviceStatus('camera') === 'success'">
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('camera') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('camera') === 'warning'">
                        <i class="el-icon-s-tools dc-report-item__icon--fixed" />
                        <span>{{ $t('report.status.fixed') }}</span>
                        <div class="dc-report-item__details">
                            <span class="dc-report-item__device dc-report-item__device--success">
                                {{ getPassedDeviceName('camera') }}
                            </span>
                        </div>
                    </template>
                    <template v-else-if="getDeviceStatus('camera') === 'error'">
                        <i class="el-icon-error dc-report-item__icon--error" />
                        <span>{{ getErrorCount('camera') }}{{ $t('report.status.abnormalCount') }}</span>
                        <div class="dc-report-item__details">
                            <span
                                v-for="(issue, idx) in getIssues('camera')"
                                :key="idx"
                                class="dc-report-item__issue"
                            >{{ issue }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <i class="el-icon-warning dc-report-item__icon--pending" />
                        <span>{{ $t('report.status.incomplete') }}</span>
                    </template>
                </div>
            </div>

            <!-- 网络状况检测结果 -->
            <div v-if="isStepConfigured('network')" class="dc-report-item dc-report-item--network">
                <span class="dc-report-item__name">{{ $t('report.network') }}</span>
                <div class="dc-report-item__result" :class="getResultClass('network')">
                    <template v-if="getStepStatus('network') === 'success'">
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                        <!-- 成功状态也显示详细信息 -->
                        <div v-if="getNetworkDetails()" class="dc-report-item__details dc-report-item__details--network">
                            <div class="dc-network-detail-item">{{ $t('report.network.totalDuration') }}{{ getNetworkDetails().totalDuration }}ms</div>
                            <div class="dc-network-detail-item">{{ $t('report.network.checkItems') }}</div>
                            <div
                                v-for="(item, idx) in getNetworkCheckItems()"
                                :key="idx"
                                class="dc-network-check-item"
                            >
                                <span class="dc-network-check-item__icon" :class="item.iconClass">{{ item.icon }}</span>
                                <span class="dc-network-check-item__name">{{ item.name }}：</span>
                                <span class="dc-network-check-item__status" :class="item.statusClass">{{ item.status }}</span>
                                <span v-if="item.extra" class="dc-network-check-item__extra">{{ item.extra }}</span>
                                <!-- 显示慢速域名 -->
                                <div v-if="item.slowDomains && item.slowDomains.length > 0" class="dc-network-slow-domains">
                                    <span class="dc-network-slow-label">{{ $t('report.network.slowDomains') }}</span>
                                    <span class="dc-network-slow-list">{{ item.slowDomains.join(', ') }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else-if="getStepStatus('network') === 'error'">
                        <i class="el-icon-error dc-report-item__icon--error" />
                        <span>{{ $t('report.status.abnormal') }}</span>
                        <div class="dc-report-item__details dc-report-item__details--network">
                            <div v-if="getNetworkDetails()" class="dc-network-detail-item">{{ $t('report.network.totalDuration') }}{{ getNetworkDetails().totalDuration }}ms</div>
                            <div class="dc-network-detail-item">{{ $t('report.network.checkItems') }}</div>
                            <div
                                v-for="(item, idx) in getNetworkCheckItems()"
                                :key="idx"
                                class="dc-network-check-item"
                            >
                                <span class="dc-network-check-item__icon" :class="item.iconClass">{{ item.icon }}</span>
                                <span class="dc-network-check-item__name">{{ item.name }}：</span>
                                <span class="dc-network-check-item__status" :class="item.statusClass">{{ item.status }}</span>
                                <span v-if="item.extra" class="dc-network-check-item__extra">{{ item.extra }}</span>
                                <!-- 显示失败的域名 -->
                                <div v-if="item.failedDomains && item.failedDomains.length > 0" class="dc-network-failed-domains">
                                    <span class="dc-network-failed-label">{{ $t('report.network.failedDomains') }}</span>
                                    <span class="dc-network-failed-list">{{ item.failedDomains.join(', ') }}</span>
                                </div>
                                <!-- 显示慢速域名 -->
                                <div v-if="item.slowDomains && item.slowDomains.length > 0" class="dc-network-slow-domains">
                                    <span class="dc-network-slow-label">{{ $t('report.network.slowDomains') }}</span>
                                    <span class="dc-network-slow-list">{{ item.slowDomains.join(', ') }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else-if="getStepStatus('network') === 'warning'">
                        <i class="el-icon-s-tools dc-report-item__icon--fixed" />
                        <span>{{ $t('report.status.fixed') }}</span>
                        <div class="dc-report-item__details dc-report-item__details--network">
                            <div v-if="getNetworkDetails()" class="dc-network-detail-item">{{ $t('report.network.totalDuration') }}{{ getNetworkDetails().totalDuration }}ms</div>
                            <div class="dc-network-detail-item">{{ $t('report.network.checkItems') }}</div>
                            <div
                                v-for="(item, idx) in getNetworkCheckItems()"
                                :key="idx"
                                class="dc-network-check-item"
                            >
                                <span class="dc-network-check-item__icon" :class="item.iconClass">{{ item.icon }}</span>
                                <span class="dc-network-check-item__name">{{ item.name }}：</span>
                                <span class="dc-network-check-item__status" :class="item.statusClass">{{ item.status }}</span>
                                <span v-if="item.extra" class="dc-network-check-item__extra">{{ item.extra }}</span>
                                <!-- 显示失败的域名 -->
                                <div v-if="item.failedDomains && item.failedDomains.length > 0" class="dc-network-failed-domains">
                                    <span class="dc-network-failed-label">{{ $t('report.network.failedDomains') }}</span>
                                    <span class="dc-network-failed-list">{{ item.failedDomains.join(', ') }}</span>
                                </div>
                                <!-- 显示慢速域名 -->
                                <div v-if="item.slowDomains && item.slowDomains.length > 0" class="dc-network-slow-domains">
                                    <span class="dc-network-slow-label">{{ $t('report.network.slowDomains') }}</span>
                                    <span class="dc-network-slow-list">{{ item.slowDomains.join(', ') }}</span>
                                </div>
                            </div>
                            <!-- 域名切换信息 -->
                            <div v-if="getFixedItems('network').length > 0" class="dc-network-detail-item dc-network-switches">
                                <div class="dc-network-switch-label">{{ $t('report.network.domainSwitches') }}</div>
                                <div
                                    v-for="(fix, idx) in getFixedItems('network')"
                                    :key="idx"
                                    class="dc-network-switch-item"
                                >
                                    · {{ fix }}
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <i class="el-icon-warning dc-report-item__icon--pending" />
                        <span>{{ $t('report.status.incomplete') }}</span>
                    </template>
                </div>
            </div>

            <!-- 系统环境检测结果（系统环境检测是网络检测的一部分，当配置了网络检测时才显示） -->
            <div v-if="isStepConfigured('network')" class="dc-report-item">
                <span class="dc-report-item__name">{{ $t('report.system') }}</span>
                <div class="dc-report-item__result" :class="getResultClass('system')">
                    <template v-if="getSystemStatus() === 'success'">
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                    </template>
                    <template v-else-if="getSystemStatus() === 'failed'">
                        <i class="el-icon-error dc-report-item__icon--error" />
                        <span>{{ $t('report.status.abnormal') }}</span>
                        <div class="dc-report-item__details">
                            <span
                                v-for="(issue, idx) in getSystemIssues()"
                                :key="idx"
                                class="dc-report-item__issue"
                            >{{ issue }}</span>
                        </div>
                    </template>
                    <template v-else-if="getSystemStatus() === 'warning'">
                        <i class="el-icon-warning dc-report-item__icon--warning" />
                        <span>{{ $t('report.status.partialAvailable') }}</span>
                        <div class="dc-report-item__details">
                            <span
                                v-for="(issue, idx) in getSystemIssues()"
                                :key="idx"
                                class="dc-report-item__issue"
                            >{{ issue }}</span>
                        </div>
                    </template>
                    <template v-else>
                        <i class="el-icon-success dc-report-item__icon--success" />
                        <span>{{ $t('report.status.normal') }}</span>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { BaseStepMixin, CHECK_STATUS, DeviceTestResult } from '../BaseStepMixin';

export default {
    name: 'ReportCheck',

    mixins: [BaseStepMixin],

    data() {
        return {
            // 复制成功提示
            copySuccess: false
        };
    },

    computed: {
        /**
         * 获取所有步骤状态
         */
        allStepStates() {
            // 从 stepState.result 中获取，这里需要从父组件获取所有步骤的状态
            // 报告组件会接收到workflowManager的所有状态
            return this.stepState?.result?.stepStates || [];
        },

        /**
         * 获取所有步骤结果
         */
        allResults() {
            return this.stepState?.result?.details || {};
        },

        /**
         * 获取配置的步骤 key 列表（不包括 report 步骤本身）
         * 用于判断结果页应该展示哪些检测项
         */
        configuredStepKeys() {
            if (!this.workflowManager?.steps) {
                return [];
            }
            return this.workflowManager.steps
                .filter(step => step.key !== 'report')
                .map(step => step.key);
        }
    },

    mounted() {
        // 报告组件加载时自动标记为成功状态
        this.markAsSuccess({
            timestamp: Date.now()
        });

        this.logInfo('报告页面已加载', {
            stepStates: this.allStepStates,
            results: this.allResults
        });

        // 自动调用 finish 方法，导出检测结果
        if (this.workflowManager) {
            this.logInfo('自动调用 finish 方法，导出检测结果');
            this.workflowManager.finish();
        }
    },

    methods: {
        /**
         * 判断某个步骤是否在配置中
         * @param {string} stepKey - 步骤标识符
         * @returns {boolean} - 是否配置了该步骤
         */
        isStepConfigured(stepKey) {
            return this.configuredStepKeys.includes(stepKey);
        },

        /**
         * 获取步骤状态
         */
        getStepStatus(stepKey) {
            const stepState = this.allStepStates.find(s => s.key === stepKey);
            return stepState?.status || 'pending';
        },

        /**
         * 获取设备检测状态（根据新的状态判定规则）
         * - 正常(success)：只有1个设备且检测通过
         * - 已修复(warning)：有多个设备，至少有一个通过（说明用户尝试了多个设备后才成功）
         * - 失败(error)：所有设备检测失败或无设备
         * - 未完成(pending)：未进行检测
         *
         * 注意：devices 数组只包含实际测试过的设备（PASSED 或 FAILED），不包含 SKIPPED 状态
         */
        getDeviceStatus(stepKey) {
            const result = this.getStepResult(stepKey);

            // 未进行检测
            if (!result) {
                return 'pending';
            }

            // 设备类检测结果存储在 devices 字段中
            const devices = result.devices;
            if (Array.isArray(devices)) {
                // 无设备或未测试任何设备
                if (devices.length === 0) {
                    return 'error';
                }

                const passedDevices = devices.filter(r => r.result === DeviceTestResult.PASSED);
                const failedDevices = devices.filter(r => r.result === DeviceTestResult.FAILED);

                // 所有设备都失败
                if (failedDevices.length === devices.length) {
                    return 'error';
                }

                // 只有1个设备且通过 = 正常
                if (devices.length === 1 && passedDevices.length === 1) {
                    return 'success';
                }

                // 有多个设备，至少有一个通过 = 已修复（说明用户尝试了多个设备后才成功）
                if (devices.length > 1 && passedDevices.length > 0) {
                    return 'warning';
                }

                return 'error';
            }

            return 'pending';
        },

        /**
         * 获取设备详情列表（用于已修复状态的展示）
         */
        getDeviceDetailList(stepKey) {
            const result = this.getStepResult(stepKey);
            const deviceList = [];

            // 设备类检测结果存储在 devices 字段中
            const devices = result?.devices;
            if (!devices || !Array.isArray(devices)) {
                return deviceList;
            }

            devices.forEach((device, index) => {
                let deviceName = '';
                if (stepKey === 'speaker') {
                    deviceName = device.speakerName || `设备${index + 1}`;
                } else if (stepKey === 'microphone') {
                    deviceName = device.micName || `设备${index + 1}`;
                } else if (stepKey === 'camera') {
                    deviceName = device.cameraName || `设备${index + 1}`;
                }

                deviceList.push({
                    name: deviceName,
                    passed: device.result === DeviceTestResult.PASSED,
                    testTime: device.testTime
                });
            });

            return deviceList;
        },

        /**
         * 获取通过检测的设备名称（用于成功状态的展示）
         */
        getPassedDeviceName(stepKey) {
            const result = this.getStepResult(stepKey);
            const devices = result?.devices;

            if (!devices || !Array.isArray(devices)) {
                return '';
            }

            // 查找第一个通过检测的设备
            const passedDevice = devices.find(d => d.result === DeviceTestResult.PASSED);
            if (!passedDevice) {
                return '';
            }

            // 根据设备类型获取设备名称
            if (stepKey === 'speaker') {
                return passedDevice.speakerName || this.$t('report.issue.unknownDevice');
            } else if (stepKey === 'microphone') {
                return passedDevice.micName || this.$t('report.issue.unknownDevice');
            } else if (stepKey === 'camera') {
                return passedDevice.cameraName || this.$t('report.issue.unknownDevice');
            }

            return this.$t('report.issue.unknownDevice');
        },

        /**
         * 获取步骤结果
         */
        getStepResult(stepKey) {
            return this.allResults[stepKey] || null;
        },

        /**
         * 获取结果样式类
         */
        getResultClass(stepKey) {
            // 设备类检测使用新的状态判定逻辑
            if (['speaker', 'microphone', 'camera'].includes(stepKey)) {
                const status = this.getDeviceStatus(stepKey);
                return {
                    'is-success': status === 'success',
                    'is-error': status === 'error',
                    'is-warning': status === 'warning',
                    'is-pending': status === 'pending'
                };
            }

            // 系统环境使用 getSystemStatus()
            if (stepKey === 'system') {
                const status = this.getSystemStatus();
                return {
                    'is-success': status === 'success',
                    'is-error': status === 'failed',  // 'failed' 映射到 'is-error' 样式
                    'is-warning': status === 'warning',
                    'is-pending': status === 'pending'
                };
            }

            // 其他检测使用原有逻辑
            const status = this.getStepStatus(stepKey);
            return {
                'is-success': status === 'success',
                'is-error': status === 'error',
                'is-warning': status === 'warning',
                'is-pending': status === 'pending' || status === 'running'
            };
        },

        /**
         * 获取错误数量
         */
        getErrorCount(stepKey) {
            const result = this.getStepResult(stepKey);
            if (!result) return 1; // 未检测也算一个异常

            // 设备类检测结果存储在 devices 字段中
            const devices = result.devices;
            if (Array.isArray(devices)) {
                // 无设备算一个异常
                if (devices.length === 0) {
                    return 1;
                }
                // 统计失败的设备数
                const failedCount = devices.filter(r => r.result === DeviceTestResult.FAILED).length;
                return failedCount || 1;
            }

            return 1;
        },

        /**
         * 获取问题列表（用于失败状态的展示）
         */
        getIssues(stepKey) {
            const result = this.getStepResult(stepKey);
            const issues = [];

            if (!result) {
                issues.push(this.$t('report.issue.notCompleted'));
                return issues;
            }

            // 设备类检测结果存储在 devices 字段中
            const devices = result.devices;
            if (Array.isArray(devices)) {
                // 无设备情况
                if (devices.length === 0) {
                    // 根据设备类型返回具体的无设备提示
                    if (stepKey === 'speaker') {
                        issues.push(this.$t('report.issue.noSpeaker'));
                    } else if (stepKey === 'microphone') {
                        issues.push(this.$t('report.issue.noMicrophone'));
                    } else if (stepKey === 'camera') {
                        issues.push(this.$t('report.issue.noCamera'));
                    } else {
                        issues.push(this.$t('report.issue.noDevice'));
                    }
                    return issues;
                }

                // 统计失败的设备
                const failedDevices = devices.filter(r => r.result === DeviceTestResult.FAILED);

                // 所有设备都失败：逐个列出
                if (failedDevices.length > 0) {
                    failedDevices.forEach(d => {
                        const deviceName = d.speakerName || d.micName || d.cameraName || this.$t('report.issue.unknownDevice');
                        issues.push(`${deviceName}：${this.$t('report.issue.deviceCheckFailed')}`);
                    });
                }

                return issues;
            }

            // 网络检测
            if (stepKey === 'network' && result.report) {
                const report = result.report;
                if (report.summary?.failedCount > 0) {
                    Object.entries(report.summary?.itemStatus || {}).forEach(([key, status]) => {
                        if (status === 'failed') {
                            issues.push(this.getNetworkItemName(key) + this.$t('report.issue.checkFailed'));
                        }
                    });
                }
                return issues;
            }

            return issues;
        },

        /**
         * 获取已修复项目列表（网络检测）
         */
        getFixedItems(stepKey) {
            const fixes = [];
            if (stepKey !== 'network') return fixes;

            const result = this.getStepResult(stepKey);
            if (!result?.domainPreference) return fixes;

            const pref = result.domainPreference;

            // 检查域名是否切换到备用
            if (pref.classCdnUsedBackup) {
                fixes.push(this.$t('report.fix.cdnSwitched'));
            }
            if (pref.classApiUsedBackup) {
                fixes.push(this.$t('report.fix.apiSwitched'));
            }
            if (pref.whiteboardResUsedBackup) {
                fixes.push(this.$t('report.fix.whiteboardResSwitched'));
            }
            if (pref.whiteboardApiUsedBackup) {
                fixes.push(this.$t('report.fix.whiteboardApiSwitched'));
            }

            return fixes;
        },

        /**
         * 获取网络检测详情
         */
        getNetworkDetails() {
            const result = this.getStepResult('network');
            if (!result?.report) return null;

            return {
                totalDuration: result.report.summary?.totalDuration || 0
            };
        },

        /**
         * 获取网络检测各项状态
         */
        getNetworkCheckItems() {
            const result = this.getStepResult('network');
            if (!result?.report) return [];

            const report = result.report;
            const details = report.details || {};
            const items = [];

            const SLOW_LATENCY_THRESHOLD = 1000;

            // 1. 网络连通性
            if (details.network) {
                const netDetail = details.network;
                const status = this.getItemStatusFromResult(netDetail.result);
                const failedDomains = netDetail.domains?.filter(d => !d.success).map(d => d.domain) || [];
                // 收集慢速域名（延迟 > 400ms 且成功的域名）
                const slowDomains = netDetail.domains?.filter(d => d.success && d.latency > SLOW_LATENCY_THRESHOLD).map(d => `${d.domain} (${d.latency}ms)`) || [];

                items.push({
                    name: this.$t('network.item.network'),
                    status: status.text,
                    icon: status.icon,
                    iconClass: status.iconClass,
                    statusClass: status.statusClass,
                    extra: netDetail.avgLatency ? `(${this.$t('report.network.avgLatency')}${netDetail.avgLatency}ms)` : '',
                    failedDomains: failedDomains.length > 0 ? failedDomains : null,
                    slowDomains: slowDomains.length > 0 ? slowDomains : null
                });
            }

            // 2. CDN资源
            if (details.cdn) {
                const cdnDetail = details.cdn;
                const status = this.getItemStatusFromResult(cdnDetail.result);
                const failedNodes = cdnDetail.nodes?.filter(n => !n.success).map(n => n.domain || n.baseUrl) || [];
                // 收集慢速CDN节点（延迟 > 400ms 且成功的节点）
                const slowNodes = cdnDetail.nodes?.filter(n => n.success && n.latency > SLOW_LATENCY_THRESHOLD).map(n => `${n.domain || n.baseUrl} (${n.latency}ms)`) || [];

                items.push({
                    name: this.$t('network.item.cdn'),
                    status: status.text,
                    icon: status.icon,
                    iconClass: status.iconClass,
                    statusClass: status.statusClass,
                    failedDomains: failedNodes.length > 0 ? failedNodes : null,
                    slowDomains: slowNodes.length > 0 ? slowNodes : null
                });
            }

            // 3. 课堂接口
            if (details.classroom) {
                const classDetail = details.classroom;
                const status = this.getItemStatusFromResult(classDetail.result);
                // 主备域名均失败的服务
                const failedServices = classDetail.services?.filter(s => !s.primary.success && (!s.backup || !s.backup.success)).map(s => s.serviceName) || [];
                // 主域名失败但备用域名成功的服务（已切换）
                const switchedServices = classDetail.services?.filter(s => !s.primary.success && s.backup && s.backup.success).map(s => s.serviceName) || [];

                // 收集慢速域名（最终选择的域名延迟 > 400ms）
                const slowServices = classDetail.services?.filter(s => {
                    // 获取最终选择的域名的延迟
                    const selectedDomain = s.selectedDomain;
                    if (selectedDomain === s.primary.domain) {
                        return s.primary.success && s.primary.latency > SLOW_LATENCY_THRESHOLD;
                    } else if (s.backup && selectedDomain === s.backup.domain) {
                        return s.backup.success && s.backup.latency > SLOW_LATENCY_THRESHOLD;
                    }
                    return false;
                }).map(s => {
                    const selectedDomain = s.selectedDomain;
                    const latency = selectedDomain === s.primary.domain ? s.primary.latency : s.backup?.latency;
                    return `${s.serviceName} (${latency}ms)`;
                }) || [];

                // 合并显示信息
                const domainInfo = [];
                if (failedServices.length > 0) {
                    domainInfo.push(...failedServices.map(s => `${s}(${this.$t('report.network.bothFailed')})`));
                }
                if (switchedServices.length > 0) {
                    domainInfo.push(...switchedServices.map(s => `${s}(${this.$t('report.network.switchedToBackup')})`));
                }

                items.push({
                    name: this.$t('network.item.classroom'),
                    status: status.text,
                    icon: status.icon,
                    iconClass: status.iconClass,
                    statusClass: status.statusClass,
                    failedDomains: domainInfo.length > 0 ? domainInfo : null,
                    slowDomains: slowServices.length > 0 ? slowServices : null
                });
            }

            // 4. IM信令
            if (details.im) {
                const imDetail = details.im;
                const status = this.getItemStatusFromResult(imDetail.result);
                const failedItems = [];

                // 收集失败的检测项
                if (imDetail.sdkCheck && !imDetail.sdkCheck.success) {
                    failedItems.push('Create Chat SDK');
                }
                if (imDetail.websocketCheck && !imDetail.websocketCheck.success) {
                    const failedWs = imDetail.websocketCheck.domains?.filter(d => !d.success).map(d => d.domain) || [];
                    if (failedWs.length > 0) {
                        failedItems.push(...failedWs);
                    }
                }
                if (imDetail.httpCheck && !imDetail.httpCheck.success) {
                    const failedHttp = imDetail.httpCheck.domains?.filter(d => !d.success).map(d => d.domain) || [];
                    if (failedHttp.length > 0) {
                        failedItems.push(...failedHttp);
                    }
                }

                items.push({
                    name: this.$t('network.item.im'),
                    status: status.text,
                    icon: status.icon,
                    iconClass: status.iconClass,
                    statusClass: status.statusClass,
                    extra: imDetail.sdkCheck?.connectionTime ? `(${this.$t('report.network.connectionTime')}${imDetail.sdkCheck.connectionTime}ms)` : '',
                    failedDomains: failedItems.length > 0 ? failedItems : null
                });
            }

            // 5. TRTC音视频
            if (details.trtc) {
                const trtcDetail = details.trtc;
                const status = this.getItemStatusFromResult(trtcDetail.result);
                const failedDomains = trtcDetail.connectivity?.domains?.filter(d => !d.success).map(d => d.domain) || [];

                items.push({
                    name: this.$t('network.item.trtc'),
                    status: status.text,
                    icon: status.icon,
                    iconClass: status.iconClass,
                    statusClass: status.statusClass,
                    failedDomains: failedDomains.length > 0 ? failedDomains : null
                });
            }

            return items;
        },

        /**
         * 根据检测结果获取状态显示
         */
        getItemStatusFromResult(result) {
            const statusMap = {
                success: {
                    text: this.$t('report.status.normal'),
                    icon: '✓',
                    iconClass: 'dc-network-icon--success',
                    statusClass: 'dc-network-status--success'
                },
                fixed: {
                    text: this.$t('report.status.fixed'),
                    icon: '🔧',
                    iconClass: 'dc-network-icon--fixed',
                    statusClass: 'dc-network-status--fixed'
                },
                warning: {
                    text: this.$t('report.status.partialAvailable'),
                    icon: '⚠',
                    iconClass: 'dc-network-icon--warning',
                    statusClass: 'dc-network-status--warning'
                },
                failed: {
                    text: this.$t('report.status.failed'),
                    icon: '✗',
                    iconClass: 'dc-network-icon--failed',
                    statusClass: 'dc-network-status--failed'
                }
            };

            return statusMap[result] || statusMap.failed;
        },

        /**
         * 获取网络检测项名称
         */
        getNetworkItemName(key) {
            const nameMap = {
                network: this.$t('network.item.network'),
                cdn: this.$t('network.item.cdn'),
                classroom: this.$t('network.item.classroom'),
                im: this.$t('network.item.im'),
                trtc: this.$t('network.item.trtc'),
                system: this.$t('network.item.system')
            };
            return nameMap[key] || key;
        },

        /**
         * 获取系统状态（从网络检测结果中提取）
         */
        getSystemStatus() {
            const networkResult = this.getStepResult('network');
            if (!networkResult?.report?.details?.system) {
                return 'success'; // 默认正常
            }

            const systemResult = networkResult.report.details.system;
            return systemResult.result || 'success';
        },

        /**
         * 获取系统问题列表
         */
        getSystemIssues() {
            const issues = [];
            const networkResult = this.getStepResult('network');
            if (!networkResult?.report?.details?.system) {
                return issues;
            }

            const systemDetails = networkResult.report.details.system;
            if (systemDetails.warnings && systemDetails.warnings.length > 0) {
                // 处理国际化键：如果是 i18n 键则翻译，否则直接使用
                systemDetails.warnings.forEach(warning => {
                    // 检查是否是国际化键（以 system.error. 开头）
                    if (typeof warning === 'string' && warning.startsWith('system.error.')) {
                        // 处理带附加信息的键（如 system.error.trtcCheckFailed: xxx）
                        const colonIndex = warning.indexOf(':');
                        if (colonIndex > 0) {
                            const key = warning.substring(0, colonIndex).trim();
                            const extra = warning.substring(colonIndex + 1).trim();
                            const translated = this.$t(key);
                            issues.push(`${translated}${extra ? ': ' + extra : ''}`);
                        } else {
                            issues.push(this.$t(warning));
                        }
                    } else {
                        issues.push(warning);
                    }
                });
            }

            return issues;
        },

        /**
         * 处理重新检测
         */
        handleRestart() {
            this.emitAction('点击重新检测');
            // 通知父组件重新开始检测
            this.$emit('restart');
        },

        /**
         * 处理复制结果
         */
        async handleCopyResult() {
            this.emitAction('点击复制结果');

            const reportText = this.generateReportText();

            try {
                await navigator.clipboard.writeText(reportText);
                this.$message.success(this.$t('report.copySuccess'));
                this.logInfo('检测结果已复制到剪贴板');
            } catch (error) {
                // 降级方案：使用textarea复制
                this.fallbackCopy(reportText);
            }
        },

        /**
         * 降级复制方案
         */
        fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                this.$message.success(this.$t('report.copySuccess'));
            } catch (err) {
                this.$message.error(this.$t('report.copyFailed'));
                this.logError('复制失败', { error: err.message });
            }

            document.body.removeChild(textarea);
        },

        /**
         * 生成报告文本（用户友好格式）
         */
        generateReportText() {
            const lines = [];
            const separator = '─'.repeat(40);

            // 标题
            lines.push(this.$t('export.title'));
            lines.push(separator);
            lines.push(`${this.$t('export.checkTime')}: ${this.formatDateTime(Date.now())}`);
            lines.push('');

            // 概述
            lines.push(`[${this.$t('export.summary.title')}]`);
            lines.push(this.generateSummary());
            lines.push('');

            // 详细结果
            lines.push(`[${this.$t('export.details.title')}]`);
            lines.push('');

            // 1. 扬声器检测（仅配置时展示）
            if (this.isStepConfigured('speaker')) {
                lines.push(this.formatDeviceResult('speaker', this.$t('export.device.speaker')));
                lines.push('');
            }

            // 2. 麦克风检测（仅配置时展示）
            if (this.isStepConfigured('microphone')) {
                lines.push(this.formatDeviceResult('microphone', this.$t('export.device.microphone')));
                lines.push('');
            }

            // 3. 摄像头检测（仅配置时展示）
            if (this.isStepConfigured('camera')) {
                lines.push(this.formatDeviceResult('camera', this.$t('export.device.camera')));
                lines.push('');
            }

            // 4. 网络检测（仅配置时展示）
            if (this.isStepConfigured('network')) {
                lines.push(this.formatNetworkResult());
                lines.push('');

                // 5. 系统环境（系统环境是网络检测的一部分）
                lines.push(this.formatSystemResult());
                lines.push('');
            }

            // 日志部分
            lines.push(separator);
            lines.push(`[${this.$t('export.log.title')}]`);
            lines.push(this.logCollector.export());

            return lines.join('\n');
        },

        /**
         * 生成检测概述
         */
        generateSummary() {
            // 仅统计配置了的步骤
            const configuredDeviceSteps = ['speaker', 'microphone', 'camera'].filter(key => this.isStepConfigured(key));
            const hasNetwork = this.isStepConfigured('network');

            // 对设备类使用新的状态判定，对网络使用原有状态
            const statuses = [
                ...configuredDeviceSteps.map(key => ({ key, status: this.getDeviceStatus(key) })),
                ...(hasNetwork ? [{ key: 'network', status: this.getStepStatus('network') }] : [])
            ];

            const successCount = statuses.filter(s => s.status === 'success').length;
            const warningCount = statuses.filter(s => s.status === 'warning').length;
            const errorCount = statuses.filter(s => s.status === 'error').length;
            const pendingCount = statuses.filter(s => s.status === 'pending' || s.status === 'running').length;

            const parts = [];
            if (successCount > 0) parts.push(`${successCount}${this.$t('export.summary.itemsNormal')}`);
            if (warningCount > 0) parts.push(`${warningCount}${this.$t('export.summary.itemsFixed')}`);
            if (errorCount > 0) parts.push(`${errorCount}${this.$t('export.summary.itemsAbnormal')}`);
            if (pendingCount > 0) parts.push(`${pendingCount}${this.$t('export.summary.itemsIncomplete')}`);

            if (errorCount > 0) {
                return `${parts.join(', ')}. ${this.$t('export.summary.suggestFix')}`;
            } else if (warningCount > 0) {
                return `${parts.join(', ')}. ${this.$t('export.summary.autoFixed')}`;
            } else if (pendingCount > 0) {
                return `${parts.join(', ')}. ${this.$t('export.summary.incomplete')}`;
            } else {
                return this.$t('export.summary.allNormal');
            }
        },

        /**
         * 格式化设备检测结果
         */
        formatDeviceResult(stepKey, title) {
            const lines = [title];
            const status = this.getDeviceStatus(stepKey);
            const result = this.getStepResult(stepKey);
            const devices = result?.devices;

            // 状态行 - 使用新的状态判定
            if (status === 'success') {
                lines.push(`  ${this.$t('export.status.label')}: ${this.$t('export.status.normal')}`);
            } else if (status === 'warning') {
                lines.push(`  ${this.$t('export.status.label')}: ${this.$t('export.status.fixed')}`);
            } else if (status === 'error') {
                const errorCount = this.getErrorCount(stepKey);
                lines.push(`  ${this.$t('export.status.label')}: ${errorCount}${this.$t('report.status.abnormalCount')}`);
            } else {
                lines.push(`  ${this.$t('export.status.label')}: ${this.$t('export.status.incomplete')}`);
            }

            // 详细信息
            if (Array.isArray(devices) && devices.length > 0) {
                lines.push(`  ${this.$t('export.device.list')}:`);
                devices.forEach((device, index) => {
                    const deviceName = device.speakerName || device.micName || device.cameraName || `Device ${index + 1}`;
                    const deviceResult = device.result === DeviceTestResult.PASSED ? this.$t('export.status.normal') :
                        device.result === DeviceTestResult.FAILED ? this.$t('export.device.checkFailed') : this.$t('export.device.notChecked');
                    const testTime = device.testTime ? ` (${this.$t('export.device.duration')}: ${device.testTime}ms)` : '';
                    lines.push(`    - ${deviceName}: ${deviceResult}${testTime}`);
                });
            } else if (Array.isArray(devices) && devices.length === 0) {
                // 无设备情况，显示具体的设备类型
                let noDeviceText = this.$t('report.issue.noDevice');
                if (stepKey === 'speaker') {
                    noDeviceText = this.$t('export.device.noSpeaker');
                } else if (stepKey === 'microphone') {
                    noDeviceText = this.$t('export.device.noMicrophone');
                } else if (stepKey === 'camera') {
                    noDeviceText = this.$t('export.device.noCamera');
                }
                lines.push(`  ${noDeviceText}`);
            } else if (!result) {
                lines.push(`  ${this.$t('export.device.notCheckedYet')}`);
            }

            return lines.join('\n');
        },

        /**
         * 格式化网络检测结果
         */
        formatNetworkResult() {
            const lines = [this.$t('export.device.network')];
            const status = this.getStepStatus('network');
            const result = this.getStepResult('network');

            // 慢速域名延迟阈值（毫秒）
            const SLOW_LATENCY_THRESHOLD = 400;

            // 状态行
            const statusText = this.getStatusText(status);
            lines.push(`  ${this.$t('export.status.label')}: ${statusText}`);

            if (!result?.report) {
                lines.push(`  ${this.$t('export.device.notCheckedYet')}`);
                return lines.join('\n');
            }

            const report = result.report;

            // 检测耗时
            if (report.summary?.totalDuration) {
                lines.push(`  ${this.$t('export.network.totalDuration')}: ${report.summary.totalDuration}ms`);
            }

            // 各项检测结果
            lines.push(`  ${this.$t('export.network.checkItems')}:`);
            const details = report.details || {};

            // 网络连通性
            if (details.network) {
                const netDetail = details.network;
                const netResult = netDetail.result || 'unknown';
                const statusText = this.getItemStatusText(netResult);
                const extra = netDetail.avgLatency ? ` (${this.$t('export.network.avgLatency')}: ${netDetail.avgLatency}ms)` : '';
                lines.push(`    - ${this.$t('export.network.connectivity')}: ${statusText}${extra}`);

                // 显示失败的域名
                const failedDomains = netDetail.domains?.filter(d => !d.success) || [];
                if (failedDomains.length > 0) {
                    const failedList = failedDomains.map(d => d.domain).join(', ');
                    lines.push(`      ${this.$t('export.network.failedDomains')}: ${failedList}`);
                }

                // 显示慢速域名（延迟 > 400ms 且成功的域名）
                const slowDomains = netDetail.domains?.filter(d => d.success && d.latency > SLOW_LATENCY_THRESHOLD) || [];
                if (slowDomains.length > 0) {
                    const slowList = slowDomains.map(d => `${d.domain} (${d.latency}ms)`).join(', ');
                    lines.push(`      ${this.$t('export.network.slowDomains')}: ${slowList}`);
                }
            }

            // CDN资源
            if (details.cdn) {
                const cdnDetail = details.cdn;
                const cdnResult = cdnDetail.result || 'unknown';
                lines.push(`    - ${this.$t('export.network.cdnResource')}: ${this.getItemStatusText(cdnResult)}`);

                // 显示失败的CDN节点
                const failedNodes = cdnDetail.nodes?.filter(n => !n.success) || [];
                if (failedNodes.length > 0) {
                    const failedList = failedNodes.map(n => n.domain || n.baseUrl).join(', ');
                    lines.push(`      ${this.$t('export.network.failedNodes')}: ${failedList}`);
                }

                // 显示慢速CDN节点（延迟 > 400ms 且成功的节点）
                const slowNodes = cdnDetail.nodes?.filter(n => n.success && n.latency > SLOW_LATENCY_THRESHOLD) || [];
                if (slowNodes.length > 0) {
                    const slowList = slowNodes.map(n => `${n.domain || n.baseUrl} (${n.latency}ms)`).join(', ');
                    lines.push(`      ${this.$t('export.network.slowDomains')}: ${slowList}`);
                }
            }

            // 课堂接口
            if (details.classroom) {
                const classDetail = details.classroom;
                const classResult = classDetail.result || 'unknown';
                lines.push(`    - ${this.$t('export.network.classroomApi')}: ${this.getItemStatusText(classResult)}`);

                // 显示主备域名均失败的服务
                const failedServices = classDetail.services?.filter(s =>
                    !s.primary.success && (!s.backup || !s.backup.success)
                ) || [];
                if (failedServices.length > 0) {
                    failedServices.forEach(s => {
                        lines.push(`      ${this.$t('export.network.bothFailed')}: ${s.serviceName}`);
                    });
                }

                // 显示主域名失败但备用域名成功的服务（已切换）
                const switchedServices = classDetail.services?.filter(s =>
                    !s.primary.success && s.backup && s.backup.success
                ) || [];
                if (switchedServices.length > 0) {
                    switchedServices.forEach(s => {
                        lines.push(`      ${this.$t('export.network.switchedToBackup')}: ${s.serviceName}`);
                    });
                }

                // 显示慢速域名（最终选择的域名延迟 > 400ms）
                const slowServices = classDetail.services?.filter(s => {
                    const selectedDomain = s.selectedDomain;
                    if (selectedDomain === s.primary.domain) {
                        return s.primary.success && s.primary.latency > SLOW_LATENCY_THRESHOLD;
                    } else if (s.backup && selectedDomain === s.backup.domain) {
                        return s.backup.success && s.backup.latency > SLOW_LATENCY_THRESHOLD;
                    }
                    return false;
                }) || [];
                if (slowServices.length > 0) {
                    const slowList = slowServices.map(s => {
                        const selectedDomain = s.selectedDomain;
                        const latency = selectedDomain === s.primary.domain ? s.primary.latency : s.backup?.latency;
                        return `${s.serviceName} (${latency}ms)`;
                    }).join(', ');
                    lines.push(`      ${this.$t('export.network.slowDomains')}: ${slowList}`);
                }
            }

            // IM信令
            if (details.im) {
                const imDetail = details.im;
                const imResult = imDetail.result || 'unknown';
                const extra = imDetail.sdkCheck?.connectionTime ? ` (${this.$t('export.network.connectionTime')}: ${imDetail.sdkCheck.connectionTime}ms)` : '';
                lines.push(`    - ${this.$t('export.network.imSignaling')}: ${this.getItemStatusText(imResult)}${extra}`);

                // 显示失败的检测项
                const failedItems = [];
                if (imDetail.sdkCheck && !imDetail.sdkCheck.success) {
                    failedItems.push(this.$t('export.network.sdkConnectFailed'));
                }
                if (imDetail.websocketCheck && !imDetail.websocketCheck.success) {
                    const failedWs = imDetail.websocketCheck.domains?.filter(d => !d.success) || [];
                    failedWs.forEach(d => {
                        failedItems.push(`${this.$t('export.network.wsConnectFailed')} (${d.domain})`);
                    });
                }
                if (imDetail.httpCheck && !imDetail.httpCheck.success) {
                    const failedHttp = imDetail.httpCheck.domains?.filter(d => !d.success) || [];
                    failedHttp.forEach(d => {
                        failedItems.push(`${this.$t('export.network.httpConnectFailed')} (${d.domain})`);
                    });
                }
                if (failedItems.length > 0) {
                    failedItems.forEach(item => {
                        lines.push(`      ${item}`);
                    });
                }
            }

            // TRTC音视频
            if (details.trtc) {
                const trtcDetail = details.trtc;
                const trtcResult = trtcDetail.result || 'unknown';
                lines.push(`    - ${this.$t('export.network.audioVideo')}: ${this.getItemStatusText(trtcResult)}`);

                // 显示失败的域名
                const failedDomains = trtcDetail.connectivity?.domains?.filter(d => !d.success) || [];
                if (failedDomains.length > 0) {
                    const failedList = failedDomains.map(d => d.domain).join(', ');
                    lines.push(`      ${this.$t('export.network.failedDomains')}: ${failedList}`);
                }
            }

            // 域名偏好设置
            if (result.domainPreference) {
                const pref = result.domainPreference;
                const switches = [];
                if (pref.classCdnUsedBackup) switches.push(this.$t('export.network.cdnDomain'));
                if (pref.classApiUsedBackup) switches.push(this.$t('export.network.classroomApiDomain'));
                if (pref.whiteboardResUsedBackup) switches.push(this.$t('export.network.whiteboardRes'));
                if (pref.whiteboardApiUsedBackup) switches.push(this.$t('export.network.whiteboardApi'));

                if (switches.length > 0) {
                    lines.push(`  ${this.$t('export.network.domainSwitch')}:`);
                    lines.push(`    ${this.$t('export.network.switchedToBackupDomains')}: ${switches.join(', ')}`);
                }
            }

            return lines.join('\n');
        },

        /**
         * 格式化系统环境结果
         */
        formatSystemResult() {
            const lines = [this.$t('export.device.system')];
            const networkResult = this.getStepResult('network');
            const systemDetails = networkResult?.report?.details?.system;

            if (!systemDetails) {
                lines.push(`  ${this.$t('export.status.label')}: ${this.$t('export.status.normal')}`);
                lines.push(`  ${this.$t('export.system.normalDesc')}`);
                return lines.join('\n');
            }

            const status = systemDetails.result || 'success';
            lines.push(`  ${this.$t('export.status.label')}: ${this.getItemStatusText(status)}`);

            // 浏览器信息
            if (systemDetails.browser) {
                lines.push(`  ${this.$t('export.system.browser')}: ${systemDetails.browser.name || this.$t('export.system.unknown')} ${systemDetails.browser.version || ''}`);
            }

            // 操作系统
            if (systemDetails.os) {
                lines.push(`  ${this.$t('export.system.os')}: ${systemDetails.os.name || this.$t('export.system.unknown')} ${systemDetails.os.version || ''}`);
            }

            // WebRTC支持
            if (systemDetails.webrtcSupport !== undefined) {
                lines.push(`  ${this.$t('export.system.webrtcSupport')}: ${systemDetails.webrtcSupport ? this.$t('export.system.yes') : this.$t('export.system.no')}`);
            }

            // 警告信息
            if (systemDetails.warnings && systemDetails.warnings.length > 0) {
                lines.push(`  ${this.$t('report.system.notes')}:`);
                systemDetails.warnings.forEach(warning => {
                    // 检查是否是国际化键（以 system.error. 开头）
                    let translatedWarning = warning;
                    if (typeof warning === 'string' && warning.startsWith('system.error.')) {
                        const colonIndex = warning.indexOf(':');
                        if (colonIndex > 0) {
                            const key = warning.substring(0, colonIndex).trim();
                            const extra = warning.substring(colonIndex + 1).trim();
                            const translated = this.$t(key);
                            translatedWarning = `${translated}${extra ? ': ' + extra : ''}`;
                        } else {
                            translatedWarning = this.$t(warning);
                        }
                    }
                    lines.push(`    ${translatedWarning}`);
                });
            }

            return lines.join('\n');
        },

        /**
         * 获取状态文本
         */
        getStatusText(status) {
            const statusMap = {
                success: this.$t('export.status.normal'),
                warning: this.$t('export.status.fixed'),
                error: this.$t('export.status.abnormal'),
                pending: this.$t('export.status.incomplete'),
                running: this.$t('export.status.checking')
            };
            return statusMap[status] || this.$t('export.status.unknown');
        },

        /**
         * 获取检测项状态文本
         */
        getItemStatusText(result) {
            const resultMap = {
                success: this.$t('export.status.normal'),
                fixed: this.$t('export.status.fixed'),
                warning: this.$t('export.status.partialAvailable'),
                failed: this.$t('export.status.failed'),
                unknown: this.$t('export.status.unknown')
            };
            return resultMap[result] || result;
        },

        /**
         * 格式化日期时间
         */
        formatDateTime(timestamp) {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../../styles/step-common.scss';

// 报告检测组件样式
.dc-report-check {
    padding: $dc-spacing-lg;

    .dc-step-title {
        margin-bottom: $dc-spacing-lg;
    }
}

// 操作按钮区域
.dc-report-actions {
    display: flex;
    gap: $dc-spacing-md;
    margin-bottom: $dc-spacing-xl;

    .dc-report-btn {
        flex: 1;
        height: 44px;
        font-size: $dc-font-size-md;
        border-radius: $dc-radius-sm;

        &--secondary {
            background-color: var(--dc-bg);
            border: 1px solid var(--dc-border);
            color: var(--dc-text-primary);

            &:hover {
                border-color: var(--dc-primary);
                color: var(--dc-primary);
            }
        }

        &--primary {
            background-color: var(--dc-primary);
            border-color: var(--dc-primary);
            color: #fff;

            &:hover {
                opacity: 0.9;
            }
        }
    }
}

// 检测结果列表
.dc-report-list {
    display: flex;
    flex-direction: column;
    gap: $dc-spacing-sm;
}

// 检测结果项
.dc-report-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: $dc-spacing-md $dc-spacing-lg;
    background-color: var(--dc-bg);
    border-radius: $dc-radius-sm;
    min-height: 56px;
    border-bottom: 1px solid var(--dc-border-light, #f0f0f0);

    &:last-child {
        border-bottom: none;
    }

    &__name {
        font-size: $dc-font-size-md;
        font-weight: 500;
        color: var(--dc-text-primary);
        min-width: 80px;
        padding-top: 2px;
    }

    &__result {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: $dc-spacing-xs;
        font-size: $dc-font-size-sm;

        > span:first-of-type {
            display: flex;
            align-items: center;
            gap: $dc-spacing-xs;
        }

        &.is-success {
            color: var(--dc-success, #67c23a);
        }

        &.is-error {
            color: var(--dc-error, #f56c6c);
        }

        &.is-warning {
            color: var(--dc-warning, #e6a23c);
        }

        &.is-pending {
            color: var(--dc-warning, #e6a23c);
        }
    }

    &__icon {
        &--success {
            color: var(--dc-success, #67c23a);
            font-size: 16px;
        }

        &--error {
            color: var(--dc-error, #f56c6c);
            font-size: 16px;
        }

        &--warning {
            color: var(--dc-warning, #e6a23c);
            font-size: 16px;
        }

        &--pending {
            color: var(--dc-warning, #e6a23c);
            font-size: 16px;
        }

        &--fixed {
            color: var(--dc-warning, #e6a23c);
            font-size: 16px;
        }
    }

    &__details {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        margin-top: $dc-spacing-xs;
    }

    &__issue {
        font-size: $dc-font-size-xs;
        color: var(--dc-error, #f56c6c);
    }

    &__device {
        font-size: $dc-font-size-xs;

        &--success {
            color: var(--dc-success, #67c23a);
        }

        &--failed {
            color: var(--dc-error, #f56c6c);
        }
    }

    &__fix {
        font-size: $dc-font-size-xs;
        color: var(--dc-warning, #e6a23c);
    }

    // 网络检测详细信息样式
    &__details--network {
        width: 100%;
        margin-top: $dc-spacing-sm;
    }

    &--network {
        .dc-report-item__result {
            flex-direction: column;
            align-items: flex-end;
        }
    }
}

// 网络检测详细项
.dc-network-detail-item {
    font-size: $dc-font-size-xs;
    color: var(--dc-text-secondary);
    margin-bottom: 4px;
    text-align: right;
}

.dc-network-check-item {
    display: flex;
    align-items: flex-start;
    font-size: $dc-font-size-xs;
    margin-left: $dc-spacing-sm;
    margin-bottom: 4px;
    text-align: right;
    flex-wrap: wrap;
    justify-content: flex-end;

    &__icon {
        margin-right: 4px;
        font-size: 12px;
    }

    &__name {
        color: var(--dc-text-secondary);
        margin-right: 4px;
    }

    &__status {
        font-weight: 500;
    }

    &__extra {
        color: var(--dc-text-tertiary);
        margin-left: 4px;
    }
}

// 网络图标颜色
.dc-network-icon {
    &--success {
        color: var(--dc-success, #67c23a);
    }

    &--fixed {
        color: var(--dc-warning, #e6a23c);
    }

    &--warning {
        color: var(--dc-warning, #e6a23c);
    }

    &--failed {
        color: var(--dc-error, #f56c6c);
    }
}

// 网络状态颜色
.dc-network-status {
    &--success {
        color: var(--dc-success, #67c23a);
    }

    &--fixed {
        color: var(--dc-warning, #e6a23c);
    }

    &--warning {
        color: var(--dc-warning, #e6a23c);
    }

    &--failed {
        color: var(--dc-error, #f56c6c);
    }
}

// 失败域名列表
.dc-network-failed-domains {
    width: 100%;
    margin-top: 2px;
    margin-left: 16px;
    font-size: $dc-font-size-xs;
    color: var(--dc-error, #f56c6c);
    text-align: right;
}

.dc-network-failed-label {
    margin-right: 4px;
}

.dc-network-failed-list {
    word-break: break-all;
}

// 慢速域名列表（橙色）
.dc-network-slow-domains {
    width: 100%;
    margin-top: 2px;
    margin-left: 16px;
    font-size: $dc-font-size-xs;
    color: var(--dc-warning, #e6a23c);
    text-align: right;
}

.dc-network-slow-label {
    margin-right: 4px;
    font-weight: 500;
}

.dc-network-slow-list {
    word-break: break-all;
}

// 域名切换信息
.dc-network-switches {
    margin-top: $dc-spacing-xs;
    padding-top: $dc-spacing-xs;
    border-top: 1px solid var(--dc-border-light, #f0f0f0);
}

.dc-network-switch-label {
    font-weight: 500;
    margin-bottom: 4px;
}

.dc-network-switch-item {
    margin-left: $dc-spacing-sm;
    color: var(--dc-warning, #e6a23c);
}
</style>
