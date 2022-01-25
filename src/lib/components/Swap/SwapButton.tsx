import { Trans } from '@lingui/macro'
import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
import { useSwapInfo } from 'lib/hooks/swap'
import useSwapApproval, { ApprovalState, useSwapApprovalOptimizedTrade } from 'lib/hooks/swap/useSwapApproval'
import { useSwapCallback } from 'lib/hooks/swap/useSwapCallback'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { Field } from 'lib/state/swap'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
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

  // TODO(zzmp): Track pending approval
  const useIsPendingApproval = () => false

  // TODO(zzmp): Return an optimized trade directly from useSwapInfo.
  const approvalOptimizedTrade = useSwapApprovalOptimizedTrade(trade.trade, allowedSlippage, useIsPendingApproval)
  const [approval, getApproval] = useSwapApproval(approvalOptimizedTrade, allowedSlippage, useIsPendingApproval)

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
  }, [approval, disabled, inputCurrencyAmount, inputCurrencyBalance])

  // @TODO(ianlapham): connect deadline from state instead of passing undefined.
  const { signatureData } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, undefined)

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    account ?? null,
    signatureData
  )

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
        onUpdate={getApproval}
        {...actionProps}
      >
        <Trans>Review swap</Trans>
      </ActionButton>
      {activeTrade && (
        <Dialog color="dialog" onClose={() => setActiveTrade(undefined)}>
          <SummaryDialog trade={activeTrade} allowedSlippage={allowedSlippage} onConfirm={onConfirm} />
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
