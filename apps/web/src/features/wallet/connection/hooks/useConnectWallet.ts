import {
  ConnectWalletMutationParams,
  useConnectWalletMutation,
} from 'features/wallet/connection/hooks/useConnectWalletMutation'
import { useGetConnectionService } from 'features/wallet/connection/services/getConnectionService'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import { pipe } from 'utilities/src/primitives/array'
import { useEvent } from 'utilities/src/react/hooks'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

/** Wraps a connect wallet service with functionality to log connection events. */
function wrapConnectionServiceWithLogging(baseService: ConnectionService): ConnectionService {
  return {
    connect: async (params) => {
      logger.debug(
        'wrapConnectWalletServiceWithLogging',
        'features/wallet/connection/hooks/useConnectWallet',
        `Connection activating: ${params.wallet.name}`,
      )
      try {
        const result = await baseService.connect(params)
        if (result.connected) {
          logger.debug(
            'wrapConnectWalletServiceWithLogging',
            'features/wallet/connection/hooks/useConnectWallet',
            `Connection activated: ${params.wallet.name}`,
          )
        }
        return result
      } catch (error) {
        logger.warn(
          'wrapConnectWalletServiceWithLogging',
          'features/wallet/connection/hooks/useConnectWallet',
          `Connection failed: ${params.wallet.name}. Error: ${error.message}`,
        )
        throw error
      }
    },
  }
}

/** Wraps a connect wallet service with functionality to send analytics events. */
function wrapConnectionServiceWithAnalytics(service: ConnectionService): ConnectionService {
  return {
    connect: async (params) => {
      try {
        return await service.connect(params)
      } catch (error) {
        sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
          result: WalletConnectionResult.Failed,
          wallet_name: params.wallet.name,
          wallet_type: params.wallet.analyticsWalletType,
          page: getCurrentPageFromLocation(window.location.pathname),
          error: error.message,
        })
        throw error
      }
    },
  }
}

export function useConnectWallet() {
  const getConnectionService = useGetConnectionService()

  const { mutate, ...rest } = useConnectWalletMutation()

  const connectWallet = useEvent((params: Omit<ConnectWalletMutationParams, 'connectionService'>) => {
    // 1) Get the proper connection service based on input
    const baseService = getConnectionService(params)

    // 2) Wrap the connection service with logging decorator
    const wrappedService = pipe(baseService, [wrapConnectionServiceWithLogging, wrapConnectionServiceWithAnalytics])

    // 3) Initiate Connection
    mutate({ ...params, connectionService: wrappedService })
  })

  return { connectWallet, ...rest }
}
