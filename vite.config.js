import path from 'path';
import { fileURLToPath } from 'url';
import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
            outDir: 'dist',
            include: ['src/**/*.ts', 'src/**/*.vue'],
            rollupTypes: true
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                // 全局注入 SCSS 变量
                additionalData: `@use "@/styles/variables.scss" as *;`
            }
        }
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'TencentClassroomDeviceCheckUI',
            fileName: format => `device-check-ui.${format === 'es' ? 'mjs' : 'cjs'}`,
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            // 外部化处理，不打包进库的依赖
            output: {
                // 使用 named 导出，避免 default export 警告
                exports: 'named',
                // 确保 CSS 单独导出
                assetFileNames: assetInfo => {
                    if (assetInfo.name === 'style.css') {
                        return 'style.css';
                    }
                    return assetInfo.name || 'asset';
                }
            }
        },
        sourcemap: true
    }
});
