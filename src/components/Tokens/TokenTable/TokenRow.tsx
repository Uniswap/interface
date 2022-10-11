import { Trans } from '@lingui/macro'
import { ParentSize } from '@visx/responsive'
import { sendAnalyticsEvent } from 'analytics'
import { EventName } from 'analytics/constants'
import SparklineChart from 'components/Charts/SparklineChart'
import CurrencyLogo from 'components/CurrencyLogo'
import { getChainInfo } from 'constants/chainInfo'
import { FavoriteTokensVariant, useFavoriteTokensFlag } from 'featureFlags/flags/favoriteTokens'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { ForwardedRef, forwardRef } from 'react'
import { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, Heart } from 'react-feather'
import { Link, useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components/macro'
import { ClickableStyle } from 'theme'
import { formatDollar } from 'utils/formatNumbers'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../constants'
import { LoadingBubble } from '../loading'
import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
  useIsFavorited,
  useSetSortMethod,
  useToggleFavorite,
} from '../state'
import { useTokenLogoURI } from '../TokenDetails/ChartSection'
import InfoTip from '../TokenDetails/InfoTip'
import { formatDelta, getDeltaArrow } from '../TokenDetails/PriceChart'

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const StyledTokenRow = styled.div<{
  first?: boolean
  last?: boolean
  loading?: boolean
  favoriteTokensEnabled?: boolean
}>`
  background-color: transparent;
  display: grid;
  font-size: 16px;
  grid-template-columns: ${({ favoriteTokensEnabled }) =>
    favoriteTokensEnabled ? '1fr 7fr 4fr 4fr 4fr 4fr 5fr 1.2fr' : '1fr 7fr 4fr 4fr 4fr 4fr 5fr'};
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
    grid-template-columns: 1fr 6.5fr 4.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 7.5fr 4.5fr 4.5fr 4.5fr 1.7fr;
    width: fit-content;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    grid-template-columns: 1fr 10fr 5fr 5fr 1.2fr;
    width: fit-content;
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
export const ClickFavorited = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    opacity: 60%;
  }
`

export const FavoriteIcon = styled(Heart)<{ isFavorited: boolean }>`
  ${ClickableStyle}
  height: 22px;
  width: 24px;
  color: ${({ isFavorited, theme }) => (isFavorited ? theme.accentAction : theme.textSecondary)};
  fill: ${({ isFavorited, theme }) => (isFavorited ? theme.accentAction : 'transparent')};
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
  max-width: 100%;
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
const MarketCapCell = styled(DataCell)`
  padding-right: 8px;
  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const NameCell = styled(Cell)`
  justify-content: flex-start;
  padding: 0px 8px;
  min-width: 240px;
  gap: 8px;
`
const PriceCell = styled(DataCell)`
  padding-right: 8px;
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
const HeaderCellWrapper = styled.span<{ onClick?: () => void }>`
  align-items: center;
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'unset')};
  display: flex;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
  width: 100%;
`
const HeaderCellText = styled(Text)`
  ${ClickableStyle}
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

export const L2NetworkLogo = styled.div<{ networkUrl?: string; size?: string }>`
  height: ${({ size }) => size ?? '12px'};
  width: ${({ size }) => size ?? '12px'};
  position: absolute;
  left: 50%;
  bottom: 0;
  background: url(${({ networkUrl }) => networkUrl});
  background-repeat: no-repeat;
  background-size: ${({ size }) => (size ? `${size} ${size}` : '12px 12px')};
  display: ${({ networkUrl }) => !networkUrl && 'none'};
`
export const LogoContainer = styled.div`
  position: relative;
  align-items: center;
  display: flex;
`

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.PERCENT_CHANGE]: undefined,
  [TokenSortMethod.TOTAL_VALUE_LOCKED]: (
    <Trans>Total value locked (TVL) is the amount of the asset that’s currently in a Uniswap v3 liquidity pool.</Trans>
  ),
  [TokenSortMethod.VOLUME]: (
    <Trans>Volume is the amount of the asset that has been traded on Uniswap v3 during the selected time frame.</Trans>
  ),
}

/* Get singular header cell for header row */
function HeaderCell({
  category,
  sortable,
}: {
  category: TokenSortMethod // TODO: change this to make it work for trans
  sortable: boolean
}) {
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
      <HeaderCellText>{category}</HeaderCellText>
      {description && <InfoTip text={description}></InfoTip>}
    </HeaderCellWrapper>
  )
}

/* Token Row: skeleton row component */
export function TokenRow({
  favorited,
  header,
  listNumber,
  tokenInfo,
  price,
  percentChange,
  marketCap,
  volume,
  sparkLine,
  ...rest
}: {
  favorited: ReactNode
  first?: boolean
  header: boolean
  listNumber: ReactNode
  loading?: boolean
  marketCap: ReactNode
  price: ReactNode
  percentChange: ReactNode
  sparkLine?: ReactNode
  tokenInfo: ReactNode
  volume: ReactNode
  last?: boolean
  style?: CSSProperties
}) {
  const favoriteTokensEnabled = useFavoriteTokensFlag() === FavoriteTokensVariant.Enabled
  const rowCells = (
    <>
      <ListNumberCell header={header}>{listNumber}</ListNumberCell>
      <NameCell>{tokenInfo}</NameCell>
      <PriceCell sortable={header}>{price}</PriceCell>
      <PercentChangeCell sortable={header}>{percentChange}</PercentChangeCell>
      <MarketCapCell sortable={header}>{marketCap}</MarketCapCell>
      <VolumeCell sortable={header}>{volume}</VolumeCell>
      <SparkLineCell>{sparkLine}</SparkLineCell>
      {favoriteTokensEnabled && <FavoriteCell>{favorited}</FavoriteCell>}
    </>
  )
  if (header) return <StyledHeaderRow favoriteTokensEnabled={favoriteTokensEnabled}>{rowCells}</StyledHeaderRow>
  return (
    <StyledTokenRow favoriteTokensEnabled={favoriteTokensEnabled} {...rest}>
      {rowCells}
    </StyledTokenRow>
  )
}

/* Header Row: top header row component for table */
export function HeaderRow() {
  return (
    <TokenRow
      header={true}
      favorited={null}
      listNumber="#"
      tokenInfo={<Trans>Token Name</Trans>}
      price={<HeaderCell category={TokenSortMethod.PRICE} sortable />}
      percentChange={<HeaderCell category={TokenSortMethod.PERCENT_CHANGE} sortable />}
      marketCap={<HeaderCell category={TokenSortMethod.TOTAL_VALUE_LOCKED} sortable />}
      volume={<HeaderCell category={TokenSortMethod.VOLUME} sortable />}
      sparkLine={null}
    />
  )
}

/* Loading State: row component with loading bubbles */
export function LoadingRow() {
  return (
    <TokenRow
      favorited={null}
      header={false}
      listNumber={<SmallLoadingBubble />}
      loading
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

interface LoadedRowProps {
  tokenListIndex: number
  tokenListLength: number
  token: NonNullable<TopToken>
  sparklineMap: SparklineMap
}

/* Loaded State: row component with token information */
export const LoadedRow = forwardRef((props: LoadedRowProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { tokenListIndex, tokenListLength, token } = props
  const tokenAddress = token.address
  const tokenName = token.name
  const tokenSymbol = token.symbol
  const isFavorited = useIsFavorited(tokenAddress)
  const toggleFavorite = useToggleFavorite(tokenAddress)
  const filterString = useAtomValue(filterStringAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const lowercaseChainName = useParams<{ chainName?: string }>().chainName?.toUpperCase() ?? 'ethereum'
  const filterNetwork = lowercaseChainName.toUpperCase()
  const L2Icon = getChainInfo(CHAIN_NAME_TO_CHAIN_ID[filterNetwork]).circleLogoUrl
  const timePeriod = useAtomValue(filterTimeAtom)
  const delta = token.market?.pricePercentChange?.value
  const arrow = getDeltaArrow(delta)
  const formattedDelta = formatDelta(delta)
  const rank = sortAscending ? tokenListLength - tokenListIndex : tokenListIndex + 1

  const exploreTokenSelectedEventProperties = {
    chain_id: filterNetwork,
    token_address: tokenAddress,
    token_symbol: tokenSymbol,
    token_list_index: tokenListIndex,
    token_list_rank: rank,
    token_list_length: tokenListLength,
    time_frame: timePeriod,
    search_token_address_input: filterString,
  }

  // TODO: currency logo sizing mobile (32px) vs. desktop (24px)
  return (
    <div ref={ref}>
      <StyledLink
        to={getTokenDetailsURL(token.address, token.chain)}
        onClick={() => sendAnalyticsEvent(EventName.EXPLORE_TOKEN_ROW_CLICKED, exploreTokenSelectedEventProperties)}
      >
        <TokenRow
          header={false}
          favorited={
            <ClickFavorited
              onClick={(e) => {
                e.preventDefault()
                toggleFavorite()
              }}
            >
              <FavoriteIcon isFavorited={isFavorited} />
            </ClickFavorited>
          }
          listNumber={rank}
          tokenInfo={
            <ClickableName>
              <LogoContainer>
                <CurrencyLogo src={useTokenLogoURI(token)} symbol={tokenSymbol} />
                <L2NetworkLogo networkUrl={L2Icon} />
              </LogoContainer>
              <TokenInfoCell>
                <TokenName>{tokenName}</TokenName>
                <TokenSymbol>{tokenSymbol}</TokenSymbol>
              </TokenInfoCell>
            </ClickableName>
          }
          price={
            <ClickableContent>
              <PriceInfoCell>
                {token.market?.price?.value
                  ? formatDollar({ num: token.market.price.value, isPrice: true, lessPreciseStablecoinValues: true })
                  : '-'}
                <PercentChangeInfoCell>
                  {formattedDelta}
                  {arrow}
                </PercentChangeInfoCell>
              </PriceInfoCell>
            </ClickableContent>
          }
          percentChange={
            <ClickableContent>
              {formattedDelta}
              {arrow}
            </ClickableContent>
          }
          marketCap={
            <ClickableContent>
              {token.market?.totalValueLocked?.value ? formatDollar({ num: token.market.totalValueLocked.value }) : '-'}
            </ClickableContent>
          }
          volume={
            <ClickableContent>
              {token.market?.volume?.value ? formatDollar({ num: token.market.volume.value }) : '-'}
            </ClickableContent>
          }
          sparkLine={
            <SparkLine>
              <ParentSize>
                {({ width, height }) =>
                  props.sparklineMap && (
                    <SparklineChart
                      width={width}
                      height={height}
                      tokenData={token}
                      pricePercentChange={token.market?.pricePercentChange?.value}
                      timePeriod={timePeriod}
                      sparklineMap={props.sparklineMap}
                    />
                  )
                }
              </ParentSize>
            </SparkLine>
          }
          first={tokenListIndex === 0}
          last={tokenListIndex === tokenListLength - 1}
        />
      </StyledLink>
    </div>
  )
})

LoadedRow.displayName = 'LoadedRow'
