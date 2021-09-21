import { Trans } from '@lingui/macro'
import { CurrencyAmount, Fraction, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { CheckCircle, Triangle } from 'react-feather'
import styled from 'styled-components/macro'
import { ExtendedEther } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'

import { useActiveWeb3React } from '../../hooks/web3'
import { VoteOption } from '../../state/governance/model'
import {
  AddLiquidityV2PoolTransactionInfo,
  AddLiquidityV3PoolTransactionInfo,
  ApproveTransactionInfo,
  ClaimTransactionInfo,
  CollectFeesTransactionInfo,
  CreateV3PoolTransactionInfo,
  DelegateTransactionInfo,
  DepositLiquidityStakingTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  SubmitProposalTransactionInfo,
  TransactionInfo,
  TransactionType,
  VoteTransactionInfo,
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

function formatAmount(amountRaw: string, decimals: number, sigFigs: number): string {
  return new Fraction(amountRaw, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))).toSignificant(sigFigs)
}

function ClaimSummary({ info: { recipient, uniAmountRaw } }: { info: ClaimTransactionInfo }) {
  return typeof uniAmountRaw === 'string' ? (
    <Trans>
      Claim {formatAmount(uniAmountRaw, 18, 4)} UNI for {recipient}
    </Trans>
  ) : (
    <Trans>Claim UNI reward for {recipient}</Trans>
  )
}
function SubmitProposalTransactionSummary({}: { info: SubmitProposalTransactionInfo }) {
  return <Trans>Submitted new proposal</Trans>
}

function ApprovalSummary({ info }: { info: ApproveTransactionInfo }) {
  return <Trans>Approve {info.tokenAddress} to spend your tokens</Trans>
}

function VoteSummary({ info }: { info: VoteTransactionInfo }) {
  const proposalKey = `${info.governorAddress}/${info.proposalId}`
  if (info.reason && info.reason.trim().length > 0) {
    switch (info.decision) {
      case VoteOption.For:
        return <Trans>Voted in favor of proposal {proposalKey}</Trans>
      case VoteOption.Abstain:
        return <Trans>Abstain to vote for {proposalKey}</Trans>
      case VoteOption.Against:
        return <Trans>Vote against {proposalKey}</Trans>
    }
  } else {
    switch (info.decision) {
      case VoteOption.For:
        return (
          <Trans>
            Voted in favor of proposal {proposalKey} with reason &quot;{info.reason}&quot;
          </Trans>
        )
      case VoteOption.Abstain:
        return (
          <Trans>
            Abstain to vote for {proposalKey} with reason &quot;{info.reason}&quot;
          </Trans>
        )
      case VoteOption.Against:
        return (
          <Trans>
            Vote against {proposalKey} with reason &quot;{info.reason}&quot;
          </Trans>
        )
    }
  }
}

function DelegateSummary({ info: { delegatee } }: { info: DelegateTransactionInfo }) {
  return <Trans>Delegate voting power to {delegatee}</Trans>
}

function WrapSummary({ info: { currencyAmountRaw, unwrapped } }: { info: WrapTransactionInfo }) {
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

function DepositLiquidityStakingSummary({}: { info: DepositLiquidityStakingTransactionInfo }) {
  // not worth rendering the tokens since you can should no longer deposit liquidity in the staking contracts
  // todo: deprecate and delete the code paths that allow this, show user more information
  return <Trans>Deposit liquidity</Trans>
}

function WithdrawLiquidityStakingSummary({}: { info: WithdrawLiquidityStakingTransactionInfo }) {
  return <Trans>Withdraw deposited liquidity</Trans>
}

function MigrateLiquidityToV3Summary({
  info: { baseCurrencyId, quoteCurrencyId },
}: {
  info: MigrateV2LiquidityToV3TransactionInfo
}) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  return (
    <Trans>
      Migrate ${baseCurrency?.symbol}/${quoteCurrency?.symbol} liquidity to V3
    </Trans>
  )
}

function CreateV3PoolSummary({ info: { quoteCurrencyId, baseCurrencyId } }: { info: CreateV3PoolTransactionInfo }) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  return (
    <Trans>
      Create {baseCurrency?.symbol}/{quoteCurrency?.symbol} V3 pool
    </Trans>
  )
}

function CollectFeesSummary({ info: { currencyId0, currencyId1 } }: { info: CollectFeesTransactionInfo }) {
  const currency0 = useCurrency(currencyId0)
  const currency1 = useCurrency(currencyId1)

  return (
    <Trans>
      Create {currency0?.symbol}/{currency1?.symbol} V3 pool
    </Trans>
  )
}

function RemoveLiquidityV3Summary({
  info: { baseCurrencyId, quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw },
}: {
  info: RemoveLiquidityV3TransactionInfo
}) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  const [baseAmount, quoteAmount] = useMemo(() => {
    return [
      baseCurrency ? CurrencyAmount.fromRawAmount(baseCurrency, expectedAmountBaseRaw) : null,
      quoteCurrency ? CurrencyAmount.fromRawAmount(quoteCurrency, expectedAmountQuoteRaw) : null,
    ]
  }, [baseCurrency, expectedAmountBaseRaw, expectedAmountQuoteRaw, quoteCurrency])

  return (
    <Trans>
      Remove {baseAmount?.toSignificant(3)} {baseCurrency?.symbol} and {quoteAmount?.toSignificant(3)}
      {quoteCurrency?.symbol}
    </Trans>
  )
}

function AddLiquidityV3PoolSummary({
  info: { createPool, quoteCurrencyId, baseCurrencyId },
}: {
  info: AddLiquidityV3PoolTransactionInfo
}) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  return createPool ? (
    <Trans>
      Create pool and add {baseCurrency?.symbol}/{quoteCurrency?.symbol} V3 liquidity
    </Trans>
  ) : (
    <Trans>
      Add {baseCurrency?.symbol}/{quoteCurrency?.symbol} V3 liquidity
    </Trans>
  )
}

function AddLiquidityV2PoolSummary({
  info: { quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw, baseCurrencyId },
}: {
  info: AddLiquidityV2PoolTransactionInfo
}) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  const [baseAmount, quoteAmount] = useMemo(() => {
    return [
      baseCurrency ? CurrencyAmount.fromRawAmount(baseCurrency, expectedAmountBaseRaw) : null,
      quoteCurrency ? CurrencyAmount.fromRawAmount(quoteCurrency, expectedAmountQuoteRaw) : null,
    ]
  }, [baseCurrency, expectedAmountBaseRaw, expectedAmountQuoteRaw, quoteCurrency])

  return (
    <Trans>
      Add ${baseAmount?.toSignificant(3)} ${baseCurrency?.symbol} and ${quoteAmount?.toSignificant(3)} $
      {quoteCurrency?.symbol} to Uniswap V2
    </Trans>
  )
}

function SwapSummary({ info }: { info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo }) {
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
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
      return <AddLiquidityV3PoolSummary info={info} />

    case TransactionType.ADD_LIQUIDITY_V2_POOL:
      return <AddLiquidityV2PoolSummary info={info} />

    case TransactionType.CLAIM:
      return <ClaimSummary info={info} />

    case TransactionType.DEPOSIT_LIQUIDITY_STAKING:
      return <DepositLiquidityStakingSummary info={info} />

    case TransactionType.WITHDRAW_LIQUIDITY_STAKING:
      return <WithdrawLiquidityStakingSummary info={info} />

    case TransactionType.SWAP:
      return <SwapSummary info={info} />

    case TransactionType.APPROVAL:
      return <ApprovalSummary info={info} />

    case TransactionType.VOTE:
      return <VoteSummary info={info} />

    case TransactionType.DELEGATE:
      return <DelegateSummary info={info} />

    case TransactionType.WRAP:
      return <WrapSummary info={info} />

    case TransactionType.CREATE_V3_POOL:
      return <CreateV3PoolSummary info={info} />

    case TransactionType.MIGRATE_LIQUIDITY_V3:
      return <MigrateLiquidityToV3Summary info={info} />

    case TransactionType.COLLECT_FEES:
      return <CollectFeesSummary info={info} />

    case TransactionType.REMOVE_LIQUIDITY_V3:
      return <RemoveLiquidityV3Summary info={info} />

    case TransactionType.SUBMIT_PROPOSAL:
      return <SubmitProposalTransactionSummary info={info} />
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
