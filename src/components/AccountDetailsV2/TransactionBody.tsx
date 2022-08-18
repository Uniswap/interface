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

const formatAmount = (amountRaw: string, decimals: number, sigFigs: number): string =>
  new Fraction(amountRaw, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(sigFigs)

const getFailedText = (transactionState: TransactionState) =>
  transactionState === TransactionState.Failed ? <Trans>failed</Trans> : null

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

const SwapSummary = ({
  info,
  transactionState,
}: {
  info: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  transactionState: TransactionState
}) => {
  const action = [<Trans key="1">Swapping</Trans>, <Trans key="2">Swapped</Trans>, <Trans key="3">Swap</Trans>][
    transactionState
  ]

  return (
    <>
      {action}{' '}
      <FormattedCurrencyAmount
        rawAmount={
          info.tradeType === TradeType.EXACT_INPUT ? info.inputCurrencyAmountRaw : info.expectedInputCurrencyAmountRaw
        }
        currencyId={info.inputCurrencyId}
        sigFigs={2}
      />{' '}
      <Trans>for </Trans>{' '}
      <FormattedCurrencyAmount
        rawAmount={
          info.tradeType === TradeType.EXACT_INPUT ? info.expectedOutputCurrencyAmountRaw : info.outputCurrencyAmountRaw
        }
        currencyId={info.outputCurrencyId}
        sigFigs={2}
      />{' '}
      {getFailedText(transactionState)}
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
  const action = [<Trans key="1">Adding</Trans>, <Trans key="2">Added</Trans>, <Trans key="3">Add</Trans>][
    transactionState
  ]

  return (
    <>
      {createPool ? (
        <CreateV3PoolSummary info={info} transactionState={transactionState} />
      ) : (
        <>
          {action}{' '}
          <FormattedCurrencyAmount rawAmount={info.expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={2} />{' '}
          <Trans>and</Trans>{' '}
          <FormattedCurrencyAmount rawAmount={info.expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={2} />
        </>
      )}{' '}
      {getFailedText(transactionState)}
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
  const action = [<Trans key="1">Removing</Trans>, <Trans key="2">Removed</Trans>, <Trans key="3">Remove</Trans>][
    transactionState
  ]

  return (
    <>
      {action} <FormattedCurrencyAmount rawAmount={expectedAmountBaseRaw} currencyId={baseCurrencyId} sigFigs={2} />{' '}
      <Trans>and</Trans>{' '}
      <FormattedCurrencyAmount rawAmount={expectedAmountQuoteRaw} currencyId={quoteCurrencyId} sigFigs={2} />{' '}
      {getFailedText(transactionState)}
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
  const action = [<Trans key="1">Creating</Trans>, <Trans key="2">Created</Trans>, <Trans key="3">Create</Trans>][
    transactionState
  ]

  return (
    <>
      {action}{' '}
      <HighlightText>
        {baseCurrency?.symbol}/{quoteCurrency?.symbol}{' '}
      </HighlightText>
      <Trans>Pool</Trans> {getFailedText(transactionState)}
    </>
  )
}

export const getTransactionBody = ({
  info,
  transactionState,
}: {
  info: TransactionInfo
  transactionState: TransactionState
}) => {
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
