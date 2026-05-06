import { getConfig } from '~/config'
import { setupAmplitude } from '~/tracing/amplitude'
import { isRemoteReportingEnabled } from '~/utils/env'

if (isRemoteReportingEnabled()) {
  // Dump some metadata into the window to allow client verification.
  window.GIT_COMMIT_HASH = getConfig().gitCommitHash
}

setupAmplitude()
