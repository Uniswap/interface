import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Action } from 'lib/components/ActionButton'
import EtherscanLink from 'lib/components/EtherscanLink'
import {
  ApproveOrPermitState,
  useApproveOrPermit,
  useSwapApprovalOptimizedTrade,
  useSwapRouterAddress,
} from 'lib/hooks/swap/useSwapApproval'
import { useAddTransaction, usePendingApproval } from 'lib/hooks/transactions'
import { Slippage } from 'lib/hooks/useSlippage'
import { Spinner } from 'lib/icons'
import { TransactionType } from 'lib/state/transactions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExplorerDataType } from 'utils/getExplorerLink'

export function useIsPendingApproval(token?: Token, spender?: string): boolean {
  return Boolean(usePendingApproval(token, spender))
}

export default function useApprovalData(
  trade: ReturnType<typeof useSwapApprovalOptimizedTrade>,
  slippage: Slippage,
  currencyAmount?: CurrencyAmount<Currency>
) {
  const currency = currencyAmount?.currency
  const { approvalState, signatureData, handleApproveOrPermit } = useApproveOrPermit(
    trade,
    slippage.allowed,
    useIsPendingApproval,
    currencyAmount
  )

  const [isPending, setIsPending] = useState(false)
  const addTransaction = useAddTransaction()
  const onApprove = useCallback(async () => {
    setIsPending(true)
    const transaction = await handleApproveOrPermit()
    if (transaction) {
      addTransaction({ type: TransactionType.APPROVAL, ...transaction })
    }
    setIsPending(false)
  }, [addTransaction, handleApproveOrPermit])
  // Reset the pending state if currency changes.
  useEffect(() => setIsPending(false), [currency])

  const approvalHash = usePendingApproval(currency?.isToken ? currency : undefined, useSwapRouterAddress(trade))
  const approvalAction = useMemo((): Action | undefined => {
    if (!trade || !currency) return

    switch (approvalState) {
      case ApproveOrPermitState.REQUIRES_APPROVAL:
        if (isPending) {
          return { message: <Trans>Approve in your wallet</Trans>, icon: Spinner }
        }
        return {
          message: <Trans>Approve {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Approve</Trans>,
        }
      case ApproveOrPermitState.REQUIRES_SIGNATURE:
        if (isPending) {
          return { message: <Trans>Allow in your wallet</Trans>, icon: Spinner }
        }
        return {
          message: <Trans>Allow {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Allow</Trans>,
        }
      case ApproveOrPermitState.PENDING_APPROVAL:
        return {
          message: (
            <EtherscanLink type={ExplorerDataType.TRANSACTION} data={approvalHash}>
              <Trans>Approval pending</Trans>
            </EtherscanLink>
          ),
          icon: Spinner,
        }
      case ApproveOrPermitState.PENDING_SIGNATURE:
        return { message: <Trans>Allowance pending</Trans>, icon: Spinner }
      case ApproveOrPermitState.APPROVED:
        return
    }
  }, [approvalHash, approvalState, currency, isPending, onApprove, trade])

  return { approvalAction, signatureData: signatureData ?? undefined }
}
