export interface ParsedStack {
  file: string
  line: number
  column: number
  callStack: string[]
}

export interface TrackedInfo {
  id: string
  weakRef: WeakRef<object>
  stack: ParsedStack
  type: string
  name: string
  createTime: number
  destroyTime: number | null
  isCollected: boolean
  isLeaked: boolean
  registryToken: object
}

export interface MemGuardConfig {
  enabled: boolean
  threshold: number
  interval: number
  ignorePatterns: RegExp[]
  globalVariableName: string
}

export interface TrackOptions {
  type?: string
  name?: string
}

export type DestroyOptions = {
  type?: string
}
