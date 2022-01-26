import { Trans } from '@lingui/macro'
import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
import { useSwapInfo } from 'lib/hooks/swap'
import useSwapApproval, { ApprovalState, useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import { useAddTransaction } from 'lib/hooks/transactions'
import { useIsPendingApproval } from 'lib/hooks/transactions'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { Field } from 'lib/state/swap'
import { TransactionType } from 'lib/state/transactions'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { SummaryDialog } from './Summary'

interface SwapButtonProps {
  disabled?: boolean
}

export default function SwapButton({ disabled }: SwapButtonProps) {
  const { account } = useActiveWeb3React()

  const {
    trade,
    allowedSlippage,
    currencyBalances: { [Field.INPUT]: inputCurrencyBalance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount },
  } = useSwapInfo()

  const [activeTrade, setActiveTrade] = useState<typeof trade.trade | undefined>(undefined)
  useEffect(() => {
    setActiveTrade((activeTrade) => activeTrade && trade.trade)
  }, [trade])

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const optimizedTrade =
    // Use trade.trade if there is no swap optimized trade. This occurs if approvals are still pending.
    useSwapApprovalOptimizedTrade(trade.trade, allowedSlippage, useIsPendingApproval) || trade.trade
  const [approval, getApproval] = useSwapApproval(optimizedTrade, allowedSlippage, useIsPendingApproval)

  const addTransaction = useAddTransaction()
  const addApprovalTransaction = useCallback(() => {
    getApproval().then((transaction) => {
      if (transaction) {
        addTransaction({ type: TransactionType.APPROVAL, ...transaction })
      }
    })
  }, [addTransaction, getApproval])

  const actionProps = useMemo(() => {
    if (disabled) return { disabled: true }

    if (inputCurrencyAmount && inputCurrencyBalance?.greaterThan(inputCurrencyAmount)) {
      // TODO(zzmp): Update UI for pending approvals.
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
  }, [approval, disabled, inputCurrencyAmount, inputCurrencyBalance])

  // @TODO(ianlapham): connect deadline from state instead of passing undefined.
  const { signatureData } = useERC20PermitFromTrade(optimizedTrade, allowedSlippage, undefined)

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback(optimizedTrade, allowedSlippage, account ?? null, signatureData)

  //@TODO(ianlapham): add a loading state, process errors
  const onConfirm = useCallback(() => {
    if (!swapCallback) {
      return
    }
    swapCallback().then((hash) => {
      console.log(hash)
    })
  }, [swapCallback])

  return (
    <>
      <ActionButton
        color="interactive"
        onClick={() => setActiveTrade(trade.trade)}
        onUpdate={addApprovalTransaction}
        {...actionProps}
      >
        <Trans>Review swap</Trans>
      </ActionButton>
      {activeTrade && (
        <Dialog color="dialog" onClose={() => setActiveTrade(undefined)}>
          <SummaryDialog trade={activeTrade} allowedSlippage={allowedSlippage} onConfirm={onConfirm} />
        </Dialog>
      )}
      {/* TODO(zzmp): Pass the completed tx, possibly at a different level of the DOM.
        <Dialog color="dialog">
          <StatusDialog onClose={() => void 0} />
        </Dialog>
      */}
    </>
  )
}
