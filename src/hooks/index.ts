import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../state'
import { isMobile } from 'react-device-detect'
import { injected } from '../connectors'
import { ethers } from 'ethers'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useLocalStorage } from 'react-use'

export const providers: {
  [chainId in ChainId]: ethers.providers.JsonRpcProvider
} = SUPPORTED_NETWORKS.reduce(
  (acc, val) => {
    acc[val] = new ethers.providers.JsonRpcProvider(NETWORKS_INFO[val].rpcUrl)
    return acc
  },
  {} as {
    [chainId in ChainId]: ethers.providers.JsonRpcProvider
  },
)

export function useActiveWeb3React(): Web3ReactContextInterface<Web3Provider> & { chainId?: ChainId } {
  const context = useWeb3ReactCore()
  // const contextNetwork = useWeb3ReactCore<Web3Provider>(NetworkContextName)

  const { library, chainId, ...web3React } = context
  const chainIdWhenNotConnected = useSelector<AppState, ChainId>(state => state.application.chainIdWhenNotConnected)
  if (context.active && context.chainId) {
    // const provider = providers[context.chainId as ChainId].cl
    // provider.provider = { isMetaMask: true }
    // provider.send = context.library.__proto__.send
    // provider.jsonRpcFetchFunc = context.library.jsonRpcFetchFunc
    // return {
    //   library: provider,
    //   chainId: context.chainId as ChainId,
    //   ...web3React
    // } as Web3ReactContextInterface
    return context
  } else {
    return {
      library: providers[chainIdWhenNotConnected],
      chainId: chainIdWhenNotConnected,
      ...web3React,
    } as Web3ReactContextInterface
  }
}

async function isAuthorized(): Promise<boolean> {
  if (!window.ethereum) {
    return false
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })

    if (accounts?.length > 0) {
      return true
    }
    return false
  } catch {
    return false
  }
}

let globalTried = false

export function useEagerConnect() {
  const { activate, active } = useWeb3ReactCore() // specifically using useWeb3ReactCore because of what this hook does
  const [tried, setTried] = useState(false)
  const [isManuallyDisconnect] = useLocalStorage('user-manually-disconnect')

  useEffect(() => {
    globalTried = tried
  }, [tried])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!globalTried) setTried(true)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    try {
      isAuthorized()
        .then(isAuthorized => {
          if (isAuthorized && !isManuallyDisconnect) {
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
        .catch(e => {
          console.log('Eagerly connect: authorize error', e)
          setTried(true)
        })
    } catch (e) {
      console.log('Eagerly connect: authorize error', e)
      setTried(true)
    }
  }, [activate, isManuallyDisconnect]) // intentionally only running on mount (make sure it's only mounted once :))

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
