import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Field } from 'components/swap/constants'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { useSwapAndLimitContext } from 'state/swap/SwapContext'

import { LimitState } from './LimitContext'

export type LimitInfo = {
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
}

export function useDerivedLimitInfo(state: LimitState): LimitInfo {
  const { account } = useWeb3React()
  const { inputAmount, outputAmount } = state
  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const parsedAmounts = useMemo(() => {
    return {
      [Field.INPUT]: tryParseCurrencyAmount(inputAmount, inputCurrency),
      [Field.OUTPUT]: tryParseCurrencyAmount(outputAmount, outputCurrency),
    }
  }, [inputAmount, inputCurrency, outputAmount, outputCurrency])

  return { currencyBalances, parsedAmounts }
}
