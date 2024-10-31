import { setupAmplitude } from 'tracing/amplitude'
import { getEnvName } from 'tracing/env'
import { setupSentry } from 'tracing/sentry'
import { setupDatadog } from 'utilities/src/logger/Datadog'
import { isRemoteReportingEnabled } from 'utils/env'

// we do not collect analytics atm
const shouldAllowAnalytics = false

if (isRemoteReportingEnabled() && shouldAllowAnalytics) {
  // Dump some metadata into the window to allow client verification.
  window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

  setupDatadog(getEnvName)
  setupSentry()
}

if (shouldAllowAnalytics) {
    setupAmplitude()
}
