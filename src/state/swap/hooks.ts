import { parseUnits } from '@ethersproject/units'
import { ChainId, JSBI, Token, TokenAmount, Trade, WETH, Pair, Fees } from 'dxswap-sdk'
import { ParsedQs } from 'qs'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useTokenBalancesTreatWETHAsETH } from '../wallet/hooks'
import { Field, replaceSwapState, selectToken, switchTokens, typeInput, setSwapFees, setProtocolFee } from './actions'
import { SwapState } from './reducer'
import { useUserSlippageTolerance } from '../user/hooks'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'
import { useAsync } from 'react-use';
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'

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
} {
  const { chainId, account, library } = useActiveWeb3React()
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { address: tokenInAddress },
    [Field.OUTPUT]: { address: tokenOutAddress },
    protocolFeeTo
  } = useSwapState()

  const tokenIn = useToken(tokenInAddress)
  const tokenOut = useToken(tokenOutAddress)
  
  // get token pair data with swapFee and protocolFeeDenominator
  const dispatch = useDispatch<AppDispatch>()
  const swapFeesPromise = useAsync(async () => {
      return await Fees.fetchAllSwapFees(chainId, {}, getDefaultProvider(getNetwork(chainId), { quorum: 1}))
  }, []);
  const protocolFeePromise = useAsync(async () => {
    if (!protocolFeeTo) {
      return await Fees.fetchProtocolFee(chainId, getDefaultProvider(getNetwork(chainId), { quorum: 1 }))
    } else {
      return null
    }
  }, []);
  useEffect(() => {
    if (swapFeesPromise && !swapFeesPromise.loading && !swapFeesPromise.error && swapFeesPromise.value)
      dispatch(setSwapFees({ swapFees: swapFeesPromise.value }))
    if (protocolFeePromise && !protocolFeePromise.loading && !protocolFeePromise.error && protocolFeePromise.value)
      dispatch(setProtocolFee({
        protocolFeeDenominator: Number(protocolFeePromise.value.feeDenominator),
        protocolFeeTo: protocolFeePromise.value.feeReceiver,
      }))
  }, [swapFeesPromise, protocolFeePromise])

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

  const [allowedSlippage] = useUserSlippageTolerance()

  const slippageAdjustedAmounts =
    bestTrade && allowedSlippage && computeSlippageAdjustedAmounts(bestTrade, allowedSlippage)

  // compare input balance to MAx input based on version
  const [balanceIn, amountIn] = [
    tokenBalances[Field.INPUT],
    slippageAdjustedAmounts
      ? slippageAdjustedAmounts[Field.INPUT]
      : null
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    error = 'Insufficient ' + amountIn.token.symbol + ' balance'
  }

  return {
    tokens,
    tokenBalances,
    parsedAmount,
    bestTrade,
    error,
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

export function queryParametersToSwapState(parsedQs: ParsedQs, chainId: ChainId): {
  independentField: Field,
  typedValue: string,
  [Field.INPUT]: {
    address: string | undefined
  },
  [Field.OUTPUT]: {
    address: string | undefined
  }
} {
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
        outputTokenAddress: parsed[Field.OUTPUT].address,
        swapFees: {}
      })
    )
    // eslint-disable-next-line
  }, [dispatch, chainId])
}
