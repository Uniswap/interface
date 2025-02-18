import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

export const useOnGlobalChainSwitch = (callback: (chainId: number, chain?: Chain) => void) => {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  useEffect(() => {
    if (isSupportedChain && chainId === switchingChain) {
      const chainName = toGraphQLChain(chainId)
      callback(chainId, chainName)
    }
  }, [callback, chainId, isSupportedChain, switchingChain])
}
