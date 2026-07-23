import { TradeType } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useAccountsStore } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTradingApiGasOverrides } from 'uniswap/src/features/gas/hooks/useTradingApiGasOverrides'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useSwapEarnIntent } from 'uniswap/src/features/transactions/swap/hooks/useSwapEarnIntent'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { useTradeFromExistingPlan } from 'uniswap/src/features/transactions/swap/hooks/useTradeFromExistingPlan'
import { getWalletExecutionContext } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getWrapType } from 'uniswap/src/features/transactions/swap/utils/wrap'
import type { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo({
  isDebouncing,
  isEarnFlow,
  ...state
}: TransactionState & {
  isDebouncing?: boolean
  isEarnFlow?: boolean
}): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField = CurrencyField.INPUT,
    txId,
  } = state

  const { defaultChainId } = useEnabledChains()

  const { customSlippageTolerance, selectedProtocols, isV4HookPoolsEnabled } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    selectedProtocols: s.selectedProtocols,
    isV4HookPoolsEnabled: s.isV4HookPoolsEnabled,
  }))

  const currencyInInfo = useCurrencyInfo(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn.address) : undefined,
    { refetch: true },
  )

  const currencyOutInfo = useCurrencyInfo(
    currencyAssetOut ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut.address) : undefined,
    { refetch: true },
  )

  const currencyIn = currencyInInfo?.currency
  const currencyOut = currencyOutInfo?.currency

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? defaultChainId

  const { evmAccount, svmAccount } = useWallet()

  const account = chainId === UniverseChainId.Solana ? svmAccount : evmAccount

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyInInfo,
      [CurrencyField.OUTPUT]: currencyOutInfo,
    }
  }, [currencyInInfo, currencyOutInfo])

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currencyIn, account?.address)
  const { balance: tokenOutBalance } = useOnChainCurrencyBalance(currencyOut, account?.address)

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

  const sendPortionEnabled = useFeatureFlag(FeatureFlags.PortionFields)
  // Earn deposits are exact-input only: the user specifies how much of the input token to
  // swap + deposit. Exact-asset (output-specified) deposits are not supported. When
  // disabled, the Earn hook passes inert query inputs so normal swaps do not fetch Earn data.
  const { earnIntent, quoteOutputOverride } = useSwapEarnIntent({
    currencyIn,
    currencyOut,
    enabled: isEarnFlow === true && exactCurrencyField === CurrencyField.INPUT,
  })

  const generatePermitAsTransaction = useUniswapContextSelector((ctx) => {
    // If the account cannot sign typedData, permits should be completed as a transaction step,
    // unless the swap is going through the 7702 smart wallet flow, in which case the
    // swap_7702 endpoint consumes typedData in the process encoding the swap.
    return ctx.getCanSignPermits?.(chainId) && !ctx.getSwapDelegationInfo?.(chainId).delegationAddress
  })
  const caip25Info = useAccountsStore((s) => s.getActiveConnector(Platform.EVM)?.session?.caip25Info)
  const walletExecutionContext = useMemo(() => getWalletExecutionContext(caip25Info), [caip25Info])
  // tx is unavailable at quote time (this hook runs before the /swap response
  // resolves); recommended falls back to undefined, which is fine for full overrides.
  const gasOverrides = useTradingApiGasOverrides({ tx: undefined })
  const tradeParams = useMemo(
    () => ({
      account,
      amountSpecified,
      otherCurrency,
      tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
      customSlippageTolerance,
      selectedProtocols,
      sendPortionEnabled,
      isDebouncing,
      generatePermitAsTransaction,
      isV4HookPoolsEnabled,
      walletExecutionContext,
      gasOverrides,
      earnIntent,
      quoteOutputOverride,
      skipIndicativeTrade: earnIntent !== undefined,
    }),
    [
      account,
      amountSpecified,
      otherCurrency,
      isExactIn,
      customSlippageTolerance,
      selectedProtocols,
      sendPortionEnabled,
      isDebouncing,
      generatePermitAsTransaction,
      isV4HookPoolsEnabled,
      walletExecutionContext,
      gasOverrides,
      earnIntent,
      quoteOutputOverride,
    ],
  )

  const existingPlanTrade = useTradeFromExistingPlan(tradeParams)
  const tradeFromQuote = useTrade({ ...tradeParams, skip: !!existingPlanTrade })
  const trade = existingPlanTrade ?? tradeFromQuote

  const displayableTrade = trade.trade ?? trade.indicativeTrade

  const displayableTradeOutputAmount = displayableTrade?.outputAmount

  const currencyAmounts = useMemo(
    () => ({
      [CurrencyField.INPUT]:
        exactCurrencyField === CurrencyField.INPUT ? amountSpecified : displayableTrade?.inputAmount,
      [CurrencyField.OUTPUT]:
        exactCurrencyField === CurrencyField.OUTPUT ? amountSpecified : displayableTradeOutputAmount,
    }),
    [exactCurrencyField, amountSpecified, displayableTrade?.inputAmount, displayableTradeOutputAmount],
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
    trade,
    txId,
    wrapType,
    displayableTrade,
  ])
}
