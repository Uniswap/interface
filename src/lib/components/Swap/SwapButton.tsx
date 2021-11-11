import { Trans } from '@lingui/macro'
import assert from 'assert'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'

import ActionButton, { ApprovalButton, DisabledButton, LoadingButton } from '../ActionButton'
import Dialog from '../Dialog'
import { inputAtom, State, stateAtom } from './state'
import { SummaryDialog } from './Summary'
import TransactionStatusDialog from './TransactionStatusDialog'

export default function SwapButton() {
  const [state, setState] = useAtom(stateAtom)
  const { token } = useAtomValue(inputAtom)
  const [open, setOpen] = useState(false)
  const action = useMemo(() => {
    switch (state) {
      case State.EMPTY:
        return (
          <DisabledButton>
            <Trans>Enter amount</Trans>
          </DisabledButton>
        )
      case State.LOADING:
        return <LoadingButton />
      case State.TOKEN_APPROVAL:
        assert(token)
        return (
          <ApprovalButton onClick={() => void 0}>
            <Trans>Approve {token.symbol} first</Trans>
          </ApprovalButton>
        )
      case State.BALANCE_INSUFFICIENT:
        assert(token)
        return (
          <DisabledButton>
            <Trans>Insufficient {token.symbol} balance</Trans>
          </DisabledButton>
        )
      case State.LOADED:
        return (
          <ActionButton onClick={() => setOpen(true)}>
            <Trans>Swap</Trans>
          </ActionButton>
        )
      default:
        return <DisabledButton>🦄</DisabledButton>
    }
  }, [state, token])
  useEffect(() => {
    if (state === State.PENDING) {
      setOpen(false)
    }
  }, [state])
  return (
    <>
      {action}
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
