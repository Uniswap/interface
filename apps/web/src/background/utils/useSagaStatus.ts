import { useEffect } from 'react'
import { monitoredSagas } from 'src/background/saga'
import { useAppDispatch, useAppSelector } from 'src/background/store'
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

  const { status, error } = sagaState

  useEffect(() => {
    if (status === SagaStatus.Success) {
      // TODO: fix this.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (resetSagaOnSuccess) dispatch(saga.actions.reset())
      onSuccess?.()
    }
  }, [saga, status, error, onSuccess, resetSagaOnSuccess, dispatch])

  useEffect(() => {
    return () => {
      // TODO: fix this.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (resetSagaOnSuccess) dispatch(saga.actions.reset())
    }
  }, [saga, resetSagaOnSuccess, dispatch])

  return sagaState
}
