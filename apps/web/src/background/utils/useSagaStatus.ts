import { useCallback, useEffect } from 'react'
import { monitoredSagas } from 'src/background/saga'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { useAsyncData } from 'wallet/src/utils/hooks'
import { SagaState, SagaStatus } from 'wallet/src/utils/saga'

// Convenience hook to get the status + error of an active saga
export function useSagaStatus(
  sagaName: string,
  onSuccess?: () => void,
  resetSagaOnSuccess = true
): SagaState {
  const dispatch = useAppDispatch()
  const sagaState = useAppSelector((s) => s.saga[sagaName])
  if (!sagaState) {
    throw new Error(`No saga state found, is sagaName valid? Name: ${sagaName}`)
  }

  const saga = monitoredSagas[sagaName]
  if (!saga) {
    throw new Error(`No saga found, is sagaName valid? Name: ${sagaName}`)
  }

  const { status } = sagaState

  const resetSaga = useCallback(async () => {
    if (status === SagaStatus.Success) {
      if (resetSagaOnSuccess) await dispatch(saga.actions.reset())
      onSuccess?.()
    }
  }, [saga, status, onSuccess, resetSagaOnSuccess, dispatch])

  useAsyncData(resetSaga)

  useEffect(() => {
    return () => {
      if (resetSagaOnSuccess) dispatch(saga.actions.reset()).catch(() => undefined)
    }
  }, [saga, resetSagaOnSuccess, dispatch])

  return sagaState
}
