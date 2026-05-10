import { track, destroy, init } from '../core';

interface UseMemGuardOptions {
  type?: string;
  name?: string;
}

let React: typeof import('react') | null = null;

try {
  React = require('react');
} catch {
  React = null;
}

const canUseReact = React !== null;

export const useMemGuard = <T extends object>(obj: T, options?: UseMemGuardOptions): T => {
  if (!canUseReact) {
    return obj;
  }
  
  const { useEffect, useRef } = React!;
  const idRef = useRef<string | null>(null);
  
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

export const withMemGuard = <P extends object>(Component: React.ComponentType<P>, options?: UseMemGuardOptions) => {
  if (!canUseReact) {
    return Component;
  }
  
  const { useEffect, useRef, createElement } = React!;
  
  return (props: P & { ref?: React.Ref<any> }) => {
    const innerRef = useRef<any>(null);
    const idRef = useRef<string | null>(null);
    
    useEffect(() => {
      if (innerRef.current) {
        const id = track(innerRef.current as object, {
          type: options?.type || 'component',
          name: options?.name || (Component as { name?: string }).name
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
let MemGuardContext: React.Context<MemGuardContextTypeValue> | null = null;

const getMemGuardContext = () => {
  if (!MemGuardContext && canUseReact) {
    MemGuardContext = React!.createContext<MemGuardContextType | null>(null);
  }
  return MemGuardContext;
};

const TrackedComponent = ({ 
  element, 
  key 
}: { 
  element: React.ReactElement<any>; 
  key: React.Key | null | undefined; 
}) => {
  if (!canUseReact) {
    return element;
  }
  
  const { useEffect, useRef, createElement } = React!;
  const innerRef = useRef<any>(null);
  const idRef = useRef<string | null>(null);
  const type = element.type;
  const componentName = (type as { displayName?: string })?.displayName || 
    (typeof type === 'function' ? type.name : 'Unknown');
  
  useEffect(() => {
    if (innerRef.current) {
      const id = track(innerRef.current as object, {
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

const recursivelyTrackChildren = (children: React.ReactNode): React.ReactNode => {
  if (!canUseReact) {
    return children;
  }
  
  const { isValidElement, createElement } = React!;
  
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

export const MemGuardProvider = ({ children, trackComponents = false, ...config }: MemGuardProviderProps) => {
  if (!canUseReact) {
    init(config);
    return children as React.ReactNode;
  }
  
  const { useLayoutEffect, useEffect, createElement } = React!;
  const canUseDOM = typeof window !== 'undefined';
  const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
  
  useIsomorphicLayoutEffect(() => {
    init(config);
  }, []);
  
  const contextValue: MemGuardContextType = {
    track,
    destroy,
    trackComponents
  };
  
  const content = trackComponents 
    ? recursivelyTrackChildren(children)
    : children;
  
  const context = getMemGuardContext();
  if (!context) {
    return content as React.ReactNode;
  }
  
  return createElement(context.Provider, { value: contextValue }, content);
};

export const useMemGuardContext = (): MemGuardContextType => {
  if (!canUseReact) {
    throw new Error('useMemGuardContext requires React to be available');
  }
  
  const { useContext } = React!;
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