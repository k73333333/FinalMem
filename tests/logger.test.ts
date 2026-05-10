import { describe, it, expect, vi } from 'vitest'
import { logLeak } from '../src/logger'
import type { TrackedInfo } from '../src/types'

describe('logger', () => {
  it('should log leak warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const info: TrackedInfo = {
      id: 'mem-123',
      weakRef: new WeakRef({}),
      stack: {
        file: '/path/to/file.ts',
        line: 45,
        column: 10,
        callStack: ['at function1', 'at function2']
      },
      type: 'component',
      name: 'MyComponent',
      createTime: Date.now() - 10000,
      destroyTime: Date.now() - 8000,
      isCollected: false,
      isLeaked: false
    }
    
    logLeak(info)
    
    expect(warnSpy).toHaveBeenCalled()
    
    warnSpy.mockRestore()
  })
})
