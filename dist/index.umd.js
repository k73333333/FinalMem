(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FinalMem = {}, global.React));
})(this, (function (exports, React) { 'use strict';

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
              if (!file) {
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
              callStack.push(match[1] || lineText);
          }
          else {
              callStack.push(lineText);
          }
      }
      return { file, line: lineNum, column, callStack };
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
      config = { ...config, ...newConfig };
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
      console.warn(`%c[MEMGUARD 内存泄漏]`, 'color: #ff4757; font-weight: bold;', `类型: ${info.type} | 名称: ${info.name} | 存活: ${aliveTime}ms`);
      if (info.stack.file) {
          console.warn(`文件: ${info.stack.file} | 行: ${info.stack.line}`);
      }
      if (info.stack.callStack.length > 0) {
          console.warn('完整堆栈:');
          info.stack.callStack.forEach((line, index) => {
              console.warn(`  ${index + 1}. ${line}`);
          });
      }
  }

  const trackedMap = new Map();
  let registry = null;
  let inspectionTimer = null;
  let initialized = false;
  function generateId() {
      return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
          catch {
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
                  if (info.destroyTime !== null && now - info.destroyTime > threshold) {
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
          catch {
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
      catch {
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
      catch {
      }
  }
  function untrack(id) {
      try {
          const info = trackedMap.get(id);
          if (info && registry) {
              registry.unregister(info.registryToken);
          }
          trackedMap.delete(id);
      }
      catch {
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
      catch {
      }
  }
  function init(options) {
      if (initialized)
          return;
      if (options) {
          setConfig(options);
      }
      initRegistry();
      startInspection();
      initialized = true;
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
                  beforeCreate() {
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

  function useMemGuard(obj, options) {
      const idRef = React.useRef(null);
      React.useEffect(() => {
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
  function withMemGuard(Component, options) {
      return function MemGuardWrapped(props) {
          const innerRef = React.useRef(null);
          const idRef = React.useRef(null);
          React.useEffect(() => {
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
          return React.createElement(Component, { ...props, ref: innerRef });
      };
  }
  const MemGuardContext = React.createContext(null);
  function TrackedComponent({ element, key }) {
      const innerRef = React.useRef(null);
      const idRef = React.useRef(null);
      const type = element.type;
      const componentName = type?.displayName ||
          (typeof type === 'function' ? type.name : 'Unknown');
      React.useEffect(() => {
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
      return React.createElement(element.type, {
          ...element.props,
          ref: innerRef,
          key
      });
  }
  function recursivelyTrackChildren(children) {
      if (Array.isArray(children)) {
          return children.map((child, index) => {
              if (React.isValidElement(child)) {
                  return React.createElement(TrackedComponent, {
                      element: child,
                      key: child.key ?? `memguard-${index}`
                  });
              }
              return child;
          });
      }
      if (React.isValidElement(children)) {
          return React.createElement(TrackedComponent, {
              element: children,
              key: children.key
          });
      }
      return children;
  }
  function MemGuardProvider({ children, trackComponents = false, ...config }) {
      React.useLayoutEffect(() => {
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
      return React.createElement(MemGuardContext.Provider, { value: contextValue }, content);
  }
  function useMemGuardContext() {
      const context = React.useContext(MemGuardContext);
      if (!context) {
          throw new Error('useMemGuardContext must be used within a MemGuardProvider');
      }
      return context;
  }

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
