declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<object, object, unknown>;
    export default component;
}

declare module '*.json' {
    const value: Record<string, unknown>;
    export default value;
}

declare module 'element-ui';
declare module 'element-ui/lib/theme-chalk/index.css';

declare module 'vue/types/vue' {
    interface Vue {
        $t: (key: string, options?: Record<string, unknown>) => string;
    }
}

interface Window {
    TicNativeBridge?: {
        onCheckFinished: (result: string) => void;
    };
    __TIC_CHECKER__?: unknown;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
}
