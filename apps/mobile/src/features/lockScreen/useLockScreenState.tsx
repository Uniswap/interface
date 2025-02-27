import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  LockScreenVisibility,
  selectIsLockScreenVisible,
  setLockScreenOnBlur,
  setLockScreenVisibility,
} from 'src/features/lockScreen/lockScreenSlice'

export interface LockScreenContextValue {
  isLockScreenVisible: boolean
  setIsLockScreenVisible: (value: boolean) => void
}

export function useLockScreenState(): LockScreenContextValue {
  const isLockScreenVisible = useSelector(selectIsLockScreenVisible)
  const dispatch = useDispatch()
  return {
    isLockScreenVisible,
    setIsLockScreenVisible: (value: boolean) =>
      dispatch(setLockScreenVisibility(value ? LockScreenVisibility.Visible : LockScreenVisibility.Hidden)),
  }
}

/**
 * Hook that sets the lock screen on blur state to true when the screen is focused and false when it is not.
 * Use: to protect screen content such as seed phrase input from being accessed when the app is the app switcher, backgrounded, etc.
 * @param isDisabled - Whether the lock screen on blur state should be disabled.
 */
export function useLockScreenOnBlur(isDisabled?: boolean): void {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setLockScreenOnBlur(isDisabled ? false : true))
    return () => {
      dispatch(setLockScreenOnBlur(false))
    }
  }, [isDisabled, dispatch])
}
