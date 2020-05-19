import { MaxUint256 } from '@ethersproject/constants'
import { Trade, WETH, TokenAmount } from '@uniswap/sdk'
import { useCallback, useMemo } from 'react'
import { ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract, useWeb3React } from './index'

// returns a boolean indicating whether approval is necessary, and a function to approve if it is
export function useApproveCallback(
  amountToApprove?: TokenAmount,
  addressToApprove?: string
): [undefined | boolean, () => Promise<void>] {
  const { account, chainId } = useWeb3React()
  const currentAllowance = useTokenAllowance(amountToApprove?.token, account, addressToApprove)

  const mustApprove = useMemo(() => {
    // we treat WETH as ETH which requires no approvals
    if (amountToApprove?.token?.equals(WETH[chainId])) return false
    // return undefined if we don't have enough data to know whether or not we need to approve
    if (!currentAllowance) return undefined
    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
  }, [amountToApprove, chainId, currentAllowance])

  const tokenContract = useTokenContract(amountToApprove?.token?.address)
  const addTransaction = useTransactionAdder()
  const approve = useCallback(async (): Promise<void> => {
    if (!mustApprove) return

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
  }, [mustApprove, tokenContract, addressToApprove, amountToApprove, addTransaction])

  return [mustApprove, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(
  trade?: Trade,
  allowedSlippage = 0
): [undefined | boolean, () => Promise<void>] {
  const amountToApprove = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT], [
    trade,
    allowedSlippage
  ])
  return useApproveCallback(amountToApprove, ROUTER_ADDRESS)
}
