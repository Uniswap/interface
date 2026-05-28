import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { tokenWrapActions } from 'wallet/src/features/transactions/swap/wrapSaga'

export function useWrapCallback(): WrapCallback {
  const appDispatch = useDispatch()

  return useCallback(
    ({ onSuccess, inputCurrencyAmount, ...params }: WrapCallbackParams) => {
      // Serialize CurrencyAmount to avoid Redux serialization warnings
      const serializedParams = {
        ...params,
        inputCurrencyAmountRaw: inputCurrencyAmount.quotient.toString(),
        inputCurrencyId: currencyId(inputCurrencyAmount.currency),
        chainId: inputCurrencyAmount.currency.chainId,
      }
      appDispatch(tokenWrapActions.trigger(serializedParams))
      onSuccess()
    },
    [appDispatch],
  )
}
