import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import useDefaultsTokenFromURLSearch from 'hooks/useDefaultsTokenFromURLSearch'
import useParsedQueryString from 'hooks/useParsedQueryString'

export default function useCurrencyHandler(chainId: ChainId) {
  const [currencyIn, setCurrencyIn] = useState<Currency>(NativeCurrencies[chainId])
  const [currencyOut, setCurrencyOut] = useState<Currency>(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)
  const qs = useParsedQueryString()

  const { inputCurrency, outputCurrency } = useDefaultsTokenFromURLSearch(
    currencyIn,
    currencyOut,
    APP_PATHS.NOTIFICATION_CENTER,
    chainId,
  )

  const navigate = useNavigate()
  const replaceUrl = useCallback(() => {
    const { inputCurrency, outputCurrency, amount, ...rest } = qs
    if (!inputCurrency && !outputCurrency) return
    navigate({ search: stringify(rest) }, { replace: true })
  }, [qs, navigate])

  const isInit = useRef(false)
  useEffect(() => {
    if (!isInit.current) {
      // skip the first time and a bit delay
      setTimeout(() => (isInit.current = true), 1000)
      return
    }
    replaceUrl()
    setCurrencyIn(NativeCurrencies[chainId])
    setCurrencyOut(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)
  }, [chainId, replaceUrl])

  useEffect(() => {
    if (inputCurrency && !currencyIn?.equals(inputCurrency)) {
      setCurrencyIn(inputCurrency ?? undefined)
    }
  }, [inputCurrency, currencyIn])

  useEffect(() => {
    if (outputCurrency && !currencyOut?.equals(outputCurrency)) {
      setCurrencyOut(outputCurrency ?? undefined)
    }
  }, [outputCurrency, currencyOut])

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      if (currencyOut?.equals(c)) return
      setCurrencyIn(c)
      replaceUrl()
    },
    [currencyOut, replaceUrl],
  )
  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      if (currencyIn?.equals(c)) return
      setCurrencyOut(c)
      replaceUrl()
    },
    [currencyIn, replaceUrl],
  )

  return {
    currencyIn,
    currencyOut,
    onChangeCurrencyIn,
    onChangeCurrencyOut,
    inputAmount: (qs.amount as string) ?? '1',
  }
}
