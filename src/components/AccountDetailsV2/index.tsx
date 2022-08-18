import { Trans } from '@lingui/macro'
import { Fraction, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import JSBI from 'jsbi'
import { AlertTriangle, CheckCircle } from 'react-feather'
import {
  AddLiquidityV3PoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import styled, { css } from 'styled-components/macro'
import { colors } from 'theme/colors'

import { useCurrency } from '../../hooks/Tokens'
import { TransactionDetails } from '../../state/transactions/types'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'

enum TransactionState {
  Pending,
  Success,
  Failed,
}

const formatAmount = (amountRaw: string, decimals: number, sigFigs: number): string =>
  new Fraction(amountRaw, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(sigFigs)

const HighlightText = styled.span`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;
`

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

const Grid = styled.a`
  cursor: pointer;
  display: grid;
  grid-template-columns: 44px auto 24px;
  width: 100%;
  text-decoration: none;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  padding: 12px;
`

const TextContainer = styled.span`
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;
  color: ${({ theme }) => theme.textTertiary};
`

const IconStyleWrap = styled.span`
  margin-top: auto;
  margin-bottom: auto;
  margin-left: auto;
  height: 16px;
`

const TransactionContainer = ({
  currencyLogo,
  children,
  link,
  transactionState,
}: {
  currencyLogo: JSX.Element
  children: JSX.Element | JSX.Element[]
  link?: string
  transactionState: TransactionState
}) => {
  return (
    <Grid href={link}>
      {currencyLogo}
      <TextContainer as="span">{children}</TextContainer>
      {transactionState === TransactionState.Pending ? (
        <IconStyleWrap>
          <Loader />
        </IconStyleWrap>
      ) : transactionState === TransactionState.Success ? (
        <IconStyleWrap>
          <CheckCircle color={colors.green200} size="16px" />
        </IconStyleWrap>
      ) : (
        <IconStyleWrap>
          <AlertTriangle color={colors.gold200} size="16px" />
        </IconStyleWrap>
      )}
    </Grid>
  )
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

export const getBody = ({ info, transactionState }: { info: TransactionInfo; transactionState: TransactionState }) => {
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

export const TransactionSummary = ({ transactionDetails }: { transactionDetails: TransactionDetails }) => {
  const { chainId = 1 } = useWeb3React()
  const tx = transactionDetails
  const { explorer } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)
  const { info, receipt, hash } = tx
  const pending = !receipt
  const success = !pending && tx && (receipt?.status === 1 || typeof receipt?.status === 'undefined')
  const transactionState = pending
    ? TransactionState.Pending
    : success
    ? TransactionState.Success
    : TransactionState.Failed

  const currencyLogo = getCurrencyLogo({ info })
  const body = getBody({ info, transactionState })
  const link = `${explorer}tx/${hash}`

  return chainId ? (
    <TransactionContainer transactionState={transactionState} link={link} currencyLogo={currencyLogo}>
      {body}
    </TransactionContainer>
  ) : null
}

const CurrencyWrap = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
`

const CurrencyWrapStyles = css`
  position: absolute;
  height: 24px;
`

const CurrencyLogoWrap = styled.span<{ isCentered: boolean }>`
  ${CurrencyWrapStyles};
  left: ${({ isCentered }) => (isCentered ? '50%' : '0')};
  top: ${({ isCentered }) => (isCentered ? '50%' : '0')};
  transform: ${({ isCentered }) => isCentered && 'translate(-50%, -50%)'};
`
const CurrencyLogoWrapTwo = styled.span`
  ${CurrencyWrapStyles};
  bottom: 0px;
  right: 0px;
`

export const LogoView = ({ currencyId0, currencyId1 }: { currencyId0: string; currencyId1?: string }) => {
  const currency0 = useCurrency(currencyId0)
  const currency1 = useCurrency(currencyId1)
  const isCentered = !(currency0 && currency1)

  return (
    <CurrencyWrap>
      <CurrencyLogoWrap isCentered={isCentered}>
        <CurrencyLogo size="24px" currency={currency0} />
      </CurrencyLogoWrap>
      {!isCentered && (
        <CurrencyLogoWrapTwo>
          <CurrencyLogo size="24px" currency={currency1} />
        </CurrencyLogoWrapTwo>
      )}
    </CurrencyWrap>
  )
}

const getCurrencyLogo = ({ info }: { info: TransactionInfo }) => {
  switch (info.type) {
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
    case TransactionType.REMOVE_LIQUIDITY_V3:
      const { baseCurrencyId, quoteCurrencyId } = info
      return <LogoView currencyId0={baseCurrencyId} currencyId1={quoteCurrencyId} />
    case TransactionType.SWAP:
      const { inputCurrencyId, outputCurrencyId } = info
      return <LogoView currencyId0={inputCurrencyId} currencyId1={outputCurrencyId} />
    default:
      return <LogoView currencyId0="" />
  }
}
