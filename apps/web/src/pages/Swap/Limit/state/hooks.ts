import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { isEVMChain, isSVMChain } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { getStablecoinsForChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { SwapFee, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useAccount } from '~/hooks/useAccount'
import { useCurrencyBalances } from '~/lib/hooks/useCurrencyBalance'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { expiryToDeadlineSeconds } from '~/pages/Swap/Limit/state/expiryToDeadlineSeconds'
import {
  computeLimitMarketPrice,
  LimitMarketPriceResult,
  useLogMarketPriceReferenceChecks,
} from '~/pages/Swap/Limit/state/limitMarketPrice'
import { LimitInfo, LimitState } from '~/pages/Swap/Limit/state/types'
import { getWrapInfo } from '~/state/routing/gas'
import { LimitOrderTrade, SwapFeeInfo, WrapInfo } from '~/state/routing/types'
import { getUSDCostPerGas } from '~/state/routing/utils'

function isStablecoin(currency?: Currency): boolean {
  return (
    currency !== undefined &&
    isUniverseChainId(currency.chainId) &&
    getStablecoinsForChain(currency.chainId).some((stablecoin) => stablecoin.equals(currency))
  )
}

// By default, inputCurrency is base currency and outputCurrency is quote currency
// If only one of these tokens is a stablecoin, prefer the denomination (quote currency) to be the stablecoin
// TODO(limits): Also add preference for ETH, BTC to be default
export function getDefaultPriceInverted(inputCurrency?: Currency, outputCurrency?: Currency): boolean {
  const [isInputStablecoin, isOutputStablecoin] = [isStablecoin(inputCurrency), isStablecoin(outputCurrency)]
  return isInputStablecoin && !isOutputStablecoin
}

export function useDerivedLimitInfo(state: LimitState): LimitInfo {
  const account = useAccount()
  const { inputAmount, outputAmount, limitPriceInverted } = state
  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const relevantTokenBalances = useCurrencyBalances(
    account.address,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency]),
  )

  const currencyBalances = useMemo(
    () => ({
      [CurrencyField.INPUT]: relevantTokenBalances[0],
      [CurrencyField.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances],
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
      parsedLimitPriceQuoteAmount.quotient,
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

    // Price.quote() can produce zero-quotient amounts when the derived side is too small
    // (e.g. selling EURC for a tiny MOG amount). Treat these as undefined to prevent
    // placing orders with zero sell/buy values.
    if (parsedInputAmount?.quotient.toString() === '0') {
      parsedInputAmount = undefined
    }
    if (parsedOutputAmount?.quotient.toString() === '0') {
      parsedOutputAmount = undefined
    }

    return {
      [CurrencyField.INPUT]: parsedInputAmount,
      [CurrencyField.OUTPUT]: parsedOutputAmount,
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

  const { marketPrice, marketPriceRejected, fee: swapFee } = useMarketPriceAndFee(inputCurrency, outputCurrency)

  const skip =
    !(inputCurrency && outputCurrency) || isSVMChain(inputCurrency.chainId) || isSVMChain(outputCurrency.chainId)

  const { trade } = useTrade({
    amountSpecified: parsedAmounts[CurrencyField.INPUT],
    otherCurrency: outputCurrency,
    tradeType: TradeType.EXACT_INPUT,
    skip,
    isUSDQuote: true, // request classic quotes only for market price quote
  })

  const limitOrderTrade = useLimitOrderTrade({
    inputCurrency,
    parsedAmounts,
    outputAmount: parsedAmounts[CurrencyField.OUTPUT],
    trade: trade ?? undefined,
    state,
    swapFee,
  })

  return {
    currencyBalances,
    parsedAmounts,
    parsedLimitPrice,
    limitOrderTrade,
    marketPrice,
    marketPriceRejected,
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
  trade?: Trade | null
  inputCurrency?: Currency
  parsedAmounts: { [field in CurrencyField]?: CurrencyAmount<Currency> }
  outputAmount?: CurrencyAmount<Currency>
  swapFee?: SwapFeeInfo
}) {
  const account = useAccount()
  const [wrapInfo, setWrapInfo] = useState<WrapInfo>()

  useEffect(() => {
    async function calculateWrapInfo() {
      if (!inputCurrency || !isEVMChain(inputCurrency.chainId)) {
        setWrapInfo(undefined)
        return
      }

      const [currencyIn, needsWrap] = inputCurrency.isNative ? [inputCurrency.wrapped, true] : [inputCurrency, false]

      if (needsWrap) {
        const gasUseEstimate =
          trade && isClassic(trade) && trade.quote.quote.gasUseEstimate
            ? parseFloat(trade.quote.quote.gasUseEstimate)
            : undefined
        const gasUseEstimateUSD =
          trade && isClassic(trade) && trade.quote.quote.gasFeeUSD ? parseFloat(trade.quote.quote.gasFeeUSD) : undefined
        const usdCostPerGas = getUSDCostPerGas(gasUseEstimateUSD, gasUseEstimate)

        // oxlint-disable-next-line no-shadow
        const wrapInfo = await getWrapInfo({
          needsWrap,
          account: account.address,
          chainId: currencyIn.chainId,
          amount: '1',
          usdCostPerGas,
        })
        setWrapInfo(wrapInfo)
      } else {
        setWrapInfo({ needsWrap: false })
      }
    }
    calculateWrapInfo()
  }, [account.address, inputCurrency, trade])

  const limitOrderTrade = useMemo(() => {
    if (!inputCurrency || !parsedAmounts[CurrencyField.INPUT] || !account.address || !outputAmount || !wrapInfo) {
      return undefined
    }
    const amountIn = CurrencyAmount.fromRawAmount(inputCurrency.wrapped, parsedAmounts[CurrencyField.INPUT].quotient)
    return new LimitOrderTrade({
      amountIn,
      amountOut: outputAmount,
      tradeType: TradeType.EXACT_INPUT,
      wrapInfo,
      approveInfo: { needsApprove: false },
      swapper: account.address,
      deadlineBufferSecs: expiryToDeadlineSeconds(state.expiry),
      swapFee,
    })
  }, [account.address, outputAmount, inputCurrency, parsedAmounts, state.expiry, wrapInfo, swapFee])

  return limitOrderTrade
}

// Convert from SwapFee (from quote) to SwapFeeInfo (deprecated type used in LimitOrderTrade)
const toSwapFeeInfo = (swapFee: SwapFee | undefined): SwapFeeInfo | undefined =>
  swapFee ? { ...swapFee, recipient: swapFee.recipient ?? '' } : undefined

function useMarketPriceAndFee(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
): { marketPrice?: Price<Currency, Currency>; marketPriceRejected: boolean; fee?: SwapFeeInfo } {
  const skip =
    !(inputCurrency && outputCurrency) ||
    !LIMIT_SUPPORTED_CHAINS.includes(inputCurrency.chainId) ||
    isSVMChain(inputCurrency.chainId) ||
    isSVMChain(outputCurrency.chainId)

  // TODO(limits): update amount for MATIC and CELO once Limits are supported on those chains
  const baseCurrencyAmount =
    inputCurrency && CurrencyAmount.fromRawAmount(nativeOnChain(inputCurrency.chainId), 10 ** 18)
  const { trade: tradeA } = useTrade({
    amountSpecified: baseCurrencyAmount,
    otherCurrency: inputCurrency,
    tradeType: TradeType.EXACT_OUTPUT,
    skip,
    isUSDQuote: true, // request classic quotes only for market price quote
  })

  const { trade: tradeB } = useTrade({
    amountSpecified: baseCurrencyAmount,
    otherCurrency: outputCurrency,
    tradeType: TradeType.EXACT_INPUT,
    skip,
    isUSDQuote: true, // request classic quotes only for market price quote
  })

  // USD prices feed the market-price cross-check in computeLimitMarketPrice; the loading flags
  // let it defer the reference (rather than fail open) while a price is still resolving.
  // A withheld-stale price mid-refetch (isStaleRefreshing: a returning user's rehydrated cache
  // entry during its mount refetch) reports price: undefined with isLoading: false, but it is
  // provisional, not settled-missing — fold it into the loading flag so that window defers too
  // instead of skipping the cross-check open for one round-trip.
  const {
    price: usdPriceIn,
    isLoading: usdPriceInIsLoading,
    isStaleRefreshing: usdPriceInStaleRefreshing,
  } = useUSDCPrice(skip ? undefined : inputCurrency)
  const {
    price: usdPriceOut,
    isLoading: usdPriceOutIsLoading,
    isStaleRefreshing: usdPriceOutStaleRefreshing,
  } = useUSDCPrice(skip ? undefined : outputCurrency)
  const usdPriceInLoading = usdPriceInIsLoading || usdPriceInStaleRefreshing
  const usdPriceOutLoading = usdPriceOutIsLoading || usdPriceOutStaleRefreshing

  const {
    marketPrice,
    referenceRejected: marketPriceRejected,
    swapFee,
    checkLogs,
  } = useMemo((): LimitMarketPriceResult => {
    if (skip) {
      return { referenceRejected: false, checkLogs: [] }
    }

    return computeLimitMarketPrice({
      inputCurrency,
      outputCurrency,
      tradeA,
      tradeB,
      usdPriceIn,
      usdPriceOut,
      usdPriceInLoading,
      usdPriceOutLoading,
    })
  }, [
    inputCurrency,
    outputCurrency,
    skip,
    tradeA,
    tradeB,
    usdPriceIn,
    usdPriceOut,
    usdPriceInLoading,
    usdPriceOutLoading,
  ])

  useLogMarketPriceReferenceChecks(checkLogs)

  const feesEnabled = useFeatureFlag(FeatureFlags.LimitsFees)
  // Which trade's fee applies is decided by the same branch that composed the market price
  // (computeLimitMarketPrice.swapFee), so the two can't silently diverge.
  const fee = useMemo(
    () => (feesEnabled && marketPrice ? toSwapFeeInfo(swapFee) : undefined),
    [feesEnabled, marketPrice, swapFee],
  )

  return useMemo(() => ({ marketPrice, marketPriceRejected, fee }), [marketPrice, marketPriceRejected, fee])
}
