import { TradeType } from '@taraswap/sdk-core'
import { useMemo } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ChainId } from 'uniswap/src/types/chains'
import { useOnChainCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useSetTradeSlippage } from 'wallet/src/features/transactions/swap/trade/hooks/useSetTradeSlippage'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { useTradingApiTrade } from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useTradingApiTrade'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { getWrapType, isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo(state: TransactionState): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField = CurrencyField.INPUT,
    selectingCurrencyField,
    txId,
    customSlippageTolerance,
    tradeProtocolPreference,
  } = state

  const activeAccount = useActiveAccount()

  const currencyInInfo = useCurrencyInfo(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn.address) : undefined
  )

  const currencyOutInfo = useCurrencyInfo(
    currencyAssetOut
      ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut.address)
      : undefined
  )

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyInInfo,
      [CurrencyField.OUTPUT]: currencyOutInfo,
    }
  }, [currencyInInfo, currencyOutInfo])

  const currencyIn = currencyInInfo?.currency
  const currencyOut = currencyOutInfo?.currency

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? ChainId.Mainnet

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currencyIn, activeAccount?.address)
  const { balance: tokenOutBalance } = useOnChainCurrencyBalance(
    currencyOut,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  const otherCurrency = isExactIn ? currencyOut : currencyIn
  const exactCurrency = isExactIn ? currencyIn : currencyOut

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(() => {
    return getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency: exactCurrency,
    })
  }, [exactAmountToken, exactCurrency])

  const shouldGetQuote = !isWrapAction(wrapType)
  const sendPortionEnabled = useFeatureFlag(FeatureFlags.PortionFields)
  const isOptionalRoutingEnabled = useFeatureFlag(FeatureFlags.OptionalRouting)

  const tradeParams = {
    amountSpecified: shouldGetQuote ? amountSpecified : null,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    customSlippageTolerance,
    sendPortionEnabled,
    // Only pass custom routing preference if feature is enabled
    tradeProtocolPreference: isOptionalRoutingEnabled ? tradeProtocolPreference : undefined,
  }

  const tradingApiTrade = useTradingApiTrade(tradeParams)

  // Calculate auto slippage tolerance for trade. If customSlippageTolerance is undefined, then the Trade slippage is set to the calculated value.
  const { trade, autoSlippageTolerance } = useSetTradeSlippage(
    tradingApiTrade,
    customSlippageTolerance
  )

  const currencyAmounts = useMemo(
    () =>
      shouldGetQuote
        ? {
            [CurrencyField.INPUT]:
              exactCurrencyField === CurrencyField.INPUT
                ? amountSpecified
                : trade.trade?.inputAmount,
            [CurrencyField.OUTPUT]:
              exactCurrencyField === CurrencyField.OUTPUT
                ? amountSpecified
                : trade.trade?.outputAmount,
          }
        : {
            [CurrencyField.INPUT]: amountSpecified,
            [CurrencyField.OUTPUT]: amountSpecified,
          },
    [
      shouldGetQuote,
      exactCurrencyField,
      amountSpecified,
      trade.trade?.inputAmount,
      trade.trade?.outputAmount,
    ]
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  const currencyAmountsUSDValue = useMemo(() => {
    return {
      [CurrencyField.INPUT]: inputCurrencyUSDValue,
      [CurrencyField.OUTPUT]: outputCurrencyUSDValue,
    }
  }, [inputCurrencyUSDValue, outputCurrencyUSDValue])

  const currencyBalances = useMemo(() => {
    return {
      [CurrencyField.INPUT]: tokenInBalance,
      [CurrencyField.OUTPUT]: tokenOutBalance,
    }
  }, [tokenInBalance, tokenOutBalance])

  return useMemo(() => {
    return {
      chainId,
      currencies,
      currencyAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
      trade,
      exactAmountToken,
      exactAmountFiat,
      exactCurrencyField,
      focusOnCurrencyField,
      wrapType,
      selectingCurrencyField,
      txId,
      autoSlippageTolerance,
      customSlippageTolerance,
    }
  }, [
    autoSlippageTolerance,
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    customSlippageTolerance,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    trade,
    txId,
    wrapType,
  ])
}
