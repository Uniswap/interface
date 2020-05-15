import { MaxUint256 } from '@ethersproject/constants'
import { Trade, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../util/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract, useWeb3React } from './index'

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
