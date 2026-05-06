declare global {
  namespace NodeJS {
    // All process.env values used by this package should be listed here
    interface ProcessEnv {
      APPSFLYER_API_KEY?: string
      APPSFLYER_APP_ID?: string
      ONESIGNAL_APP_ID?: string
    }
  }
}

export {}
