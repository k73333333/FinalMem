import { track, destroy, init } from '../core'

interface MemGuardHTMLElement extends HTMLElement {
  __memGuardId?: string
}

interface MemGuardComponentInstance {
  $options: {
    name?: string
    _componentTag?: string
  }
  __memGuardId?: string
}

interface VueApp {
  mixin: (options: Record<string, unknown>) => void
  directive: (name: string, options: Record<string, unknown>) => void
}

export function useMemGuard() {
  return {
    track: (obj: object, options?: { type?: string; name?: string }) => {
      return track(obj, options)
    },
    destroy
  }
}

export function createMemGuardDirective() {
  return {
    mounted(el: MemGuardHTMLElement, binding: { value?: { type?: string; name?: string } }) {
      const id = track(el, binding.value)
      el.__memGuardId = id
    },
    unmounted(el: MemGuardHTMLElement) {
      const id = el.__memGuardId
      if (id) {
        destroy(id)
      }
    }
  }
}

export const MemGuardVuePlugin = {
  install(app: VueApp, options?: {
    enabled?: boolean
    threshold?: number
    interval?: number
    ignorePatterns?: RegExp[]
    trackComponents?: boolean
  }) {
    init(options)
    
    if (options?.trackComponents !== false) {
      app.mixin({
        created(this: MemGuardComponentInstance) {
          const opts = this.$options
          const componentName = opts.name || opts._componentTag || 'Anonymous'
          const id = track(this, { 
            type: 'component', 
            name: componentName 
          })
          this.__memGuardId = id
        },
        beforeUnmount(this: MemGuardComponentInstance) {
          const id = this.__memGuardId
          if (id) {
            destroy(id)
          }
        }
      })
    }
    
    app.directive('mem-guard', createMemGuardDirective())
  }
}
