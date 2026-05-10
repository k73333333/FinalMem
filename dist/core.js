import { parseStack } from './stack-parser';
import { isEnabled, getConfig, shouldIgnore, setConfig } from './config';
import { logLeak } from './logger';
const trackedMap = new Map();
let registry = null;
let inspectionTimer = null;
let initialized = false;
function generateId() {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function logError(message, error) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error(`[MEMGUARD Error] ${message}`, error);
    }
}
function initRegistry() {
    if (registry)
        return;
    registry = new FinalizationRegistry((id) => {
        try {
            const info = trackedMap.get(id);
            if (info) {
                info.isCollected = true;
                trackedMap.delete(id);
            }
        }
        catch (error) {
            logError('FinalizationRegistry callback error', error);
        }
    });
}
function startInspection() {
    if (inspectionTimer)
        return;
    const { interval } = getConfig();
    inspectionTimer = setInterval(() => {
        try {
            const { threshold } = getConfig();
            const now = Date.now();
            for (const [id, info] of trackedMap) {
                if (info.isLeaked)
                    continue;
                const checkTime = info.destroyTime || info.createTime;
                const elapsed = now - checkTime;
                if (elapsed > threshold) {
                    const obj = info.weakRef.deref();
                    if (obj !== undefined) {
                        info.isLeaked = true;
                        logLeak(info);
                    }
                    else {
                        info.isCollected = true;
                        trackedMap.delete(id);
                    }
                }
            }
        }
        catch (error) {
            logError('Inspection interval error', error);
        }
    }, interval);
}
export function track(obj, options = {}) {
    if (!isEnabled())
        return '';
    try {
        const stack = new Error().stack || '';
        const parsedStack = parseStack(stack);
        if (parsedStack.file && shouldIgnore(parsedStack.file)) {
            return '';
        }
        initRegistry();
        const id = generateId();
        const weakRef = new WeakRef(obj);
        const registryToken = {};
        registry.register(obj, id, registryToken);
        const info = {
            id,
            weakRef,
            stack: parsedStack,
            type: options.type || 'object',
            name: options.name || '',
            createTime: Date.now(),
            destroyTime: null,
            isCollected: false,
            isLeaked: false,
            registryToken
        };
        trackedMap.set(id, info);
        startInspection();
        return id;
    }
    catch (error) {
        logError('track function error', error);
        return '';
    }
}
export function destroy(id) {
    if (!isEnabled())
        return;
    try {
        const info = trackedMap.get(id);
        if (info) {
            info.destroyTime = Date.now();
        }
    }
    catch (error) {
        logError('destroy function error', error);
    }
}
export function untrack(id) {
    try {
        const info = trackedMap.get(id);
        if (info) {
            const currentRegistry = registry;
            if (currentRegistry) {
                currentRegistry.unregister(info.registryToken);
            }
            trackedMap.delete(id);
        }
    }
    catch (error) {
        logError('untrack function error', error);
    }
}
export function getTrackedCount() {
    return trackedMap.size;
}
export function clearAll() {
    try {
        if (registry) {
            for (const info of trackedMap.values()) {
                registry.unregister(info.registryToken);
            }
        }
        trackedMap.clear();
        if (inspectionTimer) {
            clearInterval(inspectionTimer);
            inspectionTimer = null;
        }
        registry = null;
        initialized = false;
    }
    catch (error) {
        logError('clearAll function error', error);
    }
}
export function init(options) {
    if (initialized)
        return;
    initialized = true;
    if (options) {
        setConfig(options);
    }
    initRegistry();
    startInspection();
}
export function isInitialized() {
    return initialized;
}
//# sourceMappingURL=core.js.map