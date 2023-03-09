import 'components/analytics'

import * as Sentry from '@sentry/react'
import { initializeAnalytics, OriginApplication } from '@uniswap/analytics'
import { SharedEventName } from '@uniswap/analytics-events'
import { isSentryEnabled } from 'utils/env'
import { getEnvName, isProductionEnv } from 'utils/env'

// Dump some metadata into the window to allow client verification.
window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

// Actual KEYs are set by proxy servers.
const AMPLITUDE_DUMMY_KEY = '00000000000000000000000000000000'
export const STATSIG_DUMMY_KEY = 'client-0000000000000000000000000000000000000000000'

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  release: process.env.REACT_APP_GIT_COMMIT_HASH,
  environment: getEnvName(),
  enabled: isSentryEnabled(),
  /**
   * TODO(INFRA-143)
   * According to Sentry, this shouldn't be necessary, as they default to `3` when not set.
   * Unfortunately, that doesn't work right now, so we workaround it by explicitly setting
   * the `normalizeDepth` to `10`. This should be removed once the issue is fixed.
   */
  normalizeDepth: 10,
})

initializeAnalytics(AMPLITUDE_DUMMY_KEY, OriginApplication.INTERFACE, {
  proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL,
  defaultEventName: SharedEventName.PAGE_VIEWED,
  commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
  isProductionEnv: isProductionEnv(),
})
