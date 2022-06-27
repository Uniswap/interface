import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TimePeriod, TokenData } from 'hooks/useTopTokens'
import { darken } from 'polished'
import React from 'react'
import { ArrowDownRight, ArrowUpRight, Heart } from 'react-feather'
import { ArrowDown, ArrowUp } from 'react-feather'
import styled from 'styled-components/macro'
import { formatAmount, formatDollarAmount } from 'utils/formatDollarAmt'

import { TIME_DISPLAYS } from './TimeSelector'

enum Category {
  percent_change = '% Change',
  market_cap = 'Market Cap',
  price = 'Price',
  volume = 'Volume',
}
enum SortDirection {
  inc = 'increasing',
  dec = 'decreasing',
}
const SORT_CATEGORIES = Object.values(Category)

const TokenRowWrapper = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  padding: 0px 12px;
  grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 4fr 5fr 2fr;
  font-size: 15px;
  line-height: 24px;
  margin: 4px 0px;
  max-width: 960px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1.2fr 1fr 6fr 4fr 4fr 4fr 4fr 3fr;
    width: fit-content;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 4fr 2.5fr;
    width: fit-content;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
      grid-template-columns: 1.2fr 1fr 7fr 4fr 4fr 2fr;
      width: fit-content;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr 7fr 4fr 4fr;
    width: fit-content;
  `};
`
const HeaderRowWrapper = styled(TokenRowWrapper)`
  width: 100%;
  height: 48px;
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  line-height: 16px;
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.bg3};
  border-radius: 8px 8px 0px 0px;
`
const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const FavoriteCell = styled(Cell)`
  min-width: 40px;
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display:none
  `};
`
const ListNumberCell = styled(Cell)`
  color: ${({ theme }) => theme.text2};
  min-width: 32px;
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  gap: 8px;
  min-width: 200px;
`
const PriceCell = styled(Cell)`
  justify-content: flex-end;
  align-items: center;
`
const PercentChangeCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;
`

const MarketCapCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
`};
`
const VolumeCell = styled(Cell)`
  justify-content: flex-end;
  min-width: max-content;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`
const SparkLineCell = styled(Cell)`
  flex-direction: column;
  padding: 0px 24px;

  min-width: 120px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `};
`
const SparkLineImg = styled(Cell)`
  max-width: 124px;
  max-height: 28px;
  flex-direction: column;
  transform: scale(1.2);
`

const SwapCell = styled(Cell)`
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display:none
`};
`

const SwapButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-weight: 600;

  width: 54px;
  height: 32px;

  background: ${({ theme }) => theme.primary2};
  border-radius: 12px;
  border: none;
  color: ${({ theme }) => theme.white};
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary2)};
  }
`

const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.text3};
`
const ArrowCell = styled.div`
  padding-left: 4px;
  display: flex;
  flex-direction: column;
`

const SortingCategory = styled.span`
  color: ${({ theme }) => theme.primary1};
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${({ theme }) => darken(0.08, theme.bg0)};
  }
`
const SortOption = styled.span`
  &:hover {
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => darken(0.08, theme.bg0)};
  }
`

const SortArrowCell = styled(Cell)`
  flex-direction: column;
  padding-right: 2px;
`

/* formatting for volume with timeframe header display */
function getHeaderDisplay(category: string, timeframe: string): string {
  if (category === Category.volume) return TIME_DISPLAYS[timeframe] + ' ' + category
  return category
}

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
          {sortDirection === SortDirection.dec ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
        </SortArrowCell>
        <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
      </SortingCategory>
    )
  }
  if (sortable) return <SortOption>{getHeaderDisplay(category, timeframe)}</SortOption>
  return <Trans>{getHeaderDisplay(category, timeframe)}</Trans>
}

export function HeaderRow({ timeframe }: { timeframe: string }) {
  /* TODO: access which sort category used and timeframe used (temporarily hardcoded values) */
  /* TODO: make column aligned */
  const sortedBy = SORT_CATEGORIES[1]
  return (
    <HeaderRowWrapper>
      {/* Empty contents for no header for favorite and rank columns */}
      <FavoriteCell></FavoriteCell>
      <ListNumberCell></ListNumberCell>
      <NameCell>
        <Trans>Name</Trans>
      </NameCell>
      <PriceCell>
        <HeaderCell
          category={Category.price}
          sortDirection={SortDirection.dec}
          isSorted={sortedBy === Category.price}
          sortable={false}
          timeframe={timeframe}
        />
      </PriceCell>
      <PercentChangeCell>
        <HeaderCell
          category={Category.percent_change}
          sortDirection={SortDirection.dec}
          isSorted={sortedBy === Category.percent_change}
          sortable={false}
          timeframe={timeframe}
        />
      </PercentChangeCell>
      <MarketCapCell>
        <HeaderCell
          category={Category.market_cap}
          sortDirection={SortDirection.dec}
          isSorted={sortedBy === Category.market_cap}
          sortable={true}
          timeframe={timeframe}
        />
      </MarketCapCell>
      <VolumeCell>
        <HeaderCell
          category={Category.volume}
          sortDirection={SortDirection.dec}
          isSorted={sortedBy === Category.volume}
          sortable={true}
          timeframe={timeframe}
        />
      </VolumeCell>
      <SparkLineCell></SparkLineCell>
      <SwapCell></SwapCell>
    </HeaderRowWrapper>
  )
}

export default function TokenRow({
  key,
  tokenAddress,
  data,
  listNumber,
  timePeriod,
}: {
  key: string
  tokenAddress: string
  data: TokenData
  listNumber: number
  timePeriod: TimePeriod
}) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol
  const tokenData = data[tokenAddress]
  const theme = useTheme()
  // TODO: remove magic number colors
  // TODO: write favorited hook
  const favorited = true
  return (
    <TokenRowWrapper key={key}>
      <FavoriteCell>
        <Heart size={15} color={favorited ? theme.primary1 : undefined} fill={favorited ? theme.primary1 : undefined} />
      </FavoriteCell>
      <ListNumberCell>{listNumber}</ListNumberCell>
      <NameCell>
        <CurrencyLogo currency={useCurrency(tokenAddress)} />
        {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
      </NameCell>
      <PriceCell>{formatDollarAmount(tokenData.price)}</PriceCell>
      <PercentChangeCell>
        {tokenData.delta}%
        <ArrowCell>
          {Math.sign(tokenData.delta) > 0 ? (
            <ArrowUpRight size={14} color={'#57bd0f'} />
          ) : (
            <ArrowDownRight size={14} color={'red'} />
          )}
        </ArrowCell>
      </PercentChangeCell>
      <MarketCapCell>{formatAmount(tokenData.marketCap).toUpperCase()}</MarketCapCell>
      <VolumeCell>{formatAmount(tokenData.volume[timePeriod]).toUpperCase()}</VolumeCell>
      <SparkLineCell>
        <SparkLineImg dangerouslySetInnerHTML={{ __html: tokenData.sparkline }} />
      </SparkLineCell>
      <SwapCell>
        <SwapButton>
          <Trans>Swap</Trans>
        </SwapButton>
      </SwapCell>
    </TokenRowWrapper>
  )
}
