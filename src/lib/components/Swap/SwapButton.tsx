import { Trans } from '@lingui/macro'
import { useSwapInfo } from 'lib/hooks/swap'
import useSwapApproval, { ApprovalState, useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { Field } from 'lib/state/swap'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
import { SummaryDialog } from './Summary'

enum Mode {
  SWAP,
  SUMMARY,
  STATUS,
}

export default function SwapButton() {
  const [mode, setMode] = useState(Mode.SWAP)
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
  // TODO(zzmp): Pass optimized trade to SummaryDialog

  const actionProps = useMemo(() => {
    if (inputCurrencyAmount && inputCurrencyBalance?.greaterThan(inputCurrencyAmount)) {
      if (approval === ApprovalState.NOT_APPROVED) {
        return {
          updated: {
            message: <Trans>Approve {inputCurrencyAmount.currency.symbol} first</Trans>,
            action: <Trans>Approve</Trans>,
          },
        }
      }
      if (approval === ApprovalState.PENDING) {
        return { disabled: true }
      }
      return {}
    }
    return { disabled: true }
  }, [approval, inputCurrencyAmount, inputCurrencyBalance])
  const onConfirm = useCallback(() => {
    // TODO: Send the tx to the connected wallet.
    setMode(Mode.STATUS)
  }, [])
  return (
    <>
      <ActionButton color="interactive" onClick={() => setMode(Mode.SUMMARY)} onUpdate={getApproval} {...actionProps}>
        <Trans>Review swap</Trans>
      </ActionButton>
      {mode >= Mode.SUMMARY && (
        <Dialog color="dialog" onClose={() => setMode(Mode.SWAP)}>
          <SummaryDialog onConfirm={onConfirm} />
        </Dialog>
      )}
      {mode >= Mode.STATUS && (
        <Dialog color="dialog">
          <StatusDialog onClose={() => setMode(Mode.SWAP)} />
        </Dialog>
      )}
    </>
  )
}
