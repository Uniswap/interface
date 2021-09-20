import { Trans } from '@lingui/macro'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CheckCircle, Triangle } from 'react-feather'
import styled from 'styled-components/macro'
import { ExtendedEther } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'

import { useActiveWeb3React } from '../../hooks/web3'
import {
  ApproveTransactionInfo,
  ClaimTransactionInfo,
  DelegateTransactionInfo,
  DepositLiquidityStakingTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionInfo,
  TransactionType,
  VoteTransactionInfo,
  VotingDecision,
  WithdrawLiquidityStakingTransactionInfo,
  WrapTransactionInfo,
} from '../../state/transactions/actions'
import { useAllTransactions } from '../../state/transactions/hooks'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import Loader from '../Loader'
import { RowFixed } from '../Row'

const TransactionStatusText = styled.div`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  :hover {
    text-decoration: underline;
  }
`

const TransactionState = styled(ExternalLink)<{ pending: boolean; success?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none !important;
  border-radius: 0.5rem;
  padding: 0.25rem 0rem;
  font-weight: 500;
  font-size: 0.825rem;
  color: ${({ theme }) => theme.primary1};
`

const IconWrapper = styled.div<{ pending: boolean; success?: boolean }>`
  color: ${({ pending, success, theme }) => (pending ? theme.primary1 : success ? theme.green1 : theme.red1)};
`

function ClaimInfo({ info }: { info: ClaimTransactionInfo }) {
  return <Trans>Claim accumulated UNI rewards for {info.recipient}</Trans>
}

function ApprovalInfo({ info }: { info: ApproveTransactionInfo }) {
  return <Trans>Approve {info.tokenAddress} to spend your tokens</Trans>
}

function VoteInfo({ info }: { info: VoteTransactionInfo }) {
  const proposalKey = `${info.governorAddress}/${info.proposalId}`
  if (info.reason && info.reason.trim().length > 0) {
    switch (info.decision) {
      case VotingDecision.FAVOR:
        return <Trans>Voted in favor of proposal {proposalKey}</Trans>
      case VotingDecision.ABSTAIN:
        return <Trans>Abstain to vote for {proposalKey}</Trans>
      case VotingDecision.OPPOSE:
        return <Trans>Vote against {proposalKey}</Trans>
    }
  } else {
    switch (info.decision) {
      case VotingDecision.FAVOR:
        return (
          <Trans>
            Voted in favor of proposal {proposalKey} with reason {info.reason}
          </Trans>
        )
      case VotingDecision.ABSTAIN:
        return (
          <Trans>
            Abstain to vote for {proposalKey} with reason {info.reason}
          </Trans>
        )
      case VotingDecision.OPPOSE:
        return (
          <Trans>
            Vote against {proposalKey} with reason {info.reason}
          </Trans>
        )
    }
  }
}

function DelegateInfo({ info: { delegatee } }: { info: DelegateTransactionInfo }) {
  return <Trans>Delegate voting power to {delegatee}</Trans>
}

function WrapInfo({ info: { currencyAmountRaw, unwrapped } }: { info: WrapTransactionInfo }) {
  const { chainId } = useActiveWeb3React()
  const amount = useMemo(() => {
    if (!chainId) return undefined
    const ether = ExtendedEther.onChain(chainId)
    return CurrencyAmount.fromRawAmount(ether, currencyAmountRaw)
  }, [chainId, currencyAmountRaw])

  if (unwrapped) {
    return <Trans>Unwrap {amount?.toSignificant(6)} WETH to ETH</Trans>
  } else {
    return <Trans>Wrap {amount?.toSignificant(6)} ETH to WETH</Trans>
  }
}

function DepositLiquidityStakingInfo({}: { info: DepositLiquidityStakingTransactionInfo }) {
  // not worth rendering the tokens since you can should no longer deposit liquidity in the staking contracts
  // todo: deprecate and delete the code paths that allow this, show user more information
  return <Trans>Deposit liquidity</Trans>
}

function WithdrawLiquidityStakingInfo({}: { info: WithdrawLiquidityStakingTransactionInfo }) {
  return <Trans>Withdraw deposited liquidity</Trans>
}

function SwapInfo({ info }: { info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo }) {
  const { inputCurrencyId, outputCurrencyId } = info
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const [inputCurrencyAmount, outputCurrencyAmount] = useMemo(() => {
    if (info.tradeType === TradeType.EXACT_INPUT) {
      return [
        inputCurrency ? CurrencyAmount.fromRawAmount(inputCurrency, info.inputCurrencyAmountRaw) : undefined,
        outputCurrency ? CurrencyAmount.fromRawAmount(outputCurrency, info.expectedOutputCurrencyAmountRaw) : undefined,
      ]
    } else {
      return [
        inputCurrency ? CurrencyAmount.fromRawAmount(inputCurrency, info.expectedInputCurrencyAmountRaw) : undefined,
        outputCurrency ? CurrencyAmount.fromRawAmount(outputCurrency, info.outputCurrencyAmountRaw) : undefined,
      ]
    }
  }, [info, inputCurrency, outputCurrency])

  if (info.tradeType === TradeType.EXACT_INPUT) {
    return (
      <Trans>
        Swap exactly {inputCurrencyAmount?.toSignificant(4)} {inputCurrencyAmount?.currency.symbol} for{' '}
        {outputCurrencyAmount?.toSignificant(4)} {outputCurrencyAmount?.currency.symbol}
      </Trans>
    )
  } else {
    return (
      <Trans>
        Swap {inputCurrencyAmount?.toSignificant(4)} {inputCurrencyAmount?.currency.symbol} for exactly{' '}
        {outputCurrencyAmount?.toSignificant(4)} {outputCurrencyAmount?.currency.symbol}
      </Trans>
    )
  }
}

export function TransactionSummary({ info }: { info: TransactionInfo }) {
  switch (info.type) {
    case TransactionType.CLAIM:
      return <ClaimInfo info={info} />

    case TransactionType.DEPOSIT_LIQUIDITY_STAKING:
      return <DepositLiquidityStakingInfo info={info} />
    case TransactionType.WITHDRAW_LIQUIDITY_STAKING:
      return <WithdrawLiquidityStakingInfo info={info} />

    case TransactionType.SWAP:
      return <SwapInfo info={info} />

    case TransactionType.APPROVAL:
      return <ApprovalInfo info={info} />

    case TransactionType.VOTE:
      return <VoteInfo info={info} />

    case TransactionType.DELEGATE:
      return <DelegateInfo info={info} />

    case TransactionType.WRAP:
      return <WrapInfo info={info} />
  }
}

export default function Transaction({ hash }: { hash: string }) {
  const { chainId } = useActiveWeb3React()
  const allTransactions = useAllTransactions()

  const tx = allTransactions?.[hash]
  const info = tx?.info
  const pending = !tx?.receipt
  const success = !pending && tx && (tx.receipt?.status === 1 || typeof tx.receipt?.status === 'undefined')

  if (!chainId) return null

  return (
    <div>
      <TransactionState
        href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
        pending={pending}
        success={success}
      >
        <RowFixed>
          <TransactionStatusText>{<TransactionSummary info={info} />} ↗</TransactionStatusText>
        </RowFixed>
        <IconWrapper pending={pending} success={success}>
          {pending ? <Loader /> : success ? <CheckCircle size="16" /> : <Triangle size="16" />}
        </IconWrapper>
      </TransactionState>
    </div>
  )
}
