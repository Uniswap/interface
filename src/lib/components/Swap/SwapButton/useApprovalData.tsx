import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { SignatureData } from 'hooks/useERC20Permit'
import { useSwapCurrencyAmount } from 'lib/hooks/swap'
import {
  ApproveOrPermitState,
  useApproveOrPermit,
  useSwapApprovalOptimizedTrade,
  useSwapRouterAddress,
} from 'lib/hooks/swap/useSwapApproval'
import { useAddTransaction, usePendingApproval } from 'lib/hooks/transactions'
import { Slippage } from 'lib/hooks/useSlippage'
import { Spinner } from 'lib/icons'
import { Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useCallback, useMemo } from 'react'
import invariant from 'tiny-invariant'
import { ExplorerDataType } from 'utils/getExplorerLink'

import { ActionButtonProps } from '../../ActionButton'
import EtherscanLink from '../../EtherscanLink'

export function useIsPendingApproval(token?: Token, spender?: string): boolean {
  return Boolean(usePendingApproval(token, spender))
}

export default function useApprovalData(
  trade: ReturnType<typeof useSwapApprovalOptimizedTrade>,
  slippage: Slippage
): { approvalData?: Partial<ActionButtonProps>; signatureData?: SignatureData } {
  // Compute approvals using the input amount (instead of the trade amount) for responsiveness.
  const approvalCurrencyAmount = useSwapCurrencyAmount(Field.INPUT) || trade?.inputAmount
  const { approvalState, signatureData, handleApproveOrPermit } = useApproveOrPermit(
    trade,
    slippage.allowed,
    useIsPendingApproval,
    approvalCurrencyAmount
  )
  const approvalHash = usePendingApproval(
    approvalCurrencyAmount?.currency.isToken ? approvalCurrencyAmount.currency : undefined,
    useSwapRouterAddress(trade)
  )

  const addTransaction = useAddTransaction()
  const onApprove = useCallback(async () => {
    const transaction = await handleApproveOrPermit()
    if (transaction) {
      addTransaction({ type: TransactionType.APPROVAL, ...transaction })
    }
  }, [addTransaction, handleApproveOrPermit])

  const approvalData = useMemo(() => {
    if (approvalState === ApproveOrPermitState.REQUIRES_APPROVAL) {
      const currency = approvalCurrencyAmount?.currency
      invariant(currency)
      return {
        action: {
          message: <Trans>Allow {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Approve</Trans>,
        },
      }
    } else if (approvalState === ApproveOrPermitState.REQUIRES_SIGNATURE) {
      const currency = approvalCurrencyAmount?.currency
      invariant(currency)
      return {
        action: {
          message: <Trans>Allow {currency.symbol} first</Trans>,
          onClick: onApprove,
          children: <Trans>Allow</Trans>,
        },
      }
    } else if (approvalState === ApproveOrPermitState.PENDING_APPROVAL) {
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
    } else if (approvalState === ApproveOrPermitState.PENDING_SIGNATURE) {
      return {
        disabled: true,
        action: {
          message: <Trans>Allowance pending</Trans>,
          icon: Spinner,
          children: <Trans>Allow</Trans>,
        },
      }
    } else {
      return undefined
    }
  }, [approvalCurrencyAmount?.currency, approvalHash, approvalState, onApprove])

  return useMemo(() => ({ approvalData, signatureData: signatureData ?? undefined }), [approvalData, signatureData])
}
