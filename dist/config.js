function getIsProduction() {
    try {
        // 检查 Node.js 环境
        if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
            return process.env.NODE_ENV === 'production';
        }
        // 检查 import.meta.env (Vite)
        if (typeof import.meta !== 'undefined') {
            const metaEnv = import.meta.env;
            if (metaEnv?.NODE_ENV) {
                return metaEnv.NODE_ENV === 'production';
            }
        }
        // 检查 window.NODE_ENV
        if (typeof window !== 'undefined' && window.NODE_ENV) {
            return window.NODE_ENV === 'production';
        }
    }
    catch {
        // 忽略任何访问错误
    }
    return false;
}
const isProduction = getIsProduction();
export const defaultConfig = {
    enabled: !isProduction,
    threshold: 5000,
    interval: 2000,
    ignorePatterns: [
        /node_modules/,
        /@vue/,
        /@react/,
        /react-dom/
    ],
    globalVariableName: 'FinalMem'
};
let config = { ...defaultConfig };
export function getConfig() {
    return config;
}
export function setConfig(newConfig) {
    const validatedConfig = {};
    if (newConfig.enabled !== undefined) {
        validatedConfig.enabled = Boolean(newConfig.enabled);
    }
    if (newConfig.threshold !== undefined && typeof newConfig.threshold === 'number' && newConfig.threshold >= 0) {
        validatedConfig.threshold = newConfig.threshold;
    }
    if (newConfig.interval !== undefined && typeof newConfig.interval === 'number' && newConfig.interval > 0) {
        validatedConfig.interval = newConfig.interval;
    }
    if (newConfig.ignorePatterns !== undefined && Array.isArray(newConfig.ignorePatterns)) {
        validatedConfig.ignorePatterns = newConfig.ignorePatterns.filter(p => p instanceof RegExp);
    }
    if (newConfig.globalVariableName !== undefined && typeof newConfig.globalVariableName === 'string') {
        validatedConfig.globalVariableName = newConfig.globalVariableName;
    }
    config = { ...config, ...validatedConfig };
}
export function isEnabled() {
    return config.enabled;
}
export function shouldIgnore(file) {
    return config.ignorePatterns.some(pattern => pattern.test(file));
}
//# sourceMappingURL=config.js.map