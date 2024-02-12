import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { BIPS_BASE } from 'constants/misc'
import { chainIdToBackendName, getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import { ChevronRight } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

import { DetailBubble } from './shared'

const FeeTier = styled(ThemedText.LabelMicro)`
  background: ${({ theme }) => theme.surface2};
  padding: 2px 6px;
  border-radius: 4px;
`

const ToggleReverseArrows = styled(ReverseArrow)`
  ${ClickableStyle}
  fill: ${({ theme }) => theme.neutral2};
`

const IconBubble = styled(LoadingBubble)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`

interface Token {
  id: string
  symbol: string
}

interface PoolDetailsBreadcrumbProps {
  chainId?: number
  poolAddress?: string
  token0?: Token
  token1?: Token
  loading?: boolean
}

export function PoolDetailsBreadcrumb({ chainId, poolAddress, token0, token1, loading }: PoolDetailsBreadcrumbProps) {
  const chainName = chainIdToBackendName(chainId)
  const exploreOrigin = `/explore/${chainName.toLowerCase()}`
  const poolsOrigin = `/explore/pools/${chainName.toLowerCase()}`

  return (
    <BreadcrumbNavContainer isInfoPDPEnabled aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={exploreOrigin}>
        <Trans>Explore</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={poolsOrigin}>
        <Trans>Pools</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {loading || !chainId || !poolAddress ? (
        <DetailBubble $width={200} />
      ) : (
        <CurrentPageBreadcrumb
          address={poolAddress}
          poolName={`${token0?.symbol} / ${token1?.symbol}`}
          chainId={chainId}
        />
      )}
    </BreadcrumbNavContainer>
  )
}

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.neutral1};
  text-decoration: none;
  ${ClickableStyle}
`

interface PoolDetailsHeaderProps {
  chainId?: number
  token0?: Token
  token1?: Token
  feeTier?: number
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
}

export function PoolDetailsHeader({
  chainId,
  token0,
  token1,
  feeTier,
  toggleReversed,
  loading,
}: PoolDetailsHeaderProps) {
  const currencies = [useCurrency(token0?.id, chainId) ?? undefined, useCurrency(token1?.id, chainId) ?? undefined]

  if (loading) {
    return (
      <Row gap="8px" data-testid="pdp-header-loading-skeleton">
        <IconBubble />
        <DetailBubble $width={137} />
      </Row>
    )
  }

  return (
    <Row gap="18px">
      <Row gap="8px" width="max-content">
        {chainId && (
          <DoubleCurrencyAndChainLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} />
        )}
        <ThemedText.HeadlineSmall>
          <StyledLink
            to={getTokenDetailsURL({
              address: token0?.id,
              chain: chainIdToBackendName(chainId),
              isInfoExplorePageEnabled: true,
            })}
          >
            {token0?.symbol}
          </StyledLink>
          &nbsp;/&nbsp;
          <StyledLink
            to={getTokenDetailsURL({
              address: token1?.id,
              chain: chainIdToBackendName(chainId),
              isInfoExplorePageEnabled: true,
            })}
          >
            {token1?.symbol}
          </StyledLink>
        </ThemedText.HeadlineSmall>
      </Row>
      {!!feeTier && <FeeTier>{feeTier / BIPS_BASE}%</FeeTier>}
      <ToggleReverseArrows data-testid="toggle-tokens-reverse-arrows" onClick={toggleReversed} />
    </Row>
  )
}

const StyledLogoParentContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
`
export function DoubleCurrencyAndChainLogo({
  chainId,
  currencies,
  size = 32,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  size?: number
}) {
  return (
    <StyledLogoParentContainer>
      <DoubleCurrencyLogo chainId={chainId} currencies={currencies} size={size} />
      <SquareL2Logo chainId={chainId} size={size} />
    </StyledLogoParentContainer>
  )
}

const L2_LOGO_SIZE_FACTOR = 3 / 8

const L2LogoContainer = styled.div<{ size: number }>`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 2px;
  width: ${({ size }) => size * L2_LOGO_SIZE_FACTOR}px;
  height: ${({ size }) => size * L2_LOGO_SIZE_FACTOR}px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  display: flex;
  align-items: center;
  justify-content: center;
`

function SquareL2Logo({ chainId, size }: { chainId: ChainId; size: number }) {
  if (chainId === ChainId.MAINNET) return null

  return (
    <L2LogoContainer size={size}>
      <ChainLogo chainId={chainId} size={size * L2_LOGO_SIZE_FACTOR} />
    </L2LogoContainer>
  )
}

export function DoubleCurrencyLogo({
  chainId,
  currencies,
  size = 32,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  size?: number
}) {
  const [src, nextSrc] = useTokenLogoSource(currencies?.[0]?.wrapped.address, chainId, currencies?.[0]?.isNative)
  const [src2, nextSrc2] = useTokenLogoSource(currencies?.[1]?.wrapped.address, chainId, currencies?.[1]?.isNative)

  return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} size={size} />
}

const DoubleLogoContainer = styled.div<{ size: number }>`
  display: flex;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: ${({ size }) => size / 2}px;
    height: ${({ size }) => size}px;
    object-fit: cover;
  }
  img:first-child {
    border-radius: ${({ size }) => `${size / 2}px 0 0 ${size / 2}px`};
    object-position: 0 0;
  }
  img:last-child {
    border-radius: ${({ size }) => `0 ${size / 2}px ${size / 2}px 0`};
    object-position: 100% 0;
  }
`

const CircleLogoImage = styled.img<{ size: number }>`
  width: ${({ size }) => size / 2}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
  size: number
}

function DoubleLogo({ logo1, onError1, logo2, onError2, size }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer size={size}>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} size={size} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} size={size} />
    </DoubleLogoContainer>
  )
}
