import { Currency } from '@swapr/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { selectCurrency, typeInput } from './actions'
import { currencyId } from '../../utils/currencyId'
import { tryParseAmount } from '../swap/hooks'


export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useBridgeActionHandlers(): {
  onCurrencySelection: (currency: Currency) => void
  onUserInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (currency: Currency) => {
      dispatch(
        selectCurrency({
          currencyId: currencyId(currency)
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ typedValue }))
    },
    [dispatch]
  )

  return {
    onCurrencySelection,
    onUserInput
  }
}

export function useBridgeInfo(
) {
  const { account, chainId } = useActiveWeb3React()
  const {
    typedValue,
    currencyId,
  } = useBridgeState()

  const bridgeCurrency = useCurrency(currencyId)
  const parsedAmount = tryParseAmount(typedValue, bridgeCurrency ?? undefined, chainId)

  const [currencyBalance] = useCurrencyBalances(account ?? undefined, [
    bridgeCurrency ?? undefined
  ])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount'
  }

  if (!bridgeCurrency) {
    inputError = inputError ?? 'Select a token'
  }

  if (currencyBalance && parsedAmount && currencyBalance.lessThan(parsedAmount)) {
    inputError = 'Insufficient ' + parsedAmount.currency.symbol + ' balance'
  }

  return {
    bridgeCurrency,
    currencyBalance,
    parsedAmount,
    inputError,
    typedValue
  }
}

