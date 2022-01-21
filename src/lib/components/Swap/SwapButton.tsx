import { Trans } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { StatusDialog } from './Status'
import { SummaryDialog } from './Summary'

const mockBalance = 123.45
const mockInputAmount = 10
const mockApproved = true

enum Mode {
  NONE,
  SUMMARY,
  STATUS,
}

export default function SwapButton() {
  const [mode, setMode] = useState(Mode.NONE)

  //@TODO(ianlapham): update this to refer to balances and use real symbol
  const actionProps = useMemo(() => {
    if (mockInputAmount < mockBalance) {
      if (mockApproved) {
        return {}
      } else {
        return {
          updated: { message: <Trans>Approve symbol first</Trans>, action: <Trans>Approve</Trans> },
        }
      }
    }
    return { disabled: true }
  }, [])
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
