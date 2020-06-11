import { parseUnits } from '@ethersproject/units'
import { ChainId, JSBI, Token, TokenAmount, Trade, WETH } from '@uniswap/sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useV1Trade } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useTokenBalancesTreatWETHAsETH } from '../wallet/hooks'
import { Field, replaceSwapState, selectToken, switchTokens, typeInput } from './actions'
import { SwapState } from './reducer'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onTokenSelection: (field: Field, address: string) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onTokenSelection = useCallback(
    (field: Field, address: string) => {
      dispatch(
        selectToken({
          field,
          address
        })
      )
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchTokens())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onTokenSelection,
    onUserInput
  }
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, token?: Token): TokenAmount | undefined {
  if (!value || !token) {
    return
  }
  try {
    const typedValueParsed = parseUnits(value, token.decimals).toString()
    if (typedValueParsed !== '0') {
      return new TokenAmount(token, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  tokens: { [field in Field]?: Token }
  tokenBalances: { [field in Field]?: TokenAmount }
  parsedAmount: TokenAmount | undefined
  bestTrade: Trade | null
  error?: string
  v1Trade: Trade | undefined
} {
  const { account } = useActiveWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { address: tokenInAddress },
    [Field.OUTPUT]: { address: tokenOutAddress }
  } = useSwapState()

  const tokenIn = useTokenByAddressAndAutomaticallyAdd(tokenInAddress)
  const tokenOut = useTokenByAddressAndAutomaticallyAdd(tokenOutAddress)

  const relevantTokenBalances = useTokenBalancesTreatWETHAsETH(account ?? undefined, [
    tokenIn ?? undefined,
    tokenOut ?? undefined
  ])

  const isExactIn: boolean = independentField === Field.INPUT
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? tokenIn : tokenOut) ?? undefined)

  const bestTradeExactIn = useTradeExactIn(isExactIn ? parsedAmount : undefined, tokenOut ?? undefined)
  const bestTradeExactOut = useTradeExactOut(tokenIn ?? undefined, !isExactIn ? parsedAmount : undefined)

  const bestTrade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const tokenBalances = {
    [Field.INPUT]: relevantTokenBalances?.[tokenIn?.address ?? ''],
    [Field.OUTPUT]: relevantTokenBalances?.[tokenOut?.address ?? '']
  }

  const tokens: { [field in Field]?: Token } = {
    [Field.INPUT]: tokenIn ?? undefined,
    [Field.OUTPUT]: tokenOut ?? undefined
  }

  // get link to trade on v1, if a better rate exists
  const v1Trade = useV1Trade(isExactIn, tokens[Field.INPUT], tokens[Field.OUTPUT], parsedAmount)

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  if (!tokens[Field.INPUT] || !tokens[Field.OUTPUT]) {
    error = error ?? 'Select a token'
  }

  // this check is incorrect, it should check against the maximum amount in
  // rather than the estimated amount in
  // const [balanceIn, amountIn] = [tokenBalances[Field.INPUT], parsedAmounts[Field.INPUT]]
  // if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
  //   error = 'Insufficient ' + amountIn.token.symbol + ' balance'
  // }

  return {
    tokens,
    tokenBalances,
    parsedAmount,
    bestTrade,
    error,
    v1Trade
  }
}

function parseCurrencyFromURLParameter(urlParam: any, chainId: number): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toLowerCase() === 'eth') return WETH[chainId as ChainId]?.address ?? ''
    if (valid === false) return WETH[chainId as ChainId]?.address ?? ''
  }

  return WETH[chainId as ChainId]?.address
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

export function queryParametersToSwapState(parsedQs: ParsedQs, chainId: ChainId): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency, chainId)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency, chainId)
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = ''
    } else {
      outputCurrency = ''
    }
  }

  return {
    [Field.INPUT]: {
      address: inputCurrency
    },
    [Field.OUTPUT]: {
      address: outputCurrency
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField)
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch() {
  const { chainId } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const parsedQs = useParsedQueryString()

  useEffect(() => {
    if (!chainId) return
    const parsed = queryParametersToSwapState(parsedQs, chainId)
    dispatch(
      replaceSwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputTokenAddress: parsed[Field.INPUT].address,
        outputTokenAddress: parsed[Field.OUTPUT].address
      })
    )
    // eslint-disable-next-line
  }, [dispatch, chainId])
}
