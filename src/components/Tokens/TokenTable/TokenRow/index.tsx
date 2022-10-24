import { ParentSize } from '@visx/responsive'
import SparklineChart from 'components/Charts/SparklineChart'
import CurrencyLogo from 'components/CurrencyLogo'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { ReactNode } from 'react'
import { Heart } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import { ClickableStyle } from 'theme'
import { formatDollar } from 'utils/formatNumbers'

import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MEDIUM_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from '../../constants'
import { LoadingBubble } from '../../loading'
import { useTokenLogoURI } from '../../TokenDetails/ChartSection'
import { formatDelta, getDeltaArrow } from '../../TokenDetails/PriceChart'
import {
  ListNumberCell,
  NameCell,
  PercentChangeCell,
  PercentChangeInfoCell,
  PriceCell,
  PriceInfoCell,
  SparkLineCell,
  SparkLineWrapper,
  TokenInfoCell,
  TokenSymbol,
  TvlCell,
  VolumeCell,
} from './TokenRowCell'

export const StyledTokenRow = styled.div<{
  loading?: boolean
}>`
  background-color: transparent;
  display: grid;
  font-size: 16px;
  color: ${({ theme }) => theme.textPrimary};
  grid-template-columns: 1fr 7fr 4fr 4fr 4fr 4fr 5fr;
  line-height: 24px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  min-width: 390px;
  height: 64px;
  padding-left: 12px;
  padding-right: 12px;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
  width: 100%;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

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
const TokenName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`
export const LogoContainer = styled.div`
  position: relative;
  align-items: center;
  display: flex;
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

/* Loading State: row component with loading bubbles */
export function TokenRowCells({
  index,
  name,
  price,
  percentChange,
  tvl,
  volume,
  sparkline,
}: {
  loading?: boolean
  index: ReactNode
  name: ReactNode
  price: ReactNode
  percentChange: ReactNode
  tvl: ReactNode
  volume: ReactNode
  sparkline?: ReactNode
}) {
  return (
    <>
      <ListNumberCell>{index}</ListNumberCell>
      <NameCell>{name}</NameCell>
      <PriceCell>
        <PriceInfoCell>
          {price}
          <PercentChangeInfoCell>{percentChange}</PercentChangeInfoCell>
        </PriceInfoCell>
      </PriceCell>
      <PercentChangeCell>{percentChange}</PercentChangeCell>
      <TvlCell>{tvl}</TvlCell>
      <VolumeCell>{volume}</VolumeCell>
      <SparkLineCell>{sparkline}</SparkLineCell>
    </>
  )
}

interface TokenRowProps {
  token: NonNullable<TopToken>
  tokenListRank: number
  l2CircleLogo: string | undefined
  sparklineMap: SparklineMap
}

export default function TokenRow({ token, l2CircleLogo, tokenListRank, sparklineMap }: TokenRowProps) {
  const delta = token.market?.pricePercentChange?.value
  const arrow = getDeltaArrow(delta)
  const formattedDelta = formatDelta(delta)

  return (
    <StyledTokenRow>
      <TokenRowCells
        index={tokenListRank}
        name={
          <>
            <LogoContainer>
              <CurrencyLogo src={useTokenLogoURI(token)} symbol={token.symbol} />
              <L2NetworkLogo networkUrl={l2CircleLogo} />
            </LogoContainer>
            <TokenInfoCell>
              <TokenName>{token.name}</TokenName>
              <TokenSymbol>{token.symbol}</TokenSymbol>
            </TokenInfoCell>
          </>
        }
        price={formatDollar({ num: token.market?.price?.value, isPrice: true, lessPreciseStablecoinValues: true })}
        percentChange={
          <>
            {formattedDelta}
            {arrow}
          </>
        }
        tvl={formatDollar({ num: token.market?.totalValueLocked?.value })}
        volume={formatDollar({ num: token.market?.volume?.value })}
        sparkline={
          <SparkLineWrapper>
            <ParentSize>
              {({ width, height }) =>
                sparklineMap && (
                  <SparklineChart
                    width={width}
                    height={height}
                    tokenData={token}
                    pricePercentChange={token.market?.pricePercentChange?.value}
                    sparklineMap={sparklineMap}
                  />
                )
              }
            </ParentSize>
          </SparkLineWrapper>
        }
      />
    </StyledTokenRow>
  )
}

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

/* Loading State: row component with loading bubbles */
export function LoadingRow(props: { first?: boolean; last?: boolean }) {
  return (
    <StyledTokenRow loading={true} {...props}>
      <TokenRowCells
        index={<SmallLoadingBubble />}
        name={
          <>
            <IconLoadingBubble />
            <MediumLoadingBubble />
          </>
        }
        price={<MediumLoadingBubble />}
        percentChange={<LoadingBubble />}
        tvl={<LoadingBubble />}
        volume={<LoadingBubble />}
        sparkline={<SparkLineLoadingBubble />}
      />
    </StyledTokenRow>
  )
}
