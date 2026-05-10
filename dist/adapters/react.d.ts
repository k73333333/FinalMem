interface UseMemGuardOptions {
    type?: string;
    name?: string;
}
export declare const useMemGuard: <T extends object>(obj: T, options?: UseMemGuardOptions) => T;
export declare const withMemGuard: <P extends object>(Component: React.ComponentType<P>, options?: UseMemGuardOptions) => import("react").ComponentType<P> | ((props: P & {
    ref?: React.Ref<any>;
}) => import("react").ReactElement<P, string | import("react").JSXElementConstructor<any>>);
interface MemGuardProviderProps {
    children: React.ReactNode;
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
type MemGuardContextTypeValue = MemGuardContextType | null;
export declare const MemGuardProvider: ({ children, trackComponents, ...config }: MemGuardProviderProps) => string | number | bigint | boolean | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | import("react").FunctionComponentElement<import("react").ProviderProps<MemGuardContextTypeValue>> | null | undefined;
export declare const useMemGuardContext: () => MemGuardContextType;
export {};
