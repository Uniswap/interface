import { useAtomValue } from 'jotai/utils'
import useInterval from 'lib/hooks/useInterval'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Info } from 'react-feather'

import ActionButton from '../ActionButton'
import Button from '../Button'
import Column from '../Column'
import Row from '../Row'
import Rule from '../Rule'
import SpinnerIcon from '../SpinnerIcon'
import { Transaction, transactionAtom } from './state'
import { SwapSummary } from './Summary'

const DownIcon = icon(ChevronDown)
const ElapsedIcon = icon(Clock)
const ErrorIcon = icon(AlertTriangle, { color: 'error' })
const InfoIcon = icon(Info)
const SuccessIcon = icon(CheckCircle, { color: 'success' })
const UpIcon = icon(ChevronUp)

const Header = styled.div<{ maximized?: boolean }>`
  display: flex;
  height: 100%;
  justify-content: center;
  font-size: ${({ maximized }) => (maximized ? 48 : 64)}px;
  padding-top: ${({ maximized }) => (maximized ? 8 : 32)}px;
  transition: font-size 0.2s linear, padding-top 0.2s linear;

    * {
      stroke-width: 1;
    }
  }
`

const Body = styled(Column)`
  height: 100%;
  text-align: center;
  width: 100%;
`

const FlexRule = styled(Rule)`
  width: 100%;
`

const Break = styled.br`
  line-height: 1em;
`

const EtherscanA = styled.a`
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
`

const ErrorColumn = styled(Column)<{ maximized?: boolean }>`
  height: ${({ maximized }) => (maximized ? 'calc(3.5em + 40px)' : '3.5em')};
  transition: height 0.2s linear;
`

function toElapsedTime(ms: number): string {
  let sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  sec = sec % 60
  if (min) {
    return `${min}m${sec}s`
  } else {
    return `${sec}s`
  }
}

function StatusBody({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [elapsedMs, setElapsedMs] = useState(0)
  useInterval(
    () => {
      setElapsedMs(transaction?.elapsedMs || Date.now() - (transaction?.timestamp ?? 0))
    },
    elapsedMs === transaction?.elapsedMs ? null : 1000
  )

  return (
    <Body align="stretch" flex padded>
      <Header>{transaction.status ? <SuccessIcon /> : <SpinnerIcon />}</Header>
      <Column gap={1}>
        <Column gap={0.75} flex>
          <TYPE.subhead1>Transaction {transaction.status ? 'submitted' : 'pending'}</TYPE.subhead1>
          <SwapSummary input={transaction.input} output={transaction.output} />
          <FlexRule />
        </Column>
        <TYPE.subhead2 color="secondary">
          <Row>
            <Row gap={0.5}>
              <ElapsedIcon />
              {toElapsedTime(transaction.elapsedMs || Date.now() - transaction.timestamp)}
            </Row>
            <EtherscanA href="//etherscan.io" target="_blank">
              View on Etherscan
            </EtherscanA>
          </Row>
        </TYPE.subhead2>
        <ActionButton onClick={onClose}>Close</ActionButton>
      </Column>
    </Body>
  )
}

function ErrorBody({ error, onClose }: { error: Error; onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Body align="stretch" flex padded>
      <Header maximized={open}>
        <ErrorIcon />
      </Header>
      <Column gap={1}>
        <Column gap={0.75}>
          <TYPE.subhead1>Something went wrong.</TYPE.subhead1>
          <TYPE.body2>Try increasing your slippage tolerance</TYPE.body2>
          <TYPE.body2 fontWeight="200" lineHeight={1.25}>
            Note: Fee on transfer and rebase tokens are incompatible with Uniswap V3.
          </TYPE.body2>
          <Rule />
        </Column>
        <Row>
          <Row gap={0.5}>
            <InfoIcon />
            <TYPE.subhead2 color="secondary">Error details</TYPE.subhead2>
          </Row>
          <Button onClick={() => setOpen(!open)}>{open ? <DownIcon /> : <UpIcon />}</Button>
        </Row>
        <ErrorColumn maximized={open} scrollable>
          {open && (
            <>
              <TYPE.code>{error.message}</TYPE.code>
              <Break />
            </>
          )}
          <ActionButton color="error" onClick={onClose}>
            Dismiss
          </ActionButton>
        </ErrorColumn>
      </Column>
    </Body>
  )
}

export function TransactionStatusDialog({ onClose }: { onClose: () => void }) {
  const transaction = useAtomValue(transactionAtom)
  return (
    transaction &&
    (transaction.status instanceof Error ? (
      <ErrorBody error={transaction.status} onClose={onClose} />
    ) : (
      <StatusBody transaction={transaction} onClose={onClose} />
    ))
  )
}
