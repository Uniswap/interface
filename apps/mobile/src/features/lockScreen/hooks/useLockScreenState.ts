import { useSelector } from 'react-redux'
import { selectIsLockScreenVisible, selectManualRetryRequired } from 'src/features/lockScreen/lockScreenSlice'

interface LockScreenContextValue {
  isLockScreenVisible: boolean
  manualRetryRequired: boolean
}

export function useLockScreenState(): LockScreenContextValue {
  const isLockScreenVisible = useSelector(selectIsLockScreenVisible)
  const manualRetryRequired = useSelector(selectManualRetryRequired)
  return {
    isLockScreenVisible,
    manualRetryRequired,
  }
}
