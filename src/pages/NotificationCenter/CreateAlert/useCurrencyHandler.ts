import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'

export default function useCurrencyHandler(chainId: ChainId) {
  const [currencyIn, setCurrencyIn] = useState<Currency>(NativeCurrencies[chainId])
  const [currencyOut, setCurrencyOut] = useState<Currency>(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)

  useEffect(() => {
    setCurrencyIn(NativeCurrencies[chainId])
    setCurrencyOut(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId] as Currency)
  }, [chainId])

  const onChangeCurrencyIn = useCallback(
    (c: Currency) => {
      if (currencyOut?.equals(c)) return
      setCurrencyIn(c)
    },
    [currencyOut],
  )
  const onChangeCurrencyOut = useCallback(
    (c: Currency) => {
      if (currencyIn?.equals(c)) return
      setCurrencyOut(c)
    },
    [currencyIn],
  )

  return { currencyIn, currencyOut, onChangeCurrencyIn, onChangeCurrencyOut }
}
