import { Trans } from '@lingui/macro'
import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Tokens/constants'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { LeaderBoard } from 'graphql/leaderboard/LeaderBoard'
import { useAtomValue } from 'jotai'
import { ForwardedRef, forwardRef, useMemo } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ClickableStyle } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { LeaderboardSortMethod, sortAscendingAtom, sortMethodAtom, useSetSortMethod } from './state'

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const StyledTokenRow = styled.div<{
  first?: boolean
  last?: boolean
  loading?: boolean
}>`
  background-color: transparent;
  display: grid;
  font-size: 16px;
  grid-template-columns: 1fr 7fr 2fr 2fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  ${({ first, last }) => css`
    height: ${first || last ? '72px' : '64px'};
    padding-top: ${first ? '8px' : '0px'};
    padding-bottom: ${last ? '8px' : '0px'};
  `}
  padding-left: 12px;
  padding-right: 12px;
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
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 3fr 2fr 2fr;
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

const ListNumberCell = styled(Cell)<{ header: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;
  font-size: 14px;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
`

const AddressCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  min-width: 280px;
  gap: 8px;
`

const AddressComponent = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`
const TradeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  width: 100%;

  &:hover {
    ${ClickableStyle}
  }
`

const VolumeCell = styled(DataCell)`
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

const InfoIconContainer = styled.div`
  margin-left: 2px;
  display: flex;
  align-items: center;
  cursor: help;
`

const StyledLink = styled(Link)`
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`

const HEADER_DESCRIPTIONS: Record<LeaderboardSortMethod, ReactNode | undefined> = {
  [LeaderboardSortMethod.TRADES]: undefined,
  [LeaderboardSortMethod.VOLUME_USDT]: (
    <Trans>Volume is the amount of the asset that has been traded on Pegasys v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({ category }: { category: LeaderboardSortMethod }) {
  const theme = useTheme()
  const sortAscending = useAtomValue(sortAscendingAtom)
  const handleSortCategory = useSetSortMethod(category)
  const sortMethod = useAtomValue(sortMethodAtom)

  const description = HEADER_DESCRIPTIONS[category]

  return (
    <HeaderCellWrapper onClick={handleSortCategory}>
      {sortMethod === category && (
        <>
          {sortAscending ? (
            <ArrowUp size={20} strokeWidth={1.8} color={theme.accentActive} />
          ) : (
            <ArrowDown size={20} strokeWidth={1.8} color={theme.accentActive} />
          )}
        </>
      )}
      {category}
      {description && (
        <MouseoverTooltip text={description} placement="right">
          <InfoIconContainer>
            <Info size={14} />
          </InfoIconContainer>
        </MouseoverTooltip>
      )}
    </HeaderCellWrapper>
  )
}

/* Token Row: skeleton row component */
function LeaderBoardRow({
  header,
  listNumber,
  address,
  trades,
  volumeUSDT,
  ...rest
}: {
  first?: boolean
  header: boolean
  listNumber: ReactNode
  loading?: boolean
  address: ReactNode
  trades: ReactNode
  volumeUSDT: ReactNode
  last?: boolean
  style?: CSSProperties
}) {
  const rank = useMemo(() => {
    if (listNumber && listNumber > 300) {
      return '300>'
    }
    return listNumber
  }, [listNumber])

  const rowCells = (
    <>
      <ListNumberCell header={header}>{rank}</ListNumberCell>
      <AddressCell data-testid="address-cell">{address}</AddressCell>
      <TradeCell data-testid="price-cell" sortable={header}>
        {trades}
      </TradeCell>
      <VolumeCell data-testid="volume-cell" sortable={header}>
        {volumeUSDT}
      </VolumeCell>
    </>
  )
  if (header) return <StyledHeaderRow data-testid="header-row">{rowCells}</StyledHeaderRow>
  return <StyledTokenRow {...rest}>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <LeaderBoardRow
      header={true}
      listNumber="Rank"
      address={<Trans>Address</Trans>}
      trades={<HeaderCell category={LeaderboardSortMethod.TRADES} />}
      volumeUSDT={<HeaderCell category={LeaderboardSortMethod.VOLUME_USDT} />}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <LeaderBoardRow
      header={false}
      listNumber={<SmallLoadingBubble />}
      loading
      address={<MediumLoadingBubble />}
      trades={<SmallLoadingBubble />}
      volumeUSDT={<LoadingBubble />}
      {...props}
    />
  )
}

interface LoadedRowProps {
  leaderboardListIndex: number
  leaderboardListLength: number
  leaderboard: NonNullable<LeaderBoard | Omit<LeaderBoard, 'address' | 'date'>>
  sortRank: number
}

interface LoadedUserRowProps {
  leaderboardListIndex: number
  leaderboardListLength: number
  leaderboard: NonNullable<Omit<LeaderBoard, 'address' | 'date'>>
  sortRank: number
}
/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { leaderboardListIndex, leaderboardListLength, leaderboard, sortRank } = props

  const address = leaderboard.id.split('-')[0]
  const trades = leaderboard.txCount
  const volumeUSDC = parseFloat(leaderboard.totalVolume).toFixed(2)
  const theme = useTheme()
  const to = getExplorerLink(570, address, ExplorerDataType.ADDRESS)
  return (
    <div ref={ref} data-testid={`leaderboard-table-row-${leaderboardListIndex}`}>
      <StyledLink to={to}>
        <LeaderBoardRow
          header={false}
          listNumber={sortRank}
          address={<AddressComponent data-cy="address">{address}</AddressComponent>}
          trades={<ClickableContent>{trades}</ClickableContent>}
          volumeUSDT={
            <ClickableContent style={{ color: `${theme.accentSuccess}` }}>{'$ ' + volumeUSDC}</ClickableContent>
          }
          first={leaderboardListIndex === 0}
          last={leaderboardListIndex === leaderboardListLength - 1}
        />
      </StyledLink>
    </div>
  )
})

export function LoadedUserRow(props: LoadedUserRowProps) {
  const { leaderboardListIndex, leaderboardListLength, leaderboard, sortRank } = props
  const address = leaderboard.id
  const to = getExplorerLink(570, address, ExplorerDataType.ADDRESS)
  const trades = leaderboard.txCount
  const volumeUSDC = parseFloat(leaderboard.totalVolume).toFixed(2)
  const theme = useTheme()

  return (
    <StyledLink to={to} target="_blank">
      <LeaderBoardRow
        header={false}
        listNumber={sortRank}
        address={<AddressComponent data-cy="address-user">{address}</AddressComponent>}
        trades={<ClickableContent>{trades}</ClickableContent>}
        volumeUSDT={
          <ClickableContent style={{ color: `${theme.accentSuccess}` }}>{'$ ' + volumeUSDC}</ClickableContent>
        }
        first={leaderboardListIndex === 0}
        last={leaderboardListIndex === leaderboardListLength - 1}
      />
    </StyledLink>
  )
}

LoadedRow.displayName = 'LoadedRow'
