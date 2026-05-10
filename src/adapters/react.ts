import React, { useEffect, useLayoutEffect, useRef, type ComponentType, type Ref, createContext, useContext, type ReactNode, createElement, type ReactElement, type Key } from 'react';
import { track, destroy, init } from '../core';

interface UseMemGuardOptions {
  type?: string;
  name?: string;
}

export function useMemGuard<T extends object>(obj: T, options?: UseMemGuardOptions): T {
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
}

export function withMemGuard<P extends object>(Component: ComponentType<P>, options?: UseMemGuardOptions) {
  return function MemGuardWrapped(props: P & { ref?: Ref<any> }) {
    const innerRef = useRef<any>(null);
    const idRef = useRef<string | null>(null);
    
    useEffect(() => {
      if (innerRef.current) {
        const id = track(innerRef.current as object, {
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

const MemGuardContext = createContext<MemGuardContextType | null>(null);

function TrackedComponent({ 
  element, 
  key 
}: { 
  element: ReactElement<any>; 
  key: Key | null | undefined; 
}) {
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
}

function recursivelyTrackChildren(children: ReactNode): ReactNode {
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

const canUseDOM = typeof window !== 'undefined';
const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;

export function MemGuardProvider({ children, trackComponents = false, ...config }: MemGuardProviderProps) {
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
  
  return createElement(MemGuardContext.Provider, { value: contextValue }, content);
}

export function useMemGuardContext(): MemGuardContextType {
  const context = useContext(MemGuardContext);
  if (!context) {
    throw new Error('useMemGuardContext must be used within a MemGuardProvider');
  }
  return context;
}
