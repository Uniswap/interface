import React, { useContext, useEffect, useState } from 'react'
import { Bridge } from 'arb-ts'
import { providers, Signer } from 'ethers'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React } from '../hooks'
import { NETWORK_DETAIL } from '../constants'
import { ChainIdPair } from '../utils/arbitrum'
import { INFURA_PROJECT_ID } from '../connectors'
import { POOLING_INTERVAL } from '../utils/getLibrary'
import { chainIdSelector } from '../state/application/selectors'

type BridgeContextType = {
  bridge: Bridge | null
  chainIdPair: ChainIdPair
}

const defaultValue: BridgeContextType = {
  bridge: null,
  chainIdPair: {
    l1ChainId: undefined,
    l2ChainId: undefined,
    chainId: undefined,
    partnerChainId: undefined,
    isArbitrum: undefined
  }
}

export const BridgeContext = React.createContext<BridgeContextType>(defaultValue)

const addInfuraKey = (rpcUrl: string) => {
  if (rpcUrl.includes('infura')) {
    let updatedUrl = rpcUrl

    if (!rpcUrl.endsWith('/')) {
      updatedUrl = rpcUrl + '/'
    }

    return updatedUrl + INFURA_PROJECT_ID
  }

  return rpcUrl
}

export const BridgeProvider = ({ children }: { children?: React.ReactNode }) => {
  const { library, chainId, account } = useActiveWeb3React()
  const [bridge, setBridge] = useState<Bridge | null>(null)
  const chains = useSelector(chainIdSelector)
  const dispatch = useDispatch()

  useEffect(() => {
    const initBridge = async (ethSigner: Signer, arbSigner: Signer) => {
      const bridge = await Bridge.init(ethSigner, arbSigner)
      setBridge(bridge)
    }

    setBridge(null)

    if (library && account && chainId) {
      const { partnerChainId, isArbitrum } = NETWORK_DETAIL[chainId]
      let l1Signer: providers.JsonRpcSigner, l2Signer: providers.JsonRpcSigner

      if (partnerChainId) {
        if (isArbitrum) {
          const rpcUrl = NETWORK_DETAIL[partnerChainId].rpcUrls[0]
          const l1Provider = new providers.JsonRpcProvider(addInfuraKey(rpcUrl))
          l1Provider.pollingInterval = POOLING_INTERVAL
          l1Signer = l1Provider.getSigner(account)
          l2Signer = library.getSigner()
        } else {
          const l2Provider = new providers.JsonRpcProvider(NETWORK_DETAIL[partnerChainId].rpcUrls[0])
          l2Provider.pollingInterval = POOLING_INTERVAL
          l1Signer = library.getSigner()
          l2Signer = l2Provider.getSigner(account)
        }

        if (l1Signer && l2Signer) {
          initBridge(l1Signer, l2Signer)
        }
      }
    }
  }, [chainId, library, account, dispatch])

  return <BridgeContext.Provider value={{ bridge: bridge, chainIdPair: chains }}>{children}</BridgeContext.Provider>
}

export const useBridge = () => {
  return useContext(BridgeContext)
}
