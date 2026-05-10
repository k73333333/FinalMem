import { track, destroy, untrack, getTrackedCount, clearAll, init, isInitialized } from '../core';
import { setConfig, getConfig } from '../config';
let globalVarName = getConfig().globalVariableName;
const updateGlobalVariable = () => {
    if (typeof window !== 'undefined') {
        const config = getConfig();
        if (globalVarName !== config.globalVariableName) {
            delete window[globalVarName];
            globalVarName = config.globalVariableName;
        }
        ;
        window[config.globalVariableName] = memGuard;
    }
};
export const memGuard = {
    track,
    destroy,
    untrack,
    getTrackedCount,
    clearAll,
    configure: (newConfig) => {
        setConfig(newConfig);
        updateGlobalVariable();
    },
    getConfig,
    init: (options) => {
        init(options);
        updateGlobalVariable();
    },
    isInitialized
};
export function install(options) {
    init(options);
    updateGlobalVariable();
}
if (typeof window !== 'undefined') {
    updateGlobalVariable();
}
//# sourceMappingURL=native.js.map