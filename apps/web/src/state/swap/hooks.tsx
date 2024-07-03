import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Field } from 'components/swap/constants'
import { useSupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useDebouncedTrade } from 'hooks/useDebouncedTrade'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { Trans } from 'i18n'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useContext, useMemo } from 'react'
import { useCurrencyBalance, useCurrencyBalances } from 'state/connection/hooks'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { isClassicTrade, isSubmittableTrade, isUniswapXTrade } from 'state/routing/utils'
import {
  CurrencyState,
  SerializedCurrencyState,
  SwapAndLimitContext,
  SwapContext,
  SwapInfo,
  SwapState,
} from 'state/swap/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { isAddress } from 'utilities/src/addresses'
import { getParsedChainId } from 'utils/chains'

export function useSwapContext() {
  return useContext(SwapContext)
}

export function useSwapAndLimitContext() {
  const account = useAccount()
  const context = useContext(SwapAndLimitContext)

  // Certain components are used both inside the swap and limit context, and outside of it.
  // One example is the CurrencySearch component, which is used in the swap context, but also in
  // the add/remove liquidity flows, nft flows, etc. In these cases, we want to use the chainId
  // from the provider account (hooks/useAccount), instead of the swap context chainId.
  return {
    ...context,
    chainId: context.isSwapAndLimitContext ? context.chainId : account.chainId,
  }
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: (options: { newOutputHasTax: boolean; previouslyEstimatedOutput: string }) => void
  onUserInput: (field: Field, typedValue: string) => void
} {
  const { swapState, setSwapState } = useSwapContext()
  const { currencyState, setCurrencyState } = useSwapAndLimitContext()

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      const [currentCurrencyKey, otherCurrencyKey]: (keyof CurrencyState)[] =
        field === Field.INPUT ? ['inputCurrency', 'outputCurrency'] : ['outputCurrency', 'inputCurrency']
      const otherCurrency = currencyState[otherCurrencyKey]
      // the case where we have to swap the order
      if (otherCurrency && currency.equals(otherCurrency)) {
        setCurrencyState({
          [currentCurrencyKey]: currency,
          [otherCurrencyKey]: currencyState[currentCurrencyKey],
        })
        setSwapState((swapState) => ({
          ...swapState,
          independentField: swapState.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        }))
        // multichain ux case where we set input or output to different chain
      } else if (otherCurrency?.chainId !== currency.chainId) {
        setCurrencyState((state) => ({
          ...state,
          [currentCurrencyKey]: currency,
          [otherCurrencyKey]: undefined,
        }))
      } else {
        setCurrencyState((state) => ({
          ...state,
          [currentCurrencyKey]: currency,
        }))
      }
    },
    [currencyState, setCurrencyState, setSwapState],
  )

  const onSwitchTokens = useCallback(
    ({
      newOutputHasTax,
      previouslyEstimatedOutput,
    }: {
      newOutputHasTax: boolean
      previouslyEstimatedOutput: string
    }) => {
      // To prevent swaps with FOT tokens as exact-outputs, we leave it as an exact-in swap and use the previously estimated output amount as the new exact-in amount.
      if (newOutputHasTax && swapState.independentField === Field.INPUT) {
        setSwapState((swapState) => ({
          ...swapState,
          typedValue: previouslyEstimatedOutput,
        }))
      } else {
        setSwapState((prev) => ({
          ...prev,
          independentField: prev.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        }))
      }

      setCurrencyState((prev) => ({
        inputCurrency: prev.outputCurrency,
        outputCurrency: prev.inputCurrency,
      }))
    },
    [setCurrencyState, setSwapState, swapState.independentField],
  )

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSwapState((state) => {
        return {
          ...state,
          independentField: field,
          typedValue,
        }
      })
    },
    [setSwapState],
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(state: SwapState): SwapInfo {
  const account = useAccount()
  const {
    chainId,
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()
  const nativeCurrency = useNativeCurrency(chainId)
  const balance = useCurrencyBalance(account.address, nativeCurrency)

  const { independentField, typedValue } = state

  const { inputTax, outputTax } = useSwapTaxes(
    inputCurrency?.isToken ? inputCurrency.address : undefined,
    outputCurrency?.isToken ? outputCurrency.address : undefined,
    chainId,
  )

  const relevantTokenBalances = useCurrencyBalances(
    account.address,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency]),
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue],
  )

  const trade: {
    state: TradeState
    trade?: InterfaceTrade
    swapQuoteLatency?: number
  } = useDebouncedTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined,
    state.routerPreferenceOverride as RouterPreference.API | undefined,
    account.address,
  )

  const { data: nativeCurrencyBalanceUSD } = useUSDPrice(balance, nativeCurrency)

  const { data: outputFeeFiatValue } = useUSDPrice(
    isSubmittableTrade(trade.trade) && trade.trade.swapFee
      ? CurrencyAmount.fromRawAmount(trade.trade.outputAmount.currency, trade.trade.swapFee.amount)
      : undefined,
    trade.trade?.outputAmount.currency,
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances],
  )

  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }),
    [inputCurrency, outputCurrency],
  )

  // allowed slippage for classic trades is either auto slippage, or custom user defined slippage if auto slippage disabled
  const classicAutoSlippage = useAutoSlippageTolerance(isClassicTrade(trade.trade) ? trade.trade : undefined)

  // slippage for uniswapx trades is defined by the quote response
  const uniswapXAutoSlippage = isUniswapXTrade(trade.trade) ? trade.trade.slippageTolerance : undefined

  // Uniswap interface recommended slippage amount
  const autoSlippage = uniswapXAutoSlippage ?? classicAutoSlippage
  const classicAllowedSlippage = useUserSlippageToleranceWithDefault(autoSlippage)

  // slippage amount used to submit the trade
  const allowedSlippage = uniswapXAutoSlippage ?? classicAllowedSlippage

  // totalGasUseEstimateUSD is greater than native token balance
  const insufficientGas =
    isClassicTrade(trade.trade) && (nativeCurrencyBalanceUSD ?? 0) < (trade.trade.totalGasUseEstimateUSDWithBuffer ?? 0)

  const { isDisconnected } = useAccount()
  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account.isConnected) {
      inputError = isDisconnected ? (
        <Trans i18nKey="common.connectWallet.button" />
      ) : (
        <Trans i18nKey="common.connectingWallet" />
      )
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      inputError = inputError ?? <Trans i18nKey="common.selectToken.label" />
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans i18nKey="common.noAmount.error" />
    }

    if (insufficientGas) {
      inputError = (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: nativeCurrency.symbol,
          }}
        />
      )
    }

    // compare input balance to max input based on version
    const [balanceIn, maxAmountIn] = [currencyBalances[Field.INPUT], trade?.trade?.maximumAmountIn(allowedSlippage)]

    if (balanceIn && maxAmountIn && balanceIn.lessThan(maxAmountIn)) {
      inputError = (
        <Trans
          i18nKey="common.insufficientTokenBalance.error"
          values={{
            tokenSymbol: balanceIn.currency.symbol,
          }}
        />
      )
    }

    return inputError
  }, [
    account.isConnected,
    currencies,
    parsedAmount,
    currencyBalances,
    trade?.trade,
    allowedSlippage,
    isDisconnected,
    insufficientGas,
    nativeCurrency.symbol,
  ])

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      trade,
      autoSlippage,
      allowedSlippage,
      outputFeeFiatValue,
      inputTax,
      outputTax,
    }),
    [
      allowedSlippage,
      autoSlippage,
      currencies,
      currencyBalances,
      inputError,
      outputFeeFiatValue,
      parsedAmount,
      trade,
      inputTax,
      outputTax,
    ],
  )
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) {
      return valid
    }
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') {
      return 'ETH'
    }
  }
  return ''
}

export function queryParametersToCurrencyState(parsedQs: ParsedQs): SerializedCurrencyState {
  const inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency ?? parsedQs.inputcurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency ?? parsedQs.outputcurrency)
  const chainId = getParsedChainId(parsedQs)
  if (inputCurrency === outputCurrency) {
    // clear output if identical
    outputCurrency = ''
  }

  return {
    inputCurrencyId: inputCurrency === '' ? undefined : inputCurrency ?? undefined,
    outputCurrencyId: outputCurrency === '' ? undefined : outputCurrency ?? undefined,
    chainId,
  }
}

export function useInitialCurrencyState(): {
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialChainId: InterfaceChainId
} {
  const multichainUXEnabled = useFeatureFlag(FeatureFlags.MultichainUX)

  const parsedQs = useParsedQueryString()
  const parsedCurrencyState = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])

  const account = useAccount()
  const supportedChainId =
    useSupportedChainId(parsedCurrencyState.chainId ?? account.chainId) ?? UniverseChainId.Mainnet

  const { balanceList } = useTokenBalances({ cacheOnly: true })

  const { initialInputCurrencyAddress, initialChainId } = useMemo(() => {
    // Handle query params or disconnected state
    if (parsedCurrencyState.inputCurrencyId) {
      return {
        initialInputCurrencyAddress: parsedCurrencyState.inputCurrencyId,
        initialChainId: supportedChainId,
      }
    } else if (
      !multichainUXEnabled ||
      !account.isConnected ||
      !balanceList ||
      parsedCurrencyState.chainId ||
      parsedCurrencyState.outputCurrencyId
    ) {
      return {
        initialInputCurrencyAddress: parsedCurrencyState.outputCurrencyId ? undefined : 'ETH',
        initialChainId: supportedChainId,
      }
    }
    // If no query params & connected, return the native token where user has the highest USD value
    let highestBalance = 0
    let highestBalanceNativeTokenAddress = 'ETH'
    let highestBalanceChainId = UniverseChainId.Mainnet
    balanceList.forEach((balance) => {
      if (
        balance?.token?.standard === NATIVE_CHAIN_ID &&
        balance?.denominatedValue?.value &&
        balance?.denominatedValue?.value > highestBalance
      ) {
        highestBalance = balance.denominatedValue.value
        highestBalanceNativeTokenAddress = balance?.token.address ?? 'ETH'
        highestBalanceChainId = supportedChainIdFromGQLChain(balance.token.chain) ?? UniverseChainId.Mainnet
      }
    })
    return { initialInputCurrencyAddress: highestBalanceNativeTokenAddress, initialChainId: highestBalanceChainId }
  }, [
    account.isConnected,
    balanceList,
    multichainUXEnabled,
    parsedCurrencyState.chainId,
    parsedCurrencyState.inputCurrencyId,
    parsedCurrencyState.outputCurrencyId,
    supportedChainId,
  ])

  const initialOutputCurrencyAddress = useMemo(
    () =>
      initialInputCurrencyAddress === parsedCurrencyState.outputCurrencyId // clear output if identical
        ? undefined
        : parsedCurrencyState.outputCurrencyId,
    [initialInputCurrencyAddress, parsedCurrencyState.outputCurrencyId],
  )
  const initialInputCurrency = useCurrency(initialInputCurrencyAddress, initialChainId)
  const initialOutputCurrency = useCurrency(initialOutputCurrencyAddress, initialChainId)

  return { initialInputCurrency, initialOutputCurrency, initialChainId }
}
