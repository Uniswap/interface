import { Trans } from '@lingui/macro'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { ParentSize } from '@visx/responsive'
import CurrencyLogo from 'components/CurrencyLogo'
import { VerifiedIcon } from 'components/TokenSafety/TokenSafetyIcon'
import { getChainInfo } from 'constants/chainInfo'
import { checkWarning } from 'constants/tokenSafety'
import { FavoriteTokensVariant, useFavoriteTokensFlag } from 'featureFlags/flags/favoriteTokens'
import { SingleTokenData, useTokenPricesCached } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import useCurrencyLogoURIs, { getTokenLogoURI } from 'lib/hooks/useCurrencyLogoURIs'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'

import { useIsFavorited, useToggleFavorite } from '../state'
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
  const checksummedAddress = isAddress(token.address)
  const chainId = CHAIN_NAME_TO_CHAIN_ID[token.chain]
  return (
    useCurrencyLogoURIs(nativeCurrency)[0] ??
    (checksummedAddress && getTokenLogoURI(checksummedAddress, chainId)) ??
    token.project?.logoUrl
  )
}

export default function ChartSection({
  token,
  nativeCurrency,
}: {
  token: NonNullable<SingleTokenData>
  nativeCurrency?: Token | NativeCurrency
}) {
  const isFavorited = useIsFavorited(token.address)
  const toggleFavorite = useToggleFavorite(token.address)
  const chainId = CHAIN_NAME_TO_CHAIN_ID[token.chain]
  const L2Icon = getChainInfo(chainId).circleLogoUrl
  const warning = checkWarning(token.address ?? '')

  const { prices } = useTokenPricesCached(token)

  const logoSrc = useTokenLogoURI(token, nativeCurrency)

  return (
    <ChartHeader>
      <TokenInfoContainer>
        <TokenNameCell>
          <LogoContainer>
            <CurrencyLogo src={logoSrc} size={'32px'} symbol={nativeCurrency?.symbol ?? token.symbol} />
            <L2NetworkLogo networkUrl={L2Icon} size={'16px'} />
          </LogoContainer>
          {nativeCurrency?.name ?? token.name ?? <Trans>Name not found</Trans>}
          <TokenSymbol>{nativeCurrency?.symbol ?? token.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
          {!warning && <VerifiedIcon size="20px" />}
        </TokenNameCell>
        <TokenActions>
          {token.name && token.symbol && token.address && (
            <ShareButton tokenName={token.name} tokenSymbol={token.symbol} tokenAddress={token.address} />
          )}
          {useFavoriteTokensFlag() === FavoriteTokensVariant.Enabled && (
            <ClickFavorited onClick={toggleFavorite}>
              <FavoriteIcon isFavorited={isFavorited} />
            </ClickFavorited>
          )}
        </TokenActions>
      </TokenInfoContainer>
      <ChartContainer>
        <ParentSize>
          {({ width, height }) => prices && <PriceChart prices={prices} width={width} height={height} />}
        </ParentSize>
      </ChartContainer>
    </ChartHeader>
  )
}
