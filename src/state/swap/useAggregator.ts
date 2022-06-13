import { useMemo } from 'react'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { isAddress } from 'utils'
import { Field } from './actions'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useENS from 'hooks/useENS'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { useTradeExactInV2 } from 'hooks/Trades'
import { BAD_RECIPIENT_ADDRESSES } from 'constants/index'
import { useUserSlippageTolerance } from '../user/hooks'
import { tryParseAmount, useSwapState } from './hooks'
import { Aggregator } from 'utils/aggregator'
import { computeSlippageAdjustedAmounts } from 'utils/prices'
import { AggregationComparer } from './types'
import JSBI from 'jsbi'

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfoV2(): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  v2Trade: Aggregator | undefined
  tradeComparer: AggregationComparer | undefined
  inputError?: string
  onRefresh: (value?: boolean) => void
  loading: boolean
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
    saveGas,
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])

  const isExactIn: boolean = independentField === Field.INPUT

  const parsedAmount = useMemo(() => {
    return tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)
  }, [typedValue, isExactIn, inputCurrency, outputCurrency])

  const [allowedSlippage] = useUserSlippageTolerance()

  const { trade: bestTradeExactIn, comparer: baseTradeComparer, onUpdateCallback, loading } = useTradeExactInV2(
    isExactIn ? parsedAmount : undefined,
    outputCurrency ?? undefined,
    saveGas,
    recipient,
    allowedSlippage,
  )

  const tradeComparer = useMemo((): AggregationComparer | undefined => {
    if (
      bestTradeExactIn?.outputAmount?.greaterThan(JSBI.BigInt(0)) &&
      baseTradeComparer?.outputAmount?.greaterThan(JSBI.BigInt(0))
      // && baseTradeComparer?.outputPriceUSD
    ) {
      try {
        const diffAmount = bestTradeExactIn.outputAmount.subtract(baseTradeComparer.outputAmount)
        const diffAmountUSD = bestTradeExactIn.receivedUsd - parseFloat(baseTradeComparer.receivedUsd)
        if (
          diffAmount.greaterThan(JSBI.BigInt(0)) &&
          bestTradeExactIn.receivedUsd > 0 &&
          parseFloat(baseTradeComparer.receivedUsd) > 0 &&
          diffAmountUSD > 0
        ) {
          const savedUsd = diffAmountUSD
          // const savedUsd = parseFloat(diffAmount.toFixed()) * parseFloat(baseTradeComparer.outputPriceUSD.toString())
          if (savedUsd) {
            return Object.assign({}, baseTradeComparer, {
              tradeSaved: {
                usd: savedUsd.toString(),
                percent: (savedUsd / bestTradeExactIn.receivedUsd) * 100,
              },
            })
          }
        }
      } catch (e) {}
    }
    return baseTradeComparer ?? undefined
  }, [bestTradeExactIn, baseTradeComparer])

  const v2Trade = isExactIn ? bestTradeExactIn : undefined

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ?? undefined,
      [Field.OUTPUT]: outputCurrency ?? undefined,
    }
  }, [inputCurrency, outputCurrency])

  let inputError: string | undefined
  if (!account) {
    inputError = t`Connect wallet`
  }

  if (!parsedAmount) {
    if (typedValue) inputError = inputError ?? t`Invalid amount`
    else inputError = inputError ?? t`Enter an amount`
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? t`Enter a recipient`
  } else {
    if (BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1) {
      inputError = inputError ?? t`Invalid recipient`
    }
  }

  const slippageAdjustedAmounts = v2Trade && allowedSlippage && computeSlippageAdjustedAmounts(v2Trade, allowedSlippage)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    slippageAdjustedAmounts ? slippageAdjustedAmounts[Field.INPUT] : null,
  ]

  if (amountIn && ((balanceIn && balanceIn.lessThan(amountIn)) || !balanceIn)) {
    inputError = t`Insufficient ${amountIn.currency.symbol} balance`
  }

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      v2Trade: v2Trade ?? undefined,
      tradeComparer,
      inputError,
      onRefresh: onUpdateCallback,
      loading,
    }),
    [currencies, currencyBalances, inputError, loading, onUpdateCallback, parsedAmount, tradeComparer, v2Trade],
  )
}
