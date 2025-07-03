import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ApprovalState, useApproval } from 'lib/hooks/useApproval'
import { useCallback } from 'react'
import { useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export { ApprovalState } from 'lib/hooks/useApproval'

function useGetAndTrackApproval(getApproval: ReturnType<typeof useApproval>[1]) {
  const addTransaction = useTransactionAdder()

  return useCallback(() => {
    return getApproval().then((pending) => {
      if (pending) {
        const { response, tokenAddress, spenderAddress: spender, amount } = pending
        addTransaction(response, {
          type: TransactionType.Approve,
          tokenAddress,
          spender,
          approvalAmount: amount.quotient.toString(),
        })
      }
    })
  }, [addTransaction, getApproval])
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string,
): [ApprovalState, () => Promise<void>] {
  const [approval, getApproval] = useApproval({
    amountToApprove,
    spender,
    useIsPendingApproval: useHasPendingApproval,
  })
  return [approval, useGetAndTrackApproval(getApproval)]
}
