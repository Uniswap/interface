import { useAppSelector } from 'state/hooks'
import { selectIsAtomicBatchingSupportedByChainId } from 'state/walletCapabilities/reducer'
import { useEvent } from 'utilities/src/react/hooks'

// used in function calls, not component bodies
export function useIsAtomicBatchingSupportedByChainIdCallback(): (chainId: number) => boolean | undefined {
  const isAtomicBatchingSupportedByChainId = useAppSelector(selectIsAtomicBatchingSupportedByChainId)
  return useEvent(isAtomicBatchingSupportedByChainId)
}
