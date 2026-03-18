import { isBetaEnv, isProdEnv } from 'utilities/src/environment/env'

function isAppUniswapOrg({ hostname }: { hostname: string }): boolean {
  return hostname === 'app.uniswap.org'
}

function isAppUniswapStagingOrg({ hostname }: { hostname: string }): boolean {
  return hostname === 'app.corn-staging.com'
}

export function isBrowserRouterEnabled(): boolean {
  if (isProdEnv()) {
    if (
      isAppUniswapOrg(window.location) ||
      isAppUniswapStagingOrg(window.location) ||
      isLocalhost(window.location) // playwright tests
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

export function isRemoteReportingEnabled(): boolean {
  // Disable in e2e test environments
  if (isBetaEnv() && !isAppUniswapStagingOrg(window.location)) {
    return false
  }
  if (isProdEnv() && !isAppUniswapOrg(window.location)) {
    return false
  }
  return process.env.REACT_APP_ANALYTICS_ENABLED === 'true'
}
