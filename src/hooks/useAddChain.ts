import { useCallback, useState } from 'react'
import { useActiveWeb3React } from './index'
import { Chain } from '../constants/chains'

const SWITCH_ERROR_MSG = 'Failed to Switch Network'

export default function useAddChain() {
  const { library } = useActiveWeb3React()
  const [error, setError] = useState<string | undefined>()

  const addChain = useCallback(
    async (chain: Chain) => {
      if (library && library.provider && library.provider.request) {
        setError(undefined)

        try {
          const response = await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chain.chainId,
                chainName: chain.chainName,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpc],
                blockExplorerUrls: [chain.explorer]
              }
            ]
          })

          if (response !== null) {
            setError(SWITCH_ERROR_MSG)
          }
        } catch (e) {
          console.log(e)
          setError(SWITCH_ERROR_MSG)
        }
      }
    },
    [library]
  )

  return { error, addChain }
}
