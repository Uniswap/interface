import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'

export const useIsBlockedByPermissionedPool = (): boolean => {
  const { blockingWarning } = useParsedSwapWarnings()
  return blockingWarning?.type === WarningLabel.PermissionedPool
}
