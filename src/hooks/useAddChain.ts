import { useCallback, useState } from 'react'
import { useInactiveWeb3 } from './index'
import { Chain } from '../constants/chains'

const SWITCH_ERROR_MSG = 'Failed to Switch Network'

export default function useAddChain() {
  const [error, setError] = useState<string | undefined>()
  const provider = useInactiveWeb3()

  const addChain = useCallback(
    async (chain: Chain) => {
      if (provider && provider.request) {
        setError(undefined)

        try {
          const response = await provider.request({
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
    [provider]
  )

  return { error, addChain }
}
