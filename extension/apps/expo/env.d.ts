declare namespace NodeJS {
  type AppVariant = 'development' | 'staging' | 'preview' | 'production'
  export interface ProcessEnv {
    APP_VARIANT: AppVariant
  }
}
