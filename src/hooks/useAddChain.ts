import { useCallback, useState } from 'react'
import { useInjectedProvider } from './index'
import { Chain } from '../constants/chains'
import { injectedSupportedChainIds } from '../connectors'

const SWITCH_ERROR_MSG = 'Failed to Switch Network'

export default function useAddChain() {
  const [error, setError] = useState<string | undefined>()
  const provider = useInjectedProvider()
  const chainId = Number(provider?.chainId)

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

  return {
    error,
    addChain,
    isAddChainEnabled:
      provider?.isMetaMask &&
      provider?._state?.isUnlocked &&
      !injectedSupportedChainIds.includes(chainId) &&
      provider.selectedAddress
  }
}
