(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FinalMem = {}));
})(this, (function (exports) { 'use strict';

  var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
  const CHROME_REGEX = /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/;
  const CHROME_SHORT_REGEX = /at\s+(.+?):(\d+):(\d+)/;
  const FIREFOX_REGEX = /(.+?)@(.+?):(\d+):(\d+)/;
  const SAFARI_REGEX = /(.+?)@(.+?):(\d+):(\d+)/;
  const SAFARI_SHORT_REGEX = /^(?:file:\/\/)?(.+?):(\d+):(\d+)$/;
  function parseStack(stack) {
      const lines = stack.split('\n').filter(line => line.trim());
      const callStack = [];
      let file = '';
      let lineNum = 0;
      let column = 0;
      let methodName = '';
      let closureName = '';
      for (let i = 1; i < lines.length; i++) {
          const lineText = lines[i];
          let match = null;
          let matchedType = null;
          match = lineText.match(CHROME_REGEX);
          if (match)
              matchedType = 'chrome';
          if (!match) {
              match = lineText.match(CHROME_SHORT_REGEX);
              if (match)
                  matchedType = 'chrome_short';
          }
          if (!match) {
              match = lineText.match(FIREFOX_REGEX);
              if (match)
                  matchedType = 'firefox';
          }
          if (!match) {
              match = lineText.match(SAFARI_REGEX);
              if (match)
                  matchedType = 'safari';
          }
          if (!match) {
              match = lineText.match(SAFARI_SHORT_REGEX);
              if (match)
                  matchedType = 'safari_short';
          }
          if (match && matchedType) {
              let currentFile = '';
              const functionName = match[1];
              switch (matchedType) {
                  case 'chrome':
                  case 'firefox':
                  case 'safari':
                      currentFile = match[2];
                      break;
                  case 'chrome_short':
                  case 'safari_short':
                      currentFile = match[1];
                      break;
              }
              if (!file && !currentFile.includes('index.umd.js') && !currentFile.includes('dist/')) {
                  switch (matchedType) {
                      case 'chrome':
                      case 'firefox':
                      case 'safari':
                          file = match[2];
                          lineNum = parseInt(match[3], 10);
                          column = parseInt(match[4], 10);
                          break;
                      case 'chrome_short':
                      case 'safari_short':
                          file = match[1];
                          lineNum = parseInt(match[2], 10);
                          column = parseInt(match[3], 10);
                          break;
                  }
              }
              if (!methodName && functionName && !currentFile.includes('index.umd.js') && !currentFile.includes('dist/')) {
                  const cleanName = functionName.replace(/^Object\./, '').replace(/^Function\./, '');
                  methodName = cleanName;
              }
              if (!closureName && functionName && (functionName.includes('(anonymous)') || functionName.includes('Closure'))) {
                  closureName = functionName;
              }
              callStack.push(functionName || lineText);
          }
          else {
              callStack.push(lineText);
          }
      }
      return { file, line: lineNum, column, callStack, methodName, closureName };
  }

  function getIsProduction() {
      try {
          // 检查 Node.js 环境
          if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
              return process.env.NODE_ENV === 'production';
          }
          // 检查 import.meta.env (Vite)
          if (typeof ({ url: (typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.umd.js', document.baseURI).href)) }) !== 'undefined') {
              const metaEnv = undefined;
              if (metaEnv?.NODE_ENV) {
                  return metaEnv.NODE_ENV === 'production';
              }
          }
          // 检查 window.NODE_ENV
          if (typeof window !== 'undefined' && window.NODE_ENV) {
              return window.NODE_ENV === 'production';
          }
      }
      catch {
          // 忽略任何访问错误
      }
      return false;
  }
  const isProduction = getIsProduction();
  const defaultConfig = {
      enabled: !isProduction,
      threshold: 5000,
      interval: 2000,
      ignorePatterns: [
          /node_modules/,
          /@vue/,
          /@react/,
          /react-dom/
      ],
      globalVariableName: 'FinalMem'
  };
  let config = { ...defaultConfig };
  function getConfig() {
      return config;
  }
  function setConfig(newConfig) {
      const validatedConfig = {};
      if (newConfig.enabled !== undefined) {
          validatedConfig.enabled = Boolean(newConfig.enabled);
      }
      if (newConfig.threshold !== undefined && typeof newConfig.threshold === 'number' && newConfig.threshold >= 0) {
          validatedConfig.threshold = newConfig.threshold;
      }
      if (newConfig.interval !== undefined && typeof newConfig.interval === 'number' && newConfig.interval > 0) {
          validatedConfig.interval = newConfig.interval;
      }
      if (newConfig.ignorePatterns !== undefined && Array.isArray(newConfig.ignorePatterns)) {
          validatedConfig.ignorePatterns = newConfig.ignorePatterns.filter(p => p instanceof RegExp);
      }
      if (newConfig.globalVariableName !== undefined && typeof newConfig.globalVariableName === 'string') {
          validatedConfig.globalVariableName = newConfig.globalVariableName;
      }
      config = { ...config, ...validatedConfig };
  }
  function isEnabled() {
      return config.enabled;
  }
  function shouldIgnore(file) {
      return config.ignorePatterns.some(pattern => pattern.test(file));
  }

  function logLeak(info) {
      const now = Date.now();
      const aliveTime = info.destroyTime ? now - info.destroyTime : now - info.createTime;
      console.warn(`%c[MEMGUARD] %c疑似内存泄漏检测`, 'color: #667eea; font-weight: bold;', 'color: #ff4757; font-weight: bold; font-size: 14px;');
      console.warn(`  %c类型%c: ${info.type} | %c名称%c: ${info.name} | %c存活%c: ${aliveTime}ms`);
      if (info.stack.file) {
          console.warn(`%c📍 定位信息`, 'color: #2ed573; font-weight: bold;');
          console.warn(`  ├── %c文件%c : ${truncate(info.stack.file, 60)}`);
          console.warn(`  └── %c行号%c : ${info.stack.line}`);
      }
      if (info.stack.methodName) {
          console.warn(`%c🔧 调用方法`, 'color: #ffa502; font-weight: bold;');
          console.warn(`  └── %c名称%c : ${info.stack.methodName}`);
      }
      if (info.stack.closureName) {
          console.warn(`%c🔒 闭包信息`, 'color: #9b59b6; font-weight: bold;');
          console.warn(`  └── %c名称%c : ${info.stack.closureName}`);
      }
      if (info.stack.callStack.length > 0) {
          console.warn(`%c📋 调用堆栈`, 'color: #3498db; font-weight: bold;');
          const stackLines = info.stack.callStack.slice(0, 5);
          stackLines.forEach((line, index) => {
              const cleanLine = line.replace(/\s+/g, ' ').trim();
              console.warn(`  ├── ${index + 1}. ${truncate(cleanLine, 55)}`);
          });
          if (info.stack.callStack.length > 5) {
              console.warn(`  └── ... 共 ${info.stack.callStack.length} 行`);
          }
      }
  }
  function truncate(str, maxLength) {
      if (str.length <= maxLength)
          return str;
      return str.slice(0, maxLength - 3) + '...';
  }

  const trackedMap = new Map();
  let registry = null;
  let inspectionTimer = null;
  let initialized = false;
  function generateId() {
      return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  function logError(message, error) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.error(`[MEMGUARD Error] ${message}`, error);
      }
  }
  function initRegistry() {
      if (registry)
          return;
      registry = new FinalizationRegistry((id) => {
          try {
              const info = trackedMap.get(id);
              if (info) {
                  info.isCollected = true;
                  trackedMap.delete(id);
              }
          }
          catch (error) {
              logError('FinalizationRegistry callback error', error);
          }
      });
  }
  function startInspection() {
      if (inspectionTimer)
          return;
      const { interval } = getConfig();
      inspectionTimer = setInterval(() => {
          try {
              const { threshold } = getConfig();
              const now = Date.now();
              for (const [id, info] of trackedMap) {
                  if (info.isLeaked)
                      continue;
                  const checkTime = info.destroyTime || info.createTime;
                  const elapsed = now - checkTime;
                  if (elapsed > threshold) {
                      const obj = info.weakRef.deref();
                      if (obj !== undefined) {
                          info.isLeaked = true;
                          logLeak(info);
                      }
                      else {
                          info.isCollected = true;
                          trackedMap.delete(id);
                      }
                  }
              }
          }
          catch (error) {
              logError('Inspection interval error', error);
          }
      }, interval);
  }
  function track(obj, options = {}) {
      if (!isEnabled())
          return '';
      try {
          const stack = new Error().stack || '';
          const parsedStack = parseStack(stack);
          if (parsedStack.file && shouldIgnore(parsedStack.file)) {
              return '';
          }
          initRegistry();
          const id = generateId();
          const weakRef = new WeakRef(obj);
          const registryToken = {};
          registry.register(obj, id, registryToken);
          const info = {
              id,
              weakRef,
              stack: parsedStack,
              type: options.type || 'object',
              name: options.name || '',
              createTime: Date.now(),
              destroyTime: null,
              isCollected: false,
              isLeaked: false,
              registryToken
          };
          trackedMap.set(id, info);
          startInspection();
          return id;
      }
      catch (error) {
          logError('track function error', error);
          return '';
      }
  }
  function destroy(id) {
      if (!isEnabled())
          return;
      try {
          const info = trackedMap.get(id);
          if (info) {
              info.destroyTime = Date.now();
          }
      }
      catch (error) {
          logError('destroy function error', error);
      }
  }
  function untrack(id) {
      try {
          const info = trackedMap.get(id);
          if (info) {
              const currentRegistry = registry;
              if (currentRegistry) {
                  currentRegistry.unregister(info.registryToken);
              }
              trackedMap.delete(id);
          }
      }
      catch (error) {
          logError('untrack function error', error);
      }
  }
  function getTrackedCount() {
      return trackedMap.size;
  }
  function clearAll() {
      try {
          if (registry) {
              for (const info of trackedMap.values()) {
                  registry.unregister(info.registryToken);
              }
          }
          trackedMap.clear();
          if (inspectionTimer) {
              clearInterval(inspectionTimer);
              inspectionTimer = null;
          }
          registry = null;
          initialized = false;
      }
      catch (error) {
          logError('clearAll function error', error);
      }
  }
  function init(options) {
      if (initialized)
          return;
      initialized = true;
      if (options) {
          setConfig(options);
      }
      initRegistry();
      startInspection();
  }
  function isInitialized() {
      return initialized;
  }

  let globalVarName = getConfig().globalVariableName;
  const updateGlobalVariable = () => {
      if (typeof window !== 'undefined') {
          const config = getConfig();
          if (globalVarName !== config.globalVariableName) {
              delete window[globalVarName];
              globalVarName = config.globalVariableName;
          }
          window[config.globalVariableName] = memGuard;
      }
  };
  const memGuard = {
      track,
      destroy,
      untrack,
      getTrackedCount,
      clearAll,
      configure: (newConfig) => {
          setConfig(newConfig);
          updateGlobalVariable();
      },
      getConfig,
      init: (options) => {
          init(options);
          updateGlobalVariable();
      },
      isInitialized
  };
  function install(options) {
      init(options);
      updateGlobalVariable();
  }
  if (typeof window !== 'undefined') {
      updateGlobalVariable();
  }

  function useMemGuard$1() {
      return {
          track: (obj, options) => {
              return track(obj, options);
          },
          destroy
      };
  }
  function createMemGuardDirective() {
      return {
          mounted(el, binding) {
              const id = track(el, binding.value);
              el.__memGuardId = id;
          },
          unmounted(el) {
              const id = el.__memGuardId;
              if (id) {
                  destroy(id);
              }
          }
      };
  }
  const MemGuardVuePlugin = {
      install(app, options) {
          init(options);
          if (options?.trackComponents !== false) {
              app.mixin({
                  created() {
                      const opts = this.$options;
                      const componentName = opts.name || opts._componentTag || 'Anonymous';
                      const id = track(this, {
                          type: 'component',
                          name: componentName
                      });
                      this.__memGuardId = id;
                  },
                  beforeUnmount() {
                      const id = this.__memGuardId;
                      if (id) {
                          destroy(id);
                      }
                  }
              });
          }
          app.directive('mem-guard', createMemGuardDirective());
      }
  };

  let React = null;
  try {
      React = require('react');
  }
  catch {
      React = null;
  }
  const canUseReact = React !== null;
  const useMemGuard = (obj, options) => {
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
  const withMemGuard = (Component, options) => {
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
  const MemGuardProvider = ({ children, trackComponents = false, ...config }) => {
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
  const useMemGuardContext = () => {
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

  exports.MemGuardProvider = MemGuardProvider;
  exports.MemGuardVuePlugin = MemGuardVuePlugin;
  exports.clearAll = clearAll;
  exports.createMemGuardDirective = createMemGuardDirective;
  exports.destroy = destroy;
  exports.getConfig = getConfig;
  exports.getTrackedCount = getTrackedCount;
  exports.init = init;
  exports.install = install;
  exports.isEnabled = isEnabled;
  exports.isInitialized = isInitialized;
  exports.memGuard = memGuard;
  exports.parseStack = parseStack;
  exports.setConfig = setConfig;
  exports.track = track;
  exports.untrack = untrack;
  exports.useMemGuardContext = useMemGuardContext;
  exports.useReactMemGuard = useMemGuard;
  exports.useVueMemGuard = useMemGuard$1;
  exports.withMemGuard = withMemGuard;

}));
//# sourceMappingURL=index.umd.js.map
