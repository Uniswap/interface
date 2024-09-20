import { setupAmplitude } from 'tracing/amplitude'
import { getEnvName } from 'tracing/env'
import { setupSentry } from 'tracing/sentry'
import { setupDatadog } from 'utilities/src/logger/Datadog'
import { isRemoteReportingEnabled } from 'utils/env'

if (isRemoteReportingEnabled()) {
  // Dump some metadata into the window to allow client verification.
  window.GIT_COMMIT_HASH = process.env.REACT_APP_GIT_COMMIT_HASH

  setupDatadog(getEnvName)
  setupSentry()
}

setupAmplitude()
