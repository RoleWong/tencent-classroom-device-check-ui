<template>
    <div class="dc-main-container" :class="{ 'is-mobile': isMobile }">
        <!-- 检测流程主界面 -->
        <template v-if="true">
            <!-- 侧边导航栏（只有一个检测步骤时不展示） -->
            <WorkflowHeader
                v-if="shouldShowHeader"
                :steps="steps"
                :step-states="stepStates"
                :current-step-index="currentStepIndex"
            />
            <!-- 主内容区 -->
            <main class="dc-content">
                <div class="dc-content__inner">
                    <!-- 当前步骤内容 -->
                    <div class="dc-step-content">
                        <component
                            :is="currentStepComponent"
                            :step="currentStep"
                            :step-state="currentStepState"
                            :log-collector="logCollector"
                            :workflow-manager="workflowManager"
                            @complete="handleStepComplete"
                            @action="handleUserAction"
                            @restart="handleRestart"
                        />
                    </div>

                <!-- 底部操作栏（报告步骤时隐藏，因为报告组件有自己的操作按钮） -->
                <footer v-if="currentStep?.key !== 'report'" class="dc-content__footer">
                    <div class="dc-action-bar">
<!--                        <el-button v-if="!isFirstStep" class="dc-action-bar__btn" @click="handlePrev">-->
<!--                            <i class="el-icon-arrow-left" />-->
<!--                            {{ $t('上一步') }}-->
<!--                        </el-button>-->
                        <div class="dc-action-bar__spacer" />
                        <el-button
                            v-if="!isLastStep && !this.workflowManager.autoNext"
                            type="primary"
                            class="dc-action-bar__btn"
                            :disabled="!canGoNext"
                            @click="handleNext"
                        >
                            {{ $t('下一步') }}
                            <i class="el-icon-arrow-right" />
                        </el-button>
                    </div>
                </footer>
            </div>
        </main>
        </template>
    </div>
</template>

<script>
import StepPlaceholder from '../components/StepPlaceholder.vue';
import SpeakerCheck from '../components/steps/SpeakerCheck.vue';
import MicCheck from '../components/steps/MicCheck.vue';
import CameraCheck from '../components/steps/CameraCheck.vue';
import NetworkCheck from '../components/steps/NetworkCheck.vue';
import ReportCheck from '../components/steps/ReportCheck.vue';
import { i18n } from "../logic/I18nController";
import WorkflowHeader from "../components/WorkflowHeader.vue";
import { UserInteractionState } from "@tencent-classroom/device-check-sdk";

/**
 * 步骤 key 与组件的映射表
 */
const STEP_COMPONENT_MAP = {
    speaker: 'SpeakerCheck',
    microphone: 'MicCheck',
    camera: 'CameraCheck',
    network: 'NetworkCheck',
    report: 'ReportCheck'
};

export default {
    name: 'DeviceDetect',

    components: {
        WorkflowHeader,
        StepPlaceholder,
        SpeakerCheck,
        MicCheck,
        CameraCheck,
        NetworkCheck,
        ReportCheck
    },

    props: {
        /**
         * 检测步骤配置数组
         */
        steps: {
            type: Array,
            required: true
        },
        /**
         * 工作流管理器实例
         */
        workflowManager: {
            type: Object,
            required: true
        },
        /**
         * 日志收集器实例
         */
        logCollector: {
            type: Object,
            required: true
        }
    },

    data() {
        return {
            currentStepIndex: 0,
            stepStates: [],
            isMobile: false,
            // 事件取消订阅函数
            unsubscribers: []
        };
    },

    computed: {
        /**
         * 当前步骤配置
         */
        currentStep() {
            return this.steps[this.currentStepIndex] || null;
        },

        /**
         * 当前步骤状态
         * 对于报告步骤，需要包含所有步骤的状态和结果
         */
        currentStepState() {
            const state = this.stepStates[this.currentStepIndex] || null;

            // 如果是报告步骤，将所有步骤的状态和结果注入到 result 中
            if (this.currentStep?.key === 'report' && state) {
                const returnVal = {
                    ...state,
                    result: {
                        stepStates: this.stepStates,
                        details: this.workflowManager.results
                    }
                }
                console.log("returnVal:", returnVal);
                return returnVal;
            }

            return state;
        },

        /**
         * 当前步骤对应的组件
         */
        currentStepComponent() {
            // 根据 step.key 动态加载对应组件
            const stepKey = this.currentStep?.key;
            return STEP_COMPONENT_MAP[stepKey] || 'StepPlaceholder';
        },

        /**
         * 是否为第一步
         */
        isFirstStep() {
            return this.currentStepIndex === 0;
        },

        /**
         * 是否为最后一步
         */
        isLastStep() {
            return this.currentStepIndex === this.steps.length - 1;
        },

        /**
         * 是否可以进入下一步
         */
        canGoNext() {
            const state = this.currentStepState;
            if (!state) return false;
            return this.workflowManager.isStepCompleted(state.status);
        },

        /**
         * 是否显示侧边导航栏
         * 当只有一个检测步骤（不包括 report）时不显示
         */
        shouldShowHeader() {
            // 过滤掉 report 步骤，计算实际检测步骤数量
            const checkSteps = this.steps.filter(step => step.key !== 'report');
            return checkSteps.length > 1;
        }
    },

    created() {
        // 初始化用户交互状态监听
        UserInteractionState.init();
        this.initFromWorkflowManager();
        this.subscribeToWorkflowEvents();
        this.checkMobile();
        window.addEventListener('resize', this.checkMobile);
    },

    beforeDestroy() {
        // 取消所有事件订阅
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        window.removeEventListener('resize', this.checkMobile);
    },

    methods: {
        initFromWorkflowManager() {
            this.stepStates = this.workflowManager.getAllStepStates();
            this.currentStepIndex = this.workflowManager.getCurrentIndex();
        },
        subscribeToWorkflowEvents() {
            const unsubStepChange = this.workflowManager.on('stepChange', (payload) => {
                this.currentStepIndex = payload.currentIndex;
                this.logCollector.action(i18n.t('步骤切换'), {
                    from: payload.previousIndex,
                    to: payload.currentIndex,
                    stepName: payload.step?.name
                });
            });
            this.unsubscribers.push(unsubStepChange);

            const unsubStateChange = this.workflowManager.on('stateChange', (payload) => {
                this.stepStates = [...payload.stepStates];
                this.currentStepIndex = payload.currentIndex;
            });
            this.unsubscribers.push(unsubStateChange);

            const unsubComplete = this.workflowManager.on('complete', (result) => {
                this.$emit('finish', result);
            });
            this.unsubscribers.push(unsubComplete);
        },

        /**
         * 检测是否为移动端
         */
        checkMobile() {
            this.isMobile = window.innerWidth < 768;
        },

        /**
         * 处理上一步
         */
        handlePrev() {
            if (this.workflowManager.goPrev()) {
                this.logCollector.action(i18n.t('点击上一步'));
            }
        },

        /**
         * 处理下一步
         */
        handleNext() {
            if (this.workflowManager.goNext()) {
                this.logCollector.action(i18n.t('点击下一步'));
            }
        },

        /**
         * 处理步骤完成
         * WorkflowManager 会自动处理进入下一步的逻辑
         */
        handleStepComplete({ status, result }) {
            console.log("handleStepComplete:", status, result);
            this.workflowManager.completeCurrentStep(status, result);
        },

        /**
         * 处理用户操作
         */
        handleUserAction(action, details) {
            this.logCollector.action(action, details);
        },

        /**
         * 处理重新检测
         */
        handleRestart() {
            this.logCollector.action(i18n.t('点击重新检测'));

            // 重置所有步骤状态
            this.stepStates = this.steps.map(step => ({
                key: step.key,
                name: step.name,
                status: 'pending',
                result: null,
                error: null,
                startTime: null,
                endTime: null
            }));

            // 重置工作流管理器
            this.workflowManager.stepStates = this.stepStates;
            this.workflowManager.results = {};
            this.workflowManager.currentIndex = 0;

            // 跳转到第一步
            this.currentStepIndex = 0;

            this.logCollector.info('DeviceDetect', '已重置检测流程，开始重新检测');
        }
    }
};
</script>

<style lang="scss" scoped>
.dc-main-container {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 500px;
    background-color: var(--dc-bg);
    flex-direction: column;
}

// 主内容区
.dc-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    margin-top: $dc-spacing-lg;

    &__inner {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 0 $dc-spacing-lg $dc-spacing-lg;
        overflow: hidden;
    }

    &__footer {
        padding-top: $dc-spacing-md;
        margin-top: auto;
    }
}

// 步骤内容区
.dc-step-content {
    flex: 1;
    overflow-y: auto;
    box-sizing: border-box;
    background-color: var(--dc-bg-secondary);
    border-radius: $dc-radius-md;
    box-shadow: $dc-shadow-md;
}

// 操作栏
.dc-action-bar {
    display: flex;
    align-items: center;

    &__spacer {
        flex: 1;
    }

    &__btn {
        min-width: 100px;
        border-radius: $dc-radius-sm;

        &--finish {
            min-width: 120px;
        }
    }
}

// 所有移动端统一滚动策略：
// 外层 MainContainer 已固定为视口尺寸 + overflow: hidden
// 滚动容器设在 dc-main-container 级别，让整个页面（包括 WorkflowHeader）都能滚动
// 内部内容高度自适应，不强制撑满，避免底部白边
// 这样 iOS（WKWebView scroll=NO）和 Android 都使用同一套内部滚动机制
.is-mobile {
    &.dc-main-container {
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        display: block;
    }

    .dc-content {
        overflow: visible;
        margin-top: $dc-spacing-md;
    }

    .dc-content__inner {
        padding: $dc-spacing-md;
        overflow: visible;
    }

    .dc-step-content {
        overflow: visible; // 内容自然展开，不在此层滚动
    }
}
</style>
