import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Protocol, Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair, Route as V2Route, Trade as V2Trade } from '@uniswap/v2-sdk'
import { Pool, Route as V3Route, Trade as V3Trade } from '@uniswap/v3-sdk'
import { useCallback, useMemo } from 'react'
import { getTxOptimizedSwapRouter, SwapRouterVersion } from 'utils/getTxOptimizedSwapRouter'

import { SWAP_ROUTER_ADDRESSES, V2_ROUTER_ADDRESS, V3_ROUTER_ADDRESS } from '../constants/addresses'
import { TransactionType } from '../state/transactions/actions'
import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { useTokenContract } from './useContract'
import { useTokenAllowance } from './useTokenAllowance'
import { useActiveWeb3React } from './web3'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export function useApprovalState(amountToApprove?: CurrencyAmount<Currency>, spender?: string) {
  const { account } = useActiveWeb3React()
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined

  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  return useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])
}

/** Returns approval state for all known swap routers */
export function useAllApprovalStates(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
) {
  const { chainId } = useActiveWeb3React()

  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage]
  )

  const v2ApprovalState = useApprovalState(amountToApprove, chainId ? V2_ROUTER_ADDRESS[chainId] : undefined)
  const v3ApprovalState = useApprovalState(amountToApprove, chainId ? V3_ROUTER_ADDRESS[chainId] : undefined)
  const v2V3ApprovalState = useApprovalState(amountToApprove, chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined)

  return useMemo(
    () => ({ v2: v2ApprovalState, v3: v3ApprovalState, v2V3: v2V3ApprovalState }),
    [v2ApprovalState, v2V3ApprovalState, v3ApprovalState]
  )
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { chainId } = useActiveWeb3React()
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined

  // check the current approval status
  const approvalState = useApprovalState(amountToApprove, spender)

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!chainId) {
      console.error('no chainId')
      return
    }

    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
    })

    return tokenContract
      .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response: TransactionResponse) => {
        addTransaction(response, { type: TransactionType.APPROVAL, tokenAddress: token.address, spender })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction, chainId])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(
  trade:
    | V2Trade<Currency, Currency, TradeType>
    | V3Trade<Currency, Currency, TradeType>
    | Trade<Currency, Currency, TradeType>
    | undefined,
  allowedSlippage: Percent
) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage]
  )

  const approveCallback = useApproveCallback(
    amountToApprove,
    chainId
      ? trade instanceof V2Trade
        ? V2_ROUTER_ADDRESS[chainId]
        : trade instanceof V3Trade
        ? V3_ROUTER_ADDRESS[chainId]
        : SWAP_ROUTER_ADDRESSES[chainId]
      : undefined
  )

  // TODO: remove L162-168 after testing is done. This error will help detect mistakes in the logic.
  if (
    (Trade instanceof V2Trade && approveCallback[0] !== ApprovalState.APPROVED) ||
    (trade instanceof V3Trade && approveCallback[0] !== ApprovalState.APPROVED)
  ) {
    throw new Error('Trying to approve legacy router')
  }

  return approveCallback
}

export function useApprovalOptimizedTrade(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
):
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>
  | undefined {
  const onlyV2Routes = trade?.routes.every((route) => route.protocol === Protocol.V2)
  const onlyV3Routes = trade?.routes.every((route) => route.protocol === Protocol.V3)
  const tradeHasSplits = (trade?.routes.length ?? 0) > 1

  const approvalStates = useAllApprovalStates(trade, allowedSlippage)

  const optimizedSwapRouter = useMemo(
    () => getTxOptimizedSwapRouter({ onlyV2Routes, onlyV3Routes, tradeHasSplits, approvalStates }),
    [approvalStates, tradeHasSplits, onlyV2Routes, onlyV3Routes]
  )

  return useMemo(() => {
    if (!trade) return undefined

    try {
      switch (optimizedSwapRouter) {
        case SwapRouterVersion.V2V3:
          return trade
        case SwapRouterVersion.V2:
          const pairs = trade.swaps[0].route.pools.filter((pool) => pool instanceof Pair) as Pair[]
          const v2Route = new V2Route(pairs, trade.inputAmount.currency, trade.outputAmount.currency)
          return new V2Trade(v2Route, trade.inputAmount, trade.tradeType)
        case SwapRouterVersion.V3:
          return V3Trade.createUncheckedTradeWithMultipleRoutes({
            routes: trade.swaps.map(({ route, inputAmount, outputAmount }) => ({
              route: new V3Route(
                route.pools.filter((p) => p instanceof Pool) as Pool[],
                inputAmount.currency,
                outputAmount.currency
              ),
              inputAmount,
              outputAmount,
            })),
            tradeType: trade.tradeType,
          })
        default:
          return undefined
      }
    } catch (e) {
      // TODO(#2989): remove try-catch
      console.debug(e)
      return undefined
    }
  }, [trade, optimizedSwapRouter])
}
