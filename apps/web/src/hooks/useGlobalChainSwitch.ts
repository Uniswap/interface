import { chainIdToBackendChain, useIsSupportedChainId } from 'constants/chains'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useChainId } from 'wagmi'

export const useOnGlobalChainSwitch = (callback: (chainId: number, chain?: Chain) => void) => {
  const chainId = useChainId()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  useEffect(() => {
    if (isSupportedChain && chainId === switchingChain) {
      const chainName = chainIdToBackendChain({ chainId })
      callback(chainId, chainName)
    }
  }, [callback, chainId, isSupportedChain, switchingChain])
}
