import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import ErrorDialog, { StatusHeader } from 'lib/components/Error/ErrorDialog'
import useInterval from 'lib/hooks/useInterval'
import { CheckCircle, Clock, Spinner } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useCallback, useMemo, useState } from 'react'

import ActionButton from '../../ActionButton'
import Column from '../../Column'
import Row from '../../Row'
import { Transaction, transactionAtom } from '../state'
import Summary from '../Summary'

const errorMessage = (
  <Trans>
    Try increasing your slippage tolerance.
    <br />
    NOTE: Fee on transfer and rebase tokens are incompatible with Uniswap V3.
  </Trans>
)

const TransactionRow = styled(Row)`
  flex-direction: row-reverse;
`

function ElapsedTime({ tx }: { tx: Transaction | null }) {
  const [elapsedMs, setElapsedMs] = useState(0)
  useInterval(
    () => {
      if (tx?.elapsedMs) {
        setElapsedMs(tx.elapsedMs)
      } else if (tx?.timestamp) {
        setElapsedMs(Date.now() - tx.timestamp)
      }
    },
    elapsedMs === tx?.elapsedMs ? null : 1000
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
    <Column flex padded gap={0.75} align="stretch" style={{ height: '100%' }}>
      <StatusHeader icon={Icon} iconColor={tx?.status && 'success'}>
        <ThemedText.Subhead1>{heading}</ThemedText.Subhead1>
        {tx ? <Summary input={tx.input} output={tx.output} /> : <div style={{ height: '1.25em' }} />}
      </StatusHeader>
      <TransactionRow flex>
        <ThemedText.ButtonSmall>
          <EtherscanA href="//etherscan.io" target="_blank">
            <Trans>View on Etherscan</Trans>
          </EtherscanA>
        </ThemedText.ButtonSmall>
        <ElapsedTime tx={tx} />
      </TransactionRow>
      <ActionButton onClick={onClose}>
        <Trans>Close</Trans>
      </ActionButton>
    </Column>
  )
}

interface StatusProps {
  onClose: () => void
}

export default function TransactionStatusDialog({ onClose }: StatusProps) {
  const tx = useAtomValue(transactionAtom)

  return tx?.status instanceof Error ? (
    <ErrorDialog header={errorMessage} error={tx.status} action={<Trans>Dismiss</Trans>} onAction={onClose} />
  ) : (
    <TransactionStatus tx={tx} onClose={onClose} />
  )
}
