import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Ether, NativeCurrency, Percent, Price, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { KROM } from 'constants/tokens'
import { useBestV3Trade } from 'hooks/useBestV3Trade'
import useParsedQueryString from 'hooks/useParsedQueryString'
import JSBI from 'jsbi'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { V3TradeState } from 'state/routing/types'
import { useUserGasPrice } from 'state/user/hooks'

import { useCurrency } from '../../hooks/Tokens'
import { useLimitOrderManager } from '../../hooks/useContract'
import useENS from '../../hooks/useENS'
import { useActiveWeb3React } from '../../hooks/web3'
import { isAddress } from '../../utils'
import { AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, Rate, replaceSwapState, selectCurrency, setRecipient, switchCurrencies } from './actions'
import { typeInput } from './actions'
import { SwapState } from './reducer'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSwapActionHandlers(): {
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

export function applyExchangeRateTo(
  inputValue: string,
  exchangeRate: string,
  inputCurrency: Currency,
  outputCurrency: Currency,
  isInverted: boolean
): CurrencyAmount<NativeCurrency | Token> | undefined {
  const parsedInputAmount = tryParseAmount(inputValue, isInverted ? outputCurrency : inputCurrency)
  const parsedExchangeRate = tryParseAmount(exchangeRate, isInverted ? inputCurrency : outputCurrency)

  if (isInverted) {
    return parsedExchangeRate && parsedInputAmount
      ? parsedInputAmount
          ?.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(inputCurrency.decimals)))
          ?.divide(parsedExchangeRate.asFraction)
      : undefined
  } else {
    return parsedExchangeRate && parsedInputAmount
      ? parsedInputAmount
          ?.multiply(parsedExchangeRate.asFraction)
          .divide(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(outputCurrency.decimals)))
      : undefined
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency | null }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  price: Price<Currency, Currency> | undefined
  inputError?: ReactNode
  v3Trade: {
    trade: V3Trade<Currency, Currency, TradeType> | null
    state: V3TradeState
  }
  parsedAmounts: {
    input: CurrencyAmount<Currency> | undefined
    output: CurrencyAmount<Currency> | undefined
  }
  formattedAmounts: {
    input: string
    output: string
    price: string
  }
  rawAmounts: {
    input: string | undefined
    output: string | undefined
  }
  bestTrade: V3Trade<Currency, Currency, TradeType> | undefined
  serviceFee: CurrencyAmount<Currency> | undefined
} {
  const { account, chainId } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    inputValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ])

  const isExactIn: boolean = independentField === Field.INPUT
  const isDesiredRateUpdate = independentField === Field.PRICE
  const desiredRateAppliedAsCurrencyAmount =
    isDesiredRateUpdate && inputValue && inputCurrency && outputCurrency
      ? applyExchangeRateTo(inputValue, typedValue, inputCurrency, outputCurrency, false)
      : undefined

  const desiredRateApplied =
    isDesiredRateUpdate && inputValue && inputCurrency && outputCurrency && desiredRateAppliedAsCurrencyAmount
      ? desiredRateAppliedAsCurrencyAmount?.toSignificant(6)
      : typedValue

  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const parsedAmountToUse = isDesiredRateUpdate
    ? tryParseAmount(desiredRateApplied, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)
    : tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const gasAmount = useUserGasPrice()

  // get quotes
  const v3Trade = useBestV3Trade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    isExactIn ? parsedAmount : parsedAmountToUse,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  )

  const bestTrade = v3Trade.trade

  const inputAmount = useMemo(() => {
    return tryParseAmount(inputValue, inputCurrency ?? undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, inputCurrencyId])

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  }

  const currencies: { [field in Field]?: Currency | null } = {
    [Field.INPUT]: inputCurrency,
    [Field.OUTPUT]: outputCurrency,
  }

  const marketPrice = useMemo(() => {
    const priceTmp =
      isDesiredRateUpdate && inputCurrency
        ? new Price({
            baseAmount: tryParseAmount('1', inputCurrency) as CurrencyAmount<Currency>,
            quoteAmount: parsedAmount as CurrencyAmount<Currency>,
          })
        : bestTrade?.route.midPrice

    if (priceTmp?.baseCurrency != inputCurrency) {
      return priceTmp?.invert()
    }
    return priceTmp
  }, [bestTrade, parsedAmount, inputCurrency, isDesiredRateUpdate])

  const parsedAmounts = useMemo(
    () => ({
      input: independentField === Field.INPUT ? parsedAmount : inputAmount,
      output:
        independentField === Field.OUTPUT ? parsedAmount : inputAmount ? marketPrice?.quote(inputAmount) : undefined,
    }),
    [independentField, parsedAmount, inputAmount, marketPrice]
  )

  if (!parsedAmounts.output && desiredRateAppliedAsCurrencyAmount) {
    parsedAmounts.output = desiredRateAppliedAsCurrencyAmount
  }

  let inputError: ReactNode | undefined
  if (!account) {
    inputError = <Trans>Connect Wallet</Trans>
  }

  if (!parsedAmounts.input || !parsedAmounts.output) {
    inputError = inputError ?? <Trans>Enter an amount</Trans>
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? <Trans>Select a token</Trans>
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? <Trans>Enter a recipient</Trans>
  } else {
    if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
      inputError = inputError ?? <Trans>Invalid recipient</Trans>
    }
  }

  const limitOrderManager = useLimitOrderManager()

  const { result: estimatedServiceFeeResult } = useSingleCallResult(limitOrderManager, 'estimateServiceFeeWei', [
    gasAmount?.quotient.toString() ?? undefined,
  ])

  const { result: estimatedKROMServiceFeeResult } = useSingleCallResult(limitOrderManager, 'quoteKROM', [
    estimatedServiceFeeResult?.[0] ?? undefined,
  ])

  const serviceFee = useMemo(() => {
    if (!chainId || !estimatedKROMServiceFeeResult) return undefined

    return CurrencyAmount.fromRawAmount(KROM[chainId], estimatedKROMServiceFeeResult?.[0])
  }, [chainId, estimatedKROMServiceFeeResult])

  const price = useMemo(() => {
    if (!parsedAmounts.input || !parsedAmounts.output) return undefined

    return new Price({
      baseAmount: parsedAmounts.input,
      quoteAmount: parsedAmounts.output,
    })
  }, [parsedAmounts.input, parsedAmounts.output])

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], inputAmount]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
  }

  const formattedAmounts = {
    input: inputValue ?? '',
    output: independentField === Field.OUTPUT ? typedValue : parsedAmounts.output?.toSignificant(6) ?? '',
    price: independentField === Field.PRICE ? typedValue : price?.toSignificant(6) ?? '',
  }

  const rawAmounts = useMemo(
    () => ({
      input: inputCurrency
        ? parsedAmounts.input
            ?.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(inputCurrency.decimals)))
            .toFixed(0)
        : undefined,

      output: outputCurrency
        ? parsedAmounts.output
            ?.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(outputCurrency.decimals)))
            .toFixed(0)
        : undefined,
    }),
    [inputCurrency, outputCurrency, parsedAmounts]
  )

  return {
    currencies,
    currencyBalances,
    price,
    inputError,
    v3Trade,
    bestTrade: bestTrade ?? undefined,
    serviceFee,
    parsedAmounts,
    formattedAmounts,
    rawAmounts,
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

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
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
    [Field.PRICE]: {
      currencyId: outputCurrency === '' ? null : outputCurrency ?? null,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    inputValue: parseTokenAmountURLParameter(parsedQs.inputAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
    recipient,
    fixedField: Field.INPUT,
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
      replaceSwapState({
        typedValue: parsed.typedValue,
        inputValue: parsed.inputValue,
        field: parsed.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsed.recipient,
        fixedField: parsed.fixedField,
      })
    )

    setResult({ inputCurrencyId, outputCurrencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
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
