import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Field } from 'components/swap/constants'
import { CHAIN_IDS_TO_NAMES, useSupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency, useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useDebouncedTrade } from 'hooks/useDebouncedTrade'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useCurrencyBalance, useCurrencyBalances } from 'state/connection/hooks'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { isClassicTrade, isSubmittableTrade, isUniswapXTrade } from 'state/routing/utils'
import { CurrencyState, SerializedCurrencyState, SwapInfo, SwapState } from 'state/swap/types'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/useSwapContext'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { Trans } from 'uniswap/src/i18n'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { isAddress } from 'utilities/src/addresses'
import { getParsedChainId } from 'utils/chains'

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: (options: { newOutputHasTax: boolean; previouslyEstimatedOutput: string }) => void
  onUserInput: (field: Field, typedValue: string) => void
} {
  const { swapState, setSwapState } = useSwapContext()
  const { currencyState, setCurrencyState } = useSwapAndLimitContext()

  const inputTokenProjects = useTokenProjects(
    currencyState.inputCurrency ? [currencyId(currencyState.inputCurrency)] : [],
  )
  const outputTokenProjects = useTokenProjects(
    currencyState.outputCurrency ? [currencyId(currencyState.outputCurrency)] : [],
  )

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
        const otherCurrencyTokenProjects = field === Field.INPUT ? outputTokenProjects : inputTokenProjects
        const otherCurrency = otherCurrencyTokenProjects?.data?.find(
          (project) => project?.currency.chainId === currency.chainId,
        )
        setCurrencyState((state) => ({
          ...state,
          [currentCurrencyKey]: currency,
          [otherCurrencyKey]:
            otherCurrency && !areCurrencyIdsEqual(currencyId(currency), otherCurrency.currencyId)
              ? otherCurrency.currency
              : undefined,
        }))
      } else {
        setCurrencyState((state) => ({
          ...state,
          [currentCurrencyKey]: currency,
        }))
      }
    },
    [currencyState, inputTokenProjects, outputTokenProjects, setCurrencyState, setSwapState],
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
  const { chainId, currencyState } = useSwapAndLimitContext()
  const nativeCurrency = useNativeCurrency(chainId)
  const balance = useCurrencyBalance(account.address, nativeCurrency)

  // Note: if the currency was selected from recent searches
  // we don't have decimals (decimals are 0) need to fetch
  // full currency info with useCurrencyInfo otherwise quotes will break
  const inputCurrencyInfo = useCurrencyInfo(currencyState.inputCurrency)
  const outputCurrencyInfo = useCurrencyInfo(currencyState.outputCurrency)
  const inputCurrency = inputCurrencyInfo?.currency
  const outputCurrency = outputCurrencyInfo?.currency

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
  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account.isConnected) {
      const disconnectedInputError = isSignIn ? (
        <Trans i18nKey="nav.signIn.button" />
      ) : isLogIn ? (
        <Trans i18nKey="nav.logIn.button" />
      ) : (
        <Trans i18nKey="common.connectWallet.button" />
      )
      inputError = isDisconnected ? disconnectedInputError : <Trans i18nKey="common.connectingWallet" />
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
    insufficientGas,
    currencyBalances,
    trade?.trade,
    allowedSlippage,
    isSignIn,
    isLogIn,
    isDisconnected,
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

function parseFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
  if (typeof urlParam === 'string') {
    return urlParam
  }
  return undefined
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) {
      return valid
    }

    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') {
      return 'ETH'
    }

    if (urlParam === NATIVE_CHAIN_ID) {
      return NATIVE_CHAIN_ID
    }
  }
  return undefined
}

export function serializeSwapStateToURLParameters(
  state: CurrencyState & Partial<SwapState> & { chainId: UniverseChainId },
): string {
  const { inputCurrency, outputCurrency, typedValue, independentField, chainId } = state
  const params = new URLSearchParams()

  params.set('chain', CHAIN_IDS_TO_NAMES[chainId])

  if (inputCurrency) {
    params.set('inputCurrency', inputCurrency.isNative ? NATIVE_CHAIN_ID : inputCurrency.address)
  }

  if (outputCurrency) {
    params.set('outputCurrency', outputCurrency.isNative ? NATIVE_CHAIN_ID : outputCurrency.address)
  }

  const hasValidInput = (inputCurrency || outputCurrency) && typedValue
  if (hasValidInput) {
    params.set('value', typedValue)
  }

  if (hasValidInput && independentField) {
    params.set('field', independentField)
  }

  return '?' + params.toString()
}

export function queryParametersToCurrencyState(parsedQs: ParsedQs): SerializedCurrencyState {
  const inputCurrencyId = parseCurrencyFromURLParameter(parsedQs.inputCurrency ?? parsedQs.inputcurrency)
  const parsedOutputCurrencyId = parseCurrencyFromURLParameter(parsedQs.outputCurrency ?? parsedQs.outputcurrency)
  const outputCurrencyId = parsedOutputCurrencyId === inputCurrencyId ? undefined : parsedOutputCurrencyId
  const hasCurrencyInput = inputCurrencyId || outputCurrencyId
  const value = hasCurrencyInput ? parseFromURLParameter(parsedQs.value) : undefined
  const field = value ? parseFromURLParameter(parsedQs.field) : undefined
  const chainId = getParsedChainId(parsedQs)

  return {
    inputCurrencyId,
    outputCurrencyId,
    value,
    field,
    chainId,
  }
}

// Despite a lighter QuickTokenBalances query we've received feedback that the initial load time is too slow.
// Removing the logic that uses user's balance to determine the initial currency.
// We can revisit this if we find a way to make the initial load time faster.

// When we get the speed up here is the PR that removed the beautiful code:
// https://app.graphite.dev/github/pr/Uniswap/universe/11068/fix-web-default-to-eth-mainnet-on-multichain
export function useInitialCurrencyState(): {
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialField?: Field
  initialChainId: InterfaceChainId
  initialCurrencyLoading: boolean
} {
  const { chainId, setIsUserSelectedToken } = useSwapAndLimitContext()

  const parsedQs = useParsedQueryString()
  const parsedCurrencyState = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])

  const supportedChainId = useSupportedChainId(parsedCurrencyState.chainId ?? chainId) ?? UniverseChainId.Mainnet
  const hasCurrencyQueryParams =
    parsedCurrencyState.inputCurrencyId || parsedCurrencyState.outputCurrencyId || parsedCurrencyState.chainId

  useEffect(() => {
    if (parsedCurrencyState.inputCurrencyId || parsedCurrencyState.outputCurrencyId) {
      setIsUserSelectedToken(true)
    }
  }, [parsedCurrencyState.inputCurrencyId, parsedCurrencyState.outputCurrencyId, setIsUserSelectedToken])

  const { initialInputCurrencyAddress, initialChainId } = useMemo(() => {
    // Default to ETH if multichain
    if (!hasCurrencyQueryParams) {
      return {
        initialInputCurrencyAddress: 'ETH',
        initialChainId: UniverseChainId.Mainnet,
      }
    }
    // Handle query params or disconnected state
    if (parsedCurrencyState.inputCurrencyId) {
      return {
        initialInputCurrencyAddress: parsedCurrencyState.inputCurrencyId,
        initialChainId: supportedChainId,
      }
    }
    // return ETH or parsedCurrencyState
    return {
      initialInputCurrencyAddress: parsedCurrencyState.outputCurrencyId ? undefined : 'ETH',
      initialChainId: supportedChainId,
    }
  }, [
    hasCurrencyQueryParams,
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
  const initialTypedValue = initialInputCurrency || initialOutputCurrency ? parsedCurrencyState.value : undefined
  const initialField =
    initialTypedValue && parsedCurrencyState.field && parsedCurrencyState.field in Field
      ? Field[parsedCurrencyState.field as keyof typeof Field]
      : undefined

  return {
    initialInputCurrency,
    initialOutputCurrency,
    initialTypedValue,
    initialField,
    initialChainId,
    initialCurrencyLoading: false,
  }
}
