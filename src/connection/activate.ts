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

const pendingConnectionStateAtom = atom<PendingConnectionState>({ connection: undefined, error: undefined })

export function useActivateConnection() {
  const dispatch = useAppDispatch()

  const [pendingState, setPendingState] = useAtom(pendingConnectionStateAtom)

  const setPendingConnection = useCallback(
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
      setPendingState({ connection, error: undefined })
    },
    [setPendingState]
  )

  const setPendingError = useCallback(
    (error: any) => {
      setPendingState(({ connection }) => {
        if (connection !== undefined) {
          sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
            result: WalletConnectionResult.FAILED,
            wallet_type: connection.getName(),
          })
        }

        return { connection, error }
      })
    },
    [setPendingState]
  )

  const cancelActivation = useCallback(async () => {
    await pendingState.connection?.connector.deactivate?.()
    setPendingConnection(undefined)
  }, [pendingState, setPendingConnection])

  const tryActivation = useCallback(
    async (connection: Connection, onSuccess: () => void) => {
      /* Skips wallet connection if the connection should override the default
        behavior, i.e. install MetaMask or launch Coinbase app */
      if (connection.overrideActivate?.()) return

      try {
        setPendingConnection(connection)
        await connection.connector.activate()

        console.debug(`connection activated: ${connection.getName()}`)
        dispatch(updateSelectedWallet({ wallet: connection.type }))

        // Clears pending connection state
        setPendingConnection(undefined)

        onSuccess()
      } catch (error) {
        // TODO(WEB-3162): re-add special treatment for already-pending injected errors
        console.debug(`web3-react connection error: ${JSON.stringify(error)}`)

        // Gracefully handles errors from the user rejecting a connection attempt
        if (didUserReject(connection, error)) {
          setPendingConnection(undefined)
          return
        }

        setPendingError(error)
      }
    },
    [dispatch, setPendingConnection, setPendingError]
  )

  return { pendingConnection: pendingState.connection, error: pendingState.error, tryActivation, cancelActivation }
}
