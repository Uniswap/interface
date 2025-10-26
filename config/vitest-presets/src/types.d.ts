// Asset type declarations
declare module '*.css' {
  const content: any
  export default content
}

declare module '*.scss' {
  const content: any
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

// Global type declarations
declare global {
  const chrome: {
    storage: {
      local: {
        get: (keys?: string | string[] | null, callback?: (items: any) => void) => void
        set: (items: any, callback?: () => void) => void
        remove: (keys: string | string[], callback?: () => void) => void
        clear: (callback?: () => void) => void
      }
      sync: {
        get: (keys?: string | string[] | null, callback?: (items: any) => void) => void
        set: (items: any, callback?: () => void) => void
        remove: (keys: string | string[], callback?: () => void) => void
        clear: (callback?: () => void) => void
      }
      session?: {
        get: (keys?: string | string[] | null, callback?: (items: any) => void) => void
        set: (items: any, callback?: () => void) => void
      }
    }
    runtime: {
      getURL: (path: string) => string
    }
  }

  var __DEV__: boolean
}

export {}
