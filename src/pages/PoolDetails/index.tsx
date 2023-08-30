import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
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
  const origin = `/tokens/${chainName}`
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
          <ThemedText.HeadlineSmall>
            {token0?.symbol} / {token1?.symbol}
          </ThemedText.HeadlineSmall>
          <FeeTier>{poolData?.feeTier / 10000}%</FeeTier>
          <ToggleReverseArrows onClick={toggleReversed} />
        </Row>
      </LeftColumn>
    </PageWrapper>
  )
}
