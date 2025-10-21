import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const useOnGlobalChainSwitch = (callback: (chainId: UniverseChainId) => void) => {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  useEffect(() => {
    if (isSupportedChain && chainId === switchingChain) {
      callback(chainId)
    }
  }, [callback, chainId, isSupportedChain, switchingChain])
}
