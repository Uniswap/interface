import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'

/**
 * The web FOR nudge, except when any blocking warning that sets its own button copy is present, since funding the
 * wallet wouldn't clear it (today that's BlockedToken and GeoRestricted). Balance warnings are exempt: funding fixes
 * them. Blocking warnings without button copy (form incomplete, no routes) leave the nudge active.
 */
export function useIsWebFORNudgeActive(): boolean {
  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()
  const { blockingWarning } = useParsedSwapWarnings()

  const isBalanceWarning =
    blockingWarning?.type === WarningLabel.InsufficientFunds ||
    blockingWarning?.type === WarningLabel.InsufficientGasFunds
  const blocksNudge = !!blockingWarning?.buttonText && !isBalanceWarning

  return isWebFORNudgeEnabled && !blocksNudge
}
