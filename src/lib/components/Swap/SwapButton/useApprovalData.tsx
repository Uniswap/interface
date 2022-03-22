import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ActionButtonProps } from 'lib/components/ActionButton'
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
import { useCallback, useMemo } from 'react'
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

  const addTransaction = useAddTransaction()
  const onApprove = useCallback(async () => {
    const transaction = await handleApproveOrPermit()
    if (transaction) {
      addTransaction({ type: TransactionType.APPROVAL, ...transaction })
    }
  }, [addTransaction, handleApproveOrPermit])

  const approvalHash = usePendingApproval(currency?.isToken ? currency : undefined, useSwapRouterAddress(trade))
  const approvalData = useMemo((): Partial<ActionButtonProps> | undefined => {
    if (!trade || !currency) return

    if (approvalState === ApproveOrPermitState.REQUIRES_APPROVAL) {
      return {
        action: {
          message: <Trans>Approve {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Approve</Trans>,
        },
      }
    } else if (approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE) {
      return {
        action: {
          message: <Trans>Allow {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Allow</Trans>,
        },
      }
    }
    if (approvalState === ApproveOrPermitState.PENDING_APPROVAL) {
      return {
        disabled: true,
        action: {
          message: (
            <EtherscanLink type={ExplorerDataType.TRANSACTION} data={approvalHash}>
              <Trans>Approval pending</Trans>
            </EtherscanLink>
          ),
          icon: Spinner,
          children: <Trans>Approve</Trans>,
        },
      }
    }
    if (approvalState === ApproveOrPermitState.PENDING_SIGNATURE) {
      return {
        disabled: true,
        action: {
          message: <Trans>Allowance pending</Trans>,
          icon: Spinner,
          children: <Trans>Allow</Trans>,
        },
      }
    }
    return
  }, [approvalHash, approvalState, currency, onApprove, trade])

  return { approvalData, signatureData: signatureData ?? undefined }
}
