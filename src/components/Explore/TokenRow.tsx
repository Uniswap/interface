import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TimePeriod, TokenData } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { darken } from 'polished'
import React, { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Heart } from 'react-feather'
import { ArrowDown, ArrowUp } from 'react-feather'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/formatDollarAmt'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from './constants'
import { TIME_DISPLAYS } from './TimeSelector'
import { favoritesAtom } from './TokenTable'

enum Category {
  percent_change = '% Change',
  market_cap = 'Market Cap',
  price = 'Price',
  volume = 'Volume',
}
enum SortDirection {
  Increasing = 'Increasing',
  Decreasing = 'Decreasing',
}
const SORT_CATEGORIES = Object.values(Category)

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
  grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 4fr 5fr 2fr;
  font-size: 15px;
  line-height: 24px;

  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.2fr 1fr 6fr 4fr 4fr 4fr 4fr 3fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 2.5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1.2fr 1fr 8fr 5fr 5fr 3.5fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7fr 4fr 4fr 0.5px;
    width: fit-content;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 12fr 6fr;
    width: fit-content;
    min-width: unset;
    border-bottom: 0.5px solid ${({ theme }) => theme.bg3};
    padding: 0px;

    :last-of-type {
      border-bottom: none;
    }
  }
`
const ClickFavorited = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.primary1};
  }
`
const FavoriteCell = styled(Cell)`
  min-width: 40px;
  color: ${({ theme }) => theme.text2};
  fill: none;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const StyledHeaderRow = styled(StyledTokenRow)`
  width: 100%;
  height: 48px;
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  line-height: 16px;
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.bg3};
  border-radius: 8px 8px 0px 0px;
  padding: 0px 12px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const ListNumberCell = styled(Cell)`
  color: ${({ theme }) => theme.text2};
  min-width: 32px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    justify-content: flex-start;
    min-width: 20px;
  }
`
const MarketCapCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding-left: 8px;
  gap: 8px;
  min-width: 200px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    min-width: fit-content;
    padding-right: 8px;
  }
`

const PercentChangeCell = styled(Cell)`
  justify-content: flex-end;
  min-width: 80px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const PercentChangeInfoCell = styled(Cell)`
  display: none;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: flex;
    color: ${({ theme }) => theme.text3};
    font-size: 12px;
    line-height: 16px;
  }
`
const PriceCell = styled(Cell)`
  justify-content: flex-end;
  min-width: 80px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    min-width: max-content;
  }
`
const PriceInfoCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    flex-direction: column;
  }
`
const SortArrowCell = styled(Cell)`
  padding-right: 2px;
`
const SortingCategory = styled.span`
  color: ${({ theme }) => theme.primary1};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => darken(0.08, theme.bg0)};
  }
`
const SortOption = styled.span`
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => darken(0.08, theme.bg0)};
  }
`
const SparkLineCell = styled(Cell)`
  padding: 0px 24px;
  min-width: 120px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SparkLineImg = styled(Cell)`
  max-width: 124px;
  max-height: 28px;
  flex-direction: column;
  transform: scale(1.2);
`
const SwapCell = styled(Cell)`
  justify-content: flex-end;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const SwapButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  width: 54px;
  height: 32px;
  background: ${({ theme }) => theme.primary2};
  border-radius: 12px;
  border: none;
  color: ${({ theme }) => theme.white};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary2)};
  }
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
const TokenSymbol = styled(Cell)`
  color: ${({ theme }) => theme.text3};

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    font-size: 12px;
    height: 16px;
    justify-content: flex-start;
    width: 100%;
  }
`
const VolumeCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
/* Loading state bubbles */
const LoadingBubble = styled.div`
  background-color: ${({ theme }) => darken(0.1, theme.bg3)};
  border-radius: 12px;
  height: 24px;
  width: 50%;
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
  sortDirection,
  isSorted,
  sortable,
  timeframe,
}: {
  category: string // TODO: change this to make it work for trans
  sortDirection: SortDirection
  isSorted: boolean
  sortable: boolean
  timeframe: string
}) {
  if (isSorted) {
    return (
      <SortingCategory>
        <SortArrowCell>
          {sortDirection === SortDirection.Decreasing ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
        </SortArrowCell>
        <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
      </SortingCategory>
    )
  }
  if (sortable) return <SortOption>{getHeaderDisplay(category, timeframe)}</SortOption>
  return <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
}

/* Token Row: skeleton row component */
export function TokenRow({
  header,
  favorited,
  listNumber,
  tokenInfo,
  price,
  percentChange,
  marketCap,
  volume,
  sparkLine,
  swap,
}: {
  header: boolean
  favorited: ReactNode
  listNumber: ReactNode
  tokenInfo: ReactNode
  price: ReactNode
  percentChange: ReactNode
  marketCap: ReactNode
  volume: ReactNode
  sparkLine: ReactNode
  swap: ReactNode
}) {
  const rowCells = (
    <>
      <FavoriteCell>{favorited}</FavoriteCell>
      <ListNumberCell>{listNumber}</ListNumberCell>
      <NameCell>{tokenInfo}</NameCell>
      <PriceCell>{price}</PriceCell>
      <PercentChangeCell>{percentChange}</PercentChangeCell>
      <MarketCapCell>{marketCap}</MarketCapCell>
      <VolumeCell>{volume}</VolumeCell>
      <SparkLineCell>{sparkLine}</SparkLineCell>
      <SwapCell>{swap}</SwapCell>
    </>
  )
  if (header) return <StyledHeaderRow>{rowCells}</StyledHeaderRow>
  return <StyledTokenRow>{rowCells}</StyledTokenRow>
}

/* Header Row: top header row component for table */
export function HeaderRow({ timeframe }: { timeframe: string }) {
  /* TODO: access which sort category used and timeframe used (temporarily hardcoded values) */
  const sortedBy = SORT_CATEGORIES[1]
  return (
    <TokenRow
      header={true}
      favorited={null}
      listNumber={null}
      tokenInfo={<Trans>Name</Trans>}
      price={
        <HeaderCell
          category={Category.price}
          sortDirection={SortDirection.Decreasing}
          isSorted={sortedBy === Category.price}
          sortable={false}
          timeframe={timeframe}
        />
      }
      percentChange={
        <HeaderCell
          category={Category.percent_change}
          sortDirection={SortDirection.Decreasing}
          isSorted={sortedBy === Category.percent_change}
          sortable={false}
          timeframe={timeframe}
        />
      }
      marketCap={
        <HeaderCell
          category={Category.market_cap}
          sortDirection={SortDirection.Decreasing}
          isSorted={sortedBy === Category.market_cap}
          sortable={true}
          timeframe={timeframe}
        />
      }
      volume={
        <HeaderCell
          category={Category.volume}
          sortDirection={SortDirection.Decreasing}
          isSorted={sortedBy === Category.volume}
          sortable={true}
          timeframe={timeframe}
        />
      }
      sparkLine={null}
      swap={null}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow() {
  return (
    <TokenRow
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
      swap={<LongLoadingBubble />}
    />
  )
}

/* Loaded State: row component with token information */
export default function LoadedRow({
  tokenAddress,
  data,
  listNumber,
  timePeriod,
}: {
  tokenAddress: string
  data: TokenData
  listNumber: number
  timePeriod: TimePeriod
}) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol
  const tokenData = data[tokenAddress]
  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)
  const theme = useTheme()
  const isFavorited = favoriteTokens.includes(tokenAddress)
  // TODO: remove magic number colors
  const tokenPercentChangeInfo = (
    <>
      {tokenData.delta}%
      <ArrowCell>
        {Math.sign(tokenData.delta) > 0 ? (
          <ArrowUpRight size={16} color={theme.green1} />
        ) : (
          <ArrowDownRight size={16} color={theme.red1} />
        )}
      </ArrowCell>
    </>
  )

  /* handle favorite token logic */
  const toggleFavoriteToken = () => {
    let updatedFavoriteTokens
    if (isFavorited) {
      updatedFavoriteTokens = favoriteTokens.filter((address: string) => {
        return address !== tokenAddress
      })
    } else {
      updatedFavoriteTokens = [...favoriteTokens, tokenAddress]
    }
    updateFavoriteTokens(updatedFavoriteTokens)
  }

  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  // TODO: fix listNumber as number on most popular (should be fixed)
  return (
    <TokenRow
      header={false}
      favorited={
        <ClickFavorited onClick={() => toggleFavoriteToken()}>
          <Heart
            size={15}
            color={isFavorited ? theme.primary1 : undefined}
            fill={isFavorited ? theme.primary1 : undefined}
          />
        </ClickFavorited>
      }
      listNumber={listNumber}
      tokenInfo={
        <>
          <CurrencyLogo currency={useCurrency(tokenAddress)} />
          <TokenInfoCell>
            {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
          </TokenInfoCell>
        </>
      }
      price={
        <PriceInfoCell>
          {formatDollarAmount(tokenData.price)}
          <PercentChangeInfoCell>{tokenPercentChangeInfo}</PercentChangeInfoCell>
        </PriceInfoCell>
      }
      percentChange={tokenPercentChangeInfo}
      marketCap={formatAmount(tokenData.marketCap).toUpperCase()}
      volume={formatAmount(tokenData.volume[timePeriod]).toUpperCase()}
      sparkLine={<SparkLineImg dangerouslySetInnerHTML={{ __html: tokenData.sparkline }} />}
      swap={
        <SwapButton>
          <Trans>Swap</Trans>
        </SwapButton>
      }
    />
  )
}
