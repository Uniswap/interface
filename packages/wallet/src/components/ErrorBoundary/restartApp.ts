import { logger } from 'utilities/src/logger/logger'
import { getReduxPersistor } from 'wallet/src/state/persistor'

// This should be the only file that imports `restart`.
// All other files should import `restartApp` instead.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { restart } from 'wallet/src/components/ErrorBoundary/restart'

export const restartApp = async (): Promise<void> => {
  try {
    // This makes sure that any pending state changes are persisted to disk.
    // This is important because we're about to restart the app, and we don't want to lose any data,
    // which could happen if we update the state right before calling `restart()`.
    await getReduxPersistor().flush()
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'restartApp.ts',
        function: 'restartApp',
      },
    })
  }

  restart()
}
