import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { logger } from 'utilities/src/logger/logger'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import {
  selectActiveAccount,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
} from 'wallet/src/features/wallet/selectors'

/**
 * Publishes wallet identity to Datadog as global attributes on every RUM event and log line. This is
 * the whole Datadog allowlist for wallet state on mobile and the extension: redux state itself never
 * leaves the device. Adding a field is a change to this file, which @uniswap/security owns.
 *
 * `isInitialized` gates the native SDK, which rejects attributes before `DdSdkReactNative.initialize`.
 * The browser SDKs keep context set before `init`, so web callers pass `true`.
 *
 * Skipped when the user has opted out of analytics.
 */
export function useDatadogWalletContext({ isInitialized }: { isInitialized: boolean }): void {
  const allowAnalytics = useSelector(selectAllowAnalytics)
  const activeAccount = useSelector(selectActiveAccount)
  const signerAccounts = useSelector(selectSignerMnemonicAccounts)
  const viewOnlyAccounts = useSelector(selectViewOnlyAccounts)

  const signerAddresses = useMemo(() => signerAccounts.map((a) => a.address), [signerAccounts])
  const viewOnlyAddresses = useMemo(() => viewOnlyAccounts.map((a) => a.address), [viewOnlyAccounts])

  useEffect(() => {
    if (!isInitialized || !allowAnalytics) {
      return
    }
    setAttributesToDatadog({
      activeWalletAddress: activeAccount?.address ?? null,
      signerWalletAddresses: signerAddresses,
      viewOnlyWalletAddresses: viewOnlyAddresses,
      signerWalletCount: signerAddresses.length,
      viewOnlyWalletCount: viewOnlyAddresses.length,
    }).catch((e: Error) =>
      logger.error(e, {
        tags: { file: 'useDatadogWalletContext.tsx', function: 'setAttributes' },
      }),
    )
  }, [isInitialized, allowAnalytics, activeAccount?.address, signerAddresses, viewOnlyAddresses])
}
