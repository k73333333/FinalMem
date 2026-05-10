import React, { type ComponentType, type Ref, type ReactNode } from 'react';
interface UseMemGuardOptions {
    type?: string;
    name?: string;
}
export declare function useMemGuard<T extends object>(obj: T, options?: UseMemGuardOptions): T;
export declare function withMemGuard<P extends object>(Component: ComponentType<P>, options?: UseMemGuardOptions): (props: P & {
    ref?: Ref<any>;
}) => React.ReactElement<P, string | React.JSXElementConstructor<any>>;
interface MemGuardProviderProps {
    children: ReactNode;
    enabled?: boolean;
    threshold?: number;
    interval?: number;
    ignorePatterns?: RegExp[];
    trackComponents?: boolean;
}
interface MemGuardContextType {
    track: (obj: object, options?: UseMemGuardOptions) => string;
    destroy: (id: string) => void;
    trackComponents: boolean;
}
export declare function MemGuardProvider({ children, trackComponents, ...config }: MemGuardProviderProps): React.FunctionComponentElement<React.ProviderProps<MemGuardContextType | null>>;
export declare function useMemGuardContext(): MemGuardContextType;
export {};
