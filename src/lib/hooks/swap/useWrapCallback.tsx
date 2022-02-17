import { useWETHContract } from 'hooks/useContract'
import { useCallback } from 'react'

import useActiveWeb3React from '../useActiveWeb3React'
import useSwapInfo from './useSwapInfo'
import { WrapType } from './useSwapInfo'

export default function useWrapCallback() {
  const { chainId } = useActiveWeb3React()
  const wethContract = useWETHContract()
  const { wrapType } = useSwapInfo()
  return useCallback(() => {
    if (!wethContract) return undefined
    if (!sufficientBalance || !parsedAmountIn) {
      return undefined
    }
    if (wrapType === WrapType.WRAP) {
      return async () => {
        try {
          const txReceipt = await wethContract.deposit({ value: `0x${parsedAmountIn.quotient.toString(16)}` })
          // addTransaction(txReceipt, {
          //   type: TransactionType.WRAP,
          //   unwrapped: false,
          //   currencyAmountRaw: parsedAmountIn?.quotient.toString(),
          //   chainId,
          // })
        } catch (error) {
          console.error('Could not deposit', error)
        }
      }
    } else if (wrapType === WrapType.UNWRAP) {
      return async () => {
        try {
          const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`)
          // addTransaction(txReceipt, {
          //   type: TransactionType.WRAP,
          //   unwrapped: true,
          //   currencyAmountRaw: inputAmount?.quotient.toString(),
          //   chainId,
          // })
        } catch (error) {
          console.error('Could not withdraw', error)
        }
      }
    }
    return undefined
  }, [])
}
