import { useDispatch } from 'react-redux'
import { useEvent } from 'utilities/src/react/hooks'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'

export function useUnlockWithPassword(): (params: { password: string }) => void {
  const dispatch = useDispatch()

  return useEvent(({ password }: { password: string }) => {
    dispatch(
      authActions.trigger({
        type: AuthActionType.Unlock,
        password,
      }),
    )
  })
}
