import { Trans } from '@lingui/macro'
import { DAI, ETH, UNI, USDC } from 'lib/mocks'
import styled, { icon, ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle, Trash2 } from 'react-feather'

import Button from './Button'
import Column from './Column'
import { Header } from './Dialog'
import Row from './Row'
import SpinnerIcon from './SpinnerIcon'

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

const TrashIcon = icon(Trash2)
const ArrowIcon = icon(ArrowRight)
const SuccessIcon = icon(CheckCircle, { color: 'success' })
const ErrorIcon = icon(AlertTriangle, { color: 'error' })

const TransactionRow = styled(Row)`
  padding: 0.5em 1em;

  :first-of-type {
    padding-top: 1em;
  }
`

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1em;
  width: 1em;
`

function TokenAmount({ value: { value, token } }: { value: ITokenAmount }) {
  return (
    <Row gap={0.375}>
      <TokenImg src={token.logoURI} />
      <ThemedText.Body2>
        {value.toLocaleString('en')} {token.symbol}
      </ThemedText.Body2>
    </Row>
  )
}

function Transaction({ tx }: { tx: ITransaction }) {
  const Status = useMemo(() => {
    switch (tx.status) {
      case TransactionStatus.SUCCESS:
        return SuccessIcon
      case TransactionStatus.ERROR:
        return ErrorIcon
      case TransactionStatus.PENDING:
        return SpinnerIcon
    }
  }, [tx.status])
  return (
    <TransactionRow grow>
      <Row gap={0.75}>
        <Row flex gap={0.5}>
          <TokenAmount value={tx.input} />
          <Row flex justify="flex-end" gap={0.5} grow>
            <ArrowIcon />
            <TokenAmount value={tx.output} />
          </Row>
        </Row>
        <Status />
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
          <TrashIcon onClick={() => setTxs([])} />
        </Button>
      </Header>
      <Column scrollable>
        {txs.map((tx, key) => (
          <Transaction tx={tx} key={key} />
        ))}
      </Column>
    </>
  )
}
