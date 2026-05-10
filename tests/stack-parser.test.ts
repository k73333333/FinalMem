import { describe, it, expect } from 'vitest'
import { parseStack } from '../src/stack-parser'

describe('stack-parser', () => {
  it('should parse Chrome format stack', () => {
    const stack = `Error
    at Object.track (file:///path/to/project/src/core.ts:63:20)
    at Object.<anonymous> (file:///path/to/project/tests/test.ts:10:15)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)`
    
    const result = parseStack(stack)
    
    expect(result.file).toBe('file:///path/to/project/src/core.ts')
    expect(result.line).toBe(63)
    expect(result.column).toBe(20)
    expect(result.callStack.length).toBeGreaterThan(0)
  })

  it('should parse Firefox format stack', () => {
    const stack = `Error
    track@file:///path/to/project/src/core.ts:63:20
    @file:///path/to/project/tests/test.ts:10:15
    Module._compile@internal/modules/cjs/loader.js:1085:14`
    
    const result = parseStack(stack)
    
    expect(result.file).toBe('file:///path/to/project/src/core.ts')
    expect(result.line).toBe(63)
    expect(result.column).toBe(20)
  })

  it('should handle empty stack', () => {
    const result = parseStack('')
    
    expect(result.file).toBe('')
    expect(result.line).toBe(0)
    expect(result.column).toBe(0)
    expect(result.callStack).toEqual([])
  })
})
