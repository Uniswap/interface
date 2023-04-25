import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { Connection } from 'connection'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'

import { didUserReject } from './utils'

export enum ActivationStatus {
  PENDING,
  ERROR,
  EMPTY,
}

type ActivationPendingState = { status: ActivationStatus.PENDING; connection: Connection }
export type ActivationErrorState = { status: ActivationStatus.ERROR; connection: Connection; error: any }
const EMPTY_ACTIVATION_STATE = { status: ActivationStatus.EMPTY } as const

type ActivationState = ActivationPendingState | ActivationErrorState | typeof EMPTY_ACTIVATION_STATE

const pendingConnectionStateAtom = atom<ActivationState>(EMPTY_ACTIVATION_STATE)

export function useTryActivation() {
  const dispatch = useAppDispatch()
  const setActivationState = useUpdateAtom(pendingConnectionStateAtom)

  return useCallback(
    async (connection: Connection, onSuccess: () => void) => {
      /* Skips wallet connection if the connection should override the default
        behavior, i.e. install MetaMask or launch Coinbase app */
      if (connection.overrideActivate?.()) return

      try {
        setActivationState({ status: ActivationStatus.PENDING, connection })
        await connection.connector.activate()

        console.debug(`connection activated: ${connection.getName()}`)
        dispatch(updateSelectedWallet({ wallet: connection.type }))

        // Clears pending connection state
        setActivationState(EMPTY_ACTIVATION_STATE)

        onSuccess()
      } catch (error) {
        // TODO(WEB-3162): re-add special treatment for already-pending injected errors
        console.debug(`web3-react connection error: ${JSON.stringify(error)}`)

        // Gracefully handles errors from the user rejecting a connection attempt
        if (didUserReject(connection, error)) {
          setActivationState(EMPTY_ACTIVATION_STATE)
          return
        }

        sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECT_TXN_COMPLETED, {
          result: WalletConnectionResult.FAILED,
          wallet_type: connection.getName(),
        })
        setActivationState({ status: ActivationStatus.ERROR, connection, error })
      }
    },
    [dispatch, setActivationState]
  )
}

function useCancelActivation() {
  const setActivationState = useUpdateAtom(pendingConnectionStateAtom)
  return useCallback(
    () =>
      setActivationState((activationState) => {
        if (activationState.status !== ActivationStatus.EMPTY) activationState.connection.connector.deactivate?.()
        return EMPTY_ACTIVATION_STATE
      }),
    [setActivationState]
  )
}

export function useActivationState() {
  const activationState = useAtomValue(pendingConnectionStateAtom)
  const tryActivation = useTryActivation()
  const cancelActivation = useCancelActivation()

  return { activationState, tryActivation, cancelActivation }
}
