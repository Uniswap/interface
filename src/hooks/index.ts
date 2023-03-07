import { Web3Provider } from '@ethersproject/providers'
import { ChainId, ChainType, getChainType } from '@kyberswap/ks-sdk-core'
import { Wallet, useWallet } from '@solana/wallet-adapter-react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { useWeb3React as useWeb3ReactCore } from '@web3-react/core'
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useSelector } from 'react-redux'

import { injected, walletconnect, walletlink } from 'connectors'
import { NETWORKS_INFO } from 'constants/networks'
import { NetworkInfo } from 'constants/networks/type'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS, WALLETLINK_LOCALSTORAGE_NAME } from 'constants/wallets'
import { AppState } from 'state'
import { useKyberSwapConfig } from 'state/application/hooks'
import { useIsAcceptedTerm, useIsUserManuallyDisconnect } from 'state/user/hooks'
import { detectInjectedType, isEVMWallet, isSolanaWallet } from 'utils'

export function useActiveWeb3React(): {
  chainId: ChainId
  account?: string
  walletKey: SUPPORTED_WALLET | undefined
  walletEVM: { isConnected: boolean; walletKey?: string | number; connector?: AbstractConnector; chainId?: ChainId }
  walletSolana: { isConnected: boolean; walletKey?: string | number; wallet: Wallet | null }
  isEVM: boolean
  isSolana: boolean
  networkInfo: NetworkInfo
} {
  const chainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  /**Hook for EVM infos */
  const { connector: connectedConnectorEVM, active: isConnectedEVM, account, chainId: chainIdEVM } = useWeb3React()
  /**Hook for Solana infos */
  const { wallet: connectedWalletSolana, connected: isConnectedSolana, publicKey } = useWallet()

  const isEVM = useMemo(() => getChainType(chainIdState) === ChainType.EVM, [chainIdState])
  const isSolana = useMemo(() => getChainType(chainIdState) === ChainType.SOLANA, [chainIdState])

  const addressEVM = account ?? undefined
  const addressSolana = publicKey?.toBase58()

  const walletKeyEVM = useMemo(() => {
    if (!isConnectedEVM) return undefined
    const detectedWallet = detectInjectedType()
    if (
      detectedWallet !== 'COINBASE' &&
      (connectedConnectorEVM === walletlink || !!(connectedConnectorEVM as any)?.walletLink)
    ) {
      return 'COINBASE_LINK'
    }
    if (connectedConnectorEVM === walletconnect) {
      return 'WALLET_CONNECT'
    }
    return (
      detectedWallet ??
      (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
        const wallet = SUPPORTED_WALLETS[walletKey]
        return isEVMWallet(wallet) && isConnectedEVM && wallet.connector === connectedConnectorEVM
      })
    )
  }, [connectedConnectorEVM, isConnectedEVM])

  const walletKeySolana = useMemo(
    () =>
      isConnectedSolana
        ? (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[]).find(walletKey => {
            const wallet = SUPPORTED_WALLETS[walletKey]
            return isSolanaWallet(wallet) && wallet.adapter === connectedWalletSolana?.adapter
          })
        : undefined,
    [isConnectedSolana, connectedWalletSolana?.adapter],
  )
  const mockAccountEVM = ''
  const mockAccountSolana = ''

  return {
    chainId: chainIdState,
    account: isEVM ? mockAccountEVM || addressEVM : (isConnectedSolana && mockAccountSolana) || addressSolana,
    walletKey: isEVM ? walletKeyEVM : walletKeySolana,
    walletEVM: useMemo(() => {
      return {
        isConnected: isConnectedEVM,
        connector: connectedConnectorEVM,
        walletKey: walletKeyEVM,
        chainId: chainIdEVM,
      }
    }, [isConnectedEVM, connectedConnectorEVM, walletKeyEVM, chainIdEVM]),
    walletSolana: useMemo(() => {
      return {
        isConnected: isConnectedSolana,
        wallet: connectedWalletSolana,
        walletKey: walletKeySolana,
      }
    }, [isConnectedSolana, connectedWalletSolana, walletKeySolana]),
    isEVM: isEVM,
    isSolana: isSolana,
    networkInfo: NETWORKS_INFO[chainIdState],
  }
}

export function useWeb3React(key?: string): Web3ReactContextInterface<Web3Provider> & { chainId?: ChainId } {
  const { connector, library, chainId, account, active, error, activate, setError, deactivate } = useWeb3ReactCore(key)
  const { provider } = useKyberSwapConfig()

  const activateWrapped = useCallback(
    (connector: AbstractConnector, onError?: (error: Error) => void, throwErrors?: boolean) => {
      return activate(connector, onError, throwErrors)
    },
    [activate],
  )
  const deactivateWrapped = useCallback(() => {
    return deactivate()
  }, [deactivate])
  return {
    connector,
    library: library || provider,
    chainId: chainId || ChainId.MAINNET,
    account,
    active,
    error,
    activate: activateWrapped,
    setError,
    deactivate: deactivateWrapped,
  } as Web3ReactContextInterface
}

export const useWeb3Solana = () => {
  const { connection } = useKyberSwapConfig()
  return { connection }
}

async function isAuthorized(): Promise<boolean> {
  // Check if previous connected to Coinbase Link
  if (window.localStorage.getItem(WALLETLINK_LOCALSTORAGE_NAME)) {
    return true
  }
  if (!window.ethereum) {
    return false
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts?.length > 0) return true
    return false
  } catch {
    return false
  }
}

export function useEagerConnect() {
  const { activate, active } = useWeb3React()
  const { disconnect } = useWallet()
  const [tried, setTried] = useState(false)
  const [isManuallyDisconnect] = useIsUserManuallyDisconnect()
  const [isAcceptedTerm] = useIsAcceptedTerm()

  useEffect(() => {
    try {
      // If not accepted Terms or Terms changed: block eager connect for EVM wallets and disconnect manualy for Solana wallet
      if (!isAcceptedTerm) {
        setTried(true)
        disconnect()
        return
      }
      isAuthorized()
        .then(isAuthorized => {
          setTried(true)
          // try to connect if previous connected to Coinbase Link
          if (isAuthorized && window.localStorage.getItem(WALLETLINK_LOCALSTORAGE_NAME)) {
            activate(walletlink)
          } else if (isAuthorized && !isManuallyDisconnect) {
            activate(injected, undefined, true)
          } else if (isMobile && window.ethereum) {
            activate(injected, undefined, true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only running on mount (make sure it's only mounted once :))

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
 * and out after checking what network they're on
 */
export function useInactiveListener(suppress = false) {
  const { isEVM } = useActiveWeb3React()
  const { active, error, activate } = useWeb3React() // specifically using useWeb3React because of what this hook does

  useEffect(() => {
    const { ethereum } = window
    if (!isEVM) return
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
  }, [active, error, suppress, activate, isEVM])
}
