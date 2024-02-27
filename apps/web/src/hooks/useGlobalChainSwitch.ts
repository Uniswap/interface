import { useWeb3React } from '@web3-react/core'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useEffect } from 'react'
import { useAppSelector } from 'state/hooks'

export const useOnGlobalChainSwitch = (callback: (chainId: number, chain?: Chain) => void) => {
  const { chainId } = useWeb3React()
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  useEffect(() => {
    if (chainId && chainId === switchingChain) {
      const chainName = CHAIN_ID_TO_BACKEND_NAME[chainId]
      callback(chainId, chainName)
    }
  }, [callback, chainId, switchingChain])
}
