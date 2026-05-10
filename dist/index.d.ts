export { track, destroy, untrack, getTrackedCount, clearAll, init, isInitialized } from './core';
export { setConfig, getConfig, isEnabled } from './config';
export { parseStack } from './stack-parser';
export { memGuard, install } from './adapters/native';
export { useMemGuard as useVueMemGuard, createMemGuardDirective, MemGuardVuePlugin } from './adapters/vue';
export { useMemGuard as useReactMemGuard, withMemGuard, MemGuardProvider, useMemGuardContext } from './adapters/react';
export type { ParsedStack, TrackedInfo, MemGuardConfig, TrackOptions } from './types';
