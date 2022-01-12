import { Trans } from '@lingui/macro'
import { useDerivedSwapInfo } from 'lib/hooks/swap'
import { Field } from 'lib/state/swap'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
import { SummaryDialog } from './Summary'

enum Mode {
  NONE,
  SUMMARY,
  STATUS,
}

export default function SwapButton() {
  const {
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency },
    parsedAmounts: { [Field.INPUT]: inputAmount, [Field.OUTPUT]: outputAmount },
    currencyBalances: { [Field.INPUT]: balance },
  } = useDerivedSwapInfo()

  const [mode, setMode] = useState(Mode.NONE)

  // @todo - IanLapham - use real approval
  const inputApproved = true

  const actionProps = useMemo(() => {
    if (inputCurrency && inputAmount && outputCurrency && outputAmount && balance && inputAmount.lessThan(balance)) {
      if (inputApproved) {
        return {}
      } else {
        return {
          updated: { message: <Trans>Approve {inputCurrency.symbol} first</Trans>, action: <Trans>Approve</Trans> },
        }
      }
    }
    return { disabled: true }
  }, [balance, inputAmount, inputApproved, inputCurrency, outputAmount, outputCurrency])
  const onConfirm = useCallback(() => {
    // TODO: Send the tx to the connected wallet.
    setMode(Mode.STATUS)
  }, [])
  return (
    <>
      <ActionButton color="interactive" onClick={() => setMode(Mode.SUMMARY)} onUpdate={() => void 0} {...actionProps}>
        <Trans>Review swap</Trans>
      </ActionButton>
      {mode >= Mode.SUMMARY && (
        <Dialog color="dialog" onClose={() => setMode(Mode.NONE)}>
          <SummaryDialog onConfirm={onConfirm} />
        </Dialog>
      )}
      {mode >= Mode.STATUS && (
        <Dialog color="dialog">
          <StatusDialog onClose={() => setMode(Mode.NONE)} />
        </Dialog>
      )}
    </>
  )
}
