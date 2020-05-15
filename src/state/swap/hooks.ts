import { MaxUint256 } from '@ethersproject/constants'
import { parseUnits } from '@ethersproject/units'
import { TokenAmount, Trade, Token, JSBI, WETH } from '@uniswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ROUTER_ADDRESS } from '../../constants'
import { useTokenAllowance } from '../../data/Allowances'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import { computeSlippageAdjustedAmounts } from '../../util/prices'
import { calculateGasMargin } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useTransactionAdder } from '../transactions/hooks'
import { useTokenBalancesTreatWETHAsETH, useTokenBalanceTreatingWETHasETH } from '../wallet/hooks'
import { Field, selectToken, setDefaultsFromURL, switchTokens, typeInput } from './actions'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onTokenSelection: (field: Field, address: string) => void
  onSwapTokens: () => void
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

  const onSwapTokens = useCallback(() => {
    dispatch(switchTokens())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onSwapTokens,
    onTokenSelection,
    onUserInput
  }
}

// try to parse a user entered amount for a given token
function tryParseAmount(value?: string, token?: Token): TokenAmount | undefined {
  if (!value || !token) return
  try {
    const typedValueParsed = parseUnits(value, token.decimals).toString()
    if (typedValueParsed !== '0') return new TokenAmount(token, JSBI.BigInt(typedValueParsed))
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
}

export enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS
}

function getSwapType(tokens: { [field in Field]?: Token }, isExactIn: boolean, chainId: number): SwapType {
  if (isExactIn) {
    if (tokens[Field.INPUT]?.equals(WETH[chainId])) {
      return SwapType.EXACT_ETH_FOR_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId])) {
      return SwapType.EXACT_TOKENS_FOR_ETH
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS
    }
  } else {
    if (tokens[Field.INPUT]?.equals(WETH[chainId])) {
      return SwapType.ETH_FOR_EXACT_TOKENS
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId])) {
      return SwapType.TOKENS_FOR_EXACT_ETH
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS
    }
  }
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  tokens: { [field in Field]?: Token }
  tokenBalances: { [field in Field]?: TokenAmount }
  parsedAmounts: { [field in Field]?: TokenAmount }
  bestTrade?: Trade
  swapType: SwapType
  error?: string
} {
  const { account, chainId } = useWeb3React()

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { address: tokenInAddress },
    [Field.OUTPUT]: { address: tokenOutAddress }
  } = useSwapState()

  const tokenIn = useTokenByAddressAndAutomaticallyAdd(tokenInAddress)
  const tokenOut = useTokenByAddressAndAutomaticallyAdd(tokenOutAddress)

  const relevantTokenBalances = useTokenBalancesTreatWETHAsETH(account, [tokenIn, tokenOut])

  const isExactIn: boolean = independentField === Field.INPUT
  const amount = tryParseAmount(typedValue, isExactIn ? tokenIn : tokenOut)

  const bestTradeExactIn = useTradeExactIn(isExactIn ? amount : null, tokenOut)
  const bestTradeExactOut = useTradeExactOut(tokenIn, !isExactIn ? amount : null)

  const bestTrade = isExactIn ? bestTradeExactIn : bestTradeExactOut

  const parsedAmounts = {
    [Field.INPUT]: isExactIn ? amount : bestTrade?.inputAmount,
    [Field.OUTPUT]: isExactIn ? bestTrade?.outputAmount : amount
  }

  const tokenBalances = {
    [Field.INPUT]: relevantTokenBalances?.[tokenIn?.address],
    [Field.OUTPUT]: relevantTokenBalances?.[tokenOut?.address]
  }

  const tokens = {
    [Field.INPUT]: tokenIn,
    [Field.OUTPUT]: tokenOut
  }

  let error: string | undefined
  if (!account) {
    error = error ?? 'Connect Wallet'
  }

  if (!parsedAmounts[Field.INPUT]) {
    error = error ?? 'Enter an amount'
  }

  if (!parsedAmounts[Field.OUTPUT]) {
    error = error ?? 'Enter an amount'
  }

  if (
    tokenBalances[Field.INPUT] &&
    parsedAmounts[Field.INPUT] &&
    tokenBalances[Field.INPUT].lessThan(parsedAmounts[Field.INPUT])
  ) {
    error = 'Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance'
  }

  return {
    tokens,
    tokenBalances,
    parsedAmounts,
    bestTrade,
    error,
    swapType: getSwapType({ [Field.INPUT]: tokenIn, [Field.OUTPUT]: tokenOut }, isExactIn, chainId)
  }
}

// returns a function to approve the amount required to execute a trade if necessary, otherwise null
export function useApproveCallback(trade?: Trade, allowedSlippage?: number): null | (() => Promise<void>) {
  const { account, chainId } = useWeb3React()
  const currentAllowance = useTokenAllowance(trade?.inputAmount?.token, account, ROUTER_ADDRESS)
  const slippageAdjustedAmountIn = computeSlippageAdjustedAmounts(trade, allowedSlippage)?.[Field.INPUT]
  const tokenContract = useTokenContract(trade?.inputAmount?.token?.address)
  const addTransaction = useTransactionAdder()
  return useMemo(() => {
    if (!slippageAdjustedAmountIn) {
      return null
    }

    // we treat WETH as ETH which requires no approvals
    if (trade?.inputAmount?.token?.equals(WETH[chainId])) {
      return null
    }

    // gte
    if (!currentAllowance?.lessThan(slippageAdjustedAmountIn) ?? false) {
      return null
    }

    return async function approveAmount(): Promise<void> {
      let useUserBalance = false

      const estimatedGas = await tokenContract.estimateGas.approve(ROUTER_ADDRESS, MaxUint256).catch(() => {
        // general fallback for tokens who restrict approval amounts
        useUserBalance = true
        return tokenContract.estimateGas.approve(ROUTER_ADDRESS, slippageAdjustedAmountIn.raw.toString())
      })

      tokenContract
        .approve(ROUTER_ADDRESS, useUserBalance ? slippageAdjustedAmountIn.raw.toString() : MaxUint256, {
          gasLimit: calculateGasMargin(estimatedGas)
        })
        .then(response => {
          addTransaction(response, {
            summary: 'Approve ' + trade?.inputAmount?.token?.symbol,
            approvalOfToken: trade?.inputAmount?.token?.symbol
          })
        })
    }
  }, [trade, account, chainId, currentAllowance, slippageAdjustedAmountIn, addTransaction])
}

// returns a function
// export function useDoSwap(allowedSlippage: number): null | (() => Promise<void>) {}

// updates the swap state to use the defaults for a given network whenever the query
// string updates
export function useDefaultsFromURL(search?: string) {
  const { chainId } = useWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(setDefaultsFromURL({ chainId, queryString: search }))
  }, [dispatch, search, chainId])
}
