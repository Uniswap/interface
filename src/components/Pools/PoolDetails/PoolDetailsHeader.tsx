import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import Column from 'components/Column'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { BIPS_BASE } from 'constants/misc'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'

import { ReversedArrowsIcon } from './icons'
import { DetailBubble } from './shared'

const HeaderColumn = styled(Column)`
  gap: 36px;
`

const StyledLink = styled(Link)`
  text-decoration: none;
  ${ClickableStyle}
`

const FeeTier = styled(ThemedText.LabelMicro)`
  background: ${({ theme }) => theme.surface2};
  padding: 2px 6px;
  border-radius: 4px;
`

const ToggleReverseArrows = styled(ReversedArrowsIcon)`
  ${ClickableStyle}
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

interface PoolDetailsHeaderProps {
  chainId?: number
  poolAddress?: string
  token0?: Token
  token1?: Token
  feeTier?: number
  toggleReversed: React.DispatchWithoutAction
  loading?: boolean
}

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  toggleReversed,
  loading,
}: PoolDetailsHeaderProps) {
  const currencies = [useCurrency(token0?.id, chainId) ?? undefined, useCurrency(token1?.id, chainId) ?? undefined]
  const chainName = chainIdToBackendName(chainId).toLowerCase()
  const exploreHref = `/tokens/${chainName}`
  const explorePoolsHref = `/explore/pools/${chainName}`

  if (loading)
    return (
      <HeaderColumn data-testid="pdp-header-loading-skeleton">
        <DetailBubble $width={300} />
        <Column gap="sm">
          <Row gap="8px">
            <IconBubble />
            <DetailBubble $width={137} />
          </Row>
        </Column>
      </HeaderColumn>
    )

  return (
    <HeaderColumn>
      <Row>
        <StyledLink to={exploreHref}>
          <ThemedText.BodySecondary>
            <Trans>Explore</Trans>
          </ThemedText.BodySecondary>
        </StyledLink>
        <ThemedText.BodySecondary>&nbsp;{'>'}&nbsp;</ThemedText.BodySecondary>
        {/* TODO: When Explore Pool table is added, link directly back to it */}
        <StyledLink to={explorePoolsHref}>
          <ThemedText.BodySecondary>
            <Trans>Pool</Trans>
          </ThemedText.BodySecondary>
        </StyledLink>
        <ThemedText.BodySecondary>&nbsp;{'>'}&nbsp;</ThemedText.BodySecondary>
        <ThemedText.BodyPrimary>
          {token0?.symbol} / {token1?.symbol} ({shortenAddress(poolAddress)})
        </ThemedText.BodyPrimary>
      </Row>
      <Row gap="18px">
        <Row gap="8px" width="max-content">
          {chainId && (
            <DoubleCurrencyAndChainLogo data-testid="double-token-logo" chainId={chainId} currencies={currencies} />
          )}
          <ThemedText.HeadlineSmall>
            {token0?.symbol} / {token1?.symbol}
          </ThemedText.HeadlineSmall>
        </Row>
        {!!feeTier && <FeeTier>{feeTier / BIPS_BASE}%</FeeTier>}
        <ToggleReverseArrows data-testid="toggle-tokens-reverse-arrows" onClick={toggleReversed} />
      </Row>
    </HeaderColumn>
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

function DoubleCurrencyLogo({
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
