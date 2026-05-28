import { getFewTokenFromOriginalToken, isFewToken } from '@ring-protocol/few-v2-sdk'
import { Token, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAccountMeta, useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getWrapType, isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo({
  isDebouncing,
  ...state
}: TransactionState & { isDebouncing?: boolean }): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField = CurrencyField.INPUT,
    selectingCurrencyField,
    txId,
  } = state

  const { customSlippageTolerance, customDeadline, selectedProtocols, isV4HookPoolsEnabled, selectedAggregators } =
    useTransactionSettingsContext()

  const account = useAccountMeta()
  const { defaultChainId } = useEnabledChains()

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

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? defaultChainId

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
    return undefined
  }, [exactAmountToken, isWrap, otherCurrency])

  // Check if it's a FEW token 1:1 pair (supports both FewWrap and FewUnwrap)
  const isFewTokenPair = useMemo(() => {
    if (!currencyIn || !currencyOut || currencyIn.chainId !== currencyOut.chainId) {
      return false
    }

    const inputToken = currencyIn.isNative ? currencyIn.wrapped : (currencyIn as Token)
    const outputToken = currencyOut.isNative ? currencyOut.wrapped : (currencyOut as Token)

    // Case 1: FewWrap - input is regular token, output is corresponding FEW token
    if (!isFewToken(inputToken) && isFewToken(outputToken)) {
      const expectedFewToken = getFewTokenFromOriginalToken(inputToken, currencyIn.chainId)
      return areAddressesEqual(expectedFewToken.address, outputToken.address)
    }

    // Case 2: FewUnwrap - input is FEW token, output is corresponding regular token
    if (isFewToken(inputToken) && !isFewToken(outputToken)) {
      const expectedFewToken = getFewTokenFromOriginalToken(outputToken, currencyOut.chainId)
      return areAddressesEqual(expectedFewToken.address, inputToken.address)
    }

    return false
  }, [currencyIn, currencyOut])

  // For FEW token pairs, the other amount equals the input amount (1:1)
  // Supports bidirectional: INPUT -> OUTPUT and OUTPUT -> INPUT
  const otherAmountForFewToken = useMemo(() => {
    if (isFewTokenPair && exactAmountToken) {
      return getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: otherCurrency,
      })
    }
    return undefined
  }, [exactAmountToken, isFewTokenPair, otherCurrency])

  const sendPortionEnabled = useFeatureFlag(FeatureFlags.PortionFields)

  const generatePermitAsTransaction = useUniswapContextSelector((ctx) => {
    // If the account cannot sign typedData, permits should be completed as a transaction step,
    // unless the swap is going through the 7702 smart wallet flow, in which case the
    // swap_7702 endpoint consumes typedData in the process encoding the swap.
    return ctx.getCanSignPermits?.(chainId) && !ctx.getSwapDelegationInfo?.(chainId)?.delegationAddress
  })

  const tradeParams = {
    account,
    amountSpecified: isWrap ? null : amountSpecified,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    customSlippageTolerance,
    customDeadline,
    selectedProtocols,
    selectedAggregators,
    sendPortionEnabled,
    isDebouncing,
    generatePermitAsTransaction,
    isV4HookPoolsEnabled,
  }

  const trade = useTrade(tradeParams)

  const displayableTrade = trade.trade ?? trade.indicativeTrade

  const priceUXEnabled = usePriceUXEnabled()
  const displayableTradeOutputAmount = priceUXEnabled
    ? displayableTrade?.quoteOutputAmount
    : displayableTrade?.outputAmount

  const currencyAmounts = useMemo(
    () =>
      isWrap
        ? {
            [CurrencyField.INPUT]: amountSpecified,
            [CurrencyField.OUTPUT]: otherAmountForWrap,
          }
        : isFewTokenPair
          ? {
              // FEW token 1:1 pair, similar to wrap
              [CurrencyField.INPUT]: amountSpecified,
              [CurrencyField.OUTPUT]: otherAmountForFewToken,
            }
          : {
              [CurrencyField.INPUT]:
                exactCurrencyField === CurrencyField.INPUT ? amountSpecified : displayableTrade?.inputAmount,
              [CurrencyField.OUTPUT]:
                exactCurrencyField === CurrencyField.OUTPUT ? amountSpecified : displayableTradeOutputAmount,
            },
    [
      isWrap,
      isFewTokenPair,
      exactCurrencyField,
      amountSpecified,
      otherAmountForWrap,
      otherAmountForFewToken,
      displayableTrade?.inputAmount,
      displayableTradeOutputAmount,
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
      outputAmountUserWillReceive: displayableTrade?.quoteOutputAmountUserWillReceive,
    }
  }, [
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    trade,
    txId,
    wrapType,
    displayableTrade,
  ])
}
