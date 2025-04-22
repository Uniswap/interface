import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { useDisconnect } from 'hooks/useDisconnect'
import { PropsWithChildren, createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { UserRejectedRequestError } from 'viem'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ResolvedRegister, UseConnectReturnType, useConnect as useConnectWagmi } from 'wagmi'

const ConnectionContext = createContext<UseConnectReturnType<ResolvedRegister['config']> | undefined>(undefined)

export function ConnectionProvider({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const accountDrawer = useAccountDrawer()
  const { disconnect } = useDisconnect()

  const connection = useConnectWagmi({
    mutation: {
      onMutate({ connector }) {
        logger.debug('useConnect', 'ConnectionProvider', `Connection activating: ${connector.name}`)
      },
      onSuccess(_, { connector }) {
        logger.debug('useConnect', 'ConnectionProvider', `Connection activated: ${connector.name}`)
        accountDrawer.close()
      },
      onError(error, { connector }) {
        if (error instanceof UserRejectedRequestError) {
          connection.reset()
          return
        }

        // TODO(WEB-1859): re-add special treatment for already-pending injected errors & move debug to after didUserReject() check
        logger.warn('useConnect', 'ConnectionProvider', `Connection failed: ${connector.name}`)

        sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, {
          result: WalletConnectionResult.FAILED,
          wallet_name: connector.name,
          wallet_type: walletTypeToAmplitudeWalletType('type' in connector ? connector.type : undefined),
          page: getCurrentPageFromLocation(pathname),
          error: error.message,
        })
      },
    },
  })

  useEffect(() => {
    if (!accountDrawer.isOpen && connection.isPending) {
      connection.reset()
      disconnect()
    }
  }, [connection, accountDrawer.isOpen, disconnect])

  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>
}

/**
 * Wraps wagmi.useConnect in a singleton provider to provide the same connect state to all callers.
 * @see {@link https://wagmi.sh/react/api/hooks/useConnect}
 */
export function useConnect() {
  const value = useContext(ConnectionContext)
  if (!value) {
    throw new Error('useConnect must be used within a ConnectionProvider')
  }
  return value
}
