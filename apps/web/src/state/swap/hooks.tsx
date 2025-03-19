import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency, useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useDebouncedTrade } from 'hooks/useDebouncedTrade'
import { useSwapTaxes } from 'hooks/useSwapTaxes'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { useCurrencyBalance, useCurrencyBalances } from 'state/connection/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { isClassicTrade, isSubmittableTrade, isUniswapXTrade } from 'state/routing/utils'
import { CurrencyState, SerializedCurrencyState, SwapInfo, SwapState } from 'state/swap/types'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/useSwapContext'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isAddress } from 'utilities/src/addresses'
import { getParsedChainId } from 'utils/chainParams'

export function useSwapActionHandlers(): {
  onSwitchTokens: (options: { newOutputHasTax: boolean; previouslyEstimatedOutput: string }) => void
} {
  const { swapState, setSwapState } = useSwapContext()
  const { setCurrencyState } = useSwapAndLimitContext()

  const onSwitchTokens = useCallback(
    ({
      newOutputHasTax,
      previouslyEstimatedOutput,
    }: {
      newOutputHasTax: boolean
      previouslyEstimatedOutput: string
    }) => {
      // To prevent swaps with FOT tokens as exact-outputs, we leave it as an exact-in swap and use the previously estimated output amount as the new exact-in amount.
      if (newOutputHasTax && swapState.independentField === CurrencyField.INPUT) {
        setSwapState((swapState) => ({
          ...swapState,
          typedValue: previouslyEstimatedOutput,
        }))
      } else {
        setSwapState((prev) => ({
          ...prev,
          independentField: prev.independentField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT,
        }))
      }

      setCurrencyState((prev) => ({
        inputCurrency: prev.outputCurrency,
        outputCurrency: prev.inputCurrency,
      }))
    },
    [setCurrencyState, setSwapState, swapState.independentField],
  )

  return {
    onSwitchTokens,
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(state: SwapState): SwapInfo {
  const account = useAccount()
  const { chainId } = useMultichainContext()
  const { currencyState } = useSwapAndLimitContext()
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

  const isExactIn: boolean = independentField === CurrencyField.INPUT
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
      [CurrencyField.INPUT]: relevantTokenBalances[0],
      [CurrencyField.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances],
  )

  const currencies: { [field in CurrencyField]?: Currency } = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputCurrency,
      [CurrencyField.OUTPUT]: outputCurrency,
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
      inputError = isDisconnected ? <ConnectWalletButtonText /> : <Trans i18nKey="common.connectingWallet" />
    }

    if (!currencies[CurrencyField.INPUT] || !currencies[CurrencyField.OUTPUT]) {
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
    const [balanceIn, maxAmountIn] = [
      currencyBalances[CurrencyField.INPUT],
      trade?.trade?.maximumAmountIn(allowedSlippage),
    ]

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

export function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
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

interface BaseSwapParams {
  chainId?: UniverseChainId
  outputChainId?: UniverseChainId
  inputCurrency?: string
  outputCurrency?: string
  typedValue?: string
  independentField?: CurrencyField
}

function createBaseSwapURLParams({
  chainId,
  outputChainId,
  inputCurrency,
  outputCurrency,
  typedValue,
  independentField,
}: BaseSwapParams): URLSearchParams {
  const params = new URLSearchParams()

  if (chainId) {
    params.set('chain', getChainInfo(chainId).interfaceName)
  }

  if (outputChainId && outputChainId !== chainId) {
    params.set('outputChain', getChainInfo(outputChainId).interfaceName)
  }

  if (inputCurrency) {
    params.set('inputCurrency', inputCurrency)
  }

  if (outputCurrency) {
    params.set('outputCurrency', outputCurrency)
  }

  if (typedValue) {
    params.set('value', typedValue)
  }

  if (independentField) {
    params.set('field', independentField)
  }

  return params
}

export function serializeSwapStateToURLParameters(
  state: CurrencyState & Partial<SwapState> & { chainId: UniverseChainId },
): string {
  const { inputCurrency, outputCurrency, typedValue, independentField, chainId } = state
  const hasValidInput = (inputCurrency || outputCurrency) && typedValue

  return (
    '?' +
    createBaseSwapURLParams({
      chainId,
      outputChainId: outputCurrency?.chainId !== inputCurrency?.chainId ? outputCurrency?.chainId : undefined,
      inputCurrency: inputCurrency ? (inputCurrency.isNative ? NATIVE_CHAIN_ID : inputCurrency.address) : undefined,
      outputCurrency: outputCurrency ? (outputCurrency.isNative ? NATIVE_CHAIN_ID : outputCurrency.address) : undefined,
      typedValue: hasValidInput ? typedValue : undefined,
      independentField: hasValidInput ? independentField : undefined,
    }).toString()
  )
}

export function serializeSwapAddressesToURLParameters({
  inputTokenAddress,
  outputTokenAddress,
  chainId,
  outputChainId,
}: {
  inputTokenAddress?: string
  outputTokenAddress?: string
  chainId?: UniverseChainId | null
  outputChainId?: UniverseChainId | null
}): string {
  const chainIdOrDefault = chainId ?? UniverseChainId.Mainnet

  return (
    '?' +
    createBaseSwapURLParams({
      chainId: chainId ?? undefined,
      outputChainId: outputChainId ?? undefined,
      inputCurrency: inputTokenAddress
        ? inputTokenAddress === getNativeAddress(chainIdOrDefault)
          ? NATIVE_CHAIN_ID
          : inputTokenAddress
        : undefined,
      outputCurrency: outputTokenAddress
        ? outputTokenAddress === getNativeAddress(outputChainId ?? chainIdOrDefault)
          ? NATIVE_CHAIN_ID
          : outputTokenAddress
        : undefined,
    }).toString()
  )
}

export function queryParametersToCurrencyState(parsedQs: ParsedQs): SerializedCurrencyState {
  const chainId = getParsedChainId(parsedQs)
  const outputChainId = getParsedChainId(parsedQs, CurrencyField.OUTPUT)
  const inputCurrencyId = parseCurrencyFromURLParameter(parsedQs.inputCurrency ?? parsedQs.inputcurrency)
  const parsedOutputCurrencyId = parseCurrencyFromURLParameter(parsedQs.outputCurrency ?? parsedQs.outputcurrency)
  const outputCurrencyId =
    parsedOutputCurrencyId === inputCurrencyId && outputChainId === chainId ? undefined : parsedOutputCurrencyId
  const hasCurrencyInput = inputCurrencyId || outputCurrencyId
  const value = hasCurrencyInput ? parseFromURLParameter(parsedQs.value) : undefined
  const field = value ? parseFromURLParameter(parsedQs.field) : undefined

  return {
    inputCurrencyId,
    outputCurrencyId,
    value,
    field,
    chainId,
    outputChainId,
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
  initialField?: CurrencyField
  initialChainId: UniverseChainId
  triggerConnect: boolean
} {
  const { setIsUserSelectedToken } = useMultichainContext()
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const parsedCurrencyState = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])

  const supportedChainId = useSupportedChainId(parsedCurrencyState.chainId ?? defaultChainId) ?? UniverseChainId.Mainnet
  const supportedChainInfo = getChainInfo(supportedChainId)
  const isSupportedChainCompatible = isTestnetModeEnabled === !!supportedChainInfo.testnet

  const hasCurrencyQueryParams =
    parsedCurrencyState.inputCurrencyId || parsedCurrencyState.outputCurrencyId || parsedCurrencyState.chainId

  useEffect(() => {
    if (parsedCurrencyState.inputCurrencyId || parsedCurrencyState.outputCurrencyId) {
      setIsUserSelectedToken(true)
    }
  }, [parsedCurrencyState.inputCurrencyId, parsedCurrencyState.outputCurrencyId, setIsUserSelectedToken])

  const { initialInputCurrencyAddress, initialChainId } = useMemo(() => {
    // Default to ETH if no query params or chain is not compatible with testnet or mainnet mode
    if (!hasCurrencyQueryParams || !isSupportedChainCompatible) {
      return {
        initialInputCurrencyAddress: 'ETH',
        initialChainId: defaultChainId,
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
    parsedCurrencyState.outputCurrencyId,
    parsedCurrencyState.inputCurrencyId,
    isSupportedChainCompatible,
    supportedChainId,
    defaultChainId,
  ])

  const outputChainIsSupported = useSupportedChainId(parsedCurrencyState.outputChainId)

  const initialOutputCurrencyAddress = useMemo(
    () =>
      // clear output if identical unless there's a supported outputChainId which means we're bridging
      initialInputCurrencyAddress === parsedCurrencyState.outputCurrencyId && !outputChainIsSupported
        ? undefined
        : parsedCurrencyState.outputCurrencyId,
    [initialInputCurrencyAddress, parsedCurrencyState.outputCurrencyId, outputChainIsSupported],
  )

  const initialInputCurrency = useCurrency(initialInputCurrencyAddress, initialChainId)
  const initialOutputCurrency = useCurrency(
    initialOutputCurrencyAddress,
    parsedCurrencyState.outputChainId ?? initialChainId,
  )
  const initialTypedValue = initialInputCurrency || initialOutputCurrency ? parsedCurrencyState.value : undefined
  const initialFieldUpper =
    parsedCurrencyState.field && typeof parsedCurrencyState.field === 'string'
      ? parsedCurrencyState.field.toUpperCase()
      : undefined
  const initialField =
    initialTypedValue && initialFieldUpper && initialFieldUpper in CurrencyField
      ? CurrencyField[initialFieldUpper as keyof typeof CurrencyField]
      : undefined

  return {
    initialInputCurrency,
    initialOutputCurrency,
    initialTypedValue,
    initialField,
    initialChainId,
    triggerConnect: !!parsedQs.connect,
  }
}
