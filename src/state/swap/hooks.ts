import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { parseUnits } from '@ethersproject/units'
import { JSBI, Token, TokenAmount, Trade, TradeType, WETH } from '@uniswap/sdk'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, ROUTER_ADDRESS } from '../../constants'
import { useTokenAllowance } from '../../data/Allowances'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import { computeSlippageAdjustedAmounts } from '../../util/prices'
import { calculateGasMargin, getRouterContract, isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useTransactionAdder } from '../transactions/hooks'
import { useTokenBalancesTreatWETHAsETH } from '../wallet/hooks'
import { Field, selectToken, setDefaultsFromURL, switchTokens, typeInput } from './actions'

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
    onSwitchTokens: onSwapTokens,
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
  error?: string
} {
  const { account } = useWeb3React()

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
    error
  }
}

// returns a function to approve the amount required to execute a trade if necessary, otherwise null
export function useApproveCallback(trade?: Trade, allowedSlippage?: number): null | (() => Promise<void>) {
  const { account, chainId } = useWeb3React()
  const currentAllowance = useTokenAllowance(trade?.inputAmount?.token, account, ROUTER_ADDRESS)
  const tokenContract = useTokenContract(trade?.inputAmount?.token?.address)
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    const slippageAdjustedAmountIn = computeSlippageAdjustedAmounts(trade, allowedSlippage)?.[Field.INPUT]

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

      return tokenContract
        .approve(ROUTER_ADDRESS, useUserBalance ? slippageAdjustedAmountIn.raw.toString() : MaxUint256, {
          gasLimit: calculateGasMargin(estimatedGas)
        })
        .then(response => {
          addTransaction(response, {
            summary: 'Approve ' + trade?.inputAmount?.token?.symbol,
            approvalOfToken: trade?.inputAmount?.token?.symbol
          })
        })
        .catch(error => {
          console.debug('Failed to approve token', error)
          throw error
        })
    }
  }, [trade, chainId, currentAllowance, addTransaction, tokenContract, allowedSlippage])
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade?: Trade, // trade to execute, required
  allowedSlippage?: number, // in bips, optional
  deadline?: number, // in seconds from now, optional
  to?: string // recipient of output, optional
): null | (() => Promise<string>) {
  const { account, chainId, library } = useWeb3React()
  const inputAllowance = useTokenAllowance(trade?.inputAmount?.token, account, ROUTER_ADDRESS)
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!trade) {
      return null
    }

    const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage ?? INITIAL_ALLOWED_SLIPPAGE)

    const recipient = to ? isAddress(to) : account

    if (!recipient) {
      return null
    }

    if (!slippageAdjustedAmounts) {
      return null
    }

    // no allowance
    if (
      inputAllowance &&
      !trade.inputAmount.token.equals(WETH[chainId]) &&
      slippageAdjustedAmounts[Field.INPUT].greaterThan(inputAllowance)
    ) {
      return null
    }

    return async function onSwap() {
      const routerContract: Contract = getRouterContract(chainId, library, account)

      const path = trade.route.path.map(t => isAddress(t.address))

      const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + (deadline ?? DEFAULT_DEADLINE_FROM_NOW)

      const swapType = getSwapType(
        { [Field.INPUT]: trade.inputAmount.token, [Field.OUTPUT]: trade.outputAmount.token },
        trade.tradeType === TradeType.EXACT_INPUT,
        chainId
      )

      let estimate, method, args, value
      switch (swapType) {
        case SwapType.EXACT_TOKENS_FOR_TOKENS:
          estimate = routerContract.estimateGas.swapExactTokensForTokens
          method = routerContract.swapExactTokensForTokens
          args = [
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            path,
            account,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.TOKENS_FOR_EXACT_TOKENS:
          estimate = routerContract.estimateGas.swapTokensForExactTokens
          method = routerContract.swapTokensForExactTokens
          args = [
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            path,
            account,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.EXACT_ETH_FOR_TOKENS:
          estimate = routerContract.estimateGas.swapExactETHForTokens
          method = routerContract.swapExactETHForTokens
          args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, account, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
          break
        case SwapType.TOKENS_FOR_EXACT_ETH:
          estimate = routerContract.estimateGas.swapTokensForExactETH
          method = routerContract.swapTokensForExactETH
          args = [
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            path,
            account,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.EXACT_TOKENS_FOR_ETH:
          estimate = routerContract.estimateGas.swapExactTokensForETH
          method = routerContract.swapExactTokensForETH
          args = [
            slippageAdjustedAmounts[Field.INPUT].raw.toString(),
            slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
            path,
            account,
            deadlineFromNow
          ]
          value = null
          break
        case SwapType.ETH_FOR_EXACT_TOKENS:
          estimate = routerContract.estimateGas.swapETHForExactTokens
          method = routerContract.swapETHForExactTokens
          args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, account, deadlineFromNow]
          value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
          break
      }

      return estimate(...args, value ? { value } : {})
        .then(estimatedGasLimit =>
          method(...args, {
            ...(value ? { value } : {}),
            gasLimit: calculateGasMargin(estimatedGasLimit)
          })
        )
        .then(response => {
          addTransaction(response, {
            summary:
              'Swap ' +
              slippageAdjustedAmounts[Field.INPUT].toSignificant(3) +
              ' ' +
              trade.inputAmount.token.symbol +
              ' for ' +
              slippageAdjustedAmounts[Field.OUTPUT].toSignificant(3) +
              ' ' +
              trade.outputAmount.token.symbol
          })
          return response.hash
        })
        .catch(error => {
          console.error(`Swap or gas estimate failed`, error)
          throw error
        })
    }
  }, [account, allowedSlippage, addTransaction, chainId, deadline, inputAllowance, library, to, trade])
}

// updates the swap state to use the defaults for a given network whenever the query
// string updates
export function useDefaultsFromURL(search?: string) {
  const { chainId } = useWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(setDefaultsFromURL({ chainId, queryString: search }))
  }, [dispatch, search, chainId])
}
