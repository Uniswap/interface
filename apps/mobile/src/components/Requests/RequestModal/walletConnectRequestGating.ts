import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface ShouldDisableWalletConnectConfirmForSafetyParams {
  isInternetReachable: boolean | null
  isLinkModeSupported: boolean | undefined
  riskLevel: TransactionRiskLevel | null
  confirmedRisk: boolean
}

/** Link mode bypasses only the transport check; every external dapp request still requires a usable scan verdict. */
export function shouldDisableWalletConnectConfirmForSafety({
  isInternetReachable,
  isLinkModeSupported,
  riskLevel,
  confirmedRisk,
}: ShouldDisableWalletConnectConfirmForSafetyParams): boolean {
  if (!isInternetReachable && !isLinkModeSupported) {
    return true
  }

  return shouldDisableConfirm({ riskLevel, confirmedRisk })
}
