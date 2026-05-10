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
    config = { ...config, ...newConfig };
}
export function isEnabled() {
    return config.enabled;
}
export function shouldIgnore(file) {
    return config.ignorePatterns.some(pattern => pattern.test(file));
}
//# sourceMappingURL=config.js.map