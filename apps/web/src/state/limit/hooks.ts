import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Field } from 'components/swap/constants'
import { isStablecoin, nativeOnChain } from 'constants/tokens'
import JSBI from 'jsbi'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import ms from 'ms'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { getWrapInfo } from 'state/routing/gas'
import { LimitOrderTrade, RouterPreference, SubmittableTrade, SwapFeeInfo, WrapInfo } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { getUSDCostPerGas, isClassicTrade } from 'state/routing/utils'
import { useSwapAndLimitContext } from 'state/swap/SwapContext'

import { useLimitsFeesEnabled } from 'featureFlags/flags/limitsFees'
import { Expiry, LimitState } from './LimitContext'

export type LimitInfo = {
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  parsedLimitPrice?: Price<Currency, Currency>
  limitOrderTrade?: LimitOrderTrade
  marketPrice?: Price<Currency, Currency>
  fee?: SwapFeeInfo
}

const DAY_SECS = ms('1d') / 1000

export function expiryToDeadlineSeconds(expiry: Expiry): number {
  switch (expiry) {
    case Expiry.Day:
      return DAY_SECS
    case Expiry.Week:
      return DAY_SECS * 7
    case Expiry.Month:
      return DAY_SECS * 30
    case Expiry.Year:
      return DAY_SECS * 365
  }
}

// By default, inputCurrency is base currency and outputCurrency is quote currency
// If only one of these tokens is a stablecoin, prefer the denomination (quote currency) to be the stablecoin
// TODO(limits): Also add preference for ETH, BTC to be default
export function getDefaultPriceInverted(inputCurrency?: Currency, outputCurrency?: Currency): boolean {
  const [isInputStablecoin, isOutputStablecoin] = [isStablecoin(inputCurrency), isStablecoin(outputCurrency)]
  return isInputStablecoin && !isOutputStablecoin
}

export function useDerivedLimitInfo(state: LimitState, setState: Dispatch<SetStateAction<LimitState>>): LimitInfo {
  const { account } = useWeb3React()
  const { inputAmount, outputAmount, limitPriceInverted } = state
  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      limitPriceInverted: getDefaultPriceInverted(inputCurrency, outputCurrency),
    }))
  }, [inputCurrency, outputCurrency, setState])

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const parsedLimitPrice = useMemo(() => {
    if (!inputCurrency || !outputCurrency || !state.limitPrice) {
      return undefined
    }

    const [baseCurrency, quoteCurrency] = limitPriceInverted
      ? [outputCurrency, inputCurrency]
      : [inputCurrency, outputCurrency]

    const parsedLimitPriceQuoteAmount = tryParseCurrencyAmount(state.limitPrice, quoteCurrency)
    if (!parsedLimitPriceQuoteAmount) {
      return undefined
    }

    return new Price(
      baseCurrency,
      quoteCurrency,
      JSBI.BigInt(10 ** baseCurrency.decimals),
      parsedLimitPriceQuoteAmount.quotient
    )
  }, [inputCurrency, limitPriceInverted, outputCurrency, state.limitPrice])

  const parsedAmounts = useMemo(() => {
    let parsedInputAmount
    let parsedOutputAmount
    const limitPrice = limitPriceInverted ? parsedLimitPrice?.invert() : parsedLimitPrice
    if (state.isInputAmountFixed) {
      parsedInputAmount = tryParseCurrencyAmount(inputAmount, inputCurrency)
      parsedOutputAmount = !limitPrice
        ? tryParseCurrencyAmount(outputAmount, outputCurrency)
        : parsedInputAmount && limitPrice.quote(parsedInputAmount)
    } else {
      parsedOutputAmount = tryParseCurrencyAmount(outputAmount, outputCurrency)
      parsedInputAmount = !limitPrice
        ? tryParseCurrencyAmount(inputAmount, inputCurrency)
        : parsedOutputAmount && limitPrice.invert().quote(parsedOutputAmount)
    }

    return {
      [Field.INPUT]: parsedInputAmount,
      [Field.OUTPUT]: parsedOutputAmount,
    }
  }, [
    inputAmount,
    inputCurrency,
    limitPriceInverted,
    outputAmount,
    outputCurrency,
    parsedLimitPrice,
    state.isInputAmountFixed,
  ])

  const { marketPrice, fee: swapFee } = useMarketPriceAndFee(inputCurrency, outputCurrency)

  const skip = !(inputCurrency && outputCurrency)

  const { trade } = useRoutingAPITrade(
    skip,
    TradeType.EXACT_INPUT,
    parsedAmounts?.[Field.INPUT],
    outputCurrency,
    RouterPreference.API
  )

  const limitOrderTrade = useLimitOrderTrade({
    inputCurrency,
    parsedAmounts,
    outputAmount: parsedAmounts[Field.OUTPUT],
    trade,
    state,
    swapFee,
  })

  return {
    currencyBalances,
    parsedAmounts,
    parsedLimitPrice,
    limitOrderTrade,
    marketPrice,
  }
}

function useLimitOrderTrade({
  state,
  trade,
  inputCurrency,
  parsedAmounts,
  outputAmount,
  swapFee,
}: {
  state: LimitState
  trade?: SubmittableTrade
  inputCurrency?: Currency
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  outputAmount?: CurrencyAmount<Currency>
  swapFee?: SwapFeeInfo
}) {
  const { account } = useWeb3React()
  const [wrapInfo, setWrapInfo] = useState<WrapInfo>()

  useEffect(() => {
    async function calculateWrapInfo() {
      if (!inputCurrency) {
        setWrapInfo(undefined)
        return
      }

      const [currencyIn, needsWrap] = inputCurrency.isNative ? [inputCurrency.wrapped, true] : [inputCurrency, false]
      const [gasUseEstimate, gasUseEstimateUSD] = isClassicTrade(trade)
        ? [trade.gasUseEstimate, trade.gasUseEstimateUSD]
        : [undefined, undefined]
      const usdCostPerGas = getUSDCostPerGas(gasUseEstimateUSD, gasUseEstimate)

      if (needsWrap) {
        const wrapInfo = await getWrapInfo(needsWrap, account, currencyIn.chainId, '1', usdCostPerGas)
        setWrapInfo(wrapInfo)
      } else {
        setWrapInfo({ needsWrap: false })
      }
    }
    calculateWrapInfo()
  }, [account, inputCurrency, trade])

  const limitOrderTrade = useMemo(() => {
    if (!inputCurrency || !parsedAmounts?.[Field.INPUT] || !account || !outputAmount || !wrapInfo) {
      return undefined
    }
    const amountIn = CurrencyAmount.fromRawAmount(inputCurrency.wrapped, parsedAmounts?.[Field.INPUT].quotient)
    return new LimitOrderTrade({
      amountIn,
      amountOut: outputAmount,
      tradeType: TradeType.EXACT_INPUT,
      wrapInfo,
      approveInfo: { needsApprove: false },
      swapper: account,
      deadlineBufferSecs: expiryToDeadlineSeconds(state.expiry),
      swapFee,
    })
  }, [account, outputAmount, inputCurrency, parsedAmounts, state.expiry, wrapInfo, swapFee])

  return limitOrderTrade
}

function isNativeOrWrappedNative(currency: Currency) {
  return currency.isNative || nativeOnChain(currency.chainId).wrapped.equals(currency)
}

function useMarketPriceAndFee(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined
): { marketPrice?: Price<Currency, Currency>; fee?: SwapFeeInfo } {
  const skip = !(inputCurrency && outputCurrency)
  // TODO(limits): update amount for MATIC and CELO once Limits are supported on those chains
  const baseCurrencyAmount =
    inputCurrency && CurrencyAmount.fromRawAmount(nativeOnChain(inputCurrency.chainId), 10 ** 18)
  const { trade: tradeA } = useRoutingAPITrade(
    skip,
    TradeType.EXACT_OUTPUT,
    baseCurrencyAmount,
    inputCurrency,
    RouterPreference.API
  )

  const { trade: tradeB } = useRoutingAPITrade(
    skip,
    TradeType.EXACT_INPUT,
    baseCurrencyAmount,
    outputCurrency,
    RouterPreference.API
  )

  const marketPrice: Price<Currency, Currency> | undefined = useMemo(() => {
    if (skip) return undefined

    // if one of the currencies is ETH or WETH, just use the spot price from one of the Trade objects
    if (isNativeOrWrappedNative(inputCurrency)) {
      if (!tradeB?.outputAmount.currency.equals(outputCurrency) || !isClassicTrade(tradeB)) return undefined

      const referencePrice = tradeB.routes[0]?.midPrice
      // reconstruct Price object using correct currency between ETH or WETH
      return new Price(inputCurrency, outputCurrency, referencePrice.denominator, referencePrice.numerator)
    }

    // same thing but for output currency being ETH or WETH
    if (isNativeOrWrappedNative(outputCurrency)) {
      if (!tradeA?.inputAmount.currency.equals(inputCurrency) || !isClassicTrade(tradeA)) return undefined

      const referencePrice = tradeA.routes[0]?.midPrice
      return new Price(inputCurrency, outputCurrency, referencePrice.denominator, referencePrice.numerator)
    }

    // trade objects are still loading
    if (!tradeA?.inputAmount.currency.equals(inputCurrency) || !tradeB?.outputAmount.currency.equals(outputCurrency)) {
      return undefined
    }

    if (!tradeA || !tradeB || !isClassicTrade(tradeA) || !isClassicTrade(tradeB)) return undefined

    const priceA = tradeA.routes[0]?.midPrice
    const priceB = tradeB.routes[0]?.midPrice
    if (!priceA || !priceB) return undefined

    // Combine spot prices of A -> ETH and ETH -> B to get a price for A -> B
    return priceA.multiply(priceB)
  }, [inputCurrency, outputCurrency, skip, tradeA, tradeB])

  const feesEnabled = useLimitsFeesEnabled()
  const fee = useMemo(() => {
    if (!marketPrice || !inputCurrency || !outputCurrency || !feesEnabled) return undefined

    if (isNativeOrWrappedNative(inputCurrency)) {
      if (!tradeB?.outputAmount.currency.equals(outputCurrency) || !isClassicTrade(tradeB)) return undefined

      return tradeB.swapFee
    }

    if (isNativeOrWrappedNative(outputCurrency)) {
      if (!tradeA?.inputAmount.currency.equals(inputCurrency) || !isClassicTrade(tradeA)) return undefined

      return tradeA.swapFee
    }

    if (!tradeA || !tradeB) return undefined

    // This currency pair is only eligible for fees iff both tradeA and tradeB are eligible for fees
    const canTakeFees = tradeA.swapFee?.percent.greaterThan(0) && tradeB.swapFee?.percent.greaterThan(0)
    return canTakeFees ? tradeB.swapFee : undefined
  }, [inputCurrency, outputCurrency, marketPrice, tradeA, tradeB, feesEnabled])

  return useMemo(() => ({ marketPrice, fee }), [marketPrice, fee])
}
