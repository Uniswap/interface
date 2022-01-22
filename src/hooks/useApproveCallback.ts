import { TransactionResponse } from '@ethersproject/providers'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import useSwapApproval, { useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { ApprovalState, useApproval } from 'lib/hooks/useApproval'
import { useCallback } from 'react'
import invariant from 'tiny-invariant'

import { TransactionType } from '../state/transactions/actions'
import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'
export { ApprovalState } from 'lib/hooks/useApproval'

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined
  const addTransaction = useTransactionAdder()
  const [approval, approvalCallback] = useApproval(amountToApprove, spender, useHasPendingApproval)

  const approveCallback = useCallback(() => {
    return approvalCallback().then((response?: TransactionResponse) => {
      if (response) {
        invariant(token && spender)
        addTransaction(response, { type: TransactionType.APPROVAL, tokenAddress: token.address, spender })
      }
    })
  }, [approvalCallback, token, spender, addTransaction])

  return [approval, approveCallback]
}

export function useApprovalOptimizedTrade(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
) {
  return useSwapApprovalOptimizedTrade(trade, allowedSlippage, useHasPendingApproval)
}

export function useApproveCallbackFromTrade(
  trade:
    | V2Trade<Currency, Currency, TradeType>
    | V3Trade<Currency, Currency, TradeType>
    | Trade<Currency, Currency, TradeType>
    | undefined,
  allowedSlippage: Percent
) {
  return useSwapApproval(trade, allowedSlippage, useHasPendingApproval)
}
