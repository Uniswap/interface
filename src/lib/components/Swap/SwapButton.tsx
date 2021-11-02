import assert from 'assert'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'

import ActionButton, { ApprovalButton, DisabledButton, LoadingButton } from '../ActionButton'
import Dialog from '../Dialog'
import { inputAtom, State, stateAtom } from './state'
import { SummaryDialog } from './Summary'
import { TransactionStatusDialog } from './TransactionStatus'

export default function SwapButton() {
  const state = useAtomValue(stateAtom)
  const { token } = useAtomValue(inputAtom)
  const [open, setOpen] = useState(false)
  const action = useMemo(() => {
    switch (state) {
      case State.EMPTY:
        return <DisabledButton>Enter amount</DisabledButton>
      case State.LOADING:
        return <LoadingButton />
      case State.TOKEN_APPROVAL:
        assert(token)
        return <ApprovalButton onClick={() => void 0}>Approve {token.symbol} first</ApprovalButton>
      case State.BALANCE_INSUFFICIENT:
        assert(token)
        return <DisabledButton>Insufficient {token.symbol} balance</DisabledButton>
      case State.LOADED:
        return <ActionButton onClick={() => setOpen(true)}>Swap</ActionButton>
      default:
        return <DisabledButton>🦄</DisabledButton>
    }
  }, [state, token])
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
          <TransactionStatusDialog />
        </Dialog>
      )}
    </>
  )
}
