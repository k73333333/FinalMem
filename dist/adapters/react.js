import React, { useEffect, useLayoutEffect, useRef, createContext, useContext, createElement } from 'react';
import { track, destroy, init } from '../core';
export function useMemGuard(obj, options) {
    const idRef = useRef(null);
    useEffect(() => {
        const id = track(obj, options);
        idRef.current = id;
        return () => {
            if (idRef.current) {
                destroy(idRef.current);
            }
        };
    }, [obj]);
    return obj;
}
export function withMemGuard(Component, options) {
    return function MemGuardWrapped(props) {
        const innerRef = useRef(null);
        const idRef = useRef(null);
        useEffect(() => {
            if (innerRef.current) {
                const id = track(innerRef.current, {
                    type: options?.type || 'component',
                    name: options?.name || Component.name
                });
                idRef.current = id;
            }
            return () => {
                if (idRef.current) {
                    destroy(idRef.current);
                }
            };
        }, []);
        return createElement(Component, { ...props, ref: innerRef });
    };
}
const MemGuardContext = createContext(null);
function TrackedComponent({ element, key }) {
    const innerRef = useRef(null);
    const idRef = useRef(null);
    const type = element.type;
    const componentName = type?.displayName ||
        (typeof type === 'function' ? type.name : 'Unknown');
    useEffect(() => {
        if (innerRef.current) {
            const id = track(innerRef.current, {
                type: 'component',
                name: componentName
            });
            idRef.current = id;
        }
        return () => {
            if (idRef.current) {
                destroy(idRef.current);
            }
        };
    }, []);
    return createElement(element.type, {
        ...element.props,
        ref: innerRef,
        key
    });
}
function recursivelyTrackChildren(children) {
    if (Array.isArray(children)) {
        return children.map((child, index) => {
            if (React.isValidElement(child)) {
                return createElement(TrackedComponent, {
                    element: child,
                    key: child.key ?? `memguard-${index}`
                });
            }
            return child;
        });
    }
    if (React.isValidElement(children)) {
        return createElement(TrackedComponent, {
            element: children,
            key: children.key
        });
    }
    return children;
}
export function MemGuardProvider({ children, trackComponents = false, ...config }) {
    useLayoutEffect(() => {
        init(config);
    }, []);
    const contextValue = {
        track,
        destroy,
        trackComponents
    };
    const content = trackComponents
        ? recursivelyTrackChildren(children)
        : children;
    return createElement(MemGuardContext.Provider, { value: contextValue }, content);
}
export function useMemGuardContext() {
    const context = useContext(MemGuardContext);
    if (!context) {
        throw new Error('useMemGuardContext must be used within a MemGuardProvider');
    }
    return context;
}
//# sourceMappingURL=react.js.map