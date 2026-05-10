import { track, destroy, untrack, getTrackedCount, clearAll, init, isInitialized } from '../core'
import { setConfig, getConfig } from '../config'
import type { MemGuardConfig } from '../types'

let globalVarName = getConfig().globalVariableName

const updateGlobalVariable = () => {
  if (typeof window !== 'undefined') {
    const config = getConfig()
    if (globalVarName !== config.globalVariableName) {
      delete (window as any)[globalVarName]
      globalVarName = config.globalVariableName
    }
    ;(window as any)[config.globalVariableName] = memGuard
  }
}

export const memGuard = {
  track,
  destroy,
  untrack,
  getTrackedCount,
  clearAll,
  configure: (newConfig: Partial<MemGuardConfig>) => {
    setConfig(newConfig)
    updateGlobalVariable()
  },
  getConfig,
  init: (options?: Partial<MemGuardConfig>) => {
    init(options)
    updateGlobalVariable()
  },
  isInitialized
}

export function install(options?: {
  enabled?: boolean
  threshold?: number
  interval?: number
  ignorePatterns?: RegExp[]
}): void {
  init(options)
  updateGlobalVariable()
}

if (typeof window !== 'undefined') {
  updateGlobalVariable()
}
