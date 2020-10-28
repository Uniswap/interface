import { AppState, AppDispatch } from '../index'
import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useMemo } from 'react'
import { typeInput, Field } from './actions'
import { Currency, CurrencyAmount } from 'uniswap-fuse-sdk'
import { useCurrencyBalances } from '../wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useDerivedBridgeInfo(
  inputCurrency: Currency | undefined
): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  inputError?: string
} {
  const { account } = useActiveWeb3React()

  const { independentField, typedValue } = useBridgeState()

  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency ?? undefined
    }),
    [inputCurrency]
  )

  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.INPUT]])

  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.INPUT]: balances[0]
  }

  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])

  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.INPUT]: independentAmount
  }

  const parsedAmount = tryParseAmount(typedValue, inputCurrency)

  const { [Field.INPUT]: inputAmount } = parsedAmounts

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!currencies[Field.INPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  if (Number(typedValue) < 0.5) {
    inputError = inputError ?? 'Below minimum limit'
  }

  if (inputAmount && currencyBalances?.[Field.INPUT]?.lessThan(inputAmount)) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol + ' balance'
  }

  return {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError
  }
}

export function useBridgeActionHandlers(): { onFieldInput: (typedValue: string) => void } {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  return { onFieldInput }
}
