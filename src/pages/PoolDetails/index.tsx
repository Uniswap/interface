import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import Column from 'components/Column'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { Globe } from 'components/Icons/Globe'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import {
  NoInfoAvailable,
  TokenDescriptionContainer,
  truncateDescription,
  TruncateDescriptionButton,
} from 'components/Tokens/TokenDetails/shared'
import { useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import { useColor } from 'hooks/useColor'
import NotFound from 'pages/NotFound'
import { useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, EllipsisStyle, ExternalLink, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { isAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PoolDetailsHeader } from './PoolDetailsHeader'
import { PoolDetailsStats } from './PoolDetailsStats'
import { PoolDetailsStatsButtons } from './PoolDetailsStatsButtons'

const PageWrapper = styled(Row)`
  padding: 48px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: 48px 16px;
  }
`

const RightColumn = styled(Column)`
  gap: 24px;
  margin: 0 48px 0 auto;
  width: 22vw;
  min-width: 360px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    margin: 44px 0px;
    width: 100%;
    min-width: unset;
  }
`

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
`

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = getValidUrlChainName(chainName)
  const chainId = chain && supportedChainIdFromGQLChain(chain)
  const { data: poolData, loading } = usePoolData(poolAddress ?? '', chainId)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const token0 = isReversed ? poolData?.token1 : poolData?.token0
  const token1 = isReversed ? poolData?.token0 : poolData?.token1
  const isInvalidPool = !chainName || !poolAddress || !getValidUrlChainName(chainName) || !isAddress(poolAddress)
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  // TODO(WEB-2814): Add skeleton once designed
  if (loading) return null
  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <PoolDetailsHeader
        chainId={chainId}
        poolAddress={poolAddress}
        token0={token0}
        token1={token1}
        feeTier={poolData?.feeTier}
        toggleReversed={toggleReversed}
      />
      <RightColumn>
        <PoolDetailsStatsButtons chainId={chainId} token0={token0} token1={token1} feeTier={poolData?.feeTier} />
        {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
        {(token0 || token1) && (
          <TokenDetailsWrapper>
            <TokenDetailsHeader>
              <Trans>Info</Trans>
            </TokenDetailsHeader>
            {token0 && <PoolDetailsTokenInfo token={token0} chainId={chainId} />}
            {token1 && <PoolDetailsTokenInfo token={token1} chainId={chainId} />}
          </TokenDetailsWrapper>
        )}
      </RightColumn>
    </PageWrapper>
  )
}

const PoolDetailsTokenSection = styled(Column)`
  gap: 12px;
  width: 100%;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) and (min-width: ${BREAKPOINTS.sm}px) {
    max-width: 45%;
  }
`

const PoolDetailsNameRow = styled(Row)`
  gap: 8px;
  width: 100%;
`

const TokenName = styled(ThemedText.BodyPrimary)`
  ${EllipsisStyle}
`

const PoolDetailsButtonRow = styled(PoolDetailsNameRow)`
  flex-wrap: wrap;
`

const PoolDetailsButton = styled(Row)<{ tokenColor: string }>`
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  color: ${({ tokenColor }) => tokenColor};
  background-color: ${({ tokenColor }) => opacify(12, tokenColor)};
  font-size: 14px;
  font-weight: 535;
  line-height: 16px;
  ${ClickableStyle}
`

const TRUNCATE_CHARACTER_COUNT = 75

function PoolDetailsTokenInfo({ token, chainId = ChainId.MAINNET }: { token: Token; chainId?: number }) {
  const currency = useCurrency(token.id, chainId)
  const color = useColor(currency?.wrapped)
  const { data: tokenQuery } = useTokenQuery({
    variables: {
      address: token.id,
      chain: chainIdToBackendName(chainId),
    },
    errorPolicy: 'all',
  })
  const description = tokenQuery?.token?.project?.description
  const explorerUrl = getExplorerLink(chainId, token.id, ExplorerDataType.TOKEN)
  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT

  const tokenDescription =
    shouldTruncate && isDescriptionTruncated ? truncateDescription(description, TRUNCATE_CHARACTER_COUNT) : description

  return (
    <PoolDetailsTokenSection>
      <PoolDetailsNameRow>
        <CurrencyLogo currency={currency} size="20px" />
        <TokenName>{currency?.name}</TokenName>
        <ThemedText.BodySecondary>{currency?.symbol}</ThemedText.BodySecondary>
      </PoolDetailsNameRow>
      <PoolDetailsButtonRow>
        <ExternalLink href={explorerUrl}>
          <PoolDetailsButton tokenColor={color}>
            <EtherscanLogo width="18px" height="18px" fill={color} />
            <Trans>Etherscan</Trans>
          </PoolDetailsButton>
        </ExternalLink>
        {tokenQuery?.token?.project?.homepageUrl && (
          <ExternalLink href={tokenQuery.token.project.homepageUrl}>
            <PoolDetailsButton tokenColor={color}>
              <Globe width="18px" height="18px" fill={color} />
              <Trans>Website</Trans>
            </PoolDetailsButton>
          </ExternalLink>
        )}
        {tokenQuery?.token?.project?.twitterName && (
          <ExternalLink href={`https://x.com/${tokenQuery.token.project.twitterName}`}>
            <PoolDetailsButton tokenColor={color}>
              <TwitterXLogo width="18px" height="18px" fill={color} />
              <Trans>Twitter/X</Trans>
            </PoolDetailsButton>
          </ExternalLink>
        )}
      </PoolDetailsButtonRow>
      <TokenDescriptionContainer>
        {!description && (
          <NoInfoAvailable>
            <Trans>No token information available</Trans>
          </NoInfoAvailable>
        )}
        {tokenDescription}
        {shouldTruncate && (
          <TruncateDescriptionButton onClick={toggleIsDescriptionTruncated}>
            {isDescriptionTruncated ? <Trans>Show more</Trans> : <Trans>Hide</Trans>}
          </TruncateDescriptionButton>
        )}
      </TokenDescriptionContainer>
    </PoolDetailsTokenSection>
  )
}
