import { track, destroy, untrack, getTrackedCount, clearAll, isInitialized } from '../core';
import { getConfig } from '../config';
import type { MemGuardConfig } from '../types';
export declare const memGuard: {
    track: typeof track;
    destroy: typeof destroy;
    untrack: typeof untrack;
    getTrackedCount: typeof getTrackedCount;
    clearAll: typeof clearAll;
    configure: (newConfig: Partial<MemGuardConfig>) => void;
    getConfig: typeof getConfig;
    init: (options?: Partial<MemGuardConfig>) => void;
    isInitialized: typeof isInitialized;
};
export declare function install(options?: {
    enabled?: boolean;
    threshold?: number;
    interval?: number;
    ignorePatterns?: RegExp[];
}): void;
