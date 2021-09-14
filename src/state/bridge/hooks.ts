import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount, JSBI, Token, TokenAmount } from '@bridger/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { replaceBridgeState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { currencyId } from '../../utils/currencyId'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useBridgeActionHandlers(): {
  onCurrencySelection: (currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onCurrencySelection = useCallback(
    (currency: Currency) => {
      dispatch(
        selectCurrency({
          currencyId: currencyId(currency)
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ typedValue }))
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
    onChangeRecipient
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: Currency, chainId?: number): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      if (currency instanceof Token) return new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
      else if (chainId) return CurrencyAmount.nativeCurrency(JSBI.BigInt(typedValueParsed), chainId)
      else return undefined
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

// from the current bridge inputs, compute the best trade and return it.
export function useDerivedBridgeInfo(
): {
  bridgeCurrency: Currency 
  currencyBalance: CurrencyAmount 
  parsedAmount: CurrencyAmount | undefined
  inputError?: string
} {
  const { account, chainId } = useActiveWeb3React()
  const {
    typedValue,
    currencyId: bridgeCurrencyId,
  } = useBridgeState()

  const bridgeCurrency = useCurrency(bridgeCurrencyId)

  const parsedAmount = tryParseAmount(typedValue, bridgeCurrency ?? undefined, chainId)

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    bridgeCurrency ?? undefined
  ])
  const currencyBalance = relevantTokenBalances[0]

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount'
  }

  if (!bridgeCurrency) {
    inputError = inputError ?? 'Select a token'
  }

  if (currencyBalance && parsedAmount && currencyBalance.lessThan(parsedAmount)) {
    inputError = 'Insufficient ' + parsedAmount.currency.symbol + ' balance'
  }

  return {
    bridgeCurrency,
    currencyBalance,
    parsedAmount,
    inputError
  }
}

function parseCurrencyFromURLParameter(urlParam: any, nativeCurrencyId: string): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toUpperCase() === nativeCurrencyId) return nativeCurrencyId
    if (valid === false) return nativeCurrencyId
  }
  return nativeCurrencyId ?? ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
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

export function queryParametersToBridgeState(
  parsedQs: ParsedQs,
  nativeCurrencyId: string
): {
  typedValue: string
  currencyId: string | undefined
  recipient: string | null
} {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency, nativeCurrencyId)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency, nativeCurrencyId)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    currencyId: inputCurrency,
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    recipient
  }
}

// updates the bridge state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | { currencyId: string | undefined}
  | undefined {
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()
  const [result, setResult] = useState<
    { currencyId: string | undefined } | undefined
  >()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToBridgeState(parsedQs, currencyId(nativeCurrency))

    dispatch(
      replaceBridgeState({
        typedValue: parsed.typedValue,
        currencyId: parsed.currencyId,
        recipient: parsed.recipient
      })
    )

    setResult({ currencyId: parsed.currencyId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return result
}
