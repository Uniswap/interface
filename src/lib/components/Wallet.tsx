import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Trash2 } from 'react-feather'

import Button from './Button'
import Column from './Column'
import Dialog, { DialogBody, DialogHeader } from './Dialog'
import Row from './Row'
import SpinnerIcon from './SpinnerIcon'

interface TokenAmount {
  value: number
  symbol: string
  logoUri?: string
}

enum TransactionStatus {
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
const mockTxs: Transaction[] = [
  {
    input: {
      value: 4170.15,
      symbol: 'USDC',
      logoUri:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
    output: { value: 4167.44, symbol: 'DAI', logoUri: 'https://gemini.com/images/currencies/icons/default/dai.svg' },
    status: TransactionStatus.SUCCESS,
  },
  {
    input: {
      value: 1.23,
      symbol: 'ETH',
      logoUri: 'https://raw.githubusercontent.com/Uniswap/interface/main/src/assets/images/ethereum-logo.png',
    },
    output: { value: 4125.02, symbol: 'DAI', logoUri: 'https://gemini.com/images/currencies/icons/default/dai.svg' },
    status: TransactionStatus.PENDING,
  },
  {
    input: { value: 10, symbol: 'UNI', logoUri: 'https://gemini.com/images/currencies/icons/default/uni.svg' },
    output: {
      value: 2125.02,
      symbol: 'ETH',
      logoUri: 'https://raw.githubusercontent.com/Uniswap/interface/main/src/assets/images/ethereum-logo.png',
    },
    status: TransactionStatus.ERROR,
  },
]

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.module};
  border-radius: inherit;
  height: 100%;
`

const Body = styled(Column)`
  padding: 0.5em 0;
`

const TrashIcon = icon(Trash2)
const ArrowIcon = icon(ArrowRight)
const SuccessIcon = icon(CheckCircle, { color: 'success' })
const ErrorIcon = icon(AlertTriangle, { color: 'error' })

const TransactionRow = styled(Row)`
  padding: 0.5em 1em;
`

const TokenImg = styled.img`
  border-radius: 0.5em;
  height: 1em;
  width: 1em;
`

function TokenAmount({ value: { value, symbol, logoUri } }: { value: TokenAmount }) {
  return (
    <Row gap="0.375em">
      <TokenImg src={logoUri} />
      <TYPE.body2>
        {value.toLocaleString('en')} {symbol}
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
        <Row gap="0.5em">
          <TokenAmount value={tx.input} />
          <ArrowIcon />
          <TokenAmount value={tx.output} />
        </Row>
        <Status />
      </Row>
    </TransactionRow>
  )
}

export function TransactionsDialog({ onClose }: { onClose: () => void }) {
  const [txs, setTxs] = useState(mockTxs)

  return (
    <Wrapper>
      <DialogHeader title="Recent transactions" onClose={onClose}>
        <Button>
          <TrashIcon onClick={() => setTxs([])} />
        </Button>
      </DialogHeader>
      <DialogBody>
        <Body>
          {txs.map((tx, key) => (
            <Transaction tx={tx} key={key} />
          ))}
        </Body>
      </DialogBody>
    </Wrapper>
  )
}

const TransactionsIcon = icon(Clock)

export default function Wallet() {
  const txs = mockTxs

  const [open, setOpen] = useState(false)
  const Icon = useMemo(() => {
    if (txs.length === 0) {
      return undefined
    }
    return txs.some(({ status }) => status === TransactionStatus.PENDING) ? SpinnerIcon : TransactionsIcon
  }, [txs])
  if (Icon) {
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <Icon />
        </Button>
        {open && (
          <Dialog>
            <TransactionsDialog onClose={() => setOpen(false)} />
          </Dialog>
        )}
      </>
    )
  }
  return null
}
