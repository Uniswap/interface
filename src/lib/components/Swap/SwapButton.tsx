import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { inputAtom, outputAtom, swapAtom } from 'lib/state/swap'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
import { SummaryDialog } from './Summary'

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
    if (swap && input.token && input.value && output.token && output.value && input.value <= balance) {
      if (input.approved) {
        return {}
      } else {
        return {
          updated: { message: <Trans>Approve {input.token.symbol} first</Trans>, action: <Trans>Approve</Trans> },
        }
      }
    }
    return { disabled: true }
  }, [balance, input.approved, input.token, input.value, output.token, output.value, swap])
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
