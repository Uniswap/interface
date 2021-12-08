import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { inputAtom, outputAtom, swapAtom } from './state'
import { SummaryDialog } from './Summary'
import TransactionStatusDialog from './TransactionStatusDialog'

const mockBalance = 123.45

enum Mode {
  NONE,
  SUMMARY,
  STATUS,
}

export default function SwapButton() {
  const swap = useAtomValue(swapAtom)
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const balance = mockBalance
  const [mode, setMode] = useState(Mode.NONE)
  const actionProps = useMemo(() => {
    if (input.token && output.token && !input.approved) {
      return { updated: { message: <Trans>Approve {input.token.symbol} first</Trans>, action: <Trans>Approve</Trans> } }
    } else if (swap && input.value && input.value <= balance) {
      return {}
    }
    return { disabled: true }
  }, [balance, input.approved, input.token, input.value, output.token, swap])
  return (
    <>
      <ActionButton color="interactive" onClick={() => setMode(Mode.SUMMARY)} onUpdate={() => void 0} {...actionProps}>
        <Trans>Review swap</Trans>
      </ActionButton>
      {mode === Mode.SUMMARY && (
        <Dialog color="dialog" onClose={() => setMode(Mode.NONE)}>
          <SummaryDialog />
        </Dialog>
      )}
      {mode === Mode.STATUS && (
        <Dialog color="dialog">
          <TransactionStatusDialog onClose={() => setMode(Mode.NONE)} />
        </Dialog>
      )}
    </>
  )
}
