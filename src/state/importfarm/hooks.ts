import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, AppState } from '../index'
import { FarmSummary } from './../../pages/Earn/useFarmRegistry'
import { addImportedFarm, initializeImportedFarm, removeImportedFarm } from './actions'

export function useImportedFarmState(): AppState['importfarm'] {
  return useSelector<AppState, AppState['importfarm']>((state) => state.importfarm)
}

export function useImportedFarmActionHandlers(): {
  onAddImportedFarm: (farmSummary: FarmSummary) => void
  onRemoveImportedFarm: (farmAddress: string) => void
  onInitializeImportedFarm: () => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onAddImportedFarm = useCallback(
    (farmSummary: FarmSummary) => {
      dispatch(addImportedFarm({ farmSummary }))
    },
    [dispatch]
  )

  const onRemoveImportedFarm = useCallback(
    (farmAddress: string) => {
      dispatch(removeImportedFarm({ farmAddress }))
    },
    [dispatch]
  )

  const onInitializeImportedFarm = useCallback(() => {
    dispatch(initializeImportedFarm())
  }, [dispatch])

  return {
    onAddImportedFarm,
    onRemoveImportedFarm,
    onInitializeImportedFarm,
  }
}
