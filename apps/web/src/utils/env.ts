export function isDevelopmentEnv(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test'
}

export function isStagingEnv(): boolean {
  // This is set in vercel builds and deploys from web/staging.
  return Boolean(process.env.REACT_APP_STAGING)
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production' && !isStagingEnv()
}

export function isAppRigoblockCom({ hostname }: { hostname: string }): boolean {
  return hostname === 'app.rigoblock.com'
}

export function isAppRigoblockStagingCom({ hostname }: { hostname: string }): boolean {
  return hostname === 'app.rigoblock-staging.com'
}

export function isBrowserRouterEnabled(): boolean {
  if (isProductionEnv()) {
    if (
      isAppUniswapOrg(window.location) ||
      isAppUniswapStagingOrg(window.location) ||
      isLocalhost(window.location) // cypress tests
    ) {
      return true
    }
    return false // production builds *not* served through our domains or localhost, eg IPFS
  }
  return true // local dev builds
}

function isLocalhost({ hostname }: { hostname: string }): boolean {
  return hostname === 'localhost'
}

export function isSentryEnabled(): boolean {
  // Disable in e2e test environments
  if (isStagingEnv() && !isAppRigoblockStagingCom(window.location)) return false
  if (isProductionEnv()) return false
  return process.env.REACT_APP_SENTRY_ENABLED === 'false'
}

export function getEnvName(): 'production' | 'staging' | 'development' {
  if (isStagingEnv()) {
    return 'staging'
  }
  if (isProductionEnv()) {
    return 'production'
  }
  return 'development'
}
