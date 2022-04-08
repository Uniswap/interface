import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import useSlippage, { Slippage } from 'lib/hooks/useSlippage'
import useUSDCPriceImpact, { PriceImpact } from 'lib/hooks/useUSDCPriceImpact'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useEffect, useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

import { useBestTrade } from './useBestTrade'
import useWrapCallback, { WrapType } from './useWrapCallback'

interface SwapField {
  currency?: Currency
  amount?: CurrencyAmount<Currency>
  balance?: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Currency>
}

interface SwapInfo {
  [Field.INPUT]: SwapField
  [Field.OUTPUT]: SwapField
  trade: {
    trade?: InterfaceTrade<Currency, Currency, TradeType>
    state: TradeState
  }
  slippage: Slippage
  impact?: PriceImpact
}

// from the current swap inputs, compute the best trade and return it.
function useComputeSwapInfo(): SwapInfo {
  const { type: wrapType } = useWrapCallback()
  const isWrapping = wrapType === WrapType.WRAP || wrapType === WrapType.UNWRAP
  const { independentField, amount, [Field.INPUT]: currencyIn, [Field.OUTPUT]: currencyOut } = useAtomValue(swapAtom)
  const isExactIn = independentField === Field.INPUT

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(amount, (isExactIn ? currencyIn : currencyOut) ?? undefined),
    [amount, isExactIn, currencyIn, currencyOut]
  )
  const hasAmounts = currencyIn && currencyOut && parsedAmount && !isWrapping
  const trade = useBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    hasAmounts ? parsedAmount : undefined,
    hasAmounts ? (isExactIn ? currencyOut : currencyIn) : undefined
  )

  const amountIn = useMemo(
    () => (isWrapping || isExactIn ? parsedAmount : trade.trade?.inputAmount),
    [isExactIn, isWrapping, parsedAmount, trade.trade?.inputAmount]
  )
  const amountOut = useMemo(
    () => (isWrapping || !isExactIn ? parsedAmount : trade.trade?.outputAmount),
    [isExactIn, isWrapping, parsedAmount, trade.trade?.outputAmount]
  )

  // Compute slippage and impact off of the trade so that it refreshes with the trade.
  // (Using amountIn/amountOut would show (incorrect) intermediate values.)
  const slippage = useSlippage(trade.trade)
  const { inputUSDC, outputUSDC, impact } = useUSDCPriceImpact(trade.trade?.inputAmount, trade.trade?.outputAmount)

  return useMemo(
    () => ({
      [Field.INPUT]: {
        amount: amountIn,
        usdc: inputUSDC,
      },
      [Field.OUTPUT]: {
        amount: amountOut,
        usdc: outputUSDC,
      },
      trade,
      slippage,
      impact,
    }),
    [amountIn, amountOut, impact, inputUSDC, outputUSDC, slippage, trade]
  )
}

const swapInfoAtom = atom<SwapInfo>({
  [Field.INPUT]: {},
  [Field.OUTPUT]: {},
  trade: { state: TradeState.INVALID },
  slippage: { auto: true, allowed: new Percent(0) },
})

export function SwapInfoUpdater() {
  const setSwapInfo = useUpdateAtom(swapInfoAtom)
  const swapInfo = useComputeSwapInfo()
  useEffect(() => setSwapInfo(swapInfo), [setSwapInfo, swapInfo])
  return null
}

/** Requires that SwapInfoUpdater be installed in the DOM tree. **/
export default function useSwapInfo(): SwapInfo {
  const swapInfo = useAtomValue(swapInfoAtom)

  const { [Field.INPUT]: currencyIn, [Field.OUTPUT]: currencyOut } = useAtomValue(swapAtom)
  const tradeState = useMemo(() => {
    const { trade } = swapInfo
    if (trade.state === TradeState.VALID && trade.trade) {
      const isTradeStale =
        (currencyIn && !trade.trade.inputAmount.currency.equals(currencyIn)) ||
        (currencyOut && !trade.trade.outputAmount.currency.equals(currencyOut))
      // swapInfo has not yet caught up to swapAtom.
      if (isTradeStale) return TradeState.LOADING
    }
    return trade.state
  }, [currencyIn, currencyOut, swapInfo])

  const { account } = useActiveWeb3React()
  const [balanceIn, balanceOut] = useCurrencyBalances(
    account,
    useMemo(() => [currencyIn, currencyOut], [currencyIn, currencyOut])
  )

  // swapInfo will lag behind swapAtom by a frame, because its update is triggered by swapAtom
  // so a swap must be marked as loading, with up-to-date currencies, during that update.
  // In other words, swapInfo is derived from swapAtom, so it must be used as the source of truth.
  return useMemo(
    () => ({
      ...swapInfo,
      trade: { ...swapInfo.trade, state: tradeState },
      [Field.INPUT]: { ...swapInfo[Field.INPUT], currency: currencyIn, balance: balanceIn },
      [Field.OUTPUT]: { ...swapInfo[Field.OUTPUT], currency: currencyOut, balance: balanceOut },
    }),
    [balanceIn, balanceOut, currencyIn, currencyOut, swapInfo, tradeState]
  )
}
