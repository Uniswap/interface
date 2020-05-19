import { MaxUint256 } from '@ethersproject/constants'
import { Trade, WETH, TokenAmount } from '@uniswap/sdk'
import { useCallback, useMemo } from 'react'
import { ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder, useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract, useActiveWeb3React } from './index'

export enum Approval {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: TokenAmount,
  addressToApprove?: string
): [Approval, () => Promise<void>] {
  const { account } = useActiveWeb3React()

  const currentAllowance = useTokenAllowance(amountToApprove?.token, account, addressToApprove)
  const pendingApproval = useHasPendingApproval(amountToApprove?.token?.address)

  // check the current approval status
  const approval = useMemo(() => {
    // we treat WETH as ETH which requires no approvals
    if (amountToApprove?.token?.equals(WETH[amountToApprove?.token?.chainId])) return Approval.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return Approval.UNKNOWN
    if (pendingApproval) return Approval.PENDING
    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove) ? Approval.NOT_APPROVED : Approval.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval])

  const tokenContract = useTokenContract(amountToApprove?.token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    if (approval !== Approval.NOT_APPROVED) {
      console.error('approve was called unnecessarily, this is likely an error.')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(addressToApprove, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(addressToApprove, amountToApprove.raw.toString())
    })

    return tokenContract
      .approve(addressToApprove, useExact ? amountToApprove.raw.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas)
      })
      .then(response => {
        addTransaction(response, {
          summary: 'Approve ' + amountToApprove?.token?.symbol,
          approvalOfToken: amountToApprove?.token?.address
        })
      })
      .catch(error => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approval, tokenContract, addressToApprove, amountToApprove, addTransaction])

  return [approval, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
  const amountToApprove = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT], [
    trade,
    allowedSlippage
  ])
  return useApproveCallback(amountToApprove, ROUTER_ADDRESS)
}
