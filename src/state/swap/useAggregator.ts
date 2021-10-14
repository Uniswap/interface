import { useMemo } from 'react'
import { Field } from './actions'
import { Currency, CurrencyAmount } from 'libs/sdk/src'
import { ZERO } from 'libs/sdk/src/constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import useENS from '../../hooks/useENS'
import { useCurrencyBalances } from '../wallet/hooks'
import { useTradeExactInV2 } from '../../hooks/Trades'
import { t } from '@lingui/macro'
import { isAddress } from '../../utils'
import { BAD_RECIPIENT_ADDRESSES } from '../../constants'
import { useUserSlippageTolerance } from '../user/hooks'
import { convertToNativeTokenFromETH } from '../../utils/dmm'
import { tryParseAmount, useSwapState } from './hooks'
import { Aggregator } from '../../utils/aggregator'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'
import { AggregationComparer } from './types'

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfoV2(): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmount: CurrencyAmount | undefined
  v2Trade: Aggregator | undefined
  tradeComparer: AggregationComparer | undefined
  inputError?: string
  onRefresh: () => void
} {
  const { account, chainId } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
    saveGas
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined
  ])

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const { trade: bestTradeExactIn, comparer: baseTradeComparer, onUpdateCallback } = useTradeExactInV2(
    isExactIn ? parsedAmount : undefined,
    outputCurrency ?? undefined,
    saveGas
  )

  const tradeComparer = useMemo((): AggregationComparer | undefined => {
    if (
      bestTradeExactIn?.outputAmount?.greaterThan(ZERO) &&
      baseTradeComparer?.outputAmount?.greaterThan(ZERO)
      // && baseTradeComparer?.outputPriceUSD
    ) {
      try {
        const diffAmount = bestTradeExactIn.outputAmount.subtract(baseTradeComparer.outputAmount)
        const diffAmountUSD = parseFloat(bestTradeExactIn.receivedUsd) - parseFloat(baseTradeComparer.receivedUsd)
        if (
          diffAmount.greaterThan(ZERO) &&
          parseFloat(bestTradeExactIn.receivedUsd) > 0 &&
          parseFloat(baseTradeComparer.receivedUsd) > 0 &&
          diffAmountUSD > 0
        ) {
          const savedUsd = diffAmountUSD
          // const savedUsd = parseFloat(diffAmount.toFixed()) * parseFloat(baseTradeComparer.outputPriceUSD.toString())
          if (savedUsd) {
            return Object.assign({}, baseTradeComparer, {
              tradeSaved: { usd: savedUsd.toString() }
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
    [Field.OUTPUT]: relevantTokenBalances[1]
  }

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined
  }

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

  const [allowedSlippage] = useUserSlippageTolerance()

  const slippageAdjustedAmounts = v2Trade && allowedSlippage && computeSlippageAdjustedAmounts(v2Trade, allowedSlippage)

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    slippageAdjustedAmounts ? slippageAdjustedAmounts[Field.INPUT] : null
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = t`Insufficient ${convertToNativeTokenFromETH(amountIn.currency, chainId).symbol} balance`
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    v2Trade: v2Trade ?? undefined,
    tradeComparer,
    inputError,
    onRefresh: onUpdateCallback
  }
}
