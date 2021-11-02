import assert from 'assert'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'

import Action, { Approval, Disabled, Loading } from '../Action'
import Dialog from '../Dialog'
import { inputAtom, State, stateAtom } from './state'
import { SwapSummaryDialog } from './SwapSummary'

export default function SwapAction() {
  const state = useAtomValue(stateAtom)
  const { token } = useAtomValue(inputAtom)
  const [open, setOpen] = useState(false)
  const action = useMemo(() => {
    switch (state) {
      case State.EMPTY:
        return <Disabled>Enter amount</Disabled>
      case State.LOADING:
        return <Loading />
      case State.TOKEN_APPROVAL:
        assert(token)
        return <Approval onClick={() => void 0}>Approve {token.symbol} first</Approval>
      case State.BALANCE_INSUFFICIENT:
        assert(token)
        return <Disabled>Insufficient {token.symbol} balance</Disabled>
      case State.LOADED:
        return <Action onClick={() => setOpen(true)}>Swap</Action>
      default:
        return <Disabled>Confirmation pending</Disabled>
    }
  }, [state, token])
  return (
    <>
      {action}
      {open && (
        <Dialog color="dialog" onClose={() => setOpen(false)}>
          <SwapSummaryDialog />
        </Dialog>
      )}
    </>
  )
}
