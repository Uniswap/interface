import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { sendEvent } from 'components/analytics'
import { Connection } from 'connection'
import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'

import { didUserReject } from './utils'

type PendingConnectionState = {
  connection: Connection | undefined
  error: any
}

const pendingConnectionAtom = atom<PendingConnectionState>({ connection: undefined, error: undefined })

export function useActivateConnection() {
  const dispatch = useAppDispatch()

  const [pending, setPending] = useAtom(pendingConnectionAtom)

  const updatePendingConnection = useCallback(
    (connection: Connection | undefined) => {
      // log selected wallet
      if (connection !== undefined) {
        sendEvent({
          category: 'Wallet',
          action: 'Change Wallet',
          label: connection.type,
        })
      }
      // Setting a new connection clears any pending errors
      setPending({ connection, error: undefined })
    },
    [setPending]
  )

  const updatePendingError = useCallback(
    (error: any) => {
      setPending(({ connection }) => {
        if (error !== undefined && connection !== undefined) {
          sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
            result: WalletConnectionResult.FAILED,
            wallet_type: connection.getName(),
          })
        }

        return { connection, error }
      })
    },
    [setPending]
  )

  const cancelActivation = useCallback(async () => {
    await pending.connection?.connector.deactivate?.()
    updatePendingConnection(undefined)
  }, [pending, updatePendingConnection])

  const tryActivation = useCallback(
    async (connection: Connection, onSuccess: () => void) => {
      // Skips wallet connection if the connection should override the default behavior, i.e. install metamask or launch coinbase app
      if (connection.overrideActivate?.()) return

      try {
        updatePendingConnection(connection)
        await connection.connector.activate()

        console.debug(`connection activated: ${connection.getName()}`)
        dispatch(updateSelectedWallet({ wallet: connection.type }))

        // Clears pending connection state
        updatePendingConnection(undefined)

        onSuccess()
      } catch (error) {
        // TODO(WEB-3162): re-add special treatment for already-pending injected errors
        console.debug(`web3-react connection error: ${JSON.stringify(error)}`)

        // Gracefully handles errors from the user rejecting a connection attempt
        if (didUserReject(connection, error)) {
          updatePendingConnection(undefined)
          return
        }

        updatePendingError(error)
      }
    },
    [dispatch, updatePendingConnection, updatePendingError]
  )

  return { pending, tryActivation, cancelActivation }
}
