import { isBetaEnv, isProdEnv } from 'utilities/src/environment'

export function isAppRigoblockCom({ hostname }: { hostname: string }): boolean {
  return hostname === 'app.rigoblock.com'
}

export function isAppRigoblockStagingCom({ hostname }: { hostname: string }): boolean {
  return hostname === 'staging.rigoblock.com'
}

export function isBrowserRouterEnabled(): boolean {
  if (isProdEnv()) {
    if (
      isAppRigoblockCom(window.location) ||
      isAppRigoblockStagingCom(window.location) ||
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

export function isRemoteReportingEnabled(): boolean {
  // Disable in e2e test environments
  if (isBetaEnv() && !isAppRigoblockStagingCom(window.location)) {
    return false
  }
  if (isProdEnv()) {
    return false
  }
  return process.env.REACT_APP_SENTRY_ENABLED === 'false'
}
