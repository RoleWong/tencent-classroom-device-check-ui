<template>
    <div class="dc-step-panel dc-camera-check">
        <!-- 标题区域 -->
        <h2 class="dc-step-title">{{ $t('camera.title') }}</h2>

        <!-- 提示信息 -->
        <div class="dc-step-hint">
            <span>{{ needsUserInteraction ? $t('camera.hintBeforeStart') : $t('camera.hint') }}</span>
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
                    {{ $t('camera.startButton') }}
                </el-button>
            </div>
        </div>

        <!-- ⚠️ 无设备状态 -->
        <div v-else-if="cameraDevices.length === 0" class="dc-step-content dc-no-device">
            <div class="dc-no-device__icon">
                <i class="el-icon-warning-outline" />
            </div>
            <div class="dc-no-device__text">{{ $t('camera.noDevice') }}</div>
            <div class="dc-no-device__hint">{{ $t('camera.noDeviceHint') }}</div>
        </div>

        <!-- 正常表单区域（有设备时显示） -->
        <div v-else class="dc-step-content dc-step-form">
            <!-- 摄像头选择 -->
            <div class="dc-step-form__item">
                <label class="dc-step-form__label">{{ $t('camera.label') }}</label>
                <el-select
                    v-model="selectedCameraId"
                    class="dc-device-select"
                    :placeholder="$t('camera.selectPlaceholder')"
                    @change="handleCameraChange"
                >
                    <el-option
                        v-for="device in cameraDevices"
                        :key="device.deviceId"
                        :label="device.deviceName || $t('camera.defaultDevice')"
                        :value="device.deviceId"
                    >
                        <span class="dc-device-option">
                            <i
                                v-if="getDeviceTestResult(device.deviceId) === DeviceTestResult.FAILED"
                                class="el-icon-close dc-device-option__failed-icon"
                            />
                            <span class="dc-device-option__name">{{ device.deviceName || $t('camera.defaultDevice') }}</span>
                        </span>
                    </el-option>
                </el-select>
            </div>

            <!-- 视频预览区域 -->
            <div class="dc-step-form__item dc-video-preview-container">
                <div ref="videoContainer" class="dc-video-preview">
                    <!-- 视频流将渲染到这里 -->
                    <div v-if="!isTesting" class="dc-video-preview__placeholder">
                        <i class="el-icon-video-camera" />
                        <span>{{ $t('camera.loading') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="!needsUserInteraction" class="dc-step-actions">
            <!-- 无设备状态：只显示一个下一步按钮，点击后标记失败并前进 -->
            <template v-if="cameraDevices.length === 0">
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
                    @click="handleNotSee"
                >
                    {{ $t('camera.notSee') }}
                </el-button>
                <el-button
                    type="primary"
                    class="dc-step-btn dc-step-btn--primary"
                    @click="handleCanSee"
                >
                    {{ $t('camera.canSee') }}
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

export default {
    name: 'CameraCheck',

    mixins: [BaseStepMixin],

    data() {
        return {
            // 暴露枚举给模板使用
            DeviceTestResult: DeviceTestResultEnum,
            // 是否需要用户交互（用于显示"开始检测"按钮）
            needsUserInteraction: false,
            // 选中的摄像头设备ID
            selectedCameraId: '',
            // 摄像头设备列表
            cameraDevices: [],
            // 是否已开始测试
            isTesting: false,
            // 当前测试的设备索引
            currentTestIndex: 0,
            // 测试结果数组，每项包含 result, cameraId, cameraName, testTime
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
            this.startCameraTest();
        } else {
            // 需要用户先交互
            this.needsUserInteraction = true;
            this.logInfo('等待用户交互后开始摄像头检测');
        }
    },

    beforeDestroy() {
        this.stopCameraTest();
        // 取消设备变更监听
        this.unregisterDeviceChangeListener();
    },

    methods: {
        /**
         * 处理用户点击"开始检测"按钮
         */
        handleStartCheck() {
            this.emitAction('点击开始检测摄像头', {});

            // 标记用户已交互
            UserInteractionState.markAsInteracted();

            // 隐藏按钮，开始测试
            this.needsUserInteraction = false;
            this.startCameraTest();

            this.logInfo('用户点击开始检测，开始摄像头测试');
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
            const oldDeviceIds = this.cameraDevices.map(d => d.deviceId);

            // 从 TrtcUtil 获取所有设备，筛选摄像头设备
            this.cameraDevices = trtc.devices.filter(
                device => device.type === TTrtcDeviceType.Camera
            );

            // 同步更新测试结果数组
            // 保留已有设备的测试结果，为新设备添加 SKIPPED 状态
            const newTestResults = this.cameraDevices.map(device => {
                const existingResult = this.testResults.find(r => r.cameraId === device.deviceId);
                if (existingResult) {
                    return existingResult;
                }
                return {
                    result: DeviceTestResult.SKIPPED,
                    cameraId: device.deviceId,
                    cameraName: device.deviceName || '',
                    testTime: null
                };
            });
            this.testResults = newTestResults;

            // 处理默认设备切换
            if (newDefaultDeviceId) {
                const newDefaultIndex = this.cameraDevices.findIndex(d => d.deviceId === newDefaultDeviceId);
                if (newDefaultIndex !== -1) {
                    this.logInfo('检测到新的默认摄像头设备，自动切换', {
                        deviceId: newDefaultDeviceId,
                        deviceName: this.cameraDevices[newDefaultIndex]?.deviceName
                    });
                    this.currentTestIndex = newDefaultIndex;
                    this.selectedCameraId = newDefaultDeviceId;
                    // 重新开始测试
                    this.restartTestWithNewDevice(newDefaultDeviceId);
                    return true;
                }
            }

            // 如果当前选中的设备已被移除，切换到下一个可用设备
            if (this.selectedCameraId && !this.cameraDevices.find(d => d.deviceId === this.selectedCameraId)) {
                this.logInfo('当前摄像头设备已断开，自动切换到下一个设备');
                const nextIndex = this.findNextUntestedDeviceIndex();
                if (nextIndex !== -1) {
                    this.currentTestIndex = nextIndex;
                    this.selectedCameraId = this.cameraDevices[nextIndex].deviceId;
                    this.restartTestWithNewDevice(this.selectedCameraId);
                    return true;
                } else if (this.cameraDevices.length > 0) {
                    // 没有未测试的设备，选择第一个
                    this.currentTestIndex = 0;
                    this.selectedCameraId = this.cameraDevices[0].deviceId;
                    this.restartTestWithNewDevice(this.selectedCameraId);
                    return true;
                }
            } else if (this.cameraDevices.length > 0 && this.selectedCameraId) {
                // 当前选中的设备仍在列表中，同步更新 currentTestIndex（设备列表顺序可能因新增/移除设备而变化）
                const updatedIndex = this.cameraDevices.findIndex(d => d.deviceId === this.selectedCameraId);
                if (updatedIndex !== -1) {
                    this.currentTestIndex = updatedIndex;
                }
            } else if (this.cameraDevices.length > 0 && !this.selectedCameraId) {
                // 初始化时选择默认设备
                const defaultCamera = DeviceCheckSDK.current.device.getTrtcInstance().cameraId;
                if (defaultCamera) {
                    this.currentTestIndex = this.cameraDevices.findIndex(device => device.deviceId === defaultCamera);
                    if (this.currentTestIndex === -1) {
                        this.currentTestIndex = 0;
                    }
                    this.selectedCameraId = defaultCamera;
                } else {
                    this.currentTestIndex = 0;
                    this.selectedCameraId = this.cameraDevices[0].deviceId;
                }
            }

            this.logInfo('摄像头设备列表已更新', {
                count: this.cameraDevices.length,
                devices: this.cameraDevices.map(d => d.deviceName),
                selectedId: this.selectedCameraId
            });

            return false;
        },

        /**
         * 使用新设备重新开始测试
         */
        async restartTestWithNewDevice(deviceId) {
            await this.stopCameraTest();
            this.currentTestStartTime = new Date();
            await this.startCameraTest();
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
            // 只处理摄像头设备变更
            if (event.type !== TTrtcDeviceType.Camera) {
                return;
            }

            this.logInfo('检测到摄像头设备变更', event);

            if (event.state === TTrtcDeviceState.Add) {
                // 新设备添加
                const wasEmpty = this.cameraDevices.length === 0;
                // 如果是默认设备，自动切换到该设备
                // refreshDeviceList 返回 true 表示内部已调用 restartTestWithNewDevice，无需再启动测试
                const alreadyRestarted = this.refreshDeviceList(event.isDefault ? event.deviceId : null);

                // 如果之前是无设备状态，现在有设备了，且 refreshDeviceList 内部没有自行重启测试，则自动开始测试
                if (!alreadyRestarted && wasEmpty && this.cameraDevices.length > 0) {
                    this.logInfo('检测到摄像头设备接入，自动开始测试');
                    this.startCameraTest();
                }
            } else if (event.state === TTrtcDeviceState.Remove) {
                // 设备移除
                this.refreshDeviceList();
            }
        },

        /**
         * 开始摄像头测试
         */
        async startCameraTest() {
            // 无设备时不启动测试
            if (this.cameraDevices.length === 0) {
                this.logInfo('无摄像头设备，跳过测试启动');
                return;
            }

            try {
                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();

                // 记录当前设备测试开始时间
                this.currentTestStartTime = new Date();

                // 如果有选中的摄像头，先切换
                if (this.selectedCameraId) {
                    await trtc.switchCamera(this.selectedCameraId);
                }

                // 获取视频容器 DOM
                const videoContainer = this.$refs.videoContainer;
                if (!videoContainer) {
                    throw new Error('视频容器未找到');
                }

                // 开始摄像头测试，传入 DOM 节点用于渲染视频画面
                await trtc.startCameraTest(videoContainer);
                this.isTesting = true;

                // 通知父组件状态变为运行中
                this.markAsRunning();

                this.logInfo('摄像头测试开始', {
                    cameraId: this.selectedCameraId,
                    deviceIndex: this.currentTestIndex + 1,
                    totalDevices: this.cameraDevices.length
                });
            } catch (error) {
                this.logError('摄像头测试启动失败', { error: error.message });
                // 记录当前设备测试失败
                this.recordTestResult(DeviceTestResult.FAILED);
                // 尝试下一个设备
                await this.tryNextUntestedDevice();
            }
        },

        /**
         * 停止摄像头测试
         */
        async stopCameraTest() {
            try {
                if (this.isTesting) {
                    const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                    await trtc.stopCameraTest();
                    this.isTesting = false;
                }
            } catch (error) {
                this.logError('停止摄像头测试失败', { error: error.message });
            }
        },

        /**
         * 获取设备的测试结果状态
         * @param {string} deviceId - 设备ID
         * @returns {string} 测试结果状态
         */
        getDeviceTestResult(deviceId) {
            const result = this.testResults.find(r => r.cameraId === deviceId);
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
         * 处理摄像头切换（用户手动切换）
         */
        async handleCameraChange(deviceId) {
            this.emitAction('切换摄像头设备', { deviceId });

            try {
                // 更新当前测试索引
                const newIndex = this.cameraDevices.findIndex(d => d.deviceId === deviceId);
                if (newIndex !== -1) {
                    this.currentTestIndex = newIndex;
                }

                // 重置当前设备测试开始时间
                this.currentTestStartTime = new Date();

                // 停止当前测试
                await this.stopCameraTest();

                const trtc = DeviceCheckSDK.current.device.getTrtcInstance();
                await trtc.switchCamera(deviceId);

                // 获取视频容器 DOM
                const videoContainer = this.$refs.videoContainer;
                if (!videoContainer) {
                    throw new Error('视频容器未找到');
                }

                // 重新开始测试
                await trtc.startCameraTest(videoContainer);
                this.isTesting = true;

                this.logInfo('摄像头已切换', {
                    deviceId,
                    deviceName: this.cameraDevices.find(d => d.deviceId === deviceId)?.deviceName
                });
            } catch (error) {
                this.logError('切换摄像头失败', { error: error.message });
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

                // 停止测试
                await this.stopCameraTest();

                // 触发 complete 事件，只返回实际测试过的设备结果
                if (hasPassedDevice) {
                    this.markAsSuccess(testedResults);
                } else {
                    this.markAsError(testedResults);
                }

                this.logInfo('摄像头检测完成', {
                    hasPassedDevice,
                    results: testedResults
                });

                return false;
            }

            // 切换到下一个未检测的设备
            this.currentTestIndex = nextIndex;
            const nextDevice = this.cameraDevices[nextIndex];
            this.selectedCameraId = nextDevice.deviceId;

            // 重新开始测试
            await this.stopCameraTest();
            await this.startCameraTest();

            this.logInfo('自动切换到下一个未检测的摄像头', {
                deviceId: nextDevice.deviceId,
                deviceName: nextDevice.deviceName,
                deviceIndex: nextIndex + 1,
                totalDevices: this.cameraDevices.length
            });

            return true;
        },

        /**
         * 处理无设备状态下点击"下一步"按钮
         * 将这一步标记为失败并前进到下一步
         */
        handleNoDeviceNext() {
            this.emitAction('无设备点击下一步', {});

            this.logInfo('摄像头检测失败：未检测到摄像头设备', {
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
         * 处理"能看到"按钮点击
         */
        async handleCanSee() {
            this.emitAction('点击能看到', {
                cameraId: this.selectedCameraId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 记录当前设备测试通过
            this.recordTestResult(DeviceTestResult.PASSED);

            // 停止测试
            await this.stopCameraTest();

            // 获取实际测试过的结果（不包含SKIPPED状态的设备）
            const testedResults = this.getTestedResults();

            // 通知父组件检测成功，只返回实际测试过的设备结果
            this.markAsSuccess(testedResults);

            this.logInfo('摄像头检测通过', {
                cameraId: this.selectedCameraId,
                cameraName: this.cameraDevices[this.currentTestIndex]?.deviceName,
                results: testedResults
            });
        },

        /**
         * 处理"看不见"按钮点击
         */
        async handleNotSee() {
            this.emitAction('点击看不见', {
                cameraId: this.selectedCameraId,
                deviceIndex: this.currentTestIndex + 1
            });

            // 记录当前设备测试失败
            this.recordTestResult(DeviceTestResult.FAILED);

            this.logInfo('摄像头检测未通过，尝试下一个设备', {
                cameraId: this.selectedCameraId,
                cameraName: this.cameraDevices[this.currentTestIndex]?.deviceName,
                deviceIndex: this.currentTestIndex + 1,
                totalDevices: this.cameraDevices.length
            });

            // 尝试切换到下一个未检测过的设备继续测试
            await this.tryNextUntestedDevice();
        }
    }
};
</script>

<style lang="scss" scoped>
@import '../../styles/step-common.scss';

// 摄像头检测组件特有样式
.dc-camera-check {
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

    // 视频预览容器
    .dc-video-preview-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: $dc-spacing-md;
    }

    // 视频预览区域
    .dc-video-preview {
        width: 320px;
        height: 240px;
        background-color: #000;
        border-radius: $dc-radius-md;
        overflow: hidden;
        position: relative;

        // TRTC 渲染的 video 元素样式
        :deep(video) {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        // 加载占位符
        &__placeholder {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--dc-text-secondary, #909399);
            background-color: #1a1a1a;
            gap: $dc-spacing-sm;

            i {
                font-size: 48px;
                color: var(--dc-text-muted, #606266);
            }

            span {
                font-size: 14px;
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

        // 视频预览自适应
        .dc-video-preview {
            width: 100%;
            max-width: 320px;
            height: auto;
            aspect-ratio: 4 / 3;
        }
    }
}
</style>
