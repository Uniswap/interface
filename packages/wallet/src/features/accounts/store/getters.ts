/* eslint-disable @typescript-eslint/explicit-function-return-type -- utils derived from types in this file benefit from narrow, automatically inferred return types */
import { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { AccountsGetters } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { toConnectionStatusInfo } from 'uniswap/src/features/accounts/store/utils/connection'
import {
  FlexiblePlatformInput as Flexible,
  resolvePlatform,
} from 'uniswap/src/features/accounts/store/utils/flexibleInput'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { WalletAppsAccountsData } from 'wallet/src/features/accounts/store/types'

// Temporary utility type to ensure correct return type for getActiveConnector during temporary EVM-only wallet package state.
// type WalletGetConnectorReturnType<P extends Platform> = P extends Platform.EVM ? LocalConnector : undefined

export function createAccountsStoreGetters(getState: () => WalletAppsAccountsData) {
  function getActiveConnector<P extends Platform>(platform: Flexible<P>) {
    const connectorMap = {
      [Platform.EVM]: getState().localConnector,
      [Platform.SVM]: undefined, // Not implemented in wallet
    } as const

    return connectorMap[resolvePlatform(platform)]
  }

  function getActiveSession<P extends Platform>(platform: Flexible<P>) {
    const sessionMap = {
      [Platform.EVM]: getActiveConnector(Platform.EVM).session,
      [Platform.SVM]: undefined, // Not implemented in wallet
    } as const

    return sessionMap[resolvePlatform(platform)]
  }

  function getActiveWallet() {
    const session = getActiveSession(Platform.EVM)

    if (!session?.walletId) {
      return undefined
    }

    return getState().wallets[session.walletId]
  }

  function getActiveAddress<P extends Platform>(platform: Flexible<P>) {
    const session = getActiveSession(platform)
    const wallet = getActiveWallet()

    if (!wallet || !session) {
      return undefined
    }

    return wallet.addresses[session.currentAccountIndex]?.[resolvePlatform(platform)]
  }

  function getActiveAddresses() {
    return {
      evmAddress: getActiveAddress(Platform.EVM),
      svmAddress: getActiveAddress(Platform.SVM),
    }
  }

  function getActiveAccount<P extends Platform>(platform: Flexible<P>) {
    const address = getActiveAddress(platform)

    if (!address) {
      return undefined
    }

    const account = getState().accounts[address]

    const crossPlatformAccounts: { [PC in Platform]?: Account<PC> } = {
      [Platform.EVM]: account,
      [Platform.SVM]: undefined, // Not implemented in wallet
    }

    return crossPlatformAccounts[resolvePlatform(platform)]
  }

  function getConnectionStatus(platform: Flexible<Platform> | 'aggregate' = 'aggregate') {
    if (platform !== 'aggregate' && resolvePlatform(platform) === Platform.SVM) {
      return {
        status: ConnectorStatus.Disconnected,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      } as const
    }

    return toConnectionStatusInfo(getActiveConnector(Platform.EVM).status)
  }

  return {
    getActiveAddress,
    getActiveAddresses,
    getActiveAccount,
    getActiveWallet,
    getConnectionStatus,
    getActiveConnector,
  } satisfies AccountsGetters
}
