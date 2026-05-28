import { useDispatch, useSelector } from 'react-redux'
import { selectEnableCustomGasFeeEntry } from 'uniswap/src/features/settings/selectors'
import { setEnableCustomGasFeeEntry } from 'uniswap/src/features/settings/slice'
import { useEvent } from 'utilities/src/react/hooks'

export function useEnableCustomGasFeeEntry(): boolean {
  return useSelector(selectEnableCustomGasFeeEntry)
}

export function useSetEnableCustomGasFeeEntry(): (enabled: boolean) => void {
  const dispatch = useDispatch()
  return useEvent((enabled: boolean) => dispatch(setEnableCustomGasFeeEntry(enabled)))
}
