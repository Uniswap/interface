/** biome-ignore-all lint/style/noNamespace: required to define process.env type */

declare global {
  namespace NodeJS {
    // All process.env values used by this package should be listed here
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test'
      REACT_APP_VERSION_TAG?: string
      REACT_APP_WEB_BUILD_TYPE?: string
      VERSION?: string
    }
  }
}

export {}
