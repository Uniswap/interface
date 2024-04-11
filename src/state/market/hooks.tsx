import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { FEE_IMPACT_MIN } from 'constants/misc'
import { CHAIN_NATIVE_TOKEN_SYMBOL, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useBestMarketTrade } from 'hooks/useBestV3Trade'
import { SignatureData } from 'hooks/useERC20Permit'
import JSBI from 'jsbi'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useIsGaslessMode } from 'state/user/hooks'
import { SwapTransaction, V3TradeState } from 'state/validator/types'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'

import { useCurrency } from '../../hooks/Tokens'
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import useSwapSlippageTolerance from '../../hooks/useSwapSlippageTolerance'
import { Version } from '../../hooks/useToggledVersion'
import { useActiveWeb3React } from '../../hooks/web3'
import { isAddress } from '../../utils'
import { AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, replaceMarketState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { MarketState } from './reducer'

export function useMarketState(): AppState['market'] {
  return useAppSelector((state) => state.market)
}

export function useMarketActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useAppDispatch()
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

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(value?: string, currency?: T): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>,
  checksummedAddress: string
): boolean {
  const path = trade instanceof V2Trade ? trade.route.path : trade.route.tokenPath
  return (
    path.some((token) => token.address === checksummedAddress) ||
    (trade instanceof V2Trade
      ? trade.route.pairs.some((pair) => pair.liquidityToken.address === checksummedAddress)
      : false)
  )
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedMarketInfo(
  toggledVersion: Version | undefined,
  showConfirm: boolean,
  gasless: boolean,
  signatureData: SignatureData | null,
  feeImpactAccepted: boolean,
  priceImpactAccepted: boolean
): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
  v2Trade: {
    state: V3TradeState
    trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
    tx: SwapTransaction | undefined
    savings: CurrencyAmount<Token> | null
  }
  bestTrade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  allowedSlippage: Percent
  paymentToken: Token | null | undefined
  paymentFees: CurrencyAmount<Currency> | undefined
  priceImpactHigh: boolean
  feeImpactHigh: boolean
  amountToReceive: CurrencyAmount<Currency> | undefined
  inputTokenShouldBeWrapped: boolean
  quoteError: string | undefined
} {
  const { account, chainId } = useActiveWeb3React()
  const isGaslessMode =
    useIsGaslessMode() &&
    chainId !== SupportedChainId.OPTIMISM &&
    chainId !== SupportedChainId.BASE &&
    chainId !== SupportedChainId.MAINNET

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useMarketState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = useMemo(
    () => tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue]
  )

  const v2Trade = useBestMarketTrade(
    showConfirm,
    gasless,
    signatureData,
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    toggledVersion !== Version.v3 ? parsedAmount : undefined,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  )

  const bestTrade = v2Trade == undefined ? undefined : v2Trade.trade

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

  const allowedSlippage = useSwapSlippageTolerance(bestTrade ?? undefined)

  const outputAmount = useMemo(() => v2Trade?.trade?.outputAmount, [v2Trade?.trade?.outputAmount])

  const paymentFees = useMemo(() => v2Trade?.paymentFees, [v2Trade?.paymentFees])

  const outputAfterFees = useMemo(
    () =>
      paymentFees && outputAmount && paymentFees.currency.equals(outputAmount.currency)
        ? outputAmount.subtract(paymentFees)
        : outputAmount,
    [outputAmount, paymentFees]
  )

  const feeImpact = outputAmount
    ? computeFiatValuePriceImpact(outputAmount as CurrencyAmount<Token>, outputAfterFees as CurrencyAmount<Token>)
    : undefined

  const feeImpactHigh = useMemo(() => (feeImpact ? feeImpact?.greaterThan(FEE_IMPACT_MIN) : false), [feeImpact])

  const amountToReceive = useMemo(
    () => outputAfterFees?.subtract(outputAfterFees.multiply(allowedSlippage).divide(100)),
    [allowedSlippage, outputAfterFees]
  )

  const priceImpact = outputAmount
    ? computeFiatValuePriceImpact(outputAmount as CurrencyAmount<Token>, amountToReceive as CurrencyAmount<Token>)
    : undefined

  const priceImpactHigh = useMemo(() => (priceImpact ? priceImpact?.greaterThan(FEE_IMPACT_MIN) : false), [priceImpact])

  const inputTokenShouldBeWrapped =
    isGaslessMode &&
    currencies &&
    currencies[Field.INPUT]?.symbol === CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1] &&
    currencies[Field.OUTPUT] !== null &&
    currencies[Field.OUTPUT]?.symbol !== WRAPPED_NATIVE_CURRENCY[chainId ?? 1]?.symbol

  let inputError: ReactNode | undefined
  if (!account) {
    inputError = <Trans>Connect Wallet</Trans>
  }

  if (!parsedAmount) {
    inputError = inputError ?? <Trans>Enter an amount</Trans>
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? <Trans>Select a token</Trans>
  }

  if ((feeImpactHigh && !feeImpactAccepted) || (priceImpactHigh && !priceImpactAccepted)) {
    inputError = inputError ?? <Trans>Impact is too high</Trans>
  }

  if (inputTokenShouldBeWrapped && isGaslessMode) {
    inputError = inputError ?? <Trans>Wrap your native token</Trans>
  }

  if (paymentFees && outputAmount?.lessThan(paymentFees)) {
    inputError = inputError ?? <Trans>Buy amount lower than fee amount</Trans>
  }

  if (
    currencies[Field.OUTPUT] !== null &&
    v2Trade?.paymentToken?.symbol !== undefined &&
    currencies[Field.OUTPUT]?.symbol !== v2Trade?.paymentToken?.symbol &&
    currencies[Field.OUTPUT]?.wrapped.symbol !== v2Trade?.paymentToken?.symbol
  ) {
    inputError = inputError ?? <Trans>Loading ...</Trans>
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? <Trans>Enter a recipient</Trans>
  } else {
    if (
      BAD_RECIPIENT_ADDRESSES[formattedTo] ||
      (v2Trade && v2Trade.trade && involvesAddress(v2Trade.trade, formattedTo))
    ) {
      inputError = inputError ?? <Trans>Invalid recipient</Trans>
    }
  }

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], bestTrade?.maximumAmountIn(allowedSlippage)]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    v2Trade,
    bestTrade: bestTrade ?? undefined,
    allowedSlippage,
    paymentToken: v2Trade?.paymentToken,
    paymentFees: v2Trade?.paymentFees,
    priceImpactHigh,
    feeImpactHigh,
    amountToReceive,
    inputTokenShouldBeWrapped,
    quoteError: v2Trade.quoteError ?? undefined,
  }
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === 'ETH') return 'ETH'
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

export function queryParametersToSwapState(parsedQs: ParsedQs): MarketState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  if (inputCurrency === '' && outputCurrency === '') {
    // default to ETH input
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
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined }
  | undefined {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { inputCurrencyId: string | undefined; outputCurrencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs)
    const inputCurrencyId = parsed[Field.INPUT].currencyId ?? undefined
    const outputCurrencyId = parsed[Field.OUTPUT].currencyId ?? undefined

    dispatch(
      replaceMarketState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsed.recipient,
      })
    )

    setResult({ inputCurrencyId, outputCurrencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
