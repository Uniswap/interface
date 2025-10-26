/* eslint-disable import/no-unused-modules */
import type { WebAccountsData } from 'features/accounts/store/types'
import { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { AccountsGetters } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { CrossChainAddresses } from 'uniswap/src/features/accounts/store/types/Wallet'
import { toConnectionStatusInfo } from 'uniswap/src/features/accounts/store/utils/connection'
import {
  FlexiblePlatformInput as Flexible,
  resolvePlatform,
} from 'uniswap/src/features/accounts/store/utils/flexibleInput'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export function createAccountsStoreGetters(getState: () => WebAccountsData) {
  function getActiveConnector<P extends Platform>(platformInput: Flexible<P>) {
    const { activeConnectors } = getState()
    return activeConnectors[resolvePlatform(platformInput)]
  }

  function getActiveSession<P extends Platform>(platformInput: Flexible<P>) {
    const connector = getActiveConnector(platformInput)
    if (!connector?.session) {
      return undefined
    }

    return connector.session
  }

  function getActiveWallet<P extends Platform>(platformInput: Flexible<P>) {
    const session = getActiveSession(platformInput)

    if (!session?.walletId) {
      return undefined
    }

    return getState().wallets[session.walletId]
  }

  function getActiveAddress<P extends Platform>(platformInput: Flexible<P>) {
    const platform = resolvePlatform(platformInput)

    const session = getActiveSession(platform)
    const wallet = getActiveWallet(platform)

    if (!wallet || !session) {
      return undefined
    }

    const addresses = wallet.addresses[session.currentAccountIndex] as CrossChainAddresses | undefined

    return addresses?.[platform]
  }

  function getActiveAddresses() {
    return { evmAddress: getActiveAddress(Platform.EVM), svmAddress: getActiveAddress(Platform.SVM) }
  }

  function getActiveChainId<P extends Platform>(platformInput: Flexible<P>) {
    const session = getActiveSession(platformInput)
    if (!session || !session.chainScope.currentChain.supportedByApp) {
      return undefined
    }
    return session.chainScope.currentChain.currentChainId
  }

  function getActiveAccount<P extends Platform>(platformInput: Flexible<P>) {
    const platform = resolvePlatform(platformInput)

    const address = getActiveAddress(platform)
    const chainId = getActiveChainId(platform)

    if (!address) {
      return undefined
    }

    const account: Account<Platform> = getState().accounts[address]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!account) {
      return undefined
    }

    if (account.platform !== platform) {
      throw new Error(`Account ${address} is not on platform ${platform}`)
    }
    return { ...(account as Account<P>), chainId }
  }

  // TODO(SWAP-581): Refactor connection mutation vs status relationship
  function getAggregateConnectionStatus() {
    const connectorStatuses = Object.values(getState().activeConnectors).map((connector) => connector.status)

    // If any connector is connected, treat as a connected status
    if (connectorStatuses.includes(ConnectorStatus.Connected)) {
      return ConnectorStatus.Connected
    }

    // If no connectors are connected and any connector is connecting, treat as a connecting status.
    // If the connection query is pending, also treat as a connecting status; this fixes gaps where one platforms connector has finished but another hasn't started yet.
    if (connectorStatuses.includes(ConnectorStatus.Connecting) || getState().connectionQueryIsPending) {
      return ConnectorStatus.Connecting
    }

    // If no connectors are connected or connecting, treat as a disconnected status
    return ConnectorStatus.Disconnected
  }

  function getConnectionStatus(platformInput: Flexible<Platform> | 'aggregate' = 'aggregate') {
    const status =
      platformInput === 'aggregate'
        ? getAggregateConnectionStatus()
        : (getActiveConnector(platformInput)?.status ?? ConnectorStatus.Disconnected)

    return toConnectionStatusInfo(status)
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
