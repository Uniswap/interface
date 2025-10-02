import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { monitoredSagas } from 'src/app/saga'
import { ExtensionState } from 'src/store/extensionReducer'
import { SagaState, SagaStatus } from 'wallet/src/utils/saga'

// Convenience hook to get the status + error of an active saga
export function useSagaStatus({
  sagaName,
  onSuccess,
  resetSagaOnSuccess = true,
}: {
  sagaName: string
  onSuccess?: () => void
  resetSagaOnSuccess?: boolean
}): SagaState {
  const dispatch = useDispatch()
  const sagaState = useSelector((s: ExtensionState): SagaState | undefined => s.saga[sagaName])
  if (!sagaState) {
    throw new Error(`No saga state found, is sagaName valid? Name: ${sagaName}`)
  }

  const saga = monitoredSagas[sagaName]
  if (!saga) {
    throw new Error(`No saga found, is sagaName valid? Name: ${sagaName}`)
  }

  const { status, error } = sagaState

  // biome-ignore lint/correctness/useExhaustiveDependencies: error is tracked for saga state changes even if not directly used in effect body
  useEffect(() => {
    if (status === SagaStatus.Success) {
      if (resetSagaOnSuccess) {
        dispatch(saga.actions.reset()).catch(() => undefined)
      }
      onSuccess?.()
    }
  }, [saga, status, error, onSuccess, resetSagaOnSuccess, dispatch])

  useEffect(() => {
    return () => {
      if (resetSagaOnSuccess) {
        dispatch(saga.actions.reset()).catch(() => undefined)
      }
    }
  }, [saga, resetSagaOnSuccess, dispatch])

  return sagaState
}
