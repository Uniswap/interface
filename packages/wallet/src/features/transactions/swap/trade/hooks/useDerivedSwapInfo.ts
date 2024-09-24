import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useSetTradeSlippage } from 'wallet/src/features/transactions/swap/trade/hooks/useSetTradeSlippage'
import { getWrapType, isWrapAction } from 'wallet/src/features/transactions/swap/utils'

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

  const account = useAccountMeta()

  const currencyInInfo = useCurrencyInfo(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn.address) : undefined,
    { refetch: true },
  )

  const currencyOutInfo = useCurrencyInfo(
    currencyAssetOut ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut.address) : undefined,
    { refetch: true },
  )

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyInInfo,
      [CurrencyField.OUTPUT]: currencyOutInfo,
    }
  }, [currencyInInfo, currencyOutInfo])

  const currencyIn = currencyInInfo?.currency
  const currencyOut = currencyOutInfo?.currency

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? UniverseChainId.Mainnet

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currencyIn, account?.address)
  const { balance: tokenOutBalance } = useOnChainCurrencyBalance(currencyOut, account?.address)

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  const otherCurrency = isExactIn ? currencyOut : currencyIn
  const exactCurrency = isExactIn ? currencyIn : currencyOut
  const isWrap = isWrapAction(wrapType)

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(() => {
    return getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency: exactCurrency,
    })
  }, [exactAmountToken, exactCurrency])

  const otherAmountForWrap = useMemo(() => {
    //  we only use otherAmountForWrap when it's a wrap action,
    //  otherwise parsing exactAmountToken using otherCurrency can lead to errors,
    //  e.g. otherCurrency.decimals !== exactCurrency.decimals
    if (isWrap) {
      return getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: otherCurrency,
      })
    }
  }, [exactAmountToken, isWrap, otherCurrency])

  const sendPortionEnabled = useFeatureFlag(FeatureFlags.PortionFields)

  const tradeParams = {
    account,
    amountSpecified: isWrap ? null : amountSpecified,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    customSlippageTolerance,
    sendPortionEnabled,
    tradeProtocolPreference,
  }

  const tradeTradeWithoutSlippage = useTrade(tradeParams)

  // Calculate auto slippage tolerance for trade. If customSlippageTolerance is undefined, then the Trade slippage is set to the calculated value.
  const { trade, autoSlippageTolerance } = useSetTradeSlippage(tradeTradeWithoutSlippage, customSlippageTolerance)

  const displayableTrade = trade.trade ?? trade.indicativeTrade

  const currencyAmounts = useMemo(
    () =>
      isWrap
        ? {
            [CurrencyField.INPUT]: amountSpecified,
            [CurrencyField.OUTPUT]: otherAmountForWrap,
          }
        : {
            [CurrencyField.INPUT]:
              exactCurrencyField === CurrencyField.INPUT ? amountSpecified : displayableTrade?.inputAmount,
            [CurrencyField.OUTPUT]:
              exactCurrencyField === CurrencyField.OUTPUT ? amountSpecified : displayableTrade?.outputAmount,
          },
    [
      isWrap,
      exactCurrencyField,
      amountSpecified,
      otherAmountForWrap,
      displayableTrade?.inputAmount,
      displayableTrade?.outputAmount,
    ],
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
