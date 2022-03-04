import { Trans } from '@lingui/macro'
import ErrorDialog, { StatusHeader } from 'lib/components/Error/ErrorDialog'
import EtherscanLink from 'lib/components/EtherscanLink'
import SwapSummary from 'lib/components/Swap/Summary'
import useInterval from 'lib/hooks/useInterval'
import { CheckCircle, Clock, Spinner } from 'lib/icons'
import { SwapTransactionInfo, Transaction, TransactionType, WrapTransactionInfo } from 'lib/state/transactions'
import styled, { ThemedText } from 'lib/theme'
import ms from 'ms.macro'
import { useCallback, useMemo, useState } from 'react'
import { ExplorerDataType } from 'utils/getExplorerLink'

import ActionButton from '../../ActionButton'
import Column from '../../Column'
import Row from '../../Row'

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

type PendingTransaction = Transaction<SwapTransactionInfo | WrapTransactionInfo>

function ElapsedTime({ tx }: { tx: PendingTransaction }) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useInterval(() => setElapsedMs(Date.now() - tx.addedTime), tx.receipt ? null : ms`1s`)

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

interface TransactionStatusProps {
  tx: PendingTransaction
  onClose: () => void
}

function TransactionStatus({ tx, onClose }: TransactionStatusProps) {
  const Icon = useMemo(() => {
    return tx.receipt?.status ? CheckCircle : Spinner
  }, [tx.receipt?.status])
  const heading = useMemo(() => {
    if (tx.info.type === TransactionType.SWAP) {
      return tx.receipt?.status ? <Trans>Swap confirmed</Trans> : <Trans>Swap pending</Trans>
    } else if (tx.info.type === TransactionType.WRAP) {
      if (tx.info.unwrapped) {
        return tx.receipt?.status ? <Trans>Unwrap confirmed</Trans> : <Trans>Unwrap pending</Trans>
      }
      return tx.receipt?.status ? <Trans>Wrap confirmed</Trans> : <Trans>Wrap pending</Trans>
    }
    return tx.receipt?.status ? <Trans>Transaction confirmed</Trans> : <Trans>Transaction pending</Trans>
  }, [tx.info, tx.receipt?.status])

  return (
    <Column flex padded gap={0.75} align="stretch" style={{ height: '100%' }}>
      <StatusHeader icon={Icon} iconColor={tx.receipt?.status ? 'success' : undefined}>
        <ThemedText.Subhead1>{heading}</ThemedText.Subhead1>
        {tx.info.type === TransactionType.SWAP ? (
          <SwapSummary input={tx.info.inputCurrencyAmount} output={tx.info.outputCurrencyAmount} />
        ) : null}
      </StatusHeader>
      <TransactionRow flex>
        <ThemedText.ButtonSmall>
          <EtherscanLink type={ExplorerDataType.TRANSACTION} data={tx.info.response.hash}>
            <Trans>View on Etherscan</Trans>
          </EtherscanLink>
        </ThemedText.ButtonSmall>
        <ElapsedTime tx={tx} />
      </TransactionRow>
      <ActionButton onClick={onClose}>
        <Trans>Close</Trans>
      </ActionButton>
    </Column>
  )
}

export default function TransactionStatusDialog({ tx, onClose }: TransactionStatusProps) {
  return tx.receipt?.status === 0 ? (
    <ErrorDialog
      header={errorMessage}
      error={new Error('TODO(zzmp)')}
      action={<Trans>Dismiss</Trans>}
      onClick={onClose}
    />
  ) : (
    <TransactionStatus tx={tx} onClose={onClose} />
  )
}
