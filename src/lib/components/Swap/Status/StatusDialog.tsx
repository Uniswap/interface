import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import useInterval from 'lib/hooks/useInterval'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Icon, Info, LargeIcon, Spinner } from 'lib/icons'
import styled, { Color, ThemedText, useScrollbar } from 'lib/theme'
import { ReactNode, useCallback, useMemo, useState } from 'react'

import ActionButton from '../../ActionButton'
import { IconButton } from '../../Button'
import Column from '../../Column'
import Row from '../../Row'
import Rule from '../../Rule'
import { Transaction, transactionAtom } from '../state'
import Summary from '../Summary'

const HeaderIcon = styled(LargeIcon)`
  flex-grow: 1;

  svg {
    transition: height 0.25s, width 0.25s;
  }
`

interface StatusHeaderProps {
  icon: Icon
  iconColor?: Color
  iconSize?: number
  children: ReactNode
}

function StatusHeader({ icon: Icon, iconColor, iconSize = 4, children }: StatusHeaderProps) {
  return (
    <>
      <Column flex style={{ flexGrow: 1 }}>
        <HeaderIcon icon={Icon} color={iconColor} size={iconSize} />
        <Column gap={0.75} flex>
          {children}
        </Column>
      </Column>
      <Rule />
    </>
  )
}

interface StatusProps {
  onClose: () => void
}

const TransactionRow = styled(Row)`
  flex-direction: row-reverse;
`

function ElapsedTime({ tx }: { tx: Transaction }) {
  const [elapsedMs, setElapsedMs] = useState(0)
  useInterval(
    () => {
      setElapsedMs(tx.elapsedMs || Date.now() - (tx.timestamp ?? 0))
    },
    elapsedMs === tx.elapsedMs ? null : 1000
  )
  const toElapsedTime = useCallback((ms: number) => {
    let sec = Math.floor(ms / 1000)
    const min = Math.floor(sec / 60)
    sec = sec % 60
    if (min) {
      return (
        <Trans>
          {min}m {sec}s
        </Trans>
      )
    } else {
      return <Trans>{sec}s</Trans>
    }
  }, [])
  return (
    <Row gap={0.5}>
      <Clock />
      <ThemedText.Body2>{toElapsedTime(elapsedMs)}</ThemedText.Body2>
    </Row>
  )
}

const EtherscanA = styled.a`
  color: ${({ theme }) => theme.accent};
  text-decoration: none;
`

interface TransactionStatusProps extends StatusProps {
  tx: Transaction | null
}

function TransactionStatus({ tx, onClose }: TransactionStatusProps) {
  const Icon = useMemo(() => {
    return tx?.status ? CheckCircle : Spinner
  }, [tx?.status])
  const heading = useMemo(() => {
    return tx?.status ? <Trans>Transaction submitted</Trans> : <Trans>Transaction pending</Trans>
  }, [tx?.status])
  return (
    <>
      <StatusHeader icon={Icon} iconColor={tx?.status && 'success'}>
        <ThemedText.Subhead1>{heading}</ThemedText.Subhead1>
        {tx && <Summary input={tx.input} output={tx.output} />}
      </StatusHeader>
      <TransactionRow flex>
        <ThemedText.ButtonSmall>
          <EtherscanA href="//etherscan.io" target="_blank">
            <Trans>View on Etherscan</Trans>
          </EtherscanA>
        </ThemedText.ButtonSmall>
        {tx && <ElapsedTime tx={tx} />}
      </TransactionRow>
      <ActionButton onClick={onClose}>
        <Trans>Close</Trans>
      </ActionButton>
    </>
  )
}

const ErrorHeader = styled(Column)<{ open: boolean }>`
  transition: gap 0.25s;

  div:last-child {
    max-height: ${({ open }) => (open ? 0 : 60 / 14)}em; // 3 * line-height
    overflow-y: hidden;
    transition: max-height 0.25s;
  }
`
const ErrorColumn = styled(Column)``
const ExpandoColumn = styled(Column)<{ open: boolean }>`
  flex-grow: ${({ open }) => (open ? 2 : 0)};
  transition: flex-grow 0.25s, gap 0.25s;

  ${Rule} {
    margin-bottom: ${({ open }) => (open ? 0 : 0.75)}em;
    transition: margin-bottom 0.25s;
  }

  ${ErrorColumn} {
    flex-basis: 0;
    flex-grow: ${({ open }) => (open ? 1 : 0)};
    overflow-y: hidden;
    position: relative;
    transition: flex-grow 0.25s;

    ${Column} {
      height: 100%;
      padding: ${({ open }) => (open ? '0.5em 0' : 0)};
      transition: padding 0.25s;

      :after {
        background: linear-gradient(#ffffff00, ${({ theme }) => theme.dialog});
        bottom: 0;
        content: '';
        height: 0.75em;
        pointer-events: none;
        position: absolute;
        width: calc(100% - 1em);
      }
    }
  }
`

interface ErrorStatusProps extends StatusProps {
  error: Error
}

function ErrorStatus({ error, onClose }: ErrorStatusProps) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(details)
  return (
    <>
      <StatusHeader icon={AlertTriangle} iconColor="error" iconSize={open ? 3 : 4}>
        <ErrorHeader gap={open ? 0 : 0.75} open={open}>
          <ThemedText.Subhead1>
            <Trans>Something went wrong.</Trans>
          </ThemedText.Subhead1>
          <ThemedText.Body2>
            <Trans>
              Try increasing your slippage tolerance.
              <br />
              NOTE: Fee on transfer and rebase tokens are incompatible with Uniswap V3.
            </Trans>
          </ThemedText.Body2>
        </ErrorHeader>
      </StatusHeader>
      <Row>
        <Row gap={0.5}>
          <Info color="secondary" />
          <ThemedText.Subhead2 color="secondary">
            <Trans>Error details</Trans>
          </ThemedText.Subhead2>
        </Row>
        <IconButton color="secondary" onClick={() => setOpen(!open)} icon={open ? ChevronDown : ChevronUp} />
      </Row>
      <ExpandoColumn flex align="stretch" open={open}>
        <Rule />
        <ErrorColumn>
          <Column gap={0.5} ref={setDetails} css={scrollbar}>
            <ThemedText.Code>{error.message}</ThemedText.Code>
          </Column>
        </ErrorColumn>
        <ActionButton onClick={onClose}>
          <Trans>Dismiss</Trans>
        </ActionButton>
      </ExpandoColumn>
    </>
  )
}

export default function TransactionStatusDialog({ onClose }: StatusProps) {
  const tx = useAtomValue(transactionAtom)

  return (
    <Column flex padded gap={0.75} align="stretch" style={{ height: '100%' }}>
      {tx?.status instanceof Error ? (
        <ErrorStatus error={tx.status} onClose={onClose} />
      ) : (
        <TransactionStatus tx={tx} onClose={onClose} />
      )}
    </Column>
  )
}
