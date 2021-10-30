import assert from 'assert'
import { useAtomValue } from 'jotai/utils'
import styled, { Color, icon, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useMemo } from 'react'
import { AlertTriangle } from 'react-feather'

import Button from '../Button'
import Row from '../Row'
import { inputAtom, State, swapAtom } from './state'

export const ActionButton = styled(Button)<{ color?: Color; theme: Theme }>`
  background-color: ${({ color, theme }) => color && theme[color]};
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  height: 3.5em;
  outline: ${({ color, theme }) => (color ? undefined : `1px solid ${theme.outline}`)};

  :disabled {
    opacity: 1;
  }
`

const ApprovalRow = styled(Row)`
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  height: 3.5em;
  outline: 1px solid ${({ theme }) => theme.outline};
  padding: 0.5em;
`

const ApproveButton = styled(Button)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => theme.borderRadius * 0.5}em;
  color: ${({ theme }) => theme.contrast};
  height: 100%;
  padding: 0 1em;
`

function Disabled({ children }: { children: ReactNode }) {
  return (
    <ActionButton disabled>
      <TYPE.buttonLarge>{children}</TYPE.buttonLarge>
    </ActionButton>
  )
}

function Loading() {
  return (
    <ActionButton disabled>
      <TYPE.buttonLarge>Loading…</TYPE.buttonLarge>
    </ActionButton>
  )
}

interface ActionProps {
  onClick: () => void
  children: ReactNode
}

const AlertIcon = icon(AlertTriangle, { color: 'primary' })

function Approval({ onClick, children }: ActionProps) {
  return (
    <ApprovalRow>
      <Row gap={0.5}>
        <AlertIcon />
        <TYPE.subhead2>{children}</TYPE.subhead2>
      </Row>
      <ApproveButton onClick={onClick}>Approve</ApproveButton>
    </ApprovalRow>
  )
  return null
}

function Action({ onClick, children }: ActionProps) {
  return (
    <ActionButton color="interactive" onClick={onClick}>
      <TYPE.buttonLarge color="contrast">{children}</TYPE.buttonLarge>
    </ActionButton>
  )
}

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
