import { Trans } from '@lingui/macro'
import { AlertTriangle, ArrowRight, CheckCircle, Spinner, Trash2 } from 'lib/icons'
import { DAI, ETH, UNI, USDC } from 'lib/mocks'
import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { useMemo, useState } from 'react'

import Button from './Button'
import Column from './Column'
import { Header } from './Dialog'
import Row from './Row'
import TokenImg from './TokenImg'

interface ITokenAmount {
  value: number
  token: Token
}

export enum TransactionStatus {
  SUCCESS = 0,
  ERROR,
  PENDING,
}

interface ITransaction {
  input: ITokenAmount
  output: ITokenAmount
  status: TransactionStatus
}

// TODO: integrate with web3-react context
export const mockTxs: ITransaction[] = [
  {
    input: { value: 4170.15, token: USDC },
    output: { value: 4167.44, token: DAI },
    status: TransactionStatus.SUCCESS,
  },
  {
    input: { value: 1.23, token: ETH },
    output: { value: 4125.02, token: DAI },
    status: TransactionStatus.PENDING,
  },
  {
    input: { value: 10, token: UNI },
    output: { value: 2125.02, token: ETH },
    status: TransactionStatus.ERROR,
  },
]

const TransactionRow = styled(Row)`
  padding: 0.5em 1em;

  :first-of-type {
    padding-top: 1em;
  }
`

function TokenAmount({ value: { value, token } }: { value: ITokenAmount }) {
  return (
    <Row gap={0.375}>
      <TokenImg token={token} />
      <ThemedText.Body2>
        {value.toLocaleString('en')} {token.symbol}
      </ThemedText.Body2>
    </Row>
  )
}

function Transaction({ tx }: { tx: ITransaction }) {
  const statusIcon = useMemo(() => {
    switch (tx.status) {
      case TransactionStatus.SUCCESS:
        return <CheckCircle color="success" />
      case TransactionStatus.ERROR:
        return <AlertTriangle color="error" />
      case TransactionStatus.PENDING:
        return <Spinner />
    }
  }, [tx.status])
  return (
    <TransactionRow grow>
      <Row gap={0.75}>
        <Row flex gap={0.5}>
          <TokenAmount value={tx.input} />
          <Row flex justify="flex-end" gap={0.5} grow>
            <ArrowRight />
            <TokenAmount value={tx.output} />
          </Row>
        </Row>
        {statusIcon}
      </Row>
    </TransactionRow>
  )
}

export default function RecentTransactionsDialog() {
  const [txs, setTxs] = useState(mockTxs)

  return (
    <>
      <Header title={<Trans>Recent transactions</Trans>} ruled>
        <Button>
          <Trash2 onClick={() => setTxs([])} />
        </Button>
      </Header>
      <Column>
        {txs.map((tx, key) => (
          <Transaction tx={tx} key={key} />
        ))}
      </Column>
    </>
  )
}
