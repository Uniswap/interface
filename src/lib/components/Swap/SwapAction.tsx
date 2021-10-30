import assert from 'assert'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import Action, { Approval, Disabled, Loading } from '../Action'
import { inputAtom, State, swapAtom } from './state'

function Empty() {
  return <Disabled>Enter amount</Disabled>
}

function TokenApproval() {
  const { token } = useAtomValue(inputAtom)
  assert(token)
  return <Approval onClick={() => void 0}>Approve {token.symbol} first</Approval>
}

function BalanceInsufficient() {
  const { token } = useAtomValue(inputAtom)
  assert(token)
  return <Disabled>Insufficient {token.symbol} balance</Disabled>
}

export default function SwapAction() {
  const swap = useAtomValue(swapAtom)
  return useMemo(() => {
    switch (swap.state) {
      case State.EMPTY:
        return <Empty />
      case State.LOADING:
        return <Loading />
      case State.TOKEN_APPROVAL:
        return <TokenApproval />
      case State.BALANCE_INSUFFICIENT:
        return <BalanceInsufficient />
      case State.LOADED:
        return <Action onClick={() => void 0}>Swap</Action>
    }
  }, [swap.state])
}
