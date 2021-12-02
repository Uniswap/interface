import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import useInterval from 'lib/hooks/useInterval'
import styled, { icon, ThemedText } from 'lib/theme'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Info } from 'react-feather'

import ActionButton from '../ActionButton'
import Button from '../Button'
import Column from '../Column'
import Row from '../Row'
import Rule from '../Rule'
import SpinnerIcon from '../SpinnerIcon'
import { Transaction, transactionAtom } from './state'
import Summary from './Summary'

const DownIcon = icon(ChevronDown)
const ElapsedIcon = icon(Clock)
const ErrorIcon = icon(AlertTriangle, { color: 'error' })
const InfoIcon = icon(Info)
const SuccessIcon = icon(CheckCircle, { color: 'success' })
const UpIcon = icon(ChevronUp)

const Header = styled.div<{ maximized?: boolean }>`
  display: flex;
  font-size: ${({ maximized }) => (maximized ? 48 : 64)}px;
  height: 100%;
  justify-content: center;
  padding-top: ${({ maximized }) => (maximized ? 8 : 32)}px;
  transition: font-size 0.2s linear, padding-top 0.2s linear;

  * {
    stroke-width: 1;
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
  overflow-y: ${({ maximized }) => (maximized ? 'scroll' : 'hidden')};
  transition: height 0.2s linear;
`

function toElapsedTime(ms: number) {
  let sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  sec = sec % 60
  if (min) {
    return (
      <Trans>
        {min}m{sec}s
      </Trans>
    )
  } else {
    return <Trans>{sec}s</Trans>
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
          <ThemedText.Subhead1>
            {transaction.status ? <Trans>Transaction submitted</Trans> : <Trans>Transaction pending</Trans>}
          </ThemedText.Subhead1>
          <Summary input={transaction.input} output={transaction.output} />
          <FlexRule />
        </Column>
        <ThemedText.Subhead2 color="secondary">
          <Row>
            <Row gap={0.5}>
              <ElapsedIcon />
              {toElapsedTime(transaction.elapsedMs || Date.now() - transaction.timestamp)}
            </Row>
            <EtherscanA href="//etherscan.io" target="_blank">
              <Trans>View on Etherscan</Trans>
            </EtherscanA>
          </Row>
        </ThemedText.Subhead2>
        <ActionButton onClick={onClose}>
          <Trans>Close</Trans>
        </ActionButton>
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
          <ThemedText.Subhead1>
            <Trans>Something went wrong.</Trans>
          </ThemedText.Subhead1>
          <ThemedText.Body2>
            <Trans>Try increasing your slippage tolerance</Trans>
          </ThemedText.Body2>
          <ThemedText.Body2 fontWeight="200" lineHeight={1.25}>
            <Trans>Note: Fee on transfer and rebase tokens are incompatible with Uniswap V3.</Trans>
          </ThemedText.Body2>
          <Rule />
        </Column>
        <Row>
          <Row gap={0.5}>
            <InfoIcon />
            <ThemedText.Subhead2 color="secondary">
              <Trans>Error details</Trans>
            </ThemedText.Subhead2>
          </Row>
          <Button onClick={() => setOpen(!open)}>{open ? <DownIcon /> : <UpIcon />}</Button>
        </Row>
        <ErrorColumn maximized={open}>
          <ThemedText.Code>{error.message}</ThemedText.Code>
          <Break />
          <ActionButton color="error" onClick={onClose}>
            <Trans>Dismiss</Trans>
          </ActionButton>
        </ErrorColumn>
      </Column>
    </Body>
  )
}

export default function TransactionStatusDialog({ onClose }: { onClose: () => void }) {
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
