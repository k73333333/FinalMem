import { describe, it, expect } from 'vitest'
import { getConfig, setConfig, isEnabled, shouldIgnore } from '../src/config'

describe('config', () => {
  it('should return default config', () => {
    const config = getConfig()
    
    expect(config.enabled).toBe(true)
    expect(config.threshold).toBe(5000)
    expect(config.interval).toBe(2000)
    expect(config.ignorePatterns.length).toBeGreaterThan(0)
  })

  it('should update config', () => {
    setConfig({ enabled: false, threshold: 1000 })
    
    const config = getConfig()
    
    expect(config.enabled).toBe(false)
    expect(config.threshold).toBe(1000)
    expect(config.interval).toBe(2000)
  })

  it('should check if enabled', () => {
    setConfig({ enabled: true })
    expect(isEnabled()).toBe(true)
    
    setConfig({ enabled: false })
    expect(isEnabled()).toBe(false)
  })

  it('should check if file should be ignored', () => {
    expect(shouldIgnore('/node_modules/react/index.js')).toBe(true)
    expect(shouldIgnore('/src/components/MyComponent.tsx')).toBe(false)
  })
})
