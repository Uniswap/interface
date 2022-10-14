import { Trans } from '@lingui/macro'
import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import CurrencyLogo from 'components/CurrencyLogo'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import { getChainInfo } from 'constants/chainInfo'
import { checkWarning } from 'constants/tokenSafety'
import { FavoriteTokensVariant, useFavoriteTokensFlag } from 'featureFlags/flags/favoriteTokens'
import { PriceDurations, PricePoint, SingleTokenData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID, TimePeriod } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { textFadeIn } from 'theme/animations'

import { filterTimeAtom, useIsFavorited, useToggleFavorite } from '../state'
import { ClickFavorited, FavoriteIcon, L2NetworkLogo, LogoContainer } from '../TokenTable/TokenRow'
import PriceChart from './PriceChart'
import ShareButton from './ShareButton'

export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  gap: 4px;
  margin-bottom: 24px;
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 436px;
  align-items: center;
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
  ${textFadeIn}
`
const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

export function useTokenLogoURI(
  token: NonNullable<SingleTokenData> | NonNullable<TopToken>,
  nativeCurrency?: Token | NativeCurrency
) {
  const chainId = CHAIN_NAME_TO_CHAIN_ID[token.chain]
  return [
    ...useCurrencyLogoURIs(nativeCurrency),
    ...useCurrencyLogoURIs({ ...token, chainId }),
    token.project?.logoUrl,
  ][0]
}

export default function ChartSection({
  token,
  currency,
  nativeCurrency,
  prices,
}: {
  token: NonNullable<SingleTokenData>
  currency?: Currency | null
  nativeCurrency?: Token | NativeCurrency
  prices: PriceDurations
}) {
  const isFavorited = useIsFavorited(token.address)
  const toggleFavorite = useToggleFavorite(token.address)
  const chainId = CHAIN_NAME_TO_CHAIN_ID[token.chain]
  const L2Icon = getChainInfo(chainId)?.circleLogoUrl
  const warning = checkWarning(token.address ?? '')
  const timePeriod = useAtomValue(filterTimeAtom)

  const logoSrc = useTokenLogoURI(token, nativeCurrency)

  // Backend doesn't always return latest price point for every duration.
  // Thus we need to manually determine latest price point available, and
  // append it to the prices list for every duration.
  useMemo(() => {
    let latestPricePoint: PricePoint = { value: 0, timestamp: 0 }
    let latestPricePointTimePeriod: TimePeriod
    Object.keys(prices).forEach((key) => {
      const latestPricePointForTimePeriod = prices[key as unknown as TimePeriod]?.slice(-1)[0]
      if (latestPricePointForTimePeriod && latestPricePointForTimePeriod.timestamp > latestPricePoint.timestamp) {
        latestPricePoint = latestPricePointForTimePeriod
        latestPricePointTimePeriod = key as unknown as TimePeriod
      }
    })
    Object.keys(prices).forEach((key) => {
      if ((key as unknown as TimePeriod) !== latestPricePointTimePeriod) {
        prices[key as unknown as TimePeriod]?.push(latestPricePoint)
      }
    })
  }, [prices])

  return (
    <ChartHeader>
      <TokenInfoContainer>
        <TokenNameCell>
          <LogoContainer>
            <CurrencyLogo
              src={logoSrc}
              size={'32px'}
              symbol={nativeCurrency?.symbol ?? token.symbol}
              currency={nativeCurrency ? undefined : currency}
            />
            <L2NetworkLogo networkUrl={L2Icon} size={'16px'} />
          </LogoContainer>
          {nativeCurrency?.name ?? token.name ?? <Trans>Name not found</Trans>}
          <TokenSymbol>{nativeCurrency?.symbol ?? token.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
          {!warning && <VerifiedIcon size="16px" />}
        </TokenNameCell>
        <TokenActions>
          {token.name && token.symbol && token.address && <ShareButton token={token} isNative={!!nativeCurrency} />}
          {useFavoriteTokensFlag() === FavoriteTokensVariant.Enabled && (
            <ClickFavorited onClick={toggleFavorite}>
              <FavoriteIcon isFavorited={isFavorited} />
            </ClickFavorited>
          )}
        </TokenActions>
      </TokenInfoContainer>
      <ChartContainer>
        <ParentSize>
          {({ width, height }) => prices && <PriceChart prices={prices[timePeriod]} width={width} height={height} />}
        </ParentSize>
      </ChartContainer>
    </ChartHeader>
  )
}
