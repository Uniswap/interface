import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { useCallback } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { EVM_NETWORK, NETWORKS_INFO, isEVM, isSolana } from 'constants/networks'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { isEVMWallet, isSolanaWallet } from 'utils'

import { useActivationWallet } from './useActivationWallet'

const getEVMAddNetworkParams = (chainId: EVM_NETWORK) => ({
  chainId: '0x' + chainId.toString(16),
  chainName: NETWORKS_INFO[chainId].name,
  nativeCurrency: {
    name: NETWORKS_INFO[chainId].nativeToken.name,
    symbol: NETWORKS_INFO[chainId].nativeToken.symbol,
    decimals: NETWORKS_INFO[chainId].nativeToken.decimal,
  },
  rpcUrls: [NETWORKS_INFO[chainId].rpcUrl],
  blockExplorerUrls: [NETWORKS_INFO[chainId].etherscanUrl],
})

export function useChangeNetwork() {
  const { chainId, walletKey, walletEVM, walletSolana } = useActiveWeb3React()
  const { library, error } = useWeb3React()
  const { tryActivationEVM, tryActivationSolana } = useActivationWallet()

  const dispatch = useAppDispatch()
  const notify = useNotify()

  const changeNetworkHandler = useCallback(
    (desiredChainId: ChainId, successCallback?: () => void) => {
      dispatch(updateChainId(desiredChainId))
      successCallback?.()
    },
    [dispatch],
  )

  const changeNetwork = useCallback(
    async (desiredChainId: ChainId, successCallback?: () => void, failureCallback?: () => void) => {
      if (desiredChainId === chainId) {
        successCallback?.()
        return
      }

      const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
      if (
        wallet &&
        isEVMWallet(wallet) &&
        walletSolana.isConnected &&
        !walletEVM.isConnected &&
        !isSolana(desiredChainId)
      ) {
        try {
          await tryActivationEVM(wallet.connector)
        } catch {}
      }
      if (
        wallet &&
        isSolanaWallet(wallet) &&
        walletEVM.isConnected &&
        !walletEVM.isConnected &&
        !isEVM(desiredChainId)
      ) {
        try {
          await tryActivationSolana(wallet.adapter)
        } catch {}
      }

      if (isEVM(desiredChainId)) {
        const switchNetworkParams = {
          chainId: '0x' + Number(desiredChainId).toString(16),
        }
        const isWrongNetwork = error instanceof UnsupportedChainIdError
        // If not connected EVM wallet, or connected EVM wallet and want to switch back to EVM network
        if (
          (!walletEVM.isConnected && !isWrongNetwork) ||
          (walletEVM.isConnected && walletEVM.chainId === desiredChainId)
        ) {
          changeNetworkHandler(desiredChainId, successCallback)
          return
        }

        const activeProvider = library?.provider ?? window.ethereum
        if (activeProvider && activeProvider.request) {
          try {
            await activeProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [switchNetworkParams],
            })
            successCallback?.()
          } catch (switchError) {
            // This is a workaround solution for Coin98
            const isSwitchError =
              typeof switchError === 'object' && switchError && Object.keys(switchError)?.length === 0
            // This error code indicates that the chain has not been added to MetaMask.
            if ([4902, -32603, -32002].includes(switchError?.code) || isSwitchError) {
              const addNetworkParams = getEVMAddNetworkParams(desiredChainId)
              const value = await activeProvider.request({
                method: 'wallet_addEthereumChain',
                params: [addNetworkParams],
              })
              // wallet_addEthereumChain method return null mean it successful
              if (value === null) {
                successCallback?.()
              } else {
                notify({
                  title: t`Failed to switch network`,
                  type: NotificationType.ERROR,
                  summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must accept the network in your wallet.`,
                })
                failureCallback?.()
              }
            } else {
              // handle other "switch" errors
              failureCallback?.()
              notify({
                title: t`Failed to switch network`,
                type: NotificationType.ERROR,
                summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
              })
            }
          }
        }
      } else {
        changeNetworkHandler(desiredChainId, successCallback)
      }
    },
    [
      library,
      error,
      notify,
      changeNetworkHandler,
      tryActivationEVM,
      tryActivationSolana,
      walletKey,
      walletEVM.isConnected,
      walletEVM.chainId,
      walletSolana.isConnected,
      chainId,
    ],
  )

  return changeNetwork
}
