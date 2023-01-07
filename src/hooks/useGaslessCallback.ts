import { Biconomy } from '@biconomy/mexa'
import { Web3Provider } from '@ethersproject/providers'
import { BICONOMY_DAPP_API } from 'constants/addresses'
import { useEffect, useState } from 'react'
import { useIsGaslessMode } from 'state/user/hooks'

import { useActiveWeb3React } from './web3'

export function useGaslessCallback(): {
  gaslessCallback: () => Promise<Web3Provider | undefined>
} {
  // get claim data for this account
  const { library, chainId } = useActiveWeb3React()
  const isExpertMode = useIsGaslessMode()

  const gaslessCallback = async function () {
    if (!isExpertMode || !library || !chainId) return undefined

    const biconomy = new Biconomy(library, {
      apiKey: BICONOMY_DAPP_API[chainId],
      debug: true,
      strictMode: true,
    })
    return new Promise<Web3Provider>((resolve, reject) => {
      biconomy
        .onEvent(biconomy.READY, () => {
          // Initialize your dapp here like getting user accounts etc
          resolve(biconomy.getEthersProvider())
        })
        .onEvent(biconomy.ERROR, () => {
          // Handle error while initializing mexa
          resolve(library)
        })
    })
  }

  return { gaslessCallback }
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useGaslessProvider(): {
  gaslessProvider: Web3Provider | undefined
} {
  const { library, chainId } = useActiveWeb3React()
  const isExpertMode = useIsGaslessMode()

  const [gaslessLib, setGaslessLib] = useState<Web3Provider | undefined>(undefined)

  useEffect(() => {
    if (!library || !isExpertMode || !chainId) return undefined

    if (isExpertMode) {
      const biconomy = new Biconomy(library, {
        apiKey: BICONOMY_DAPP_API[chainId],
        debug: false,
      })
      return biconomy
        .onEvent(biconomy.READY, () => {
          // Initialize your dapp here like getting user accounts etc
          setGaslessLib(biconomy.getEthersProvider())
        })
        .onEvent(biconomy.ERROR, () => {
          // Handle error while initializing mexa
          setGaslessLib(library)
        })
    }
  }, [chainId, isExpertMode, library])

  return {
    gaslessProvider: gaslessLib,
  }
}
