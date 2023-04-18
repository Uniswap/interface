import { Currency, CurrencyAmount , Token} from '@uniswap/sdk-core'
import { ApprovalState, useApproval, useFaucet } from 'lib/hooks/useApproval'
import { useCallback } from 'react'

import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
export { ApprovalState } from 'lib/hooks/useApproval'

function useGetAndTrackApproval(getApproval: ReturnType<typeof useApproval>[1]) {
  const addTransaction = useTransactionAdder()
  return useCallback(() => {
    return getApproval().then((pending) => {
      if (pending) {
        const { response, tokenAddress, spenderAddress: spender } = pending
        addTransaction(response, { type: TransactionType.APPROVAL, tokenAddress, spender })
      }
    })
  }, [addTransaction, getApproval])
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const [approval, getApproval] = useApproval(amountToApprove, spender, useHasPendingApproval)
  return [approval, useGetAndTrackApproval(getApproval)]
}

export function useFaucetCallback(
  token?: Token,
  spender?: string
  ):()=>Promise<void>{
  // console.log('tokenhere', token,spender)
  const useFaucet_ = useFaucet(token, spender)
  const addTransaction = useTransactionAdder()

  return useCallback(() => {
    return useFaucet_().then((pending) => {
      if (pending) {
        const { response, tokenAddress, spenderAddress: spender } = pending
        addTransaction(response, { type: TransactionType.APPROVAL, tokenAddress, spender })
      }
    })
  }, [addTransaction, useFaucet_])


  // return useFaucet_; 

  
}