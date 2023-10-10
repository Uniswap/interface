import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import Column from 'components/Column'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Row from 'components/Row'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'

import { ReversedArrowsIcon } from './icons'

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
}

export function PoolDetailsHeader({
  chainId,
  poolAddress,
  token0,
  token1,
  feeTier,
  toggleReversed,
}: PoolDetailsHeaderProps) {
  const currencies = [useCurrency(token0?.id, chainId) ?? undefined, useCurrency(token1?.id, chainId) ?? undefined]
  const chainName = chainIdToBackendName(chainId)
  const origin = `/tokens/${chainName}`
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
        {!!feeTier && <FeeTier>{feeTier / 10000}%</FeeTier>}
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

function DoubleCurrencyLogo({ chainId, currencies }: { chainId: number; currencies: Array<Currency | undefined> }) {
  const [src, nextSrc] = useTokenLogoSource(currencies?.[0]?.wrapped.address, chainId, currencies?.[0]?.isNative)
  const [src2, nextSrc2] = useTokenLogoSource(currencies?.[1]?.wrapped.address, chainId, currencies?.[1]?.isNative)

  return <DoubleLogo logo1={src} onError1={nextSrc} logo2={src2} onError2={nextSrc2} />
}

const DoubleLogoContainer = styled.div`
  display: flex;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img {
    width: 16px;
    height: 32px;
    object-fit: cover;
  }
  img:first-child {
    border-radius: 16px 0 0 16px;
    object-position: 0 0;
  }
  img:last-child {
    border-radius: 0 16px 16px 0;
    object-position: 100% 0;
  }
`

const CircleLogoImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
`

interface DoubleLogoProps {
  logo1?: string
  logo2?: string
  onError1?: () => void
  onError2?: () => void
}

function DoubleLogo({ logo1, onError1, logo2, onError2 }: DoubleLogoProps) {
  return (
    <DoubleLogoContainer>
      <CircleLogoImage src={logo1 ?? blankTokenUrl} onError={onError1} />
      <CircleLogoImage src={logo2 ?? blankTokenUrl} onError={onError2} />
    </DoubleLogoContainer>
  )
}
