import { Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { BigNumber as BN } from "bignumber.js"
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import Row from 'components/Row'
import { AddBorrowPremiumModal, ReduceBorrowCollateralModal, ReduceBorrowDebtModal } from 'components/swap/LMTModals'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { useAtomValue } from 'jotai/utils'
import { formatSymbol } from 'lib/utils/formatSymbol'
import moment from "moment"
import { MaxButton } from 'pages/Pool/styleds'
import { SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import { ForwardedRef, forwardRef, useMemo, useState } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { Edit3, Info } from 'react-feather'
import { Link } from 'react-router-dom'
import { Box } from 'rebass'
import styled, { css } from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'
import { LimitlessPositionDetails } from 'types/leveragePosition'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from './constants'
import { LoadingBubble } from './loading'
import {
  filterStringAtom,
  PositionSortMethod,
  useSetSortMethod,
} from './state'
// import { FlexStartRow } from 'components/LeveragePositionTable/TokenRow'

const FlexStartRow = styled(Row)`
  flex-flow: row nowrap;
  align-items: center;
  justify-content:flex-start;
`
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
  grid-template-columns: 1fr 1fr 1fr 0.75fr 1fr 1fr 0.1fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
  `}
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
    grid-template-columns: 1fr 1fr 1fr 0.75fr 1fr 1fr 0.1fr;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 1fr 1fr 0.75fr 1fr 1fr 0.1fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns:  1fr 1fr 1fr 0.75fr 1fr 1fr 0.1fr;
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
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
  transition: ${({
  theme: {
    transition: { duration, timing },
  },
}) => css`background-color ${duration.medium} ${timing.ease}`};
`

export const EditCell = styled(RowBetween) <{ disabled: boolean }>`
  padding: 0;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
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
const PositionInfo = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
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
  [PositionSortMethod.BORROWED_AMOUNT]: (
    <Trans>
      Total Borrowed Amount
    </Trans>
  ),
  [PositionSortMethod.LTV]: (
    <Trans>
      Loan-to-Value
    </Trans>
  ),
  [PositionSortMethod.COLLATERAL]: (
    <Trans>
      Collateral Deposited
    </Trans>
  ),
  [PositionSortMethod.REPAYTIME]: (
    <Trans>
      Maximum time left until premium repayment
    </Trans>
  ),
  [PositionSortMethod.REMAINING]: (
    <Trans>
      Remaining Premium
    </Trans>
  ),
  [PositionSortMethod.ACTIONS]: (
    <Trans>
      (Pay): pay premium
    </Trans>
  )
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
}: {
  category: PositionSortMethod // TODO: change this to make it work for trans
}) {
  const handleSortCategory = useSetSortMethod(category)

  const description = HEADER_DESCRIPTIONS[category]

  // console.log("category",category, )

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

export const PremiumButton = styled(MaxButton)`
  font-size: 12px;
  padding: 4px;
  min-width: 28px;
`

/* Token Row: skeleton row component */
function PositionRow({
  header,
  positionInfo,
  borrowedAmount,
  ltv,
  collateral,
  repaymentTime,
  remainingPremium,
  position,
  ...rest
}: {
  first?: boolean
  header: boolean
  loading?: boolean
  borrowedAmount: ReactNode
  collateral: ReactNode
  repaymentTime: ReactNode
  positionInfo: ReactNode
  ltv: ReactNode
  remainingPremium: ReactNode
  position?: LimitlessPositionDetails,
  last?: boolean
  style?: CSSProperties
}) {

  const [showAddPremium, setShowAddPremium] = useState(false);
  const [showReduceCollateral, setShowReduceCollateral] = useState(false);
  const [showReduceBorrowed, setShowReduceBorrowed] = useState(false);
  const { account } = useWeb3React()

  // const collateral = (totalLiquidity - totalDebt)
  const handleReduceCollateralDismiss = () => {
    setShowReduceCollateral(false);
  }

  const handleReduceBorrowedDismiss = () => {
    setShowReduceBorrowed(false);
  }

  const handlePremiumConfirmDismiss = () => {
    setShowAddPremium(false);
  }
  const actions = (!header ? (
    <ActionsContainer>
      <PremiumButton width="auto" onClick={() => setShowAddPremium(!showAddPremium)} >
        <Trans>pay</Trans>
      </PremiumButton>
    </ActionsContainer>
  ): (
    (
      <MouseoverTooltip text="(reduce): reduce position, (pay): pay premium" placement="right">
        <InfoIconContainer>
          <Info size={14} />
        </InfoIconContainer>
      </MouseoverTooltip>
    )
  ))

  const rowCells = (
    <>
      {!header && showReduceCollateral && (
        <ReduceBorrowCollateralModal
        trader={account}
        isOpen={showReduceCollateral}
        tokenId={position?.tokenId ?? undefined}
        onDismiss={handleReduceCollateralDismiss}
        onAcceptChanges={() => { }}
        onConfirm={() => { }}
      />
      )}
      {showReduceBorrowed && (
        <ReduceBorrowDebtModal
        trader={account}
        isOpen={showReduceBorrowed}
        tokenId={position?.tokenId ?? undefined}
        onDismiss={handleReduceBorrowedDismiss}
        onAcceptChanges={() => { }}
        onConfirm={() => { }}
      />
      )}
      {showAddPremium && (
        <AddBorrowPremiumModal
          trader={account}
          isOpen={showAddPremium}
          tokenId={position?.tokenId ?? undefined}
          onDismiss={handlePremiumConfirmDismiss}
          onAcceptChanges={() => { }}
          onConfirm={() => { }}
        />
      )}
      <NameCell data-testid="name-cell">{positionInfo}</NameCell>
      <PriceCell data-testid="value-cell" sortable={header}>
      <EditCell onClick={() => {!header && setShowReduceBorrowed(true)}} disabled={false}>
        {borrowedAmount}
        </EditCell>
      </PriceCell>
      <PriceCell data-testid="collateral-cell" sortable={header}>
        <EditCell onClick={() => {!header && setShowReduceCollateral(true)}} disabled={false}>
        {collateral}
        </EditCell>
      </PriceCell>
      <PriceCell data-testid="repaymentTime-cell" sortable={header}>
        {repaymentTime}
      </PriceCell>
      <PriceCell data-testid="premium-cell" sortable={header}>
        {remainingPremium}
      </PriceCell>
      <PriceCell data-testid="ltv-cell" sortable={header}>
        {ltv}
      </PriceCell>
      <ActionCell data-testid="action-cell" sortable={header}>
        {
          actions
        }
      </ActionCell>
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
      positionInfo={<Box marginLeft="8px">
        <ThemedText.TableText>Position</ThemedText.TableText>
      </Box>}
      borrowedAmount={<HeaderCell category={PositionSortMethod.BORROWED_AMOUNT} />}
      collateral={<HeaderCell category={PositionSortMethod.COLLATERAL} />}
      remainingPremium={<HeaderCell category={PositionSortMethod.REMAINING} />}
      repaymentTime={<HeaderCell category={PositionSortMethod.REPAYTIME} />}
      ltv={<HeaderCell category={PositionSortMethod.LTV} />}
    />
  )
}

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
      ltv={<MediumLoadingBubble />}
      borrowedAmount={<MediumLoadingBubble />}
      collateral={<LoadingBubble />}
      repaymentTime={<LoadingBubble />}
      remainingPremium={<LoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  position: LimitlessPositionDetails
}

export const TruncatedTableText = styled(ThemedText.TableText)`
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
`
export const UnderlineText = styled(Row)`
width: fit-content;
align-items: flex-start;
text-decoration: ${({theme}) =>  `underline dashed ${theme.textPrimary}`};
`

const OutputText = styled.div`
  font-size: 14px;
  font-weight: 600;
  height: 12px;
  color: ${({theme}) => theme.textSecondary};
`

const InputText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${({theme}) => theme.textSecondary};
`


/* Loaded State: row component with token information */
 const RawLoadedRow = (props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  // const { tokenListIndex, tokenListLength, token, sortRank } = props
  const filterString = useAtomValue(filterStringAtom)
  const { position } = props

  const { isToken0, token0Address, token1Address, initialCollateral, totalDebtInput } = position;
  const token0 = useCurrency(token0Address)
  const token1 = useCurrency(token1Address)

  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.poolFee)

  // const leverageFactor = useMemo(() => (
  //   (Number(initialCollateral) + Number(totalDebtInput)) / Number(initialCollateral)
  // ), [initialCollateral, totalDebtInput]);

  const now = moment();
  const [timeLeft, isOverDue] = useMemo(() => {
    const duration = moment.duration(moment.unix(Number(position.repayTime)).add(1, 'days').diff(now))
    const hours = duration.hours();
    const isNegative = hours < 0;
    const minutes = duration.minutes()
    return [`${Math.abs(hours)}h ${Math.abs(minutes)}m`, isNegative]
  }, [position, now])

  // const quoteBaseSymbol = useMemo(() => {
  //   if (token0 && token1 && pool?.token0Price) {
  //     if (pool.token0Price.greaterThan(1)) {
  //       return `${token0.symbol}/${token1.symbol}`
  //     } else {
  //       return `${token1.symbol}/${token0.symbol}`
  //     }
  //   }
  //   return ''
  // }, [pool, token1, token0])

  const ltv = useMemo(() => {
    if (pool?.token0Price && pool?.token1Price) {
      const collateralIsToken0 = position.isToken0; // position.isToken0 === position.borrowBelow
      const price = collateralIsToken0 ? pool?.token0Price.toFixed(DEFAULT_ERC20_DECIMALS) : pool?.token1Price.toFixed(DEFAULT_ERC20_DECIMALS);
      const ltv = new BN(position.totalDebtInput).div(
        new BN(position.initialCollateral).multipliedBy(new BN(price))
      )
      return ltv.toNumber();
    }
    return 0;

  }, [position, pool])

  const [inputCurrencySymbol, outputCurrencySymbol] = useMemo(() => {
    if (position.isToken0) {
      return [formatSymbol(token0?.symbol), formatSymbol(token1?.symbol)] 
    } else {
      return [formatSymbol(token1?.symbol), formatSymbol(token0?.symbol)]
    }
  }, [
    token0,
    token1,
    position
  ])

  // unused premium * (
  const remainingPremium = useMemo(() => {
    if (position) {
      const timeLeft = moment.duration(moment.unix(Number(position.repayTime)).add(1, 'days').diff(now));
      return position.unusedPremium * (timeLeft.asSeconds() / 86400) < 0 ? 0 : position.unusedPremium * (timeLeft.asSeconds() / 86400);
    }
    return 0
  }, [position, now])

  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  return (
    <div ref={ref} data-testid={`token-table-row-${position.tokenId}`}>
      <StyledLoadedRow>
        <PositionRow
          header={false}
          // listNumber={sortRank}
          positionInfo={

              <PositionInfo>
                  <OutputText>
                    {outputCurrencySymbol}
                  </OutputText>
                  <InputText>
                  {inputCurrencySymbol}
                  </InputText>
                </PositionInfo>

          }
          ltv={
            <Trans>
                {formatNumber(Number(ltv) * 100, NumberType.SwapTradeAmount)}%
            </Trans>
          }
          borrowedAmount={
              <FlexStartRow>
                <UnderlineText>
                  {`${formatNumber(Number(position.totalDebtInput), NumberType.SwapTradeAmount)} ${outputCurrencySymbol}`}
                </UnderlineText>
                <Edit3 size={14}/>
              </FlexStartRow>
          }
          collateral={
            <FlexStartRow>
              <UnderlineText>
                {`${formatNumber(Number(position.initialCollateral), NumberType.SwapTradeAmount)} ${inputCurrencySymbol}`}
              </UnderlineText>
              <Edit3 size={14}/>
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
          remainingPremium={
            <Trans>
                {`${formatNumber(remainingPremium,  NumberType.SwapTradeAmount)} ${outputCurrencySymbol}`}
            </Trans>
          }
          position={position}
        />
      </StyledLoadedRow>
    </div>
  )
}
export const LoadedRow = forwardRef(RawLoadedRow);


