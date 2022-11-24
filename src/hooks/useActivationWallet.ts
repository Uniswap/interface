import { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useCallback } from 'react'

import { walletlink } from 'connectors'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS, WALLETLINK_LOCALSTORAGE_NAME } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

export const useActivationWallet = () => {
  const { activate, deactivate, connector: activeConnector, library } = useWeb3React()
  const { select, wallet: solanaWallet } = useWallet()
  const { isSolana, isEVM, chainId } = useActiveWeb3React()
  const tryActivationEVM = useCallback(
    async (connector: AbstractConnector | undefined) => {
      // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
      if (connector instanceof WalletConnectConnector) {
        connector.walletConnectProvider = undefined
      }
      if (connector) {
        try {
          // disconnect Coinbase link before try to connect other wallet
          if (activeConnector === walletlink) {
            window.localStorage.removeItem(WALLETLINK_LOCALSTORAGE_NAME)
          }
          await activate(connector, undefined, true)
          const activeProvider = library?.provider ?? window.ethereum
          activeProvider?.request?.({
            method: 'wallet_switchEthereumChain',
            params: [
              {
                chainId: '0x' + Number(chainId).toString(16),
              },
            ],
          })
        } catch (error) {
          if (error instanceof UnsupportedChainIdError) {
            await activate(connector)
          } else {
            throw error
          }
        }
      }
    },
    [activate, activeConnector, chainId, library],
  )

  const tryActivationSolana = useCallback(
    async (adapter: BaseMessageSignerWalletAdapter) => {
      try {
        select(adapter.name)
      } catch (error) {
        throw error
      }
    },
    [select],
  )

  const tryActivation = useCallback(
    async (walletKey: SUPPORTED_WALLET) => {
      const wallet = SUPPORTED_WALLETS[walletKey]
      try {
        if (isEVM && isEVMWallet(wallet) && !wallet.href) {
          // Support change wallet between Coinbase and Metamask when user installed both of them
          if (window.ethereum?.providers) {
            const ethereum: any = window.ethereum
            const provider = ethereum.providers.find((p: any) => {
              if (walletKey === 'METAMASK') {
                return p.isMetaMask
              }
              if (walletKey === 'COINBASE') {
                return p.isCoinbaseWallet
              }
              return false
            })
            provider && (await ethereum.setSelectedProvider(provider))
            await deactivate()
          }

          await tryActivationEVM(wallet.connector)
        }
        if (isSolana && isSolanaWallet(wallet) && wallet.adapter !== solanaWallet?.adapter) {
          await tryActivationSolana(wallet.adapter)
        }
      } catch (err) {
        throw err
      }
    },
    [isSolana, isEVM, solanaWallet?.adapter, tryActivationEVM, tryActivationSolana, deactivate],
  )

  return {
    tryActivation,
    tryActivationEVM,
    tryActivationSolana,
  }
}
