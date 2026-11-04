import type { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { type ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { TokenHoverCard, type TokenHoverCardToken } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getTokenDetailsURL, unwrapToken } from '~/data/util'

// Bundled native-currency logo (e.g. ETH for an unwrapped WETH row) — no request needed.
// Cast because the source type is RN's ImageSourcePropType, not a plain URL string.
function getNativeLogoUrl(chainId: UniverseChainId): string {
  return getChainInfo(chainId).nativeCurrency.logo as unknown as string
}

// `Link` (react-router) has no compat primitive, so the clickable chrome rebuilds on the house
// styled() factory rather than a compat prop spread. Never rides a native bundle (apps/web only),
// so `platform: 'web'` legalizes the literal hover:/active: classes directly.
const StyledInternalLinkBase = styled(Link, {
  platform: 'web',
  base: 'cursor-pointer no-underline text-neutral1 transition-opacity duration-100 hover:opacity-80 active:opacity-60',
})

// This link renders as a direct child of TokenHoverCard's legacy `TouchableArea` trigger, which
// clones non-icon, non-mycelium-primitive children and injects `color`/`backgroundColor` (the same
// hazard documented for icons under TouchableArea, generalized: WithInjectedColors in
// TouchableArea.tsx) — the styled() factory carries no primitive marker to make the injector skip
// it, so the un-consumed props land as unrecognized DOM attributes. Both are fixed by the classes
// above regardless of caller, so drop them here. Remove this widening once INFRA-3823 gives
// TouchableArea a way to skip non-primitive children, since it also swallows any legitimate
// future `color`/`backgroundColor` caller.
const StyledInternalLink = forwardRef<
  ComponentRef<typeof StyledInternalLinkBase>,
  ComponentPropsWithoutRef<typeof StyledInternalLinkBase> & { color?: unknown; backgroundColor?: unknown }
>(function StyledInternalLink({ color: _injectedColor, backgroundColor: _injectedBackgroundColor, ...rest }, ref) {
  return <StyledInternalLinkBase ref={ref} {...rest} />
})

// Renders from the row's own token data (no request); TokenHoverCard fetches richer
// CurrencyInfo lazily on hover.
export const TokenLinkCell = ({ token, hideLogo }: { token: ParsedToken; hideLogo?: boolean }) => {
  const { t } = useTranslation()
  const { chainId } = token
  const unwrappedToken = unwrapToken(chainId, token)

  const hoverCardToken: TokenHoverCardToken = {
    chainId,
    address: unwrappedToken.address ?? NATIVE_CHAIN_ID,
  }

  return (
    <TokenHoverCard token={hoverCardToken}>
      <StyledInternalLink
        to={getTokenDetailsURL({
          address: unwrappedToken.address,
          chainId,
        })}
      >
        <Flex row gap="$gap8" maxWidth="100px" alignItems="center">
          <EllipsisText>{unwrappedToken.symbol ?? t('common.unknown').toUpperCase()}</EllipsisText>
          {!hideLogo && (
            // unwrapToken doesn't rewrite logoUrl, so native rows (no address, or unwrapped to
            // NATIVE_CHAIN_ID) fall back to the bundled native logo instead of the raw payload.
            <TokenLogo
              chainId={chainId}
              size={22}
              url={
                !unwrappedToken.address || unwrappedToken.address === NATIVE_CHAIN_ID
                  ? getNativeLogoUrl(chainId)
                  : token.logoUrl
              }
              symbol={unwrappedToken.symbol ?? token.symbol}
              name={unwrappedToken.name}
            />
          )}
        </Flex>
      </StyledInternalLink>
    </TokenHoverCard>
  )
}
