import { Trans } from '@lingui/macro'
import assert from 'assert'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'

import ActionButton from '../ActionButton'
import Dialog from '../Dialog'
import { inputAtom, State, stateAtom } from './state'
import { SummaryDialog } from './Summary'
import TransactionStatusDialog from './TransactionStatusDialog'

export default function SwapButton() {
  const [state, setState] = useAtom(stateAtom)
  const { token } = useAtomValue(inputAtom)
  const [open, setOpen] = useState(false)
  const actionProps = useMemo(() => {
    switch (state) {
      case State.LOADED:
        return {}
      case State.TOKEN_APPROVAL:
        assert(token)
        return { updated: { message: <Trans>Approve {token.symbol} first</Trans>, action: <Trans>Approve</Trans> } }
      case State.EMPTY:
      case State.LOADING:
      case State.BALANCE_INSUFFICIENT:
      default:
        return { disabled: true }
    }
  }, [state, token])
  useEffect(() => {
    if (state === State.PENDING) {
      setOpen(false)
    }
  }, [state])
  return (
    <>
      <ActionButton color="interactive" onClick={() => setOpen(true)} onUpdate={() => void 0} {...actionProps}>
        <Trans>Review swap</Trans>
      </ActionButton>
      {open && (
        <Dialog color="dialog" onClose={() => setOpen(false)}>
          <SummaryDialog />
        </Dialog>
      )}
      {state === State.PENDING && (
        <Dialog color="dialog">
          <TransactionStatusDialog onClose={() => setState(State.LOADED)} />
        </Dialog>
      )}
    </>
  )
}
