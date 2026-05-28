import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useDatadogStatus } from 'src/features/datadog/DatadogContext'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { logger } from 'utilities/src/logger/logger'
import { selectAllowAnalytics } from 'wallet/src/features/telemetry/selectors'
import {
  selectActiveAccount,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
} from 'wallet/src/features/wallet/selectors'

/**
 * Publishes wallet identity (active address + imported address lists) to
 * Datadog as global RUM attributes. Replaces the per-action redux state
 * logging the team flagged as needed for wallet-recovery / import
 * investigations — without paying that cost on every dispatch.
 *
 * Skipped when the user has opted out of analytics, matching the previous
 * `shouldLogReduxState` gate on the Datadog redux enhancer.
 */
export function useDatadogWalletContext(): void {
  const { isInitialized } = useDatadogStatus()
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
