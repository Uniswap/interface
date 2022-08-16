import { Trans } from '@lingui/macro'
import { Fraction, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { UNI_ADDRESS } from 'constants/addresses'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import JSBI from 'jsbi'
import { AlertTriangle, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import {
  AddLiquidityV3PoolTransactionInfo,
  ApproveTransactionInfo,
  ClaimTransactionInfo,
  CollectFeesTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  TransactionInfo,
  TransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

import { nativeOnChain } from '../../constants/tokens'
import { useCurrency, useToken } from '../../hooks/Tokens'
import useENSName from '../../hooks/useENSName'
import { shortenAddress } from '../../nft/utils/address'
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
  border-bottom: 0.5px solid rgba(153, 161, 189, 0.24);
  padding: 12px;
`

const TextContainer = styled(Text)`
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;
  color: ${({ theme }) => theme.textTertiary};
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
  const iconStyle = { marginTop: 'auto', marginBottom: 'auto', marginLeft: 'auto' }

  return (
    <Grid href={link}>
      {currencyLogo}
      <TextContainer as="span">{children}</TextContainer>
      {transactionState === TransactionState.Pending ? (
        <Loader style={iconStyle} />
      ) : transactionState === TransactionState.Success ? (
        <CheckCircle style={iconStyle} color={colors.green200} size="16px" />
      ) : (
        <AlertTriangle style={iconStyle} color={colors.gold200} size="16px" />
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

const CollectFeesSummary = ({
  info,
  transactionState,
}: {
  info: CollectFeesTransactionInfo
  transactionState: TransactionState
}) => {
  const { currencyId0, expectedCurrencyOwed0 = '0', expectedCurrencyOwed1 = '0', currencyId1 } = info
  const action = [<Trans key="1">Collecting</Trans>, <Trans key="2">Collected</Trans>, <Trans key="3">Collect</Trans>][
    transactionState
  ]

  return (
    <>
      {action} <FormattedCurrencyAmount rawAmount={expectedCurrencyOwed0} currencyId={currencyId0} sigFigs={2} />{' '}
      <Trans>and</Trans>{' '}
      <FormattedCurrencyAmount rawAmount={expectedCurrencyOwed1} currencyId={currencyId1} sigFigs={2} />{' '}
      <Trans>fees</Trans> {getFailedText(transactionState)}
    </>
  )
}

const ApprovalSummary = ({
  info,
  transactionState,
}: {
  info: ApproveTransactionInfo
  transactionState: TransactionState
}) => {
  const token = useToken(info.tokenAddress)
  const action = [<Trans key="1">Approving</Trans>, <Trans key="2">Approved</Trans>, <Trans key="3">Approve</Trans>][
    transactionState
  ]

  return (
    <>
      {action} <HighlightText>{token?.symbol}</HighlightText> {getFailedText(transactionState)}
    </>
  )
}

const ClaimSummary = ({
  info: { recipient, uniAmountRaw },
  transactionState,
}: {
  info: ClaimTransactionInfo
  transactionState: TransactionState
}) => {
  const { ENSName } = useENSName()
  const action = [<Trans key="1">Claiming</Trans>, <Trans key="2">Claimed</Trans>, <Trans key="3">Claim</Trans>][
    transactionState
  ]

  return (
    <>
      {uniAmountRaw && (
        <>
          {action}{' '}
          <HighlightText>
            {formatAmount(uniAmountRaw, 18, 4)}
            <Trans>UNI</Trans>{' '}
          </HighlightText>{' '}
          <Trans>for</Trans> <HighlightText>{ENSName ?? shortenAddress(recipient)}</HighlightText>
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

const WrapSummary = ({
  info: { chainId, currencyAmountRaw, unwrapped },
  transactionState,
}: {
  info: WrapTransactionInfo
  transactionState: TransactionState
}) => {
  const native = chainId ? nativeOnChain(chainId) : undefined
  const from = unwrapped ? native?.wrapped.symbol ?? 'WETH' : native?.symbol ?? 'ETH'
  const to = unwrapped ? native?.symbol ?? 'ETH' : native?.wrapped.symbol ?? 'WETH'

  const amount = formatAmount(currencyAmountRaw, 18, 6)
  const action = unwrapped
    ? [<Trans key="1">Unwrapping</Trans>, <Trans key="2">Unwrapped</Trans>, <Trans key="3">Unwrap</Trans>][
        transactionState
      ]
    : [<Trans key="1">Wrapping</Trans>, <Trans key="2">Wrapped</Trans>, <Trans key="3">Wrap</Trans>][transactionState]

  return (
    <>
      {action}{' '}
      <HighlightText>
        {amount} {from}
      </HighlightText>{' '}
      <Trans>to</Trans>{' '}
      <HighlightText>
        {amount} {to}
      </HighlightText>{' '}
      {getFailedText(transactionState)}
    </>
  )
}

export const getBody = ({ info, transactionState }: { info: TransactionInfo; transactionState: TransactionState }) => {
  switch (info.type) {
    case TransactionType.SWAP:
      return <SwapSummary info={info} transactionState={transactionState} />
    case TransactionType.WRAP:
      return <WrapSummary info={info} transactionState={transactionState} />
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
      return <AddLiquidityV3PoolSummary info={info} transactionState={transactionState} />
    case TransactionType.REMOVE_LIQUIDITY_V3:
      return <RemoveLiquidityV3Summary info={info} transactionState={transactionState} />
    case TransactionType.COLLECT_FEES:
      return <CollectFeesSummary info={info} transactionState={transactionState} />
    case TransactionType.APPROVAL:
      return <ApprovalSummary info={info} transactionState={transactionState} />

    case TransactionType.CLAIM:
      return <ClaimSummary info={info} transactionState={transactionState} />
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

  const currencyLogo = getCurrencyLogo({ info, chainId })
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

const CurrencyLogoWrap = styled.span`
  position: absolute;
  height: 24;
  width: 24;
`

export const LogoView = ({ currencyId0, currencyId1 }: { currencyId0: string; currencyId1?: string }) => {
  const currency0 = useCurrency(currencyId0)
  const currency1 = useCurrency(currencyId1)

  const currencyOneLogoWrapStyle =
    currency0 && currency1
      ? { left: 0, top: 0 }
      : {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }

  return (
    <CurrencyWrap>
      <CurrencyLogoWrap style={currencyOneLogoWrapStyle}>
        <CurrencyLogo size="24px" currency={currency0} />
      </CurrencyLogoWrap>
      {currency1 && (
        <CurrencyLogoWrap style={{ right: 0, bottom: 0 }}>
          <CurrencyLogo size="24px" currency={currency1} />
        </CurrencyLogoWrap>
      )}
    </CurrencyWrap>
  )
}

const getCurrencyLogo = ({ info, chainId }: { info: TransactionInfo; chainId: number }) => {
  switch (info.type) {
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
    case TransactionType.REMOVE_LIQUIDITY_V3:
    case TransactionType.CREATE_V3_POOL:
      const { baseCurrencyId, quoteCurrencyId } = info
      return <LogoView currencyId0={baseCurrencyId} currencyId1={quoteCurrencyId} />
    case TransactionType.SWAP:
      const { inputCurrencyId, outputCurrencyId } = info
      return <LogoView currencyId0={inputCurrencyId} currencyId1={outputCurrencyId} />
    case TransactionType.WRAP:
      const { unwrapped } = info
      const native = chainId ? nativeOnChain(chainId) : undefined
      const base = 'ETH'
      const wrappedCurrency = native?.wrapped.address ?? 'WETH'

      return (
        <LogoView currencyId0={unwrapped ? wrappedCurrency : base} currencyId1={unwrapped ? base : wrappedCurrency} />
      )
    case TransactionType.COLLECT_FEES:
      const { currencyId0, currencyId1 } = info
      return <LogoView currencyId0={currencyId0} currencyId1={currencyId1} />
    case TransactionType.APPROVAL:
      return <LogoView currencyId0={info.tokenAddress} />
    case TransactionType.CLAIM:
      const uniAddress = UNI_ADDRESS[chainId]
      return <LogoView currencyId0={uniAddress} />
    default:
      return <LogoView currencyId0="" />
  }
}
