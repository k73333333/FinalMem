import type { TrackOptions } from './types';
export declare function track(obj: object, options?: TrackOptions): string;
export declare function destroy(id: string): void;
export declare function untrack(id: string): void;
export declare function getTrackedCount(): number;
export declare function clearAll(): void;
export declare function init(options?: Partial<{
    enabled?: boolean;
    threshold?: number;
    interval?: number;
    ignorePatterns?: RegExp[];
}>): void;
export declare function isInitialized(): boolean;
