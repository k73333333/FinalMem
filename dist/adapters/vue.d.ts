import { destroy } from '../core';
interface MemGuardHTMLElement extends HTMLElement {
    __memGuardId?: string;
}
interface VueApp {
    mixin: (options: Record<string, unknown>) => void;
    directive: (name: string, options: Record<string, unknown>) => void;
}
export declare function useMemGuard(): {
    track: (obj: object, options?: {
        type?: string;
        name?: string;
    }) => string;
    destroy: typeof destroy;
};
export declare function createMemGuardDirective(): {
    mounted(el: MemGuardHTMLElement, binding: {
        value?: {
            type?: string;
            name?: string;
        };
    }): void;
    unmounted(el: MemGuardHTMLElement): void;
};
export declare const MemGuardVuePlugin: {
    install(app: VueApp, options?: {
        enabled?: boolean;
        threshold?: number;
        interval?: number;
        ignorePatterns?: RegExp[];
        trackComponents?: boolean;
    }): void;
};
export {};
