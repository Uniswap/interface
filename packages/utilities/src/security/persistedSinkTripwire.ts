import { isDevEnv, isTestEnv } from '@universe/environment'
import { createSensitiveFieldFinder, WALLET_SECRET_REDACT_PATHS } from '@universe/privacy'
import { logger } from 'utilities/src/logger/logger'

/** In-app stores that keep a value after the code that needed it has finished. */
export type PersistedSink =
  | 'react-query mutation variables'
  | 'react-query mutation data'
  | 'react-query query key'
  | 'react-query query data'
  | 'redux action'

export class WalletSecretInPersistedSinkError extends Error {
  constructor({ sink, path, label }: { sink: PersistedSink; path: string; label: string }) {
    super(
      `Wallet secret '${path}' found in ${sink} (${label}). Wallet secrets live only in the Keyring: ` +
        'pass them through useSecretMutation or a closure so they never enter app state.',
    )
    this.name = 'WalletSecretInPersistedSinkError'
  }
}

const findWalletSecret = createSensitiveFieldFinder({ redactPaths: WALLET_SECRET_REDACT_PATHS })

/**
 * Dev and test guard: a wallet secret in a persisted sink is a bug, so it throws. Production builds
 * skip the walk entirely.
 */
export function assertNoSecretsInPersistedSink({
  sink,
  value,
  label,
}: {
  sink: PersistedSink
  value: unknown
  label: string
}): void {
  if (!(isDevEnv() || isTestEnv())) {
    return
  }

  const secretPath = findWalletSecret(value)
  if (secretPath) {
    throw new WalletSecretInPersistedSinkError({ sink, path: secretPath, label })
  }
}

/**
 * For callers that cannot throw synchronously (react-query's QueryCache callbacks run inside the fetch
 * promise chain, where a throw would leave the query hanging instead of failing it): log now and
 * rethrow on the next tick so the failure still surfaces as an uncaught error in dev and test.
 */
export function surfacePersistedSinkError(error: unknown): void {
  logger.error(error, { tags: { file: 'persistedSinkTripwire.ts', function: 'surfacePersistedSinkError' } })
  setTimeout(() => {
    throw error
  }, 0)
}
