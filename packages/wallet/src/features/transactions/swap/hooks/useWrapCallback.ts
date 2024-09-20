import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { tokenWrapActions } from 'wallet/src/features/transactions/swap/wrapSaga'

export function useWrapCallback(): WrapCallback {
  const appDispatch = useDispatch()

  return useCallback(
    ({ onSuccess, ...params }: WrapCallbackParams) => {
      appDispatch(tokenWrapActions.trigger(params))
      onSuccess()
    },
    [appDispatch],
  )
}
