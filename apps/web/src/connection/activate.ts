import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { trace } from 'tracing/trace'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { UserRejectedRequestError } from 'viem'
import { Connector, useConnect } from 'wagmi'

export function useConnectWithLogs(onSuccess: () => void) {
  const connectReturnType = useConnect()
  const currentPage = getCurrentPageFromLocation(useLocation().pathname)

  const { connect, reset } = connectReturnType

  const connectWithLogs = useCallback(
    async (connector: Connector) => {
      return trace(
        { name: 'Connect', op: 'wallet.connect', tags: { id: connector.id, wallet: connector.name } },
        async (trace) => {
          console.debug(`Connection activating: ${connector.name}`)
          connect(
            { connector },
            {
              onSuccess: () => {
                console.debug(`Connection activated: ${connector.name}`)
                onSuccess()
              },
              onError: (error) => {
                if (error instanceof UserRejectedRequestError) {
                  trace.setStatus('cancelled')
                  reset()
                  return
                }

                // TODO(WEB-1859): re-add special treatment for already-pending injected errors & move debug to after didUserReject() check
                console.debug(`Connection failed: ${connector.name}`)
                console.error(error)
                trace.setError(error)

                sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, {
                  result: WalletConnectionResult.FAILED,
                  wallet_type: connector.name,
                  page: currentPage,
                  error: error.message,
                })
              },
            }
          )
        }
      )
    },
    [connect, currentPage, onSuccess, reset]
  )

  return { ...connectReturnType, connect: connectWithLogs }
}
