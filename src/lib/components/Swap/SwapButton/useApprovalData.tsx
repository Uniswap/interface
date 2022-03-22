import { Token } from '@uniswap/sdk-core'
import { useSwapCurrencyAmount } from 'lib/hooks/swap'
import { useApproveOrPermit, useSwapApprovalOptimizedTrade, useSwapRouterAddress } from 'lib/hooks/swap/useSwapApproval'
import { useAddTransaction, usePendingApproval } from 'lib/hooks/transactions'
import { Slippage } from 'lib/hooks/useSlippage'
import { Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useCallback } from 'react'

export function useIsPendingApproval(token?: Token, spender?: string): boolean {
  return Boolean(usePendingApproval(token, spender))
}

export default function useApprovalData(trade: ReturnType<typeof useSwapApprovalOptimizedTrade>, slippage: Slippage) {
  const currencyAmount = useSwapCurrencyAmount(Field.INPUT)
  const currency = currencyAmount?.currency
  const { approvalState, signatureData, handleApproveOrPermit } = useApproveOrPermit(
    trade,
    slippage.allowed,
    useIsPendingApproval,
    currencyAmount
  )

  const addTransaction = useAddTransaction()
  const onApprove = useCallback(async () => {
    const transaction = await handleApproveOrPermit()
    if (transaction) {
      addTransaction({ type: TransactionType.APPROVAL, ...transaction })
    }
  }, [addTransaction, handleApproveOrPermit])

  const approvalHash = usePendingApproval(currency?.isToken ? currency : undefined, useSwapRouterAddress(trade))

  return { approvalState, signatureData, onApprove, approvalHash }
}
