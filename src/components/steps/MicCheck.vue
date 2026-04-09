<template>
    <div class="dc-step-panel dc-mic-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('mic.title') }}</h2>

        <!-- 提示信息 -->
        <div class="dc-step-hint">
            <span v-if="needsUserInteraction">{{ $t('mic.hintBeforeStart') }}</span>
            <span v-else-if="micPhase === 'recording'">
                {{ $t('mic.recording') }}
                <span class="dc-recording-badge">{{ recordingCountdown }}s</span>
            </span>
            <span v-else-if="micPhase === 'playing'">
                {{ $t('mic.playing') }}
                <span class="dc-playing-badge"><i class="el-icon-video-play" /></span>
            </span>
            <span v-else>{{ $t('mic.hint') }}</span>
            <i v-if="!needsUserInteraction && micPhase !== 'recording' && micPhase !== 'playing'" class="el-icon-time dc-step-hint__icon" />
        </div>

        <!-- 等待用户交互状态：显示"开始检测"按钮 -->
        <div v-if="needsUserInteraction" class="dc-step-content dc-start-check">
            <div class="dc-start-check__button-wrapper">
                <el-button
                    type="primary"
                    class="dc-start-check__btn"
                    @click="handleStartCheck"
                >
                    <i class="el-icon-video-play" />
                    {{ $t('mic.startButton') }}
                </el-button>
            </div>
        </div>

        <!-- ⚠️ 无设备状态 -->
        <div v-else-if="micDevices.length === 0" class="dc-step-content dc-no-device">
            <div class="dc-no-device__icon">
                <i class="el-icon-warning-outline" />
            </div>
            <div class="dc-no-device__text">{{ $t('mic.noDevice') }}</div>
            <div class="dc-no-device__hint">{{ $t('mic.noDeviceHint') }}</div>
        </div>

        <!-- 正常表单区域（有设备时显示） -->
        <div v-else class="dc-step-content dc-step-form">
            <!-- 麦克风选择 -->
            <div class="dc-step-form__item">
                <label class="dc-step-form__label">{{ $t('mic.label') }}</label>
                <el-select
                    v-model="selectedMicId"
                    class="dc-device-select"
                    :placeholder="$t('mic.selectPlaceholder')"
                    :disabled="micPhase === 'recording' || micPhase === 'playing'"
                    @change="handleMicChange"
                >
                    <el-option
                        v-for="device in micDevices"
                        :key="device.deviceId"
                        :label="device.deviceName || $t('mic.defaultDevice')"
                        :value="device.deviceId"
                    >
                        <span class="dc-device-option">
                            <i
                                v-if="getDeviceTestResult(device.deviceId) === DeviceTestResult.FAILED"
                                class="el-icon-close dc-device-option__failed-icon"
                            />
                            <span class="dc-device-option__name">{{ device.deviceName || $t('mic.defaultDevice') }}</span>
                        </span>
                    </el-option>
                </el-select>
            </div>

            <!-- 输入音量等级 -->
            <div class="dc-step-form__item">
                <label class="dc-step-form__label">{{ $t('mic.inputLevel') }}</label>
                <div class="dc-volume-bar">
                    <i class="el-icon-microphone dc-volume-bar__icon" />
                    <div class="dc-volume-bar__bars">
                        <span
                            v-for="i in 10"
                            :key="i"
                            class="dc-volume-bar__bar"
                            :class="{ 'is-active': i <= activeVolumeBars }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="!needsUserInteraction" class="dc-step-actions">
            <!-- 无设备状态：只显示一个下一步按钮，点击后标记失败并前进 -->
            <template v-if="micDevices.length === 0">
                <el-button
                    type="primary"
                    class="dc-step-btn dc-step-btn--primary"
                    @click="handleNoDeviceNext"
                >
                    {{ $t('下一步') }}
                </el-button>
            </template>
            <!-- 有设备状态：显示操作按钮 -->
            <template v-else>
                <!-- 录音/播放阶段：按钮 disabled -->
                <el-button
                    class="dc-step-btn dc-step-btn--secondary"
                    :disabled="micPhase === 'recording' || micPhase === 'playing'"
                    @click="handleNotWork"
                >
                    {{ $t('mic.notHeard') }}
                </el-button>
                <el-button
                    type="primary"
                    class="dc-step-btn dc-step-btn--primary"
                    :disabled="micPhase === 'recording'"
                    @click="handleWork"
                >
                    {{ $t('mic.heard') }}
                </el-button>
            </template>
        </div>
    </div>
</template>

<script>

import { TTrtcDeviceType, TTrtcDeviceState, TTrtcEventType } from '@tencent-classroom/device-check-sdk';
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';
import { BaseStepMixin, DeviceTestResult, CHECK_STATUS } from '../BaseStepMixin';
import { UserInteractionState } from '@tencent-classroom/device-check-sdk';

// 导出枚举供模板使用
const DeviceTestResultEnum = DeviceTestResult;

// 录音时长（秒）
const RECORDING_DURATION = 5;

export default {
    name: 'MicCheck',

    mixins: [BaseStepMixin],

    data() {
        return {
            // 暴露枚举给模板使用
            DeviceTestResult: DeviceTestResultEnum,
            // 是否需要用户交互（用于显示"开始检测"按钮）
            needsUserInteraction: false,
            // 选中的麦克风设备ID
            selectedMicId: '',
            // 麦克风设备列表
            micDevices: [],
            // 当前激活的音量条数量（基于实际音量）
            activeVolumeBars: 0,
            // 当前音量值
            currentVolume: 0,
            // 是否已开始测试
            isTesting: false,
            // 当前测试的设备索引
            currentTestIndex: 0,
            // 测试结果数组，每项包含 result, micId, micName, testTime
            testResults: [],
            // 当前设备测试开始时间
            currentTestStartTime: null,
            // 设备变更监听器取消函数
            deviceChangeUnsubscribe: null,
            // 音量更新监听器取消函数
            volumeUpdateUnsubscribe: null,
            // ========== 录音/播放相关 ==========
            // 当前麦克风检测阶段: 'recording' | 'playing' | 'feedback' | 'idle'
            micPhase: 'idle',
            // 录音倒计时（秒）
            recordingCountdown: RECORDING_DURATION,
            // 录音倒计时定时器
            recordingTimer: null,
            // 录音数据
            recordedBlob: null,
        };
    },

    created() {
    },

    mounted() {
        this.initDevices();
        this.registerDeviceChangeListener();
        this.registerVolumeUpdateListener();

        // 检查是否需要用户交互
        if (UserInteractionState.hasInteracted) {
            // 用户已交互，直接开始测试
            this.needsUserInteraction = false;
            this.startMicTest();
        } else {
            // 需要用户先交互
            this.needsUserInteraction = true;
            this.logInfo('等待用户交互后开始麦克风检测');
        }
    },

    beforeDestroy() {
        this.cleanupRecording();
        this.stopMicTest();
        // 取消设备变更监听
        this.unregisterDeviceChangeListener();
        // 取消音量更新监听
        this.unregisterVolumeUpdateListener();
    },

    methods: {
        // ========== 录音/播放流程方法 ==========

        /**
         * 开始录音流程（录音5秒）
         */
        async startRecordingPhase() {
            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                this.micPhase = 'recording';
                this.recordingCountdown = RECORDING_DURATION;
                this.recordedBlob = null;

                // 开始录音
                await trtc.startMicRecording();

                this.logInfo('开始录音', { duration: RECORDING_DURATION });

                // 启动倒计时
                this.recordingTimer = setInterval(() => {
                    this.recordingCountdown--;
                    if (this.recordingCountdown <= 0) {
                        this.finishRecording();
                    }
                }, 1000);
            } catch (error) {
                this.logError('开始录音失败', { error: error.message });
                // 录音失败，直接进入反馈阶段让用户选择
                this.micPhase = 'feedback';
            }
        },

        /**
         * 录音结束，停止录音并开始播放
         */
        async finishRecording() {
            // 清除倒计时定时器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();

                // 停止录音
                this.recordedBlob = await trtc.stopMicRecording();

                this.logInfo('录音完成', {
                    blobSize: this.recordedBlob?.size || 0
                });

                if (this.recordedBlob && this.recordedBlob.size > 0) {
                    // 开始播放录音
                    await this.startPlaybackPhase();
                } else {
                    // 没有录到数据，直接进入反馈阶段
                    this.logInfo('录音数据为空，直接进入反馈阶段');
                    this.micPhase = 'feedback';
                }
            } catch (error) {
                this.logError('停止录音失败', { error: error.message });
                this.micPhase = 'feedback';
            }
        },

        /**
         * 开始播放录音
         */
        async startPlaybackPhase() {
            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                this.micPhase = 'playing';

                this.logInfo('开始播放录音');

                await trtc.playRecording(this.recordedBlob, () => {
                    // 播放结束回调
                    this.logInfo('录音播放完成，进入反馈阶段');
                    this.micPhase = 'feedback';
                });
            } catch (error) {
                this.logError('播放录音失败', { error: error.message });
                // 播放失败，直接进入反馈阶段
                this.micPhase = 'feedback';
            }
        },

        /**
         * 清理录音/播放相关资源
         */
        cleanupRecording() {
            // 清除倒计时定时器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            // 停止播放
            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                trtc.stopPlayRecording();
            } catch (e) {
                // 忽略
            }

            // 停止录音
            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                trtc.stopMicRecording();
            } catch (e) {
                // 忽略
            }

            this.micPhase = 'idle';
            this.recordedBlob = null;
            this.recordingCountdown = RECORDING_DURATION;
        },

        // ========== 原有方法 ==========

        /**
         * 处理用户点击"开始检测"按钮
         */
        handleStartCheck() {
            this.emitAction('点击开始检测麦克风', {});

            // 标记用户已交互
            UserInteractionState.markAsInteracted();

            // 隐藏按钮，开始测试
            this.needsUserInteraction = false;
            this.startMicTest();

            this.logInfo('用户点击开始检测，开始麦克风测试');
        },

        /**
         * 初始化设备列表
         */
        initDevices() {
            this.refreshDeviceList();
        },

        /**
         * 刷新设备列表
         * @param {string} newDefaultDeviceId - 新的默认设备ID（可选）
         */
        /**
         * 刷新设备列表
         * @param {string} newDefaultDeviceId - 新的默认设备ID（可选）
         * @returns {boolean} 是否已在内部调用了 restartTestWithNewDevice（用于防止外部重复启动测试）
         */
        refreshDeviceList(newDefaultDeviceId = null) {
            const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
            const oldDeviceIds = this.micDevices.map(d => d.deviceId);

            // 从 TrtcUtil 获取所有设备，筛选麦克风设备
            this.micDevices = trtc.devices.filter(
                device => device.type === TTrtcDeviceType.Mic
            );

            // 同步更新测试结果数组
            // 保留已有设备的测试结果，为新设备添加 SKIPPED 状态
            const newTestResults = this.micDevices.map(device => {
                const existingResult = this.testResults.find(r => r.micId === device.deviceId);
                if (existingResult) {
                    return existingResult;
                }
                return {
                    result: DeviceTestResult.SKIPPED,
                    micId: device.deviceId,
                    micName: device.deviceName || '',
                    testTime: null
                };
            });
            this.testResults = newTestResults;

            // 处理默认设备切换
            if (newDefaultDeviceId) {
                const newDefaultIndex = this.micDevices.findIndex(d => d.deviceId === newDefaultDeviceId);
                if (newDefaultIndex !== -1) {
                    this.logInfo('检测到新的默认麦克风设备，自动切换', {
                        deviceId: newDefaultDeviceId,
                        deviceName: this.micDevices[newDefaultIndex]?.deviceName
                    });
                    this.currentTestIndex = newDefaultIndex;
                    this.selectedMicId = newDefaultDeviceId;
                    // 重新开始测试
                    this.restartTestWithNewDevice(newDefaultDeviceId);
                    return true;
                }
            }

            // 如果当前选中的设备已被移除，切换到下一个可用设备
            if (this.selectedMicId && !this.micDevices.find(d => d.deviceId === this.selectedMicId)) {
                this.logInfo('当前麦克风设备已断开，自动切换到下一个设备');
                const nextIndex = this.findNextUntestedDeviceIndex();
                if (nextIndex !== -1) {
                    this.currentTestIndex = nextIndex;
                    this.selectedMicId = this.micDevices[nextIndex].deviceId;
                    this.restartTestWithNewDevice(this.selectedMicId);
                    return true;
                } else if (this.micDevices.length > 0) {
                    // 没有未测试的设备，选择第一个
                    this.currentTestIndex = 0;
                    this.selectedMicId = this.micDevices[0].deviceId;
                    this.restartTestWithNewDevice(this.selectedMicId);
                    return true;
                }
            } else if (this.micDevices.length > 0 && this.selectedMicId) {
                // 当前选中的设备仍在列表中，同步更新 currentTestIndex（设备列表顺序可能因新增/移除设备而变化）
                const updatedIndex = this.micDevices.findIndex(d => d.deviceId === this.selectedMicId);
                if (updatedIndex !== -1) {
                    this.currentTestIndex = updatedIndex;
                }
            } else if (this.micDevices.length > 0 && !this.selectedMicId) {
                // 初始化时选择默认设备
                const defaultMic = DeviceCheckSDK.current.device.getTrtcInstance().micId;
                if (defaultMic) {
                    this.currentTestIndex = this.micDevices.findIndex(device => device.deviceId === defaultMic);
                    if (this.currentTestIndex === -1) {
                        this.currentTestIndex = 0;
                    }
                    this.selectedMicId = defaultMic;
                } else {
                    this.currentTestIndex = 0;
                    this.selectedMicId = this.micDevices[0].deviceId;
                }
            }

            this.logInfo('麦克风设备列表已更新', {
                count: this.micDevices.length,
                devices: this.micDevices.map(d => d.deviceName),
                selectedId: this.selectedMicId
            });

            return false;
        },

        /**
         * 使用新设备重新开始测试
         */
        async restartTestWithNewDevice(deviceId) {
            this.cleanupRecording();
            await this.stopMicTest();
            this.currentTestStartTime = new Date();
            await this.startMicTest();
        },

        /**
         * 注册设备变更监听
         */
        registerDeviceChangeListener() {
            const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
            this.deviceChangeUnsubscribe = trtc.on(TTrtcEventType.DeviceChanged, this.handleDeviceChange.bind(this));
            this.logInfo('已注册设备变更监听');
        },

        /**
         * 取消设备变更监听
         */
        unregisterDeviceChangeListener() {
            if (this.deviceChangeUnsubscribe) {
                this.deviceChangeUnsubscribe();
                this.deviceChangeUnsubscribe = null;
                this.logInfo('已取消设备变更监听');
            }
        },

        /**
         * 注册音量更新监听
         */
        registerVolumeUpdateListener() {
            const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
            this.volumeUpdateUnsubscribe = trtc.on(TTrtcEventType.VolumeUpdate, this.handleVolumeUpdate.bind(this));
            this.logInfo('已注册音量更新监听');
        },

        /**
         * 取消音量更新监听
         */
        unregisterVolumeUpdateListener() {
            if (this.volumeUpdateUnsubscribe) {
                this.volumeUpdateUnsubscribe();
                this.volumeUpdateUnsubscribe = null;
                this.logInfo('已取消音量更新监听');
            }
        },

        /**
         * 处理音量更新事件
         * @param {Object} event - 音量更新事件数据 { volume: number }
         */
        handleVolumeUpdate(event) {
            if (!this.isTesting) {
                return;
            }
            this.currentVolume = event.volume;
            // 将 0-100 的音量值映射到 0-10 的音量条数量
            this.activeVolumeBars = Math.ceil(event.volume / 10);
        },

        /**
         * 处理设备变更事件
         * @param {Object} event - 设备变更事件数据
         */
        handleDeviceChange(event) {
            // 只处理麦克风设备变更
            if (event.type !== TTrtcDeviceType.Mic) {
                return;
            }

            this.logInfo('检测到麦克风设备变更', event);

            if (event.state === TTrtcDeviceState.Add) {
                // 新设备添加
                const wasEmpty = this.micDevices.length === 0;
                // 如果是默认设备，自动切换到该设备
                // refreshDeviceList 返回 true 表示内部已调用 restartTestWithNewDevice，无需再启动测试
                const alreadyRestarted = this.refreshDeviceList(event.isDefault ? event.deviceId : null);

                // 如果之前是无设备状态，现在有设备了，且 refreshDeviceList 内部没有自行重启测试，则自动开始测试
                if (!alreadyRestarted && wasEmpty && this.micDevices.length > 0) {
                    this.logInfo('检测到麦克风设备接入，自动开始测试');
                    this.startMicTest();
                }
            } else if (event.state === TTrtcDeviceState.Remove) {
                // 设备移除
                this.refreshDeviceList();
            }
        },

        /**
         * 开始麦克风测试
         */
        async startMicTest() {
            // 无设备时不启动测试
            if (this.micDevices.length === 0) {
                this.logInfo('无麦克风设备，跳过测试启动');
                return;
            }

            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();

                // 记录当前设备测试开始时间
                this.currentTestStartTime = new Date();

                // 如果有选中的麦克风，先切换
                if (this.selectedMicId) {
                    await trtc.switchMic(this.selectedMicId);
                }

                // 开始麦克风测试
                await trtc.startMicTest();
                this.isTesting = true;

                // 通知父组件状态变为运行中
                this.markAsRunning();

                this.logInfo('麦克风测试开始', {
                    micId: this.selectedMicId,
                    deviceIndex: this.currentTestIndex + 1,
                    totalDevices: this.micDevices.length
                });

                // Electron 端暂不支持录音功能，直接让用户看音量等级选择
                // Web 端走录音-播放-反馈流程
                if (false) {
                    await this.startRecordingPhase();
                } else {
                    // Electron 端直接进入反馈阶段，用户看音量等级选择
                    this.micPhase = 'feedback';
                    this.logInfo('Electron 环境，跳过录音流程，直接进入反馈阶段');
                }// Electron 端直接进入反馈阶段，用户看音量等级选择
            } catch (error) {
                this.logError('麦克风测试启动失败', { error: error.message });
                // 记录当前设备测试失败
                this.recordTestResult(DeviceTestResult.FAILED);
                // 尝试下一个设备
                await this.tryNextUntestedDevice();
            }
        },

        /**
         * 停止麦克风测试
         */
        async stopMicTest() {
            try {
                // 重置音量条
                this.activeVolumeBars = 0;
                this.currentVolume = 0;

                if (this.isTesting) {
                    const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                    await trtc.stopMicTest();
                    this.isTesting = false;
                }
            } catch (error) {
                this.logError('停止麦克风测试失败', { error: error.message });
            }
        },

        /**
         * 获取设备的测试结果状态
         * @param {string} deviceId - 设备ID
         * @returns {string} 测试结果状态
         */
        getDeviceTestResult(deviceId) {
            const result = this.testResults.find(r => r.micId === deviceId);
            return result ? result.result : DeviceTestResult.SKIPPED;
        },

        /**
         * 查找下一个未检测过的设备索引
         * @returns {number} 下一个未检测设备的索引，如果没有则返回 -1
         */
        findNextUntestedDeviceIndex() {
            for (let i = 0; i < this.testResults.length; i++) {
                if (this.testResults[i].result === DeviceTestResult.SKIPPED) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * 处理麦克风切换（用户手动切换）
         */
        async handleMicChange(deviceId) {
            this.emitAction('切换麦克风设备', { deviceId });

            try {
                // 清理当前录音/播放
                this.cleanupRecording();

                // 更新当前测试索引
                const newIndex = this.micDevices.findIndex(d => d.deviceId === deviceId);
                if (newIndex !== -1) {
                    this.currentTestIndex = newIndex;
                }

                // 重置当前设备测试开始时间
                this.currentTestStartTime = new Date();

                // 停止当前测试
                await this.stopMicTest();

                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                await trtc.switchMic(deviceId);

                // 重新开始测试
                await trtc.startMicTest();
                this.isTesting = true;

                this.logInfo('麦克风已切换', {
                    deviceId,
                    deviceName: this.micDevices.find(d => d.deviceId === deviceId)?.deviceName
                });

                // 直接进入反馈阶段，让用户看音量等级选择
                this.micPhase = 'feedback';
            } catch (error) {
                this.logError('切换麦克风失败', { error: error.message });
                // 用户手动选择的设备切换失败，记录失败并自动跳转到下一个未检测的设备
                this.recordTestResult(DeviceTestResult.FAILED);
                await this.tryNextUntestedDevice();
            }
        },

        /**
         * 记录当前设备的测试结果
         * @param {DeviceTestResult} result - 测试结果
         */
        recordTestResult(result) {
            const testTime = this.currentTestStartTime
                ? new Date().getTime() - this.currentTestStartTime.getTime()
                : 0;

            if (this.testResults[this.currentTestIndex]) {
                this.testResults[this.currentTestIndex].result = result;
                this.testResults[this.currentTestIndex].testTime = testTime;
            }
        },

        /**
         * 尝试切换到下一个未检测过的设备进行测试
         * @returns {boolean} 是否还有下一个设备可测试
         */
        async tryNextUntestedDevice() {
            // 从当前索引之后查找下一个未检测的设备
            const nextIndex = this.findNextUntestedDeviceIndex();
            // 检查是否还有未检测的设备
            if (nextIndex === -1) {
                // 所有设备都已测试完毕，检查是否有通过的设备
                const testedResults = this.getTestedResults();
                const hasPassedDevice = testedResults.some(r => r.result === DeviceTestResult.PASSED);

                // 清理录音/播放
                this.cleanupRecording();
                // 停止测试
                await this.stopMicTest();

                // 触发 complete 事件，只返回实际测试过的设备结果
                if (hasPassedDevice) {
                    this.markAsSuccess(testedResults);
                } else {
                    this.markAsError(testedResults);
                }

                this.logInfo('麦克风检测完成', {
                    hasPassedDevice,
                    results: testedResults
                });

                return false;
            }

            // 清理当前录音/播放
            this.cleanupRecording();

            // 切换到下一个未检测的设备
            this.currentTestIndex = nextIndex;
            const nextDevice = this.micDevices[nextIndex];
            this.selectedMicId = nextDevice.deviceId;

            // 重新开始测试
            await this.stopMicTest();
            await this.startMicTest();

            this.logInfo('自动切换到下一个未检测的麦克风', {
                deviceId: nextDevice.deviceId,
                deviceName: nextDevice.deviceName,
                deviceIndex: nextIndex + 1,
                totalDevices: this.micDevices.length
            });

            return true;
        },

        /**
         * 处理无设备状态下点击"下一步"按钮
         * 将这一步标记为失败并前进到下一步
         */
        handleNoDeviceNext() {
            this.emitAction('无设备点击下一步', {});

            this.logInfo('麦克风检测失败：未检测到麦克风设备', {
                results: []
            });

            // 标记为失败并前进到下一步
            this.markAsError([]);
        },

        /**
         * 获取实际测试过的设备结果（过滤掉SKIPPED状态）
         */
        getTestedResults() {
            return this.testResults.filter(r => r.result !== DeviceTestResult.SKIPPED);
        },

        /**
         * 处理"听到了"按钮点击
         */
        async handleWork() {
            this.emitAction('点击听到了', {
                micId: this.selectedMicId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 清理录音/播放资源
            this.cleanupRecording();

            // 记录当前设备测试通过
            this.recordTestResult(DeviceTestResult.PASSED);

            // 停止测试
            await this.stopMicTest();

            // 获取实际测试过的结果（不包含SKIPPED状态的设备）
            const testedResults = this.getTestedResults();

            // 通知父组件检测成功，只返回实际测试过的设备结果
            this.markAsSuccess(testedResults);

            this.logInfo('麦克风检测通过', {
                micId: this.selectedMicId,
                micName: this.micDevices[this.currentTestIndex]?.deviceName,
                results: testedResults
            });
        },

        /**
         * 处理"没听到"按钮点击
         */
        async handleNotWork() {
            this.emitAction('点击没听到', {
                micId: this.selectedMicId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 清理录音/播放资源
            this.cleanupRecording();

            // 记录当前设备测试失败
            this.recordTestResult(DeviceTestResult.FAILED);

            this.logInfo('麦克风检测未通过，尝试下一个设备', {
                micId: this.selectedMicId,
                micName: this.micDevices[this.currentTestIndex]?.deviceName,
                deviceIndex: this.currentTestIndex + 1,
                totalDevices: this.micDevices.length
            });

            // 尝试切换到下一个未检测过的设备继续测试
            await this.tryNextUntestedDevice();
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../../styles/step-common.scss';

// 麦克风检测组件特有样式
.dc-mic-check {
    // 设备选择器
    .dc-device-select {
        width: 100%;
        max-width: 400px;
    }

    // 设备选项样式
    .dc-device-option {
        display: flex;
        align-items: center;
        gap: 8px;

        &__failed-icon {
            color: var(--dc-danger, #f56c6c);
            font-size: 14px;
            font-weight: bold;
        }

        &__name {
            flex: 1;
        }
    }

    // 音量条组件
    .dc-volume-bar {
        display: flex;
        align-items: center;
        gap: $dc-spacing-md;
        flex: 1;
        max-width: 400px;

        &__icon {
            flex-shrink: 0;
            font-size: 20px;
            color: var(--dc-text-secondary);
        }

        &__bars {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 1;
        }

        &__bar {
            width: 32px;
            height: 24px;
            background-color: var(--dc-progress-bg, #e5e6eb);
            border-radius: $dc-radius-sm;
            transition: background-color 0.15s ease;

            &.is-active {
                background-color: var(--dc-primary);
            }
        }
    }

    // 录音中徽章（在 hint 区域内联显示）
    .dc-recording-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        padding: 3px 8px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        color: #fff;
        background-color: var(--dc-danger, #f56c6c);
        border-radius: 10px;
        animation: dc-recording-pulse 1s ease-in-out infinite;
        vertical-align: middle;
        transform: translateY(-2px);
    }

    @keyframes dc-recording-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    // 播放中徽章（在 hint 区域内联显示）
    .dc-playing-badge {
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        color: var(--dc-primary);
        font-size: 16px;
        animation: dc-playing-pulse 1s ease-in-out infinite;
        vertical-align: middle;
    }

    @keyframes dc-playing-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    // 开始检测按钮区域
    .dc-start-check {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;

        &__button-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: $dc-spacing-md;
        }

        &__btn {
            min-width: 200px;
            height: 56px;
            font-size: 18px;
            border-radius: $dc-radius-lg;
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
                margin-right: $dc-spacing-sm;
                font-size: 20px;
            }
        }
    }

    // ================================
    // 移动端适配（屏幕宽度 <= 480px）
    // ================================
    @media screen and (max-width: 480px) {
        // 设备选择器全宽
        .dc-device-select {
            max-width: 100%;
        }

        // 音量条自适应
        .dc-volume-bar {
            max-width: 100%;

            &__bars {
                gap: 4px;
            }

            &__bar {
                width: auto;
                flex: 1;
                min-width: 16px;
                height: 20px;
            }
        }
    }
}
</style>
