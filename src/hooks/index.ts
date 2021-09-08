import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from 'libs/sdk/src'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../state'
import { isMobile } from 'react-device-detect'
import { injected, NETWORK_URLS } from '../connectors'
import { NetworkContextName } from '../constants'
import { ethers } from 'ethers'

const simpleRpcProvider = new ethers.providers.JsonRpcProvider(
  'https://polygon.dmm.exchange/v1/mainnet/geth?appId=prod-dmm'
)

export const providers: {
  [chainId in ChainId]?: ethers.providers.JsonRpcProvider
} = {
  [ChainId.MAINNET]: new ethers.providers.JsonRpcProvider(NETWORK_URLS[ChainId.MAINNET]),
  [ChainId.BSCMAINNET]: new ethers.providers.JsonRpcProvider(NETWORK_URLS[ChainId.BSCMAINNET]),
  [ChainId.AVAXMAINNET]: new ethers.providers.JsonRpcProvider(NETWORK_URLS[ChainId.AVAXMAINNET]),
  [ChainId.MATIC]: new ethers.providers.JsonRpcProvider(NETWORK_URLS[ChainId.MATIC])
}

export function useActiveWeb3React(): Web3ReactContextInterface<Web3Provider> & { chainId?: ChainId } {
  const context = useWeb3ReactCore()
  const { library, chainId, ...web3React } = context
  const chainIdWhenNotConnected = useSelector<AppState, ChainId>(state => state.application.chainIdWhenNotConnected)
  return context.active
    ? context
    : { library: providers[chainIdWhenNotConnected], chainId: chainIdWhenNotConnected, ...web3React }
}

export function useEagerConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true)
        })
      } else {
        if (isMobile && window.ethereum) {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        } else {
          setTried(true)
        }
      }
    })
  }, [activate]) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (active) {
      setTried(true)
    }
  }, [active])

  return tried
}

/**
 * Use for network and injected - logs user in
 * and out after checking what network theyre on
 */
export function useInactiveListener(suppress = false) {
  const { active, error, activate } = useWeb3ReactCore() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleChainChanged = () => {
        // eat errors
        activate(injected, undefined, true).catch(error => {
          console.error('Failed to activate after chain changed', error)
        })
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          // eat errors
          activate(injected, undefined, true).catch(error => {
            console.error('Failed to activate after accounts changed', error)
          })
        }
      }

      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    return undefined
  }, [active, error, suppress, activate])
}
