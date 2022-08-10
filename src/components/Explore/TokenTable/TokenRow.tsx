import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import { sendAnalyticsEvent } from 'components/AmplitudeAnalytics'
import { EventName } from 'components/AmplitudeAnalytics/constants'
import SparklineChart from 'components/Charts/SparklineChart'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TimePeriod, TokenData } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Heart } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/formatDollarAmt'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../constants'
import { LoadingBubble } from '../loading'
import {
  favoritesAtom,
  filterNetworkAtom,
  filterStringAtom,
  filterTimeAtom,
  sortCategoryAtom,
  sortDirectionAtom,
  useSetSortCategory,
  useToggleFavorite,
} from '../state'
import { Category, SortDirection } from '../types'
import { TIME_DISPLAYS } from './TimeSelector'

const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`
const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const StyledTokenRow = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 4fr 5fr;
  font-size: 15px;
  line-height: 24px;

  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  padding: 0px 12px;

  &:hover {
    background-color: ${({ theme }) => theme.accentActionSoft};
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.7fr 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr;
    width: fit-content;
    padding-right: 24px;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.7fr 1fr 7.5fr 4.5fr 4.5fr 4.5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.2fr 1fr 8fr 5fr 5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7fr 4fr 4fr 0.5px;
    width: fit-content;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 1fr;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.backgroundContainer};
    padding: 0px 12px;

    :last-of-type {
      border-bottom: none;
    }
  }
`
export const ClickFavorited = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
  }
`

const ClickableContent = styled.div`
  display: flex;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  align-items: center;
  cursor: pointer;
`
const ClickableName = styled(ClickableContent)`
  gap: 8px;
`
const FavoriteCell = styled(Cell)`
  min-width: 40px;
  color: ${({ theme }) => theme.textSecondary};
  fill: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const StyledHeaderRow = styled(StyledTokenRow)`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.backgroundOutline};
  border-radius: 8px 8px 0px 0px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  height: 48px;
  line-height: 16px;
  padding: 0px 12px;
  width: 100%;

  &:hover {
    background-color: ${({ theme }) => theme.none};
  }

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    padding-right: 24px;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    justify-content: space-between;
    padding: 0px 12px;
  }
`
const ListNumberCell = styled(Cell)`
  color: ${({ theme }) => theme.textSecondary};
  min-width: 32px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const DataCell = styled(Cell)<{ sortable: boolean }>`
  justify-content: flex-end;
  min-width: 80px;
  user-select: ${({ sortable }) => (sortable ? 'none' : 'unset')};

  &:hover {
    color: ${({ theme, sortable }) => sortable && theme.white};
    background-color: ${({ theme, sortable }) => sortable && theme.accentActionSoft};
  }
`
const MarketCapCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding-left: 8px;
  min-width: 200px;
  gap: 8px;
`
const PriceCell = styled(DataCell)`
  padding-right: 8px;
`
const PercentChangeCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
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

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    align-items: flex-end;
  }
`
const SortArrowCell = styled(Cell)`
  padding-right: 2px;
`
const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  height: 100%;
  justify-content: flex-end;
  width: 100%;
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
const TokenInfoCell = styled(Cell)`
  gap: 8px;
  line-height: 24px;
  font-size: 16px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
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
  max-width: 160px;
  white-space: nowrap;
`
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.textTertiary};

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
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
const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

/* formatting for volume with timeframe header display */
function getHeaderDisplay(category: string, timeframe: string): string {
  if (category === Category.volume) return `${TIME_DISPLAYS[timeframe]} ${category}`
  return category
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
  sortable,
}: {
  category: Category // TODO: change this to make it work for trans
  sortable: boolean
}) {
  const theme = useTheme()
  const sortDirection = useAtomValue<SortDirection>(sortDirectionAtom)
  const handleSortCategory = useSetSortCategory(category)
  const sortCategory = useAtomValue<Category>(sortCategoryAtom)
  const timeframe = useAtomValue<TimePeriod>(filterTimeAtom)

  if (sortCategory === category) {
    return (
      <HeaderCellWrapper onClick={handleSortCategory}>
        <SortArrowCell>
          {sortDirection === SortDirection.increasing ? (
            <ArrowUp size={14} color={theme.accentActive} />
          ) : (
            <ArrowDown size={14} color={theme.accentActive} />
          )}
        </SortArrowCell>
        {getHeaderDisplay(category, timeframe)}
      </HeaderCellWrapper>
    )
  }
  if (sortable) {
    return (
      <HeaderCellWrapper onClick={handleSortCategory}>
        <SortArrowCell>
          <ArrowUp size={14} visibility="hidden" />
        </SortArrowCell>
        {getHeaderDisplay(category, timeframe)}
      </HeaderCellWrapper>
    )
  }
  return <HeaderCellWrapper>{getHeaderDisplay(category, timeframe)}</HeaderCellWrapper>
}

/* Token Row: skeleton row component */
export function TokenRow({
  address,
  header,
  favorited,
  listNumber,
  tokenInfo,
  price,
  percentChange,
  marketCap,
  volume,
  sparkLine,
}: {
  address: ReactNode
  header: boolean
  favorited: ReactNode
  listNumber: ReactNode
  tokenInfo: ReactNode
  price: ReactNode
  percentChange: ReactNode
  marketCap: ReactNode
  volume: ReactNode
  sparkLine: ReactNode
}) {
  const rowCells = (
    <>
      <FavoriteCell>{favorited}</FavoriteCell>
      <ListNumberCell>{listNumber}</ListNumberCell>
      <NameCell>{tokenInfo}</NameCell>
      <PriceCell sortable={header}>{price}</PriceCell>
      <PercentChangeCell sortable={header}>{percentChange}</PercentChangeCell>
      <MarketCapCell sortable={header}>{marketCap}</MarketCapCell>
      <VolumeCell sortable={header}>{volume}</VolumeCell>
      <SparkLineCell>{sparkLine}</SparkLineCell>
    </>
  )
  if (header) return <StyledHeaderRow>{rowCells}</StyledHeaderRow>
  return <StyledTokenRow>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <TokenRow
      address={null}
      header={true}
      favorited={null}
      listNumber="#"
      tokenInfo={<Trans>Token Name</Trans>}
      price={<HeaderCell category={Category.price} sortable />}
      percentChange={<HeaderCell category={Category.percentChange} sortable />}
      marketCap={<HeaderCell category={Category.marketCap} sortable />}
      volume={<HeaderCell category={Category.volume} sortable />}
      sparkLine={null}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow() {
  return (
    <TokenRow
      address={null}
      header={false}
      favorited={null}
      listNumber={<SmallLoadingBubble />}
      tokenInfo={
        <>
          <IconLoadingBubble />
          <MediumLoadingBubble />
        </>
      }
      price={<MediumLoadingBubble />}
      percentChange={<LoadingBubble />}
      marketCap={<LoadingBubble />}
      volume={<LoadingBubble />}
      sparkLine={<SparkLineLoadingBubble />}
    />
  )
}

/* Loaded State: row component with token information */
export default function LoadedRow({
  tokenAddress,
  tokenListIndex,
  tokenListLength,
  data,
  timePeriod,
}: {
  tokenAddress: string
  tokenListIndex: number
  tokenListLength: number
  data: TokenData
  timePeriod: TimePeriod
}) {
  const token = useToken(tokenAddress)
  const currency = useCurrency(tokenAddress)
  const tokenName = token?.name ?? ''
  const tokenSymbol = token?.symbol ?? ''
  const tokenData = data[tokenAddress]
  const theme = useTheme()
  const [favoriteTokens] = useAtom(favoritesAtom)
  const isFavorited = favoriteTokens.includes(tokenAddress)
  const toggleFavorite = useToggleFavorite(tokenAddress)
  const isPositive = Math.sign(tokenData.delta) > 0
  const filterString = useAtomValue(filterStringAtom)
  const filterNetwork = useAtomValue(filterNetworkAtom)
  const filterTime = useAtomValue(filterTimeAtom) // filter time period for top tokens table

  const tokenPercentChangeInfo = (
    <>
      {tokenData.delta}%
      <ArrowCell>
        {isPositive ? (
          <ArrowUpRight size={16} color={theme.accentSuccess} />
        ) : (
          <ArrowDownRight size={16} color={theme.accentFailure} />
        )}
      </ArrowCell>
    </>
  )

  const exploreTokenSelectedEventProperties = {
    chain_id: filterNetwork,
    token_address: tokenAddress,
    token_symbol: token?.symbol,
    token_list_index: tokenListIndex,
    token_list_length: tokenListLength,
    time_frame: filterTime,
    search_token_address_input: filterString,
  }

  const heartColor = isFavorited ? theme.accentActive : undefined
  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  return (
    <StyledLink
      to={`/tokens/${tokenAddress}`}
      onClick={() => sendAnalyticsEvent(EventName.EXPLORE_TOKEN_ROW_CLICKED, exploreTokenSelectedEventProperties)}
    >
      <TokenRow
        address={tokenAddress}
        header={false}
        favorited={
          <ClickFavorited
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite()
            }}
          >
            <Heart size={18} color={heartColor} fill={heartColor} />
          </ClickFavorited>
        }
        listNumber={tokenListIndex + 1}
        tokenInfo={
          <ClickableName>
            <CurrencyLogo currency={currency} />
            <TokenInfoCell>
              <TokenName>{tokenName}</TokenName>
              <TokenSymbol>{tokenSymbol}</TokenSymbol>
            </TokenInfoCell>
          </ClickableName>
        }
        price={
          <ClickableContent>
            <PriceInfoCell>
              {formatDollarAmount(tokenData.price)}
              <PercentChangeInfoCell>{tokenPercentChangeInfo}</PercentChangeInfoCell>
            </PriceInfoCell>
          </ClickableContent>
        }
        percentChange={<ClickableContent>{tokenPercentChangeInfo}</ClickableContent>}
        marketCap={<ClickableContent>{formatAmount(tokenData.marketCap).toUpperCase()}</ClickableContent>}
        volume={<ClickableContent>{formatAmount(tokenData.volume[timePeriod]).toUpperCase()}</ClickableContent>}
        sparkLine={
          <SparkLine>
            <ParentSize>{({ width, height }) => <SparklineChart width={width} height={height} />}</ParentSize>
          </SparkLine>
        }
      />
    </StyledLink>
  )
}
