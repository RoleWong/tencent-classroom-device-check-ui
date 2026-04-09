import i18next, { TOptions } from 'i18next';

// 语言映射表：将浏览器语言代码映射到支持的语言
const LANGUAGE_MAP: Record<string, string> = {
    // 简体中文
    zh: 'zh',
    'zh-cn': 'zh',
    'zh-sg': 'zh',
    'zh-hans': 'zh',
    'zh-hans-cn': 'zh',
    'zh-hans-sg': 'zh',

    // 繁体中文
    'zh-tw': 'zh',
    'zh-hk': 'zh',
    'zh-mo': 'zh',
    'zh-hant': 'zh',
    'zh-hant-tw': 'zh',
    'zh-hant-hk': 'zh',
    'zh-hant-mo': 'zh'

    // 其他语言默认映射到英文
};

/**
 * 检测并映射语言
 * @param lang - 指定的语言代码，如果不指定则自动检测浏览器语言
 * @returns 映射后的语言代码 ('zh' 或 'en')
 */
export function detectLanguage(lang?: string): string {
    if (lang === 'auto' || !lang) {
        lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
    }

    const normalizedLang = lang.toLowerCase().trim();

    return LANGUAGE_MAP[normalizedLang] || 'en';
}

/**
 * 翻译资源类型
 */
type TranslationResource = Record<string, unknown>;

class I18nController {
    private _language: string | null = null;
    private _hasInit: boolean = false;

    async init(lng: string = 'auto'): Promise<void> {
        if (this._hasInit) return;
        this._hasInit = true;

        this._language = detectLanguage(lng);

        try {
            const translationModule = await import(`../../assets/locales/${this._language}.json`);
            const translation: TranslationResource = translationModule.default || translationModule;

            await i18next.init({
                lng: this._language,
                fallbackLng: 'en',
                resources: {
                    [this._language]: {
                        translation: translation
                    }
                }
            });

            console.log(`[I18n] 已加载语言: ${this._language}`);
        } catch (error) {
            console.error(`[I18n] Failed to load language file for ${this._language}:`, error);
            this._language = 'en';

            // 加载英文作为后备
            try {
                const fallbackModule = await import(`../../assets/locales/en.json`);
                const fallbackTranslation: TranslationResource = fallbackModule.default || fallbackModule;

                await i18next.init({
                    lng: 'en',
                    fallbackLng: 'en',
                    resources: {
                        en: {
                            translation: fallbackTranslation
                        }
                    }
                });
            } catch (fallbackError) {
                console.error('[I18n] Failed to load fallback _language (en):', fallbackError);
            }
        }
    }

    async setLanguage(language: string): Promise<void> {
        if (language === this._language) return;

        this._language = language;
        try {
            const translationModule = await import(`../../assets/locales/${language}.json`);
            const translation: TranslationResource = translationModule.default || translationModule;

            i18next.addResourceBundle(language, 'translation', translation, true, true);

            await i18next.changeLanguage(language);
            console.log('i18next _language changed to:', language);
        } catch (error) {
            console.error(`Failed to switch language to ${language}:`, error);
        }
    }

    getLanguage(): string | null {
        return this._language;
    }

    t(key: string, options?: TOptions): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return i18next.t(key, options as any) as string;
    }
}

export const i18n = i18next;

export const i18nController = new I18nController();
