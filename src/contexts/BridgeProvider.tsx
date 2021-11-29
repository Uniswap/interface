import React, { useContext, useEffect, useState } from 'react'
import { Bridge } from 'arb-ts'
import { providers, Signer } from 'ethers'
import { useDispatch } from 'react-redux'
import { useActiveWeb3React } from '../hooks'
import { NETWORK_DETAIL } from '../constants'
import { INFURA_PROJECT_ID } from '../connectors'
import { POOLING_INTERVAL } from '../utils/getLibrary'
import { getChainPair } from '../utils/arbitrum'
import { setFromBridgeNetwork, setToBridgeNetwork } from '../state/bridge/actions'

type BridgeContextType = Bridge | null

export const BridgeContext = React.createContext<BridgeContextType>(null)

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
  const { library, account, chainId } = useActiveWeb3React()
  const [bridge, setBridge] = useState<Bridge | null>(null)
  const { isArbitrum, partnerChainId } = getChainPair(chainId)
  const dispatch = useDispatch()

  useEffect(() => {
    const abortController = new AbortController()

    const initBridge = async (signal: AbortSignal, ethSigner: Signer, arbSigner: Signer) => {
      if (!signal.aborted) {
        await new Promise<void>(async (resolve, reject) => {
          signal.addEventListener('abort', reject)

          try {
            const bridge = await Bridge.init(ethSigner, arbSigner)
            setBridge(bridge)
            resolve()
          } catch (err) {
            reject()
          } finally {
            signal.removeEventListener('abort', reject)
          }
        }).catch(() => console.error('BridgeProvider: Failed to set the bridge'))
      }
    }

    setBridge(null)

    if (library && account && chainId) {
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
          initBridge(abortController.signal, l1Signer, l2Signer)
          dispatch(setFromBridgeNetwork({ chainId }))
          dispatch(setToBridgeNetwork({ chainId: partnerChainId }))
        }
      }
    }

    return () => {
      abortController.abort()
    }
  }, [chainId, library, account, dispatch, partnerChainId, isArbitrum])

  return <BridgeContext.Provider value={bridge}>{children}</BridgeContext.Provider>
}

export const useBridge = () => {
  return useContext(BridgeContext)
}
