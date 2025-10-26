/* eslint-disable import/no-unused-modules */
import { useAccountsStoreContext } from 'features/accounts/store/provider'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { AccessPattern } from 'uniswap/src/features/accounts/store/types/Connector'
import { createUseActiveAccount } from 'uniswap/src/features/accounts/store/utils/accounts'
import { createUseActiveAddress, createUseActiveAddresses } from 'uniswap/src/features/accounts/store/utils/addresses'
import {
  createUseActiveConnector,
  createUseConnectionStatus,
} from 'uniswap/src/features/accounts/store/utils/connection'
import { createUseAccountsStore } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { createUseActiveWallet, createUseWalletWithId } from 'uniswap/src/features/accounts/store/utils/wallets'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export const useAccountsStore = createUseAccountsStore(useAccountsStoreContext)

export const useActiveAddress = createUseActiveAddress(useAccountsStoreContext)

export const useActiveAddresses = createUseActiveAddresses(useAccountsStoreContext)

export const useActiveAccount = createUseActiveAccount(useAccountsStoreContext)

export const useActiveConnector = createUseActiveConnector(useAccountsStoreContext)

export const useActiveWallet = createUseActiveWallet(useAccountsStoreContext)

export const useConnectionStatus = createUseConnectionStatus(useAccountsStoreContext)

export const useWalletWithId = createUseWalletWithId(useAccountsStoreContext)

const useWalletWithConnectors = (walletId: string) => {
  const wallet = useWalletWithId(walletId)
  const connectors = useAccountsStore((state) => state.connectors)

  return useMemo(() => {
    const evmConnectorId = wallet?.connectorIds[Platform.EVM]
    const evmConnector = evmConnectorId ? connectors[evmConnectorId] : undefined

    const svmConnectorId = wallet?.connectorIds[Platform.SVM]
    const svmConnector = svmConnectorId ? connectors[svmConnectorId] : undefined

    return { ...wallet, evmConnector, svmConnector }
  }, [wallet, connectors])
}

export function useIsInjectedWallet(walletId: string) {
  const { evmConnector, svmConnector } = useWalletWithConnectors(walletId)

  // Porto is exposed by wagmi as injected, but we don't want to show it in the wallet modal as a detected wallet
  if (walletId === CONNECTION_PROVIDER_IDS.PORTO_CONNECTOR_ID) {
    return false
  }

  return evmConnector?.access === AccessPattern.Injected || svmConnector?.access === AccessPattern.Injected
}
