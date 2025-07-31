import { noop } from '@tanstack/react-query'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useConnectCustomWalletsMap } from 'features/wallet/connection/connectors/custom'
import { useConnectSolanaWallet } from 'features/wallet/connection/connectors/solana'
import { wrapConnectWalletServiceWithStateTracking } from 'features/wallet/connection/connectors/state'
import { connectWagmiWallet } from 'features/wallet/connection/connectors/wagmi'
import {
  ConnectWalletService,
  createConnectWalletService,
} from 'features/wallet/connection/services/ConnectWalletService'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import { pipe } from 'utilities/src/primitives/array'
import { useEvent } from 'utilities/src/react/hooks'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

function useConnectWalletService(): ConnectWalletService {
  const connectSolanaWallet = useConnectSolanaWallet()
  const connectCustomWalletsMap = useConnectCustomWalletsMap()

  return useMemo(
    () =>
      createConnectWalletService({
        connectSolanaWallet,
        connectWagmiWallet,
        connectCustomWalletsMap,
      }),
    [connectSolanaWallet, connectCustomWalletsMap],
  )
}

function createWrapConnectWalletServiceWithUIUpdates(accountDrawer: ReturnType<typeof useAccountDrawer>) {
  /** Wraps a connect wallet service with functionality to update the account drawer upon connection. */
  return function wrapConnectWalletServiceWithUIUpdates(service: ConnectWalletService) {
    return {
      connect: async (params: { walletConnector: WalletConnectorMeta }) => {
        await service.connect(params)

        // Open the drawer if the user is connecting an embedded wallet, otherwise close
        if (params.walletConnector.customConnectorId === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID) {
          accountDrawer.open()
        } else {
          accountDrawer.close()
        }

        return
      },
    }
  }
}

/** Wraps a connect wallet service with functionality to log connection events. */
function wrapConnectWalletServiceWithLogging(service: ConnectWalletService): ConnectWalletService {
  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      logger.debug(
        'wrapConnectWalletServiceWithLogging',
        'features/wallet/connection/hooks/useConnectWallet',
        `Connection activating: ${params.walletConnector.name}`,
      )
      try {
        await service.connect(params)
        logger.debug(
          'wrapConnectWalletServiceWithLogging',
          'features/wallet/connection/hooks/useConnectWallet',
          `Connection activated: ${params.walletConnector.name}`,
        )
      } catch (error) {
        logger.warn(
          'wrapConnectWalletServiceWithLogging',
          'features/wallet/connection/hooks/useConnectWallet',
          `Connection failed: ${params.walletConnector.name}`,
        )
        throw error
      }
    },
  }
}

/** Wraps a connect wallet service with functionality to send analytics events. */
function wrapConnectWalletServiceWithAnalytics(service: ConnectWalletService): ConnectWalletService {
  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      // eslint-disable-next-line no-useless-catch
      try {
        await service.connect(params)
      } catch (error) {
        sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
          result: WalletConnectionResult.Failed,
          wallet_name: params.walletConnector.name,
          wallet_type: params.walletConnector.analyticsWalletType,
          page: getCurrentPageFromLocation(window.location.pathname),
          error: error.message,
        })
        throw error
      }
    },
  }
}

/**
 * Hook that returns a connect function for wallet connectors.
 * @returns A function that connects to a wallet using WalletConnectorMeta
 */
export function useConnectWallet(): (walletConnector: WalletConnectorMeta) => Promise<void> {
  const baseService = useConnectWalletService()
  const accountDrawer = useAccountDrawer()

  const wrappedService = useMemo(() => {
    const wrapConnectWalletServiceWithUIUpdates = createWrapConnectWalletServiceWithUIUpdates(accountDrawer)

    return pipe(baseService, [
      wrapConnectWalletServiceWithUIUpdates,
      wrapConnectWalletServiceWithStateTracking,
      wrapConnectWalletServiceWithLogging,
      wrapConnectWalletServiceWithAnalytics,
    ])
  }, [baseService, accountDrawer])

  return useEvent(async (walletConnector: WalletConnectorMeta) =>
    wrappedService.connect({ walletConnector }).catch(noop),
  )
}
