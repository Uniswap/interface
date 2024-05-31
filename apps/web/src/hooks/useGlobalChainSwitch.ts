import { chainIdToBackendChain, useIsSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export const useOnGlobalChainSwitch = (callback: (chainId: number, chain?: Chain) => void) => {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  useEffect(() => {
    if (isSupportedChain && chainId === switchingChain) {
      const chainName = chainIdToBackendChain({ chainId })
      callback(chainId, chainName)
    }
  }, [callback, chainId, isSupportedChain, switchingChain])
}
