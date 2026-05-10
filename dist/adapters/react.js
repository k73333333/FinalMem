import { track, destroy, init } from '../core';
let React = null;
try {
    React = require('react');
}
catch {
    React = null;
}
const canUseReact = React !== null;
export const useMemGuard = (obj, options) => {
    if (!canUseReact) {
        return obj;
    }
    const { useEffect, useRef } = React;
    const idRef = useRef(null);
    useEffect(() => {
        const id = track(obj, options);
        idRef.current = id;
        return () => {
            if (idRef.current) {
                destroy(idRef.current);
            }
        };
    }, [obj, options?.type, options?.name]);
    return obj;
};
export const withMemGuard = (Component, options) => {
    if (!canUseReact) {
        return Component;
    }
    const { useEffect, useRef, createElement } = React;
    return (props) => {
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
};
let MemGuardContext = null;
const getMemGuardContext = () => {
    if (!MemGuardContext && canUseReact) {
        MemGuardContext = React.createContext(null);
    }
    return MemGuardContext;
};
const TrackedComponent = ({ element, key }) => {
    if (!canUseReact) {
        return element;
    }
    const { useEffect, useRef, createElement } = React;
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
};
const recursivelyTrackChildren = (children) => {
    if (!canUseReact) {
        return children;
    }
    const { isValidElement, createElement } = React;
    if (Array.isArray(children)) {
        return children.map((child, index) => {
            if (isValidElement(child)) {
                return createElement(TrackedComponent, {
                    element: child,
                    key: child.key ?? `memguard-${index}`
                });
            }
            return child;
        });
    }
    if (isValidElement(children)) {
        return createElement(TrackedComponent, {
            element: children,
            key: children.key
        });
    }
    return children;
};
export const MemGuardProvider = ({ children, trackComponents = false, ...config }) => {
    if (!canUseReact) {
        init(config);
        return children;
    }
    const { useLayoutEffect, useEffect, createElement } = React;
    const canUseDOM = typeof window !== 'undefined';
    const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
    useIsomorphicLayoutEffect(() => {
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
    const context = getMemGuardContext();
    if (!context) {
        return content;
    }
    return createElement(context.Provider, { value: contextValue }, content);
};
export const useMemGuardContext = () => {
    if (!canUseReact) {
        throw new Error('useMemGuardContext requires React to be available');
    }
    const { useContext } = React;
    const context = getMemGuardContext();
    if (!context) {
        throw new Error('useMemGuardContext must be used within a MemGuardProvider');
    }
    const ctx = useContext(context);
    if (!ctx) {
        throw new Error('useMemGuardContext must be used within a MemGuardProvider');
    }
    return ctx;
};
//# sourceMappingURL=react.js.map