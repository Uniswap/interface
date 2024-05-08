import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { sendAnalyticsEvent } from 'analytics'
import { Connection } from 'connection/types'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

import { trace } from 'tracing/trace'
import { didUserReject } from './utils'

export enum ActivationStatus {
  PENDING,
  ERROR,
  IDLE,
}

type ActivationPendingState = { status: ActivationStatus.PENDING; connection: Connection }
type ActivationErrorState = { status: ActivationStatus.ERROR; connection: Connection; error: any }
const IDLE_ACTIVATION_STATE = { status: ActivationStatus.IDLE } as const
type ActivationState = ActivationPendingState | ActivationErrorState | typeof IDLE_ACTIVATION_STATE

const activationStateAtom = atom<ActivationState>(IDLE_ACTIVATION_STATE)

function useTryActivation() {
  const setActivationState = useUpdateAtom(activationStateAtom)
  const { pathname } = useLocation()

  const currentPage = getCurrentPageFromLocation(pathname)

  return useCallback(
    async (connection: Connection, onSuccess: () => void, chainId?: ChainId) => {
      // Skips wallet connection if the connection should override the default
      // behavior, i.e. install MetaMask or launch Coinbase app
      if (connection.overrideActivate?.(chainId)) return

      const { name } = connection.getProviderInfo()
      return trace(
        { name: 'Connect', op: 'wallet.connect', tags: { type: connection.type, wallet: name } },
        async (trace) => {
          try {
            setActivationState({ status: ActivationStatus.PENDING, connection })

            console.debug(`Connection activating: ${name}`)
            await connection.connector.activate()

            console.debug(`Connection activated: ${name}`)

            // Clears pending connection state
            setActivationState(IDLE_ACTIVATION_STATE)

            onSuccess()
          } catch (error) {
            // Gracefully handles errors from the user rejecting a connection attempt
            if (didUserReject(connection, error)) {
              trace.setStatus('cancelled')
              setActivationState(IDLE_ACTIVATION_STATE)
              return
            }

            // TODO(WEB-1859): re-add special treatment for already-pending injected errors & move debug to after didUserReject() check
            console.debug(`Connection failed: ${name}`)
            console.error(error)
            trace.setError(error)

            // Failed Connection events are logged here, while successful ones are logged by Web3Provider
            sendAnalyticsEvent(InterfaceEventName.WALLET_CONNECTED, {
              result: WalletConnectionResult.FAILED,
              wallet_type: name,
              page: currentPage,
              error: error.message,
            })
            setActivationState({ status: ActivationStatus.ERROR, connection, error })
          }
        }
      )
    },
    [currentPage, setActivationState]
  )
}

function useCancelActivation() {
  const setActivationState = useUpdateAtom(activationStateAtom)
  return useCallback(
    () =>
      setActivationState((activationState) => {
        if (activationState.status !== ActivationStatus.IDLE) activationState.connection.connector.deactivate?.()
        return IDLE_ACTIVATION_STATE
      }),
    [setActivationState]
  )
}

export function useActivationState() {
  const activationState = useAtomValue(activationStateAtom)
  const tryActivation = useTryActivation()
  const cancelActivation = useCancelActivation()

  return { activationState, tryActivation, cancelActivation }
}
