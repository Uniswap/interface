import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { tokenWrapActions } from 'wallet/src/features/transactions/swap/wrapSaga'
import { useActiveSignerAccount } from 'wallet/src/features/wallet/hooks'

export function useWrapCallback(): WrapCallback {
  const appDispatch = useDispatch()
  const account = useActiveSignerAccount()

  return useCallback(
    ({ onSuccess, ...params }: WrapCallbackParams) => {
      if (!account || account.address !== params.account.address) {
        throw new Error('No active signer account or account mismatch')
      }
      appDispatch(tokenWrapActions.trigger({ ...params, account }))
      onSuccess()
    },
    [appDispatch, account],
  )
}
