import { useEvent } from 'utilities/src/react/hooks'
import { useAppSelector } from '~/state/hooks'
import { selectHasAlternateGasFeesByChainId } from '~/state/walletCapabilities/reducer'

// used in function calls, not component bodies
export function useHasAlternateGasFeesByChainIdCallback(): (chainId: number) => boolean | undefined {
  const hasAlternateGasFeesByChainId = useAppSelector(selectHasAlternateGasFeesByChainId)
  return useEvent(hasAlternateGasFeesByChainId)
}
