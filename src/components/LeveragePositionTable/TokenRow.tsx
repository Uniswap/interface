import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { formatNumber, formatPrice, formatUSDPrice, NumberType } from '@uniswap/conedison/format'
import { ParentSize } from '@visx/responsive'
import SparklineChart from 'components/Charts/SparklineChart'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL, validateUrlChainParam } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ForwardedRef, forwardRef, useMemo, useState } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Edit3, Info } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'
import moment from "moment"
import { BigNumber as BN } from "bignumber.js"

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from './constants'
import { LoadingBubble } from './loading'
import {
  filterStringAtom,
  filterTimeAtom,
  PositionSortMethod,
  sortAscendingAtom,
  sortMethodAtom,
  useSetSortMethod,
} from './state'
import { ArrowCell, DeltaText, formatDelta, getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useCurrency } from 'hooks/Tokens'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { LimitlessPositionDetails } from 'types/leveragePosition'
import { AutoColumn } from 'components/Column'
import ReducePositionModal, { AddLeveragePremiumModal } from 'components/swap/LMTModals'
import { useWeb3React } from '@web3-react/core'
import { SmallButtonPrimary } from 'components/Button'
import { ReduceButton, SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import { MaxButton } from 'pages/Pool/styleds'
import { usePool } from 'hooks/usePools'
import { Fraction, Price } from '@uniswap/sdk-core'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { formatSymbol } from 'lib/utils/formatSymbol'
import { TruncatedText } from 'components/swap/styleds'
import { EditCell, UnderlineText } from 'components/BorrowPositionTable/TokenRow'

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 12px;
`
const StyledTokenRow = styled.div<{
  first?: boolean
  last?: boolean
  loading?: boolean
}>`
  background-color: transparent;
  display: grid;
  font-size: 16px;
  grid-template-columns: 0.7fr 1fr 1fr 0.75fr 1fr 1fr 1fr 0.5fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
  `}
  padding-left: 8px;
  padding-right: 8px;
  transition: ${({
  theme: {
    transition: { duration, timing },
  },
}) => css`background-color ${duration.medium} ${timing.ease}`};
  width: 100%;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  &:hover {
    ${({ loading, theme }) =>
    !loading &&
    css`
        background-color: ${theme.hoverDefault};
      `}
    ${({ last }) =>
    last &&
    css`
        border-radius: 0px 0px 8px 8px;
      `}
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 0.7fr 1fr 1fr 0.75fr 1fr 1fr 1fr 0.5fr;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 0.7fr 1fr 1fr 0.75fr 1fr 1fr 1fr 0.5fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns:  0.7fr 1fr 1fr 0.75fr 1fr 1fr 1fr 0.5fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 2fr 3fr;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundModule};

    :last-of-type {
      border-bottom: none;
    }
  }
`

const ClickableContent = styled.div`
  display: flex;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  cursor: pointer;
  width: fit-content;
`
const ClickableName = styled(ClickableContent)`
  gap: 8px;
  max-width: 100%;
`
const StyledHeaderRow = styled(StyledTokenRow)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px 8px 0px 0px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  height: 48px;
  line-height: 16px;
  padding: 0px 12px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: transparent;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: space-between;
  }
`

const ListNumberCell = styled(Cell) <{ header: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;
  font-size: 14px;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell) <{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
  transition: ${({
  theme: {
    transition: { duration, timing },
  },
}) => css`background-color ${duration.medium} ${timing.ease}`};
`
const TvlCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding-right: 8px;
`
const PriceCell = styled(DataCell)`
  width: 100%;
  justify-content: flex-start;
  padding-right: 8px;
`

const ActionCell = styled(DataCell)`
  justify-content: center;
  align-items: center;
  min-width: 60px;
`

const PercentChangeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: flex;
    justify-content: flex-end;
    color: ${({ theme }) => theme.textSecondary};
    font-size: 12px;
    line-height: 16px;
  }
`
const PriceInfoCell = styled(Cell)`
  justify-content: flex-end;
  flex: 1;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const GreenText = styled.span`
  color: ${({ theme }) =>
    theme.accentSuccess
  };
`

const RedText = styled.span`
  color: ${({ theme }) =>
    theme.accentFailure
  };
  `

const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  flex-flow: row nowrap;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  justify-content: flex-start;
  width: 100%;

  &:hover {
    ${ClickableStyle}
  }
`
const SparkLineCell = styled(Cell)`
  padding: 0px 24px;
  min-width: 120px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SparkLine = styled(Cell)`
  width: 124px;
  height: 42px;
`
const StyledLink = styled(Link)`
  text-decoration: none;
`

const StyledLoadedRow = styled.div`
text-decoration: none;
`

const TokenInfoCell = styled(Cell)`
  gap: 8px;
  line-height: 24px;
  font-size: 16px;
  max-width: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    justify-content: flex-start;
    flex-direction: column;
    gap: 0px;
    width: max-content;
    font-weight: 500;
  }
`
const TokenName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.textTertiary};
  text-transform: uppercase;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    height: 16px;
    justify-content: flex-start;
    width: 100%;
  }
`
const VolumeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const RepaymentTimeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

const SmallLoadingBubble = styled(LoadingBubble)`
  width: 25%;
`
const MediumLoadingBubble = styled(LoadingBubble)`
  width: 65%;
`
const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`
const IconLoadingBubble = styled(LoadingBubble)`
  border-radius: 50%;
  width: 24px;
`
export const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

const InfoIconContainer = styled.div`
  margin-left: 2px;
  display: flex;
  align-items: center;
  cursor: help;
`
const PositionInfo = styled(AutoColumn)`
  margin-left: 8px;
`

const ResponsiveButtonPrimary = styled(SmallMaxButton)`
  border-radius: 12px;
  font-size: 13px;
  padding: 3px 4px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const ActionsContainer = styled(AutoColumn)`
  align-items: center;
`

export const HEADER_DESCRIPTIONS: Record<PositionSortMethod, ReactNode | undefined> = {
  [PositionSortMethod.VALUE]: (
    <Trans>
      Position Value
    </Trans>
  ),
  [PositionSortMethod.COLLATERAL]: (
    <Trans>
      Initial Collateral Deposited
    </Trans>
  ),
  [PositionSortMethod.REPAYTIME]: (
    <Trans>
      Maximum time left until premium repayment
    </Trans>
  ),
  [PositionSortMethod.ENTRYPRICE]: (
    <Trans>
      Your Entry and Current Price
    </Trans>
  ),
  [PositionSortMethod.PNL]: (
    <Trans>
      Profit/Loss excluding slippage+fees, loss may be greater than collateral 
    </Trans>
  ),
  [PositionSortMethod.REMAINING]: (
    <Trans>
      Remaining Premium
    </Trans>
  ),
  [PositionSortMethod.ACTIONS]: (
    <Trans>
      (Reduce): reduce position size
      (Pay): pay premium
    </Trans>
  )
  // [PositionSortMethod.RECENT_PREMIUM]: (
  //   <Trans>Recent Premium (Total Premium Paid)</Trans>
  // ),
  // [PositionSortMethod.UNUSED_PREMIUM]: (
  //   <Trans>Unused Premium Description</Trans>
  // )
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
}: {
  category: PositionSortMethod // TODO: change this to make it work for trans
}) {
  const handleSortCategory = useSetSortMethod(category)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory}>
      {description && (
        <MouseoverTooltip text={description} placement="right">
          <RowFixed>
          <ThemedText.TableText>
            {category}
          </ThemedText.TableText>
          <InfoIconContainer>
            <Info size={10} />
          </InfoIconContainer>
          </RowFixed>
          
        </MouseoverTooltip>
      )}
    </HeaderCellWrapper>
  )
}

/* Token Row: skeleton row component */
function PositionRow({
  header,
  positionInfo,
  value,
  collateral,
  repaymentTime,
  PnL,
  entryPrice,
  remainingPremium,
  position,
  ...rest
}: {
  first?: boolean
  header: boolean
  loading?: boolean
  value: ReactNode
  collateral: ReactNode
  repaymentTime: ReactNode
  positionInfo: ReactNode
  // recentPremium: ReactNode
  // unusedPremium: ReactNode
  PnL: ReactNode
  entryPrice: ReactNode
  remainingPremium: ReactNode
  position?: LimitlessPositionDetails,
  last?: boolean
  style?: CSSProperties
}) {
  const [showReduce, setShowReduce] = useState(false);
  const [showAddPremium, setShowAddPremium] = useState(false);
  const { account } = useWeb3React()

  // const collateral = (totalLiquidity - totalDebt)
  const handleConfirmDismiss = () => {
    setShowReduce(false);
  }
  const handlePremiumConfirmDismiss = () => {
    setShowAddPremium(false);
  }
  const actions = (!header ? (
    <ActionsContainer>
      <ReduceButton width="auto" onClick={() => setShowReduce(!showReduce)} >
        <Trans>reduce</Trans>
      </ReduceButton>
      <ReduceButton width="auto" onClick={() => setShowAddPremium(!showAddPremium)} >
        <Trans>pay</Trans>
      </ReduceButton>
    </ActionsContainer>
  ): (
    (
      <MouseoverTooltip text={"(reduce): reduce position, (pay): pay premium"} placement="right">
        <InfoIconContainer>
          <Info size={14} />
        </InfoIconContainer>
      </MouseoverTooltip>
    )
  ))

  const rowCells = (
    <>
      {/* <ListNumberCell header={header}>{listNumber}</ListNumberCell> */}
      {showReduce && (
        <ReducePositionModal
          isOpen={showReduce}
          trader={account}
          leverageManagerAddress={position?.leverageManagerAddress ?? undefined}
          tokenId={position?.tokenId ?? undefined}
          onDismiss={handleConfirmDismiss}
          onAcceptChanges={() => { }}
          onConfirm={() => { }}
        />
      )}
      {showAddPremium && (
        <AddLeveragePremiumModal
          trader={account}
          isOpen={showAddPremium}
          tokenId={position?.tokenId ?? undefined}
          leverageManagerAddress={position?.leverageManagerAddress ?? undefined}
          onDismiss={handlePremiumConfirmDismiss}
          onAcceptChanges={() => { }}
          onConfirm={() => { }}
        />
      )}
      <NameCell data-testid="name-cell">{positionInfo}</NameCell>
      <PriceCell data-testid="value-cell" sortable={header}>
        <EditCell onClick={() => {setShowReduce(!showReduce)}} disabled={false}>
        {value}
        </EditCell>
      </PriceCell>
      <PriceCell data-testid="collateral-cell" sortable={header}>
        {collateral}
      </PriceCell>
      <PriceCell data-testid="repaymentTime-cell" sortable={header}>
        {repaymentTime}
      </PriceCell>
      <PriceCell data-testid="premium-cell" sortable={header}>
        {remainingPremium}
      </PriceCell>
      <PriceCell data-testid="premium-cell" sortable={header}>
        {entryPrice}
      </PriceCell>
      <PriceCell data-testid="premium-cell" sortable={header}>
        {PnL}
      </PriceCell>
      <ActionCell data-testid="action-cell" sortable={header}>
        {
          actions
        }
      </ActionCell>
      {/* <SparkLineCell>{sparkLine}</SparkLineCell> */}
    </>
  )

  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <PositionRow
      header={true}
      positionInfo={<ThemedText.TableText>Position</ThemedText.TableText>}
      value={<HeaderCell category={PositionSortMethod.VALUE} />}
      collateral={<HeaderCell category={PositionSortMethod.COLLATERAL} />}
      PnL={<HeaderCell category={PositionSortMethod.PNL} />}
      entryPrice={<HeaderCell category={PositionSortMethod.ENTRYPRICE} />}
      remainingPremium={<HeaderCell category={PositionSortMethod.REMAINING} />}
      repaymentTime={<HeaderCell category={PositionSortMethod.REPAYTIME} />}
    />
  )
}


export const TruncatedTableText = styled(ThemedText.TableText)`
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
`
/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <PositionRow
      header={false}
      // listNumber={<SmallLoadingBubble />}
      loading
      positionInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      value={<MediumLoadingBubble />}
      collateral={<LoadingBubble />}
      repaymentTime={<LoadingBubble />}
      PnL={<LoadingBubble />}
      entryPrice={<LoadingBubble />}
      remainingPremium={<LoadingBubble />}
      {...props}
    />
  )
}

const FlexStartRow = styled(Row)`
  flex-flow: row nowrap;
  align-items: center;
  justify-content:flex-start;
`

interface LoadedRowProps {
  position: LimitlessPositionDetails
}

/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  // const { tokenListIndex, tokenListLength, token, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)
  const { position } = props

  const { isToken0, token0Address, token1Address, initialCollateral, totalDebtInput } = position;
  const token0 = useCurrency(token0Address)
  const token1 = useCurrency(token1Address)

  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.poolFee)

  const leverageFactor = useMemo(() => (
    (Number(initialCollateral) + Number(totalDebtInput)) / Number(initialCollateral)
  ), [initialCollateral, totalDebtInput]);

  const now = moment();
  const [timeLeft, isOverDue] = useMemo(() => {
    const duration = moment.duration(moment.unix(Number(position.repayTime)).add(1, 'days').diff(now))
    const hours = duration.hours();
    const isNegative = hours < 0;
    const minutes = duration.minutes()
    return [`${Math.abs(hours)}h ${Math.abs(minutes)}m`, isNegative]
  }, [position, now])



  // /**
  //    * Returns the current mid price of the pool in terms of token0, i.e. the ratio of token1 over token0
  //    */
  // get token0Price(): Price<Token, Token>;
  // /**
  //  * Returns the current mid price of the pool in terms of token1, i.e. the ratio of token0 over token1
  //  */
  // get token1Price(): Price<Token, Token>;

  // pnl in input token.
  // entry price in quote token / base token
  const [pnl, entryPrice, currentPrice] = useMemo(() => {
    if (
      pool?.token0Price &&
      pool?.token1Price &&
      // position.creationPrice &&
      position.totalPosition &&
      token0 &&
      token1
    ) {
      let curPrice = position.isToken0 ? new BN(pool.token1Price.toFixed(DEFAULT_ERC20_DECIMALS))
      : new BN(pool.token0Price.toFixed(DEFAULT_ERC20_DECIMALS))
     
      // entryPrice if isToken0, output is in token0. so entry price would be in input token / output token
      let _entryPrice = new BN(position.initialCollateral).plus(position.totalDebtInput).dividedBy(position.totalPosition)

      // token0Price => token1 / token0, token1Price => token0 / token1.
      // total position is in output token
      let _pnl = position.isToken0 ? (
        // token0Price => input / output, token1Price => output / input
        // entry price => input / output -> token1 / token0. 
        // total position -> output -> token0
        new BN(pool.token0Price.toFixed(DEFAULT_ERC20_DECIMALS)).minus(_entryPrice).multipliedBy(position.totalPosition).toNumber() // pnl in token1
      ) : (
        // token1Price -> token0 / token1
        // entry price -> input / output -> token0 / token1
        // total position -> output -> token1
        new BN(pool.token1Price.toFixed(DEFAULT_ERC20_DECIMALS)).minus(_entryPrice).multipliedBy(position.totalPosition).toNumber() // pnl in token0
      )

      // use token0 as quote, token1 as base
      // pnl will be in output token
      // entry price will be in quote token.

      if (pool.token0Price.greaterThan(1)) {
        // entry price = token1 / token0
        return [_pnl, position.isToken0 ? _entryPrice.toNumber() : new BN(1).dividedBy(_entryPrice).toNumber(), position.isToken0? new BN(1).dividedBy(curPrice).toNumber(): curPrice.toNumber()]
      } else {
        // entry price = token0 / token1
        return [_pnl, position.isToken0 ? new BN(1).dividedBy(_entryPrice).toNumber() : _entryPrice.toNumber(), new BN(1).dividedBy(curPrice).toNumber()]
      }
    }
    return [0, 0, 0]
  }, [position, pool?.token0Price, pool?.token1Price, token0, token1])
  // console.log('tokens', token0, token1,quoteBaseSymbol )
  const quoteBaseSymbol = useMemo(() => {
    if (token0 && token1 && pool?.token0Price) {
      if (!pool.token0Price.greaterThan(1)) {
        return `${token0.symbol}/${token1.symbol}`
      } else {
        return `${token1.symbol}/${token0.symbol}`
      }
    }
    return '-/-'
  }, [pool, token1, token0])

  const [inputCurrencySymbol, outputCurrencySymbol] = useMemo(() => {
    if (position.isToken0) {
      return [formatSymbol(token1?.symbol), formatSymbol(token0?.symbol)]
    } else {
      return [formatSymbol(token0?.symbol), formatSymbol(token1?.symbol)]
    }
  }, [
    token0,
    token1,
    position
  ])

  const remainingPremium = useMemo(() => {
    if (position) {
      const timeLeft = moment.duration(moment.unix(Number(position.repayTime)).add(1, 'days').diff(now));
      
      return position.unusedPremium * (timeLeft.asSeconds() / 86400) < 0 ? 0 : position.unusedPremium * (timeLeft.asSeconds() / 86400);
    }
    return undefined
  }, [position, now])

  // const token0Quote = useMemo(() => {
  //   return pool?.token0Price?.greaterThan(1)
  // },[pool?.token0Price])

  // console.log("position: ", position)

  const arrow = getDeltaArrow(pnl, 18)
  // console.log('leverageFactor', leverageFactor, initialCollateral, totalDebtInput)

  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  return (
    <div ref={ref} data-testid={`token-table-row-${position.tokenId}`}>
      <StyledLoadedRow>
        <PositionRow
          header={false}
          positionInfo={
            <ClickableContent>
              <RowBetween>
                <PositionInfo>
                    <GreenText> x{
                      `${(Math.round(leverageFactor*1000)/1000)} ${outputCurrencySymbol}`
                    }</GreenText> 
                </PositionInfo>
              </RowBetween>
            </ClickableContent>
          }
          value={
            <FlexStartRow>
              <UnderlineText>
              {`${formatNumber(Number(position.totalPosition), NumberType.SwapTradeAmount)} ${outputCurrencySymbol}`}
              </UnderlineText>
              <Edit3 size={14}/>
            </FlexStartRow>
          }
          collateral={
            <FlexStartRow>
              {`${formatNumber(Number(position.initialCollateral), NumberType.SwapTradeAmount)} ${inputCurrencySymbol}`}
            </FlexStartRow>
          }
          repaymentTime={
            <Trans>
                {!isOverDue ? (
                  <GreenText>
                    {timeLeft}
                  </GreenText>
                ) : (
                  <RedText>
                    {0}
                  </RedText>
                )
                }
            </Trans>
          }
          PnL={
            <Trans>
              <AutoRow>
              <RowBetween>
                  <ArrowCell>
                    {arrow}
                  </ArrowCell>
                  <DeltaText delta={Number(pnl)}>
                    {pnl ? `${formatNumber(Number(pnl), NumberType.SwapTradeAmount)} ${inputCurrencySymbol}` : "-"} 
                  </DeltaText>              
                </RowBetween>
              
              </AutoRow>
                
            </Trans>
          }
          entryPrice={
            <Trans>
              <AutoColumn>
                {`${formatNumber(Number(entryPrice), NumberType.SwapTradeAmount)}/${formatNumber(Number(currentPrice), NumberType.SwapTradeAmount)} ${quoteBaseSymbol}`}
              </AutoColumn>
            </Trans>
          }
          remainingPremium={
            <Trans>
              {`${(remainingPremium ? formatNumber(Number(remainingPremium),NumberType.SwapTradeAmount)  : 0)}/${formatNumber(position.unusedPremium, NumberType.SwapTradeAmount)} ${inputCurrencySymbol}`}
            </Trans>
          }
          position={position}
        />
      </StyledLoadedRow>
    </div>
  )
})


