import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import useDefaultsTokenFromURLSearch from 'hooks/useDefaultsTokenFromURLSearch'
import { AppDispatch, AppState } from 'state/index'

import { removeCurrentOrderUpdate, setCurrentOrderUpdate, setInputAmount, setLimitCurrency } from './actions'
import { LimitState } from './reducer'

export function useLimitState(): LimitState {
  return useSelector((state: AppState) => state.limit)
}

export function useLimitActionHandlers() {
  const dispatch = useDispatch<AppDispatch>()
  const { currencyIn, currencyOut } = useLimitState()
  const { inputCurrency, outputCurrency } = useDefaultsTokenFromURLSearch(currencyIn, currencyOut, APP_PATHS.LIMIT)

  const setInputValue = useCallback(
    (inputAmount: string) => {
      dispatch(setInputAmount(inputAmount))
    },
    [dispatch],
  )

  const resetState = useCallback(() => {
    setInputValue('')
  }, [setInputValue])

  const onSelectPair = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined, inputAmount?: string) => {
      dispatch(
        setLimitCurrency({
          currencyIn,
          currencyOut,
        }),
      )
      if (inputAmount !== undefined) {
        setInputValue(inputAmount)
      }
    },
    [dispatch, setInputValue],
  )

  useEffect(() => {
    if (
      (inputCurrency && !currencyIn?.equals(inputCurrency)) ||
      (outputCurrency && !currencyOut?.equals(outputCurrency))
    ) {
      onSelectPair(inputCurrency ?? undefined, outputCurrency ?? undefined)
    }
  }, [onSelectPair, inputCurrency, outputCurrency, currencyIn, currencyOut])

  const setCurrencyIn = useCallback(
    (currencyIn: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyOut, onSelectPair],
  )

  const setCurrencyOut = useCallback(
    (currencyOut: Currency | undefined) => {
      onSelectPair(currencyIn, currencyOut)
    },
    [currencyIn, onSelectPair],
  )

  const switchCurrency = useCallback(() => {
    onSelectPair(currencyOut, currencyIn)
  }, [onSelectPair, currencyOut, currencyIn])

  const setCurrentOrder = useCallback(
    (order: CreateOrderParam) => {
      dispatch(setCurrentOrderUpdate(order))
    },
    [dispatch],
  )

  const removeCurrentOrder = useCallback(
    (orderId: number) => {
      dispatch(removeCurrentOrderUpdate(orderId))
    },
    [dispatch],
  )

  return {
    switchCurrency,
    setCurrencyIn,
    setCurrencyOut,
    onSelectPair,
    setCurrentOrder,
    removeCurrentOrder,
    resetState,
  }
}
