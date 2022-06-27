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

enum Category {
  percent_change = '% Change',
  market_cap = 'Market Cap',
  price = 'Price',
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
  padding: 14px 0px;
  gap: 10px;
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display:none
  `};
`
const ListNumberCell = styled(Cell)`
  padding: 14px 0px;
  gap: 10px;
  color: ${({ theme }) => theme.text2};
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding: 14px 8px;
  gap: 8px;
  min-width: 200px;
`
const PriceCell = styled(Cell)`
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0px;
  gap: 10px;
`
const PercentChangeCell = styled(Cell)`
  flex-direction: column;
  align-items: flex-end;
  padding: 14px 0px;
  gap: 10px;
  min-width: max-content;
`

const MarketCapCell = styled(Cell)`
  justify-content: flex-end;
  padding: 12px 0px;
  gap: 10px;
  min-width: max-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`
const VolumeCell = styled(Cell)`
  justify-content: flex-end;
  padding: 12px 0px;
  gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`
const SparkLineCell = styled(Cell)`
  flex-direction: column;
  padding: 16px 24px;
  gap: 10px;
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
  padding: 16px 0px;
  gap: 10px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
  display:none
`};
`

const SwapButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
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
`

const SortArrowCell = styled(Cell)`
  flex-direction: column;
  padding-right: 2px;
`

function getHeaderCategory(category: string, sortCategory: string, sortDecreasing: boolean) {
  if (sortCategory === category) {
    return (
      <SortingCategory>
        <SortArrowCell>{sortDecreasing ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</SortArrowCell>
        {category}
      </SortingCategory>
    )
  }
  return category
}

export function HeaderRow() {
  /* TODO: access which sort category used and timeframe used (temporarily hardcoded values) */
  const sortCategory = SORT_CATEGORIES[0]
  const sortDecreasing = true
  return (
    <HeaderRowWrapper>
      {/* Empty contents for no header for favorite and rank columns */}
      <FavoriteCell></FavoriteCell>
      <ListNumberCell></ListNumberCell>
      <NameCell>
        <Trans>Name</Trans>
      </NameCell>
      <PriceCell>
        <Trans>{getHeaderCategory('Price', sortCategory, sortDecreasing)}</Trans>
      </PriceCell>
      <PercentChangeCell>
        <Trans>{getHeaderCategory('% Change', sortCategory, sortDecreasing)}</Trans>
      </PercentChangeCell>
      <MarketCapCell className="col-hide-3">
        <Trans>{getHeaderCategory('Market Cap', sortCategory, sortDecreasing)}</Trans>
      </MarketCapCell>
      <VolumeCell className="col-hide-2">
        <Trans>1D Volume</Trans>
      </VolumeCell>
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
        <Cell>
          {tokenData.delta}%
          <ArrowCell>
            {Math.sign(tokenData.delta) > 0 ? (
              <ArrowUpRight size={14} color={'#57bd0f'} />
            ) : (
              <ArrowDownRight size={14} color={'red'} />
            )}
          </ArrowCell>
        </Cell>
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
