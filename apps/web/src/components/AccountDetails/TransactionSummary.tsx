import { Fraction, TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers/lib/ethers'
import { useCurrency, useToken } from 'hooks/Tokens'
import JSBI from 'jsbi'
import { Trans } from 'react-i18next'
import { VoteOption } from 'state/governance/types'
import {
  AddLiquidityV2PoolTransactionInfo,
  AddLiquidityV3PoolTransactionInfo,
  ApproveTransactionInfo,
  ClaimTransactionInfo,
  CollectFeesTransactionInfo,
  CreateV3PoolTransactionInfo,
  DecreaseLiquidityTransactionInfo,
  DelegateTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  ExecuteTransactionInfo,
  IncreaseLiquidityTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  QueueTransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  SendTransactionInfo,
  TransactionInfo,
  TransactionType,
  VoteTransactionInfo,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useENSName } from 'uniswap/src/features/ens/api'

function formatAmount(amountRaw: string, decimals: number, sigFigs: number): string {
  return new Fraction(amountRaw, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(sigFigs)
}

function FormattedCurrencyAmount({
  rawAmount,
  symbol,
  decimals,
  sigFigs,
}: {
  rawAmount: string
  symbol: string
  decimals: number
  sigFigs: number
}) {
  return (
    <>
      {formatAmount(rawAmount, decimals, sigFigs)} {symbol}
    </>
  )
}

function FormattedCurrencyAmountManaged({
  rawAmount,
  currencyId,
  sigFigs = 6,
}: {
  rawAmount: string
  currencyId: string
  sigFigs: number
}) {
  const currency = useCurrency(currencyId)
  return currency ? (
    <FormattedCurrencyAmount
      rawAmount={rawAmount}
      decimals={currency.decimals}
      sigFigs={sigFigs}
      symbol={currency.symbol ?? '???'}
    />
  ) : null
}

function ClaimSummary({ info: { recipient, uniAmountRaw } }: { info: ClaimTransactionInfo }) {
  const { data: ENSName } = useENSName()
  const username = ENSName ?? recipient
  return typeof uniAmountRaw === 'string' ? (
    <Trans
      i18nKey="account.transactionSummary.claimFor"
      components={{
        currency: <FormattedCurrencyAmount rawAmount={uniAmountRaw} symbol="UNI" decimals={18} sigFigs={4} />,
      }}
      values={{
        username,
      }}
    />
  ) : (
    <Trans i18nKey="account.transactionSummary.claimReward" values={{ username }} />
  )
}

function SubmitProposalTransactionSummary() {
  return <Trans i18nKey="account.transactionSummary.submitProposal"></Trans>
}

function ApprovalSummary({ info }: { info: ApproveTransactionInfo }) {
  const token = useToken(info.tokenAddress)

  return BigNumber.from(info.amount)?.eq(0) ? (
    <Trans i18nKey="account.transactionSummary.revoke" values={{ tokenSymbol: token?.symbol }} />
  ) : (
    <Trans i18nKey="account.transactionSummary.approve" values={{ sym: token?.symbol }} />
  )
}

function VoteSummary({ info }: { info: VoteTransactionInfo }) {
  const proposalKey = `${info.governorAddress}/${info.proposalId}`
  if (info.reason && info.reason.trim().length > 0) {
    switch (info.decision) {
      case VoteOption.For:
        return <Trans i18nKey="account.transactionSummary.vote.for" values={{ proposalKey }} />
      case VoteOption.Abstain:
        return <Trans i18nKey="account.transactionSummary.vote.abstain" values={{ proposalKey }} />
      case VoteOption.Against:
        return <Trans i18nKey="account.transactionSummary.vote.against" values={{ proposalKey }} />
    }
  } else {
    switch (info.decision) {
      case VoteOption.For:
        return <Trans i18nKey="account.transactionSummary.decision.for" values={{ proposalKey, reason: info.reason }} />
      case VoteOption.Abstain:
        return (
          <Trans i18nKey="account.transactionSummary.decision.abstain" values={{ proposalKey, reason: info.reason }} />
        )
      case VoteOption.Against:
        return (
          <Trans i18nKey="account.transactionSummary.decision.against" values={{ proposalKey, reason: info.reason }} />
        )
    }
  }
}

function QueueSummary({ info }: { info: QueueTransactionInfo }) {
  const proposalKey = `${info.governorAddress}/${info.proposalId}`
  return <Trans i18nKey="account.transactionSummary.queueProposal" values={{ proposalKey }} />
}

function ExecuteSummary({ info }: { info: ExecuteTransactionInfo }) {
  const proposalKey = `${info.governorAddress}/${info.proposalId}`
  return <Trans i18nKey="account.transactionSummary.executeProposal" values={{ proposalKey }} />
}

function DelegateSummary({ info: { delegatee } }: { info: DelegateTransactionInfo }) {
  const { data: ENSName } = useENSName(delegatee)
  const username = ENSName ?? delegatee
  return <Trans i18nKey="account.transactionSummary.delegateSummary" values={{ username }} />
}

function WrapSummary({ info: { chainId, currencyAmountRaw, unwrapped } }: { info: WrapTransactionInfo }) {
  const native = chainId ? nativeOnChain(chainId) : undefined

  if (unwrapped) {
    return (
      <Trans
        i18nKey="account.transactionSummary.unwrapTo"
        components={{
          amount: (
            <FormattedCurrencyAmount
              rawAmount={currencyAmountRaw}
              symbol={native?.wrapped?.symbol ?? 'WETH'}
              decimals={18}
              sigFigs={6}
            />
          ),
        }}
        values={{
          symbol: native?.symbol ?? 'ETH',
        }}
      />
    )
  } else {
    return (
      <Trans
        i18nKey="account.transactionSummary.wrapTo"
        components={{
          amount: (
            <FormattedCurrencyAmount
              rawAmount={currencyAmountRaw}
              symbol={native?.symbol ?? 'ETH'}
              decimals={18}
              sigFigs={6}
            />
          ),
        }}
        values={{
          symbol: native?.wrapped?.symbol ?? 'WETH',
        }}
      />
    )
  }
}

function DepositLiquidityStakingSummary() {
  // not worth rendering the tokens since you can should no longer deposit liquidity in the staking contracts
  // todo: deprecate and delete the code paths that allow this, show user more information
  return <Trans i18nKey="account.transactionSummary.depositLiquidity" />
}

function WithdrawLiquidityStakingSummary() {
  return <Trans i18nKey="account.transactionSummary.withdrawLiquidity" />
}

function MigrateLiquidityToV3Summary({
  info: { baseCurrencyId, quoteCurrencyId },
}: {
  info: MigrateV2LiquidityToV3TransactionInfo
}) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  return (
    <Trans
      i18nKey="account.transactionSummary.migrateLiquidity"
      values={{
        baseSymbol: baseCurrency?.symbol,
        quoteSymbol: quoteCurrency?.symbol,
      }}
    />
  )
}

function CreateV3PoolSummary({ info: { quoteCurrencyId, baseCurrencyId } }: { info: CreateV3PoolTransactionInfo }) {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)

  return (
    <Trans
      i18nKey="account.transactionSummary.createPool"
      values={{
        baseSymbol: baseCurrency?.symbol,
        quoteSymbol: quoteCurrency?.symbol,
      }}
    />
  )
}

function CollectFeesSummary({ info: { token0CurrencyId, token1CurrencyId } }: { info: CollectFeesTransactionInfo }) {
  const currency0 = useCurrency(token0CurrencyId)
  const currency1 = useCurrency(token1CurrencyId)

  return (
    <Trans
      i18nKey="account.transactionSummary.collectFees"
      values={{
        symbol0: currency0?.symbol,
        symbol1: currency1?.symbol,
      }}
    />
  )
}

function RemoveLiquidityV3Summary({
  info: { baseCurrencyId, quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw },
}: {
  info: RemoveLiquidityV3TransactionInfo
}) {
  return (
    <Trans
      i18nKey="account.transactionSummary.removeLiquiditySummary"
      components={{
        base: (
          <FormattedCurrencyAmountManaged rawAmount={expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={3} />
        ),
        quote: (
          <FormattedCurrencyAmountManaged rawAmount={expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={3} />
        ),
      }}
    />
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
    <Trans
      i18nKey="account.transactionSummary.createAddLiquidity"
      values={{
        baseSymbol: baseCurrency?.symbol,
        quoteSymbol: quoteCurrency?.symbol,
      }}
    />
  ) : (
    <Trans
      i18nKey="account.transactionSummary.addLiquidity"
      values={{
        baseSymbol: baseCurrency?.symbol,
        quoteSymbol: quoteCurrency?.symbol,
      }}
    />
  )
}

function AddLiquidityV2PoolSummary({
  info: { quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw, baseCurrencyId },
}: {
  info: AddLiquidityV2PoolTransactionInfo
}) {
  return (
    <Trans
      i18nKey="account.transactionSummary.addLiquidityv2"
      components={{
        baseAmountAndToken: (
          <FormattedCurrencyAmountManaged rawAmount={expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={3} />
        ),
        quoteAmountAndToken: (
          <FormattedCurrencyAmountManaged rawAmount={expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={3} />
        ),
      }}
    />
  )
}

function SendSummary({ info }: { info: SendTransactionInfo }) {
  return (
    <Trans
      i18nKey="account.transactionSummary.sendSummary"
      components={{
        amount: <FormattedCurrencyAmountManaged rawAmount={info.amount} currencyId={info.currencyId} sigFigs={6} />,
      }}
      values={{
        recipient: info.recipient,
      }}
    />
  )
}

function SwapSummary({ info }: { info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo }) {
  if (info.tradeType === TradeType.EXACT_INPUT) {
    return (
      <Trans
        i18nKey="account.transactionSummary.swapExactIn"
        components={{
          amount1: (
            <FormattedCurrencyAmountManaged
              rawAmount={info.inputCurrencyAmountRaw}
              currencyId={info.inputCurrencyId}
              sigFigs={6}
            />
          ),
          amount2: (
            <FormattedCurrencyAmountManaged
              rawAmount={info.settledOutputCurrencyAmountRaw ?? info.expectedOutputCurrencyAmountRaw}
              currencyId={info.outputCurrencyId}
              sigFigs={6}
            />
          ),
        }}
      />
    )
  } else {
    return (
      <Trans
        i18nKey="account.transactionSummary.swapExactOut"
        components={{
          amount1: (
            <FormattedCurrencyAmountManaged
              rawAmount={info.expectedInputCurrencyAmountRaw}
              currencyId={info.inputCurrencyId}
              sigFigs={6}
            />
          ),
          amount2: (
            <FormattedCurrencyAmountManaged
              rawAmount={info.outputCurrencyAmountRaw}
              currencyId={info.outputCurrencyId}
              sigFigs={6}
            />
          ),
        }}
      />
    )
  }
}

function IncreaseLiquiditySummary({ info }: { info: IncreaseLiquidityTransactionInfo }) {
  const { token0CurrencyId, token1CurrencyId } = info
  const token0Currency = useCurrency(token0CurrencyId)
  const token1Currency = useCurrency(token1CurrencyId)

  // TODO(WEB-5081): update to match mocks
  return (
    <Trans
      i18nKey="account.transactionSummary.addLiquidity"
      values={{
        baseSymbol: token0Currency?.symbol,
        quoteSymbol: token1Currency?.symbol,
      }}
    />
  )
}

function DecreaseLiquiditySummary({ info }: { info: DecreaseLiquidityTransactionInfo }) {
  const { token0CurrencyId, token1CurrencyId, token0CurrencyAmountRaw, token1CurrencyAmountRaw } = info

  return (
    <Trans
      i18nKey="account.transactionSummary.removeLiquiditySummary"
      components={{
        base: (
          <FormattedCurrencyAmountManaged
            rawAmount={token0CurrencyAmountRaw}
            currencyId={token0CurrencyId}
            sigFigs={3}
          />
        ),
        quote: (
          <FormattedCurrencyAmountManaged
            rawAmount={token1CurrencyAmountRaw}
            currencyId={token1CurrencyId}
            sigFigs={3}
          />
        ),
      }}
    />
  )
}

/** @deprecated this is only used in the legacy LP flows. */
export function TransactionSummary({ info }: { info: TransactionInfo }) {
  switch (info.type) {
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
      return <AddLiquidityV3PoolSummary info={info} />

    case TransactionType.ADD_LIQUIDITY_V2_POOL:
      return <AddLiquidityV2PoolSummary info={info} />

    case TransactionType.CLAIM:
      return <ClaimSummary info={info} />

    case TransactionType.DEPOSIT_LIQUIDITY_STAKING:
      return <DepositLiquidityStakingSummary />

    case TransactionType.WITHDRAW_LIQUIDITY_STAKING:
      return <WithdrawLiquidityStakingSummary />

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

    case TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3:
      return <MigrateLiquidityToV3Summary info={info} />

    case TransactionType.COLLECT_FEES:
      return <CollectFeesSummary info={info} />

    case TransactionType.REMOVE_LIQUIDITY_V3:
      return <RemoveLiquidityV3Summary info={info} />

    case TransactionType.QUEUE:
      return <QueueSummary info={info} />

    case TransactionType.EXECUTE:
      return <ExecuteSummary info={info} />

    case TransactionType.SUBMIT_PROPOSAL:
      return <SubmitProposalTransactionSummary />

    case TransactionType.SEND:
      return <SendSummary info={info} />

    case TransactionType.INCREASE_LIQUIDITY:
      return <IncreaseLiquiditySummary info={info} />

    case TransactionType.DECREASE_LIQUIDITY:
      return <DecreaseLiquiditySummary info={info} />

    case TransactionType.CREATE_POSITION:
    case TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4:
    case TransactionType.BRIDGE:
      return <></> // These features were launched after this code became deprecated
  }
}
