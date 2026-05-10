import type { MemGuardConfig } from './types';
export declare const defaultConfig: MemGuardConfig;
export declare function getConfig(): MemGuardConfig;
export declare function setConfig(newConfig: Partial<MemGuardConfig>): void;
export declare function isEnabled(): boolean;
export declare function shouldIgnore(file: string): boolean;
