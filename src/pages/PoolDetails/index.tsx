import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import blankTokenUrl from 'assets/svg/blank_token.svg'
import Column from 'components/Column'
import Row from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import NotFound from 'pages/NotFound'
import { useReducer } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme'
import { shortenAddress } from 'utils'

import { ReversedArrowsIcon } from './icons'

const PageWrapper = styled(Row)`
  padding: 40px 56px;
  width: 100%;
`

const LeftColumn = styled(Column)`
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

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const chainId = supportedChainIdFromGQLChain(chain)
  const { data: poolData, loading } = usePoolData(poolAddress ?? '', chainId)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const token0 = isReversed ? poolData?.token1 : poolData?.token0
  const token1 = isReversed ? poolData?.token0 : poolData?.token1
  const currencies = [useCurrency(token0?.id, chainId) ?? undefined, useCurrency(token1?.id, chainId) ?? undefined]
  const origin = `/tokens/${chainName}`
  // TODO: Add skeleton once designed
  if (loading) return <></>
  if (!loading && !poolData) return <NotFound />
  return (
    <PageWrapper>
      <LeftColumn gap="xl">
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
            <DoubleCurrencyAndChainLogo chainId={chainId} currencies={currencies} />
            <ThemedText.HeadlineSmall>
              {token0?.symbol} / {token1?.symbol}
            </ThemedText.HeadlineSmall>
          </Row>
          <FeeTier>{poolData?.feeTier / 10000}%</FeeTier>
          <ToggleReverseArrows onClick={toggleReversed} />
        </Row>
      </LeftColumn>
    </PageWrapper>
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

const L2LogoContainer = styled.div<{ hasSquareLogo?: boolean }>`
  background-color: ${({ theme, hasSquareLogo }) => (hasSquareLogo ? theme.surface2 : theme.neutral1)};
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

const StyledChainLogo = styled.img`
  height: 12px;
  width: 12px;
`

const SquareChainLogo = styled.img`
  height: 100%;
  width: 100%;
`

function SquareL2Logo({ chainId }: { chainId: ChainId }) {
  if (chainId === ChainId.MAINNET) return null
  const { squareLogoUrl, logoUrl } = getChainInfo(chainId)

  const chainLogo = squareLogoUrl ?? logoUrl

  return (
    <L2LogoContainer hasSquareLogo={!!squareLogoUrl}>
      {squareLogoUrl ? (
        <SquareChainLogo src={chainLogo} alt="chainLogo" />
      ) : (
        <StyledChainLogo src={chainLogo} alt="chainLogo" />
      )}
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
  flex-direction: row;
  gap: 2px;
  position: relative;
  top: 0;
  left: 0;
  img:nth-child(n) {
    width: 16px;
    height: 32px;
    object-fit: cover;
  }
  img:nth-child(1) {
    border-radius: 16px 0 0 16px;
    object-position: 0 0;
  }
  img:nth-child(2) {
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
