import { Trans } from '@lingui/macro'
import { useSwapInfo } from 'lib/hooks/swap'
import useSwapApproval, { ApprovalState, useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { Field } from 'lib/state/swap'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
import { SummaryDialog } from './Summary'

interface SwapButtonProps {
  disabled?: boolean
}

export default function SwapButton({ disabled }: SwapButtonProps) {
  const {
    trade,
    allowedSlippage,
    currencyBalances: { [Field.INPUT]: inputCurrencyBalance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount },
  } = useSwapInfo()
  // TODO(zzmp): Track pending approval
  const useIsPendingApproval = () => false
  const optimizedTrade = useSwapApprovalOptimizedTrade(trade.trade, allowedSlippage, useIsPendingApproval)
  const [approval, getApproval] = useSwapApproval(optimizedTrade, allowedSlippage, useIsPendingApproval)
  const [activeTrade, setActiveTrade] = useState<typeof optimizedTrade>(undefined)

  const actionProps = useMemo(() => {
    if (disabled) return { disabled: true }

    if (inputCurrencyAmount && inputCurrencyBalance?.greaterThan(inputCurrencyAmount)) {
      if (approval === ApprovalState.PENDING) {
        return { disabled: true }
      } else if (approval === ApprovalState.NOT_APPROVED) {
        return {
          updated: {
            message: <Trans>Approve {inputCurrencyAmount.currency.symbol} first</Trans>,
            action: <Trans>Approve</Trans>,
          },
        }
      }
      return {}
    }

    return { disabled: true }
  }, [disabled, approval, inputCurrencyAmount, inputCurrencyBalance])
  const onConfirm = useCallback(() => {
    // TODO(zzmp)
  }, [])

  return (
    <>
      <ActionButton
        color="interactive"
        onClick={() => setActiveTrade(optimizedTrade)}
        onUpdate={getApproval}
        {...actionProps}
      >
        <Trans>Review swap</Trans>
      </ActionButton>
      {activeTrade && (
        <Dialog color="dialog" onClose={() => setActiveTrade(undefined)}>
          <SummaryDialog trade={activeTrade} onConfirm={onConfirm} />
        </Dialog>
      )}
      {false && (
        <Dialog color="dialog">
          <StatusDialog onClose={() => void 0} />
        </Dialog>
      )}
    </>
  )
}
