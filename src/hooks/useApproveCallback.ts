import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SwapTransaction } from 'state/validator/types'

import { LIMIT_ORDER_MANAGER_ADDRESSES } from '../constants/addresses'
import { TransactionType } from '../state/transactions/actions'
import { useHasPendingApproval, useIsTransactionConfirmed, useTransactionAdder } from '../state/transactions/hooks'
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

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const [approvalTxHash, setApprovalTxHash] = useState<string | undefined>()

  const { account, chainId } = useActiveWeb3React()
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined
  const hasPendingApproval = useHasPendingApproval(token?.address, spender)
  const isApprovalConfirmed = useIsTransactionConfirmed(approvalTxHash)
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)

  useEffect(() => {
    setApprovalTxHash(undefined)
  }, [amountToApprove?.currency.symbol])

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    // we might not have enough data to know whether or not we need to approve
    if (amountToApprove && amountToApprove.currency.isNative) return ApprovalState.APPROVED
    if (!amountToApprove || !spender || !token || !currentAllowance) return ApprovalState.UNKNOWN

    // The currentAllowance can lag behind sometimes when it changes,
    // so when we need a faster response, we use the receipt logs to check for the amount that has been validated by the user
    if (
      !currentAllowance.lessThan(amountToApprove) ||
      (isApprovalConfirmed.confirmed === true &&
        isApprovalConfirmed.logs &&
        !CurrencyAmount.fromRawAmount(token, Number(isApprovalConfirmed.logs[0].data as string)).lessThan(
          amountToApprove
        ))
    ) {
      return ApprovalState.APPROVED
    }
    // amountToApprove will be defined if currentAllowance is
    return hasPendingApproval ? ApprovalState.PENDING : ApprovalState.NOT_APPROVED
  }, [amountToApprove, currentAllowance, isApprovalConfirmed, hasPendingApproval, spender])
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

    const estimatedGas = await tokenContract.estimateGas
      .approve(spender, amountToApprove.quotient.toString())
      .catch(() => {
        // general fallback for tokens who restrict approval amounts
        return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
      })
    return tokenContract
      .approve(spender, amountToApprove.quotient.toString(), {
        gasLimit: calculateGasMargin(chainId, estimatedGas),
      })
      .then((response: TransactionResponse) => {
        setApprovalTxHash(response.hash)
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
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent | undefined,
  swapTransaction: SwapTransaction | undefined
) {
  const { chainId } = useActiveWeb3React()
  const v3SwapRouterAddress = chainId ? LIMIT_ORDER_MANAGER_ADDRESSES[chainId] : undefined
  const amountToApprove = useMemo(
    () => (trade ? (allowedSlippage ? trade.maximumAmountIn(allowedSlippage) : trade.inputAmount) : undefined),
    [allowedSlippage, trade]
  )

  return useApproveCallback(
    amountToApprove,
    chainId
      ? swapTransaction
        ? swapTransaction.allowanceTarget
        : trade instanceof V3Trade
        ? v3SwapRouterAddress
        : undefined
      : undefined
  )
}
