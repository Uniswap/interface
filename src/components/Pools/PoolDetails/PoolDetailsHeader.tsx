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
  const chainName = chainIdToBackendName(chainId)
  const origin = `/tokens/${chainName}`

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
        <StyledLink to={origin}>
          <ThemedText.BodySecondary>
            <Trans>Explore</Trans>
          </ThemedText.BodySecondary>
        </StyledLink>
        <ThemedText.BodySecondary>&nbsp;{'>'}&nbsp;</ThemedText.BodySecondary>
        {/* TODO: When Explore Pool table is added, link directly back to it */}
        <StyledLink to={origin}>
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
function DoubleCurrencyAndChainLogo({
  chainId,
  currencies,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
}) {
  return (
    <StyledLogoParentContainer>
      <DoubleCurrencyLogo chainId={chainId} currencies={currencies} />
      <SquareL2Logo chainId={chainId} />
    </StyledLogoParentContainer>
  )
}

const L2LogoContainer = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 2px;
  height: 12px;
  left: 60%;
  position: absolute;
  top: 60%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`

function SquareL2Logo({ chainId }: { chainId: ChainId }) {
  if (chainId === ChainId.MAINNET) return null

  return (
    <L2LogoContainer>
      <ChainLogo chainId={chainId} size={12} />
    </L2LogoContainer>
  )
}

export function DoubleCurrencyLogo({
  chainId,
  currencies,
  small,
}: {
  chainId: number
  currencies: Array<Currency | undefined>
  small?: boolean
}) {
  const [src, nextSrc] = useTokenLogoSource(currencies?.[0]?.wrapped.address, chainId, currencies?.[0]?.isNative)
  const [src2, nextSrc2] = useTokenLogoSource(currencies?.[1]?.wrapped.address, chainId, currencies?.[1]?.isNative)

  return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} small={small} />
}

const DoubleLogoContainer = styled.div<{ small?: boolean }>`
  display: flex;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: ${({ small }) => (small ? '10px' : '16px')};
    height: ${({ small }) => (small ? '20px' : '32px')};
    object-fit: cover;
  }
  img:first-child {
    border-radius: ${({ small }) => (small ? '10px 0 0 10px' : '16px 0 0 16px')};
    object-position: 0 0;
  }
  img:last-child {
    border-radius: ${({ small }) => (small ? '0 10px 10px 0' : '0 16px 16px 0')};
    object-position: 100% 0;
  }
`

const CircleLogoImage = styled.img<{ small?: boolean }>`
  width: ${({ small }) => (small ? '10px' : '16px')};
  height: ${({ small }) => (small ? '20px' : '32px')};
  border-radius: 50%;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
  small?: boolean
}

function DoubleLogo({ logo1, onError1, logo2, onError2, small }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer small={small}>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} small={small} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} small={small} />
    </DoubleLogoContainer>
  )
}
