<template>
    <div class="dc-step-panel dc-speaker-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('speaker.title') }}</h2>

        <!-- 提示信息 -->
        <div class="dc-step-hint">
            <span>{{ needsUserInteraction ? $t('speaker.hintBeforeStart') : $t('speaker.hint') }}</span>
            <i v-if="!needsUserInteraction" class="el-icon-time dc-step-hint__icon" />
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
                    {{ $t('speaker.startButton') }}
                </el-button>
            </div>
        </div>

        <!-- ⚠️ 无设备状态 -->
        <div v-else-if="speakerDevices.length === 0" class="dc-step-content dc-no-device">
            <div class="dc-no-device__icon">
                <i class="el-icon-warning-outline" />
            </div>
            <div class="dc-no-device__text">{{ $t('speaker.noDevice') }}</div>
            <div class="dc-no-device__hint">{{ $t('speaker.noDeviceHint') }}</div>
        </div>

        <!-- 正常表单区域（有设备时显示） -->
        <div v-else class="dc-step-content dc-step-form">
            <!-- 扬声器选择 -->
            <div class="dc-step-form__item">
                <label class="dc-step-form__label">{{ $t('speaker.label') }}</label>
                <el-select
                    v-model="selectedSpeakerId"
                    class="dc-device-select"
                    :placeholder="$t('speaker.selectPlaceholder')"
                    @change="handleSpeakerChange"
                >
                    <el-option
                        v-for="device in speakerDevices"
                        :key="device.deviceId"
                        :label="device.deviceName || $t('speaker.defaultDevice')"
                        :value="device.deviceId"
                    >
                        <span class="dc-device-option">
                            <i
                                v-if="getDeviceTestResult(device.deviceId) === DeviceTestResult.FAILED"
                                class="el-icon-close dc-device-option__failed-icon"
                            />
                            <span class="dc-device-option__name">{{ device.deviceName || $t('speaker.defaultDevice') }}</span>
                        </span>
                    </el-option>
                </el-select>
            </div>

            <!-- 音量等级 -->
            <div class="dc-step-form__item">
                <label class="dc-step-form__label">{{ $t('speaker.volumeLevel') }}</label>
                <div class="dc-volume-bar">
                    <i class="el-icon-video-play dc-volume-bar__icon" />
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
            <template v-if="speakerDevices.length === 0">
                <el-button
                    type="primary"
                    class="dc-step-btn dc-step-btn--primary"
                    @click="handleNoDeviceNext"
                >
                    {{ $t('下一步') }}
                </el-button>
            </template>
            <!-- 有设备状态：显示正常的操作按钮 -->
            <template v-else>
                <el-button
                    class="dc-step-btn dc-step-btn--secondary"
                    @click="handleNotHeard"
                >
                    {{ $t('speaker.notHeard') }}
                </el-button>
                <el-button
                    type="primary"
                    class="dc-step-btn dc-step-btn--primary"
                    @click="handleHeard"
                >
                    {{ $t('speaker.heard') }}
                </el-button>
            </template>
        </div>
    </div>
</template>

<script>
import { TTrtcDeviceType, TTrtcDeviceState, TTrtcEventType, TRTC_SPEAKER_TEST_PATH } from '@tencent-classroom/device-check-sdk';
import { DeviceCheckSDK } from '@tencent-classroom/device-check-sdk';
import { BaseStepMixin, DeviceTestResult, CHECK_STATUS } from '../BaseStepMixin';
import { UserInteractionState } from '@tencent-classroom/device-check-sdk';

// 导出枚举供模板使用
const DeviceTestResultEnum = DeviceTestResult;

export default {
    name: 'SpeakerCheck',

    mixins: [BaseStepMixin],

    data() {
        return {
            // 暴露枚举给模板使用
            DeviceTestResult: DeviceTestResultEnum,
            // 是否需要用户交互（用于显示"开始检测"按钮）
            needsUserInteraction: false,
            // 选中的扬声器设备ID
            selectedSpeakerId: '',
            // 扬声器设备列表
            speakerDevices: [],
            // 当前激活的音量条数量（用于模拟音量可视化）
            activeVolumeBars: 0,
            // 音量动画定时器
            volumeAnimationTimer: null,
            // 是否已开始播放
            isPlaying: false,
            // 当前测试的设备索引
            currentTestIndex: 0,
            // 测试结果数组，每项包含 result, speakerId, speakerName, testTime
            testResults: [],
            // 当前设备测试开始时间
            currentTestStartTime: null,
            // 设备变更监听器取消函数
            deviceChangeUnsubscribe: null
        };
    },

    created() {
    },

    mounted() {
        this.initDevices();
        this.registerDeviceChangeListener();

        // 检查是否需要用户交互
        if (UserInteractionState.hasInteracted) {
            // 用户已交互，直接开始测试
            this.needsUserInteraction = false;
            this.startSpeakerTest();
        } else {
            // 需要用户先交互
            this.needsUserInteraction = true;
            this.logInfo('等待用户交互后开始扬声器检测');
        }
    },

    beforeDestroy() {
        this.stopSpeakerTest();
        // 取消设备变更监听
        this.unregisterDeviceChangeListener();
    },

    methods: {
        /**
         * 处理用户点击"开始检测"按钮
         */
        handleStartCheck() {
            this.emitAction('点击开始检测扬声器', {});

            // 标记用户已交互
            UserInteractionState.markAsInteracted();

            // 隐藏按钮，开始测试
            this.needsUserInteraction = false;
            this.startSpeakerTest();

            this.logInfo('用户点击开始检测，开始扬声器测试');
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
            const oldDeviceIds = this.speakerDevices.map(d => d.deviceId);

            // 从 TrtcUtil 获取所有设备，筛选扬声器设备
            this.speakerDevices = trtc.devices.filter(
                device => device.type === TTrtcDeviceType.Speaker
            );

            // 同步更新测试结果数组
            // 保留已有设备的测试结果，为新设备添加 SKIPPED 状态
            const newTestResults = this.speakerDevices.map(device => {
                const existingResult = this.testResults.find(r => r.speakerId === device.deviceId);
                if (existingResult) {
                    return existingResult;
                }
                return {
                    result: DeviceTestResult.SKIPPED,
                    speakerId: device.deviceId,
                    speakerName: device.deviceName || '',
                    testTime: null
                };
            });
            this.testResults = newTestResults;

            // 处理默认设备切换
            if (newDefaultDeviceId) {
                const newDefaultIndex = this.speakerDevices.findIndex(d => d.deviceId === newDefaultDeviceId);
                if (newDefaultIndex !== -1) {
                    this.logInfo('检测到新的默认扬声器设备，自动切换', {
                        deviceId: newDefaultDeviceId,
                        deviceName: this.speakerDevices[newDefaultIndex]?.deviceName
                    });
                    this.currentTestIndex = newDefaultIndex;
                    this.selectedSpeakerId = newDefaultDeviceId;
                    // 重新开始测试
                    this.restartTestWithNewDevice(newDefaultDeviceId);
                    return true;
                }
            }

            // 如果当前选中的设备已被移除，切换到下一个可用设备
            if (this.selectedSpeakerId && !this.speakerDevices.find(d => d.deviceId === this.selectedSpeakerId)) {
                this.logInfo('当前扬声器设备已断开，自动切换到下一个设备');
                const nextIndex = this.findNextUntestedDeviceIndex();
                if (nextIndex !== -1) {
                    this.currentTestIndex = nextIndex;
                    this.selectedSpeakerId = this.speakerDevices[nextIndex].deviceId;
                    this.restartTestWithNewDevice(this.selectedSpeakerId);
                    return true;
                } else if (this.speakerDevices.length > 0) {
                    // 没有未测试的设备，选择第一个
                    this.currentTestIndex = 0;
                    this.selectedSpeakerId = this.speakerDevices[0].deviceId;
                    this.restartTestWithNewDevice(this.selectedSpeakerId);
                    return true;
                }
            } else if (this.speakerDevices.length > 0 && this.selectedSpeakerId) {
                // 当前选中的设备仍在列表中，同步更新 currentTestIndex（设备列表顺序可能因新增/移除设备而变化）
                const updatedIndex = this.speakerDevices.findIndex(d => d.deviceId === this.selectedSpeakerId);
                if (updatedIndex !== -1) {
                    this.currentTestIndex = updatedIndex;
                }
            } else if (this.speakerDevices.length > 0 && !this.selectedSpeakerId) {
                // 初始化时选择默认设备
                const defaultSpeaker = DeviceCheckSDK.current.device.getTrtcInstance().speakerId;
                if (defaultSpeaker) {
                    this.currentTestIndex = this.speakerDevices.findIndex(device => device.deviceId === defaultSpeaker);
                    this.selectedSpeakerId = defaultSpeaker;
                } else {
                    this.currentTestIndex = 0;
                    this.selectedSpeakerId = this.speakerDevices[0].deviceId;
                }
            }

            this.logInfo('扬声器设备列表已更新', {
                count: this.speakerDevices.length,
                devices: this.speakerDevices.map(d => d.deviceName),
                selectedId: this.selectedSpeakerId
            });

            return false;
        },

        /**
         * 使用新设备重新开始测试
         */
        async restartTestWithNewDevice(deviceId) {
            await this.stopSpeakerTest();
            this.currentTestStartTime = new Date();
            await this.startSpeakerTest();
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
         * 处理设备变更事件
         * @param {Object} event - 设备变更事件数据
         */
        handleDeviceChange(event) {
            // 只处理扬声器设备变更
            if (event.type !== TTrtcDeviceType.Speaker) {
                return;
            }

            this.logInfo('检测到扬声器设备变更', event);

            if (event.state === TTrtcDeviceState.Add) {
                // 新设备添加
                const wasEmpty = this.speakerDevices.length === 0;
                // 如果是默认设备，自动切换到该设备
                // refreshDeviceList 返回 true 表示内部已调用 restartTestWithNewDevice，无需再启动测试
                const alreadyRestarted = this.refreshDeviceList(event.isDefault ? event.deviceId : null);

                // 如果之前是无设备状态，现在有设备了，且 refreshDeviceList 内部没有自行重启测试，则自动开始测试
                if (!alreadyRestarted && wasEmpty && this.speakerDevices.length > 0) {
                    this.logInfo('检测到扬声器设备接入，自动开始测试');
                    this.startSpeakerTest();
                }
            } else if (event.state === TTrtcDeviceState.Remove) {
                // 设备移除
                this.refreshDeviceList();
            }
        },

        /**
         * 开始扬声器测试
         */
        async startSpeakerTest() {
            // 无设备时不启动测试
            if (this.speakerDevices.length === 0) {
                this.logInfo('无扬声器设备，跳过测试启动');
                return;
            }

            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();

                // 记录当前设备测试开始时间
                this.currentTestStartTime = new Date();

                // 如果有选中的扬声器，先切换
                if (this.selectedSpeakerId) {
                    await trtc.switchSpeaker(this.selectedSpeakerId);
                }

                // 开始播放测试音频
                await trtc.startSpeakerTest(TRTC_SPEAKER_TEST_PATH);
                this.isPlaying = true;

                // 通知父组件状态变为运行中
                this.markAsRunning();

                // 开始音量动画
                this.startVolumeAnimation();

                // 再切一下设备
                if (this.selectedSpeakerId) {
                    await trtc.switchSpeaker(this.selectedSpeakerId);
                }

                this.logInfo('扬声器测试开始', {
                    speakerId: this.selectedSpeakerId,
                    deviceIndex: this.currentTestIndex + 1,
                    totalDevices: this.speakerDevices.length
                });
            } catch (error) {
                this.logError('扬声器测试启动失败', { error: error.message });
                // 记录当前设备测试失败
                this.recordTestResult(DeviceTestResult.FAILED);
                // 尝试下一个设备
                await this.tryNextUntestedDevice();
            }
        },

        /**
         * 停止扬声器测试
         */
        async stopSpeakerTest() {
            try {
                this.stopVolumeAnimation();

                if (this.isPlaying) {
                    const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                    await trtc.stopSpeakerTest();
                    this.isPlaying = false;
                }
            } catch (error) {
                this.logError('停止扬声器测试失败', { error: error.message });
            }
        },

        /**
         * 开始音量动画（模拟音量条变化）
         */
        startVolumeAnimation() {
            // 模拟音量波动效果
            this.volumeAnimationTimer = setInterval(() => {
                // 随机生成 4-8 之间的活跃条数，模拟音量变化
                this.activeVolumeBars = Math.floor(Math.random() * 5) + 4;
            }, 200);
        },

        /**
         * 停止音量动画
         */
        stopVolumeAnimation() {
            if (this.volumeAnimationTimer) {
                clearInterval(this.volumeAnimationTimer);
                this.volumeAnimationTimer = null;
            }
            this.activeVolumeBars = 0;
        },

        /**
         * 获取设备的测试结果状态
         * @param {string} deviceId - 设备ID
         * @returns {string} 测试结果状态
         */
        getDeviceTestResult(deviceId) {
            const result = this.testResults.find(r => r.speakerId === deviceId);
            return result ? result.result : DeviceTestResult.SKIPPED;
        },

        /**
         * 查找下一个未检测过的设备索引
         * @param {number} startIndex - 起始索引
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
         * 处理扬声器切换（用户手动切换）
         */
        async handleSpeakerChange(deviceId) {
            this.emitAction('切换扬声器设备', { deviceId });

            try {
                // 更新当前测试索引
                const newIndex = this.speakerDevices.findIndex(d => d.deviceId === deviceId);
                if (newIndex !== -1) {
                    this.currentTestIndex = newIndex;
                }

                // 重置当前设备测试开始时间
                this.currentTestStartTime = new Date();

                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                await trtc.switchSpeaker(deviceId);

                this.logInfo('扬声器已切换', {
                    deviceId,
                    deviceName: this.speakerDevices.find(d => d.deviceId === deviceId)?.deviceName
                });
            } catch (error) {
                this.logError('切换扬声器失败', { error: error.message });
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
            const nextIndex = this.findNextUntestedDeviceIndex(this.currentTestIndex + 1);
            // 检查是否还有未检测的设备
            if (nextIndex === -1) {
                // 所有设备都已测试完毕，检查是否有通过的设备
                const testedResults = this.getTestedResults();
                const hasPassedDevice = testedResults.some(r => r.result === DeviceTestResult.PASSED);

                // 停止测试
                await this.stopSpeakerTest();

                // 触发 complete 事件，只返回实际测试过的设备结果
                if (hasPassedDevice) {
                    this.markAsSuccess(testedResults);
                } else {
                    this.markAsError(testedResults);
                }

                this.logInfo('扬声器检测完成', {
                    hasPassedDevice,
                    results: testedResults
                });

                return false;
            }

            // 切换到下一个未检测的设备
            this.currentTestIndex = nextIndex;
            const nextDevice = this.speakerDevices[nextIndex];
            this.selectedSpeakerId = nextDevice.deviceId;

            // 重新开始测试
            await this.stopSpeakerTest();
            await this.startSpeakerTest();

            this.logInfo('自动切换到下一个未检测的扬声器', {
                deviceId: nextDevice.deviceId,
                deviceName: nextDevice.deviceName,
                deviceIndex: nextIndex + 1,
                totalDevices: this.speakerDevices.length
            });

            return true;
        },

        /**
         * 处理无设备状态下点击"下一步"按钮
         * 将这一步标记为失败并前进到下一步
         */
        handleNoDeviceNext() {
            this.emitAction('无设备点击下一步', {});

            this.logInfo('扬声器检测失败：未检测到扬声器设备', {
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
        async handleHeard() {
            this.emitAction('点击听到了', {
                speakerId: this.selectedSpeakerId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 记录当前设备测试通过
            this.recordTestResult(DeviceTestResult.PASSED);

            // 停止测试
            await this.stopSpeakerTest();

            // 获取实际测试过的结果（不包含SKIPPED状态的设备）
            const testedResults = this.getTestedResults();

            // 通知父组件检测成功，只返回实际测试过的设备结果
            this.markAsSuccess(testedResults);

            this.logInfo('扬声器检测通过', {
                speakerId: this.selectedSpeakerId,
                speakerName: this.speakerDevices[this.currentTestIndex]?.deviceName,
                results: testedResults
            });
        },

        /**
         * 处理"没听到"按钮点击
         */
        async handleNotHeard() {
            this.emitAction('点击没听到', {
                speakerId: this.selectedSpeakerId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 记录当前设备测试失败
            this.recordTestResult(DeviceTestResult.FAILED);

            this.logInfo('扬声器检测未通过，尝试下一个设备', {
                speakerId: this.selectedSpeakerId,
                speakerName: this.speakerDevices[this.currentTestIndex]?.deviceName,
                deviceIndex: this.currentTestIndex + 1,
                totalDevices: this.speakerDevices.length
            });

            // 尝试切换到下一个未检测过的设备继续测试
            await this.tryNextUntestedDevice();
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../../styles/step-common.scss';

// 扬声器检测组件特有样式
.dc-speaker-check {
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
