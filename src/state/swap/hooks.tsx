import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useUSDPrice } from 'hooks/useUSDPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { AnyAction } from 'redux'
import { useAppDispatch } from 'state/hooks'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { useExpertModeManager, useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { computeRealizedPriceImpact, largerPercentValue, WarningSeverity, warningSeverity } from 'utils/prices'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { useCurrencyBalances } from '../connection/hooks'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'

export function useSwapActionHandlers(dispatch: React.Dispatch<AnyAction>): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken ? currency.address : currency.isNative ? 'ETH' : '',
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

interface DerivedSwapInfo {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
  trade: {
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
    state: TradeState
  }
  allowedSlippage: Percent
  swapIsUnsupported: boolean
  stablecoinValueDifference: Percent | undefined
  priceImpactTooHigh: boolean
  showPriceImpactWarning: boolean
  largerPriceImpact: Percent | undefined
  priceImpactSeverity: WarningSeverity | undefined
  swapFiatValues: { amountIn: number | undefined; amountOut: number | undefined }
  routeIsLoading: boolean
  routeIsSyncing: boolean
  fiatValueTradeInput: {
    data: number | undefined
    isLoading: boolean
  }
  fiatValueTradeOutput: {
    data: number | undefined
    isLoading: boolean
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(state: SwapState, chainId: SupportedChainId | undefined): DerivedSwapInfo {
  const { account } = useWeb3React()
  const isExpertMode = useExpertModeManager()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = state

  const inputCurrency = useCurrency(inputCurrencyId, chainId)
  const outputCurrency = useCurrency(outputCurrencyId, chainId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  )

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue]
  )

  const trade = useBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  )

  const currencyBalances = useMemo(
    () => ({
      [Field.INPUT]: relevantTokenBalances[0],
      [Field.OUTPUT]: relevantTokenBalances[1],
    }),
    [relevantTokenBalances]
  )

  const currencies: { [field in Field]?: Currency | null } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
    }),
    [inputCurrency, outputCurrency]
  )

  // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled
  const autoSlippageTolerance = useAutoSlippageTolerance(trade.trade)
  const allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance)

  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    const formattedTo = isAddress(to)
    if (!to || !formattedTo) {
      inputError = inputError ?? <Trans>Enter a recipient</Trans>
    } else {
      if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
        inputError = inputError ?? <Trans>Invalid recipient</Trans>
      }
    }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade.trade?.maximumAmountIn(allowedSlippage)]

    if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
      inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
    }

    return inputError
  }, [account, allowedSlippage, currencies, currencyBalances, parsedAmount, to, trade.trade])

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const routeIsLoading = TradeState.LOADING === trade?.state
  const routeIsSyncing = TradeState.SYNCING === trade?.state

  const fiatValueTradeInput = useUSDPrice(trade?.trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.trade?.outputAmount)

  const stablecoinValueDifference = useMemo(
    () =>
      !trade || routeIsSyncing
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    const marketPriceImpact = trade?.trade?.priceImpact ? computeRealizedPriceImpact(trade?.trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinValueDifference)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [stablecoinValueDifference, trade])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  const showPriceImpactWarning = Boolean(largerPriceImpact && priceImpactSeverity > 3)

  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput, fiatValueTradeOutput])

  return useMemo(
    () => ({
      currencies,
      currencyBalances,
      parsedAmount,
      inputError,
      trade,
      allowedSlippage,
      swapIsUnsupported,
      stablecoinValueDifference,
      priceImpactTooHigh,
      showPriceImpactWarning,
      largerPriceImpact,
      swapFiatValues,
      routeIsLoading,
      routeIsSyncing,
      fiatValueTradeInput,
      fiatValueTradeOutput,
      priceImpactSeverity,
    }),
    [
      allowedSlippage,
      currencies,
      currencyBalances,
      inputError,
      parsedAmount,
      priceImpactTooHigh,
      stablecoinValueDifference,
      swapIsUnsupported,
      trade,
      showPriceImpactWarning,
      largerPriceImpact,
      swapFiatValues,
      routeIsLoading,
      routeIsSyncing,
      fiatValueTradeInput,
      fiatValueTradeOutput,
      priceImpactSeverity,
    ]
  )
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') return 'ETH'
    if (upper in TOKEN_SHORTHANDS) return upper
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)
  const independentField = parseIndependentFieldURLParameter(parsedQs.exactField)

  if (inputCurrency === '' && outputCurrency === '' && typedValue === '' && independentField === Field.INPUT) {
    // Defaults to having the native currency selected
    inputCurrency = 'ETH'
  } else if (inputCurrency === outputCurrency) {
    // clear output if identical
    outputCurrency = ''
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency === '' ? null : inputCurrency ?? null,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency === '' ? null : outputCurrency ?? null,
    },
    typedValue,
    independentField,
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(): SwapState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedSwapState = useMemo(() => {
    return queryParametersToSwapState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return
    const inputCurrencyId = parsedSwapState[Field.INPUT].currencyId ?? undefined
    const outputCurrencyId = parsedSwapState[Field.OUTPUT].currencyId ?? undefined

    dispatch(
      replaceSwapState({
        typedValue: parsedSwapState.typedValue,
        field: parsedSwapState.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsedSwapState.recipient,
      })
    )
  }, [dispatch, chainId, parsedSwapState])

  return parsedSwapState
}
