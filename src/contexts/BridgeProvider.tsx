import React, { useEffect, useState } from 'react'
import { Bridge } from 'arb-ts'
import { providers, Signer } from 'ethers'

import { useActiveWeb3React } from '../hooks'

import { INFURA_PROJECT_ID } from '../connectors'
import { NETWORK_DETAIL } from '../constants'
import { getChainPair, ChainIdPair } from '../utils/arbitrum'
import { useDispatch } from 'react-redux'
import { setFromBridgeNetwork, setToBridgeNetwork } from '../state/bridge/actions'

type BridgeContextType = {
  bridge: Bridge | null
  chainIdPair: ChainIdPair
}

const defaultValue: BridgeContextType = {
  bridge: null,
  chainIdPair: {
    l1ChainId: undefined,
    l2ChainId: undefined
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
  const [chainIdPair, setChainIdPair] = useState<ChainIdPair>({
    l1ChainId: undefined,
    l2ChainId: undefined
  })
  const dispatch = useDispatch()

  useEffect(() => {
    const initBridge = async (
      ethSigner: Signer,
      arbSigner: Signer,
      l1GatewayRouterAddress?: string | undefined,
      l2GatewayRouterAddress?: string | undefined
    ) => {
      const bridge = await Bridge.init(ethSigner, arbSigner, l1GatewayRouterAddress, l2GatewayRouterAddress)
      setBridge(bridge)
    }

    // Setting the bridge
    if (library && account && chainId) {
      const resolvedChainIdPair = getChainPair(chainId)
      setChainIdPair(resolvedChainIdPair)

      const { partnerChainId, isArbitrum } = NETWORK_DETAIL[chainId]
      let l1Signer: providers.JsonRpcSigner, l2Signer: providers.JsonRpcSigner

      // Has arbitrum support
      if (partnerChainId) {
        // Withdraw
        if (isArbitrum) {
          const rpcUrl = NETWORK_DETAIL[partnerChainId].rpcUrls[0]

          l1Signer = new providers.JsonRpcProvider(addInfuraKey(rpcUrl)).getSigner(account)
          l2Signer = library.getSigner()
          // Deposit
        } else {
          l1Signer = library.getSigner()
          l2Signer = new providers.JsonRpcProvider(NETWORK_DETAIL[partnerChainId].rpcUrls[0]).getSigner(account)
        }

        if (l1Signer && l2Signer) {
          initBridge(l1Signer, l2Signer)
          dispatch(setFromBridgeNetwork({ chainId }))
          dispatch(setToBridgeNetwork({ chainId: partnerChainId }))
        }
      }
    }
  }, [chainId, library, account, dispatch])

  return (
    <BridgeContext.Provider value={{ bridge: bridge, chainIdPair: chainIdPair }}>{children}</BridgeContext.Provider>
  )
}
