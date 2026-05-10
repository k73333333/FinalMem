import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { track, destroy, untrack, getTrackedCount, clearAll } from '../src/core'
import { setConfig, getConfig, isEnabled } from '../src/config'

describe('core', () => {
  beforeEach(() => {
    setConfig({ enabled: true, ignorePatterns: [] })
    clearAll()
  })

  afterEach(() => {
    clearAll()
  })

  it('should return unique id when tracking object', () => {
    const obj = { name: 'test' }
    const id = track(obj)
    
    expect(id).toBeTruthy()
    expect(id.startsWith('mem-')).toBe(true)
  })

  it('should track and destroy object', () => {
    const obj = { name: 'test' }
    const id = track(obj)
    
    const count1 = getTrackedCount()
    expect(count1).toBe(1)
    
    destroy(id)
    
    const count2 = getTrackedCount()
    expect(count2).toBe(1)
  })

  it('should untrack object', () => {
    const obj = { name: 'test' }
    const id = track(obj)
    
    const count1 = getTrackedCount()
    expect(count1).toBe(1)
    
    untrack(id)
    
    const count2 = getTrackedCount()
    expect(count2).toBe(0)
  })

  it('should return empty string when disabled', () => {
    setConfig({ enabled: false })
    
    const obj = { name: 'test' }
    const id = track(obj)
    
    expect(id).toBe('')
  })

  it('should ignore files matching ignorePatterns', () => {
    setConfig({ enabled: true, ignorePatterns: [/node_modules/] })
    const mockStack = 'Error\n    at Object.track (/node_modules/some-lib/index.js:10:5)'
    const originalError = Error
    const MockError = class extends Error {
      constructor() {
        super()
        this.stack = mockStack
      }
    }
    const globalError = global.Error
    ;(global as any).Error = MockError
    
    try {
      const id = track({})
      expect(id).toBe('')
    } finally {
      ;(global as any).Error = globalError
    }
  })
})