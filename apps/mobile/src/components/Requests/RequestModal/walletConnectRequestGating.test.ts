import { shouldDisableWalletConnectConfirmForSafety } from 'src/components/Requests/RequestModal/walletConnectRequestGating'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

describe('shouldDisableWalletConnectConfirmForSafety', () => {
  it('keeps an offline link-mode request disabled without a scan verdict', () => {
    expect(
      shouldDisableWalletConnectConfirmForSafety({
        isInternetReachable: false,
        isLinkModeSupported: true,
        riskLevel: null,
        confirmedRisk: false,
      }),
    ).toBe(true)
  })

  it('allows link mode to bypass only the offline transport check after a usable scan', () => {
    expect(
      shouldDisableWalletConnectConfirmForSafety({
        isInternetReachable: false,
        isLinkModeSupported: true,
        riskLevel: TransactionRiskLevel.None,
        confirmedRisk: false,
      }),
    ).toBe(false)
  })

  it('keeps a non-link-mode request disabled while offline', () => {
    expect(
      shouldDisableWalletConnectConfirmForSafety({
        isInternetReachable: false,
        isLinkModeSupported: false,
        riskLevel: TransactionRiskLevel.None,
        confirmedRisk: false,
      }),
    ).toBe(true)
  })

  it('keeps an online request disabled without a scan verdict', () => {
    expect(
      shouldDisableWalletConnectConfirmForSafety({
        isInternetReachable: true,
        isLinkModeSupported: false,
        riskLevel: null,
        confirmedRisk: false,
      }),
    ).toBe(true)
  })
})
