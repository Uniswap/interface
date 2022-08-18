import { Trans } from '@lingui/macro'
import { Fraction, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import {
  AddLiquidityV3PoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import styled from 'styled-components/macro'

import { useCurrency } from '../../hooks/Tokens'
import { TransactionState } from './index'

const HighlightText = styled.span`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;
`

interface ActionProps {
  pending: JSX.Element
  success: JSX.Element
  failed: JSX.Element
  transactionState: TransactionState
}

const Action = ({ pending, success, failed, transactionState }: ActionProps) => {
  switch (transactionState) {
    case TransactionState.Failed:
      return failed
    case TransactionState.Success:
      return success
    default:
      return pending
  }
}

const formatAmount = (amountRaw: string, decimals: number, sigFigs: number): string =>
  new Fraction(amountRaw, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(sigFigs)

const FailedText = ({ transactionState }: { transactionState: TransactionState }) =>
  transactionState === TransactionState.Failed ? <Trans>failed</Trans> : <span />

const FormattedCurrencyAmount = ({
  rawAmount,
  currencyId,
  sigFigs = 2,
}: {
  rawAmount: string
  currencyId: string
  sigFigs: number
}) => {
  const currency = useCurrency(currencyId)

  return currency ? (
    <HighlightText>
      {formatAmount(rawAmount, currency.decimals, sigFigs)} {currency.symbol}
    </HighlightText>
  ) : null
}

const getRawAmounts = (
  info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
): { rawAmountFrom: string; rawAmountTo: string } => {
  return info.tradeType === TradeType.EXACT_INPUT
    ? { rawAmountFrom: info.inputCurrencyAmountRaw, rawAmountTo: info.expectedOutputCurrencyAmountRaw }
    : { rawAmountFrom: info.expectedInputCurrencyAmountRaw, rawAmountTo: info.outputCurrencyAmountRaw }
}

const SwapSummary = ({
  info,
  transactionState,
}: {
  info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  transactionState: TransactionState
}) => {
  const actionProps = {
    transactionState,
    pending: <Trans>Swapping</Trans>,
    success: <Trans>Swapped</Trans>,
    failed: <Trans>Swap</Trans>,
  }
  const { rawAmountFrom, rawAmountTo } = getRawAmounts(info)

  return (
    <>
      <Action {...actionProps} />{' '}
      <FormattedCurrencyAmount rawAmount={rawAmountFrom} currencyId={info.inputCurrencyId} sigFigs={2} />{' '}
      <Trans>for </Trans>{' '}
      <FormattedCurrencyAmount rawAmount={rawAmountTo} currencyId={info.outputCurrencyId} sigFigs={2} />{' '}
      <FailedText transactionState={transactionState} />
    </>
  )
}

const AddLiquidityV3PoolSummary = ({
  info,
  transactionState,
}: {
  info: AddLiquidityV3PoolTransactionInfo
  transactionState: TransactionState
}) => {
  const { createPool, quoteCurrencyId, baseCurrencyId } = info

  const actionProps = {
    transactionState,
    pending: <Trans>Adding</Trans>,
    success: <Trans>Added</Trans>,
    failed: <Trans>Add</Trans>,
  }

  return (
    <>
      {createPool ? (
        <CreateV3PoolSummary info={info} transactionState={transactionState} />
      ) : (
        <>
          <Action {...actionProps} />{' '}
          <FormattedCurrencyAmount rawAmount={info.expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={2} />{' '}
          <Trans>and</Trans>{' '}
          <FormattedCurrencyAmount rawAmount={info.expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={2} />
        </>
      )}{' '}
      <FailedText transactionState={transactionState} />
    </>
  )
}

const RemoveLiquidityV3Summary = ({
  info: { baseCurrencyId, quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw },
  transactionState,
}: {
  info: RemoveLiquidityV3TransactionInfo
  transactionState: TransactionState
}) => {
  const actionProps = {
    transactionState,
    pending: <Trans>Removing</Trans>,
    success: <Trans>Removed</Trans>,
    failed: <Trans>Remove</Trans>,
  }

  return (
    <>
      <Action {...actionProps} />{' '}
      <FormattedCurrencyAmount rawAmount={expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={2} />{' '}
      <Trans>and</Trans>{' '}
      <FormattedCurrencyAmount rawAmount={expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={2} />{' '}
      <FailedText transactionState={transactionState} />
    </>
  )
}

const CreateV3PoolSummary = ({
  info: { baseCurrencyId, quoteCurrencyId },
  transactionState,
}: {
  info: AddLiquidityV3PoolTransactionInfo
  transactionState: TransactionState
}) => {
  const baseCurrency = useCurrency(baseCurrencyId)
  const quoteCurrency = useCurrency(quoteCurrencyId)
  const actionProps = {
    transactionState,
    pending: <Trans>Creating</Trans>,
    success: <Trans>Created</Trans>,
    failed: <Trans>Create</Trans>,
  }

  return (
    <>
      <Action {...actionProps} />{' '}
      <HighlightText>
        {baseCurrency?.symbol}/{quoteCurrency?.symbol}{' '}
      </HighlightText>
      <Trans>Pool</Trans> <FailedText transactionState={transactionState} />
    </>
  )
}

const TransactionBody = ({ info, transactionState }: { info: TransactionInfo; transactionState: TransactionState }) => {
  switch (info.type) {
    case TransactionType.SWAP:
      return <SwapSummary info={info} transactionState={transactionState} />
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
      return <AddLiquidityV3PoolSummary info={info} transactionState={transactionState} />
    case TransactionType.REMOVE_LIQUIDITY_V3:
      return <RemoveLiquidityV3Summary info={info} transactionState={transactionState} />
    default:
      return <span />
  }
}

export default TransactionBody
