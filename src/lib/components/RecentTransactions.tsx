import { DAI, ETH, UNI, USDC } from 'lib/mocks'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle, Trash2 } from 'react-feather'

import Button from './Button'
import Column from './Column'
import { Header } from './Dialog'
import Row from './Row'
import SpinnerIcon from './SpinnerIcon'

interface TokenAmount {
  value: number
  token: Token
}

export enum TransactionStatus {
  SUCCESS = 0,
  ERROR,
  PENDING,
}

interface Transaction {
  input: TokenAmount
  output: TokenAmount
  status: TransactionStatus
}

// TODO: integrate with web3-react context
export const mockTxs: Transaction[] = [
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

function TokenAmount({ value: { value, token } }: { value: TokenAmount }) {
  return (
    <Row gap={0.375}>
      <TokenImg src={token.logoURI} />
      <TYPE.body2>
        {value.toLocaleString('en')} {token.symbol}
      </TYPE.body2>
    </Row>
  )
}

function Transaction({ tx }: { tx: Transaction }) {
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
      <Row>
        <Row gap={0.5}>
          <TokenAmount value={tx.input} />
          <ArrowIcon />
          <TokenAmount value={tx.output} />
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
      <Header title="Recent transactions" ruled>
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
