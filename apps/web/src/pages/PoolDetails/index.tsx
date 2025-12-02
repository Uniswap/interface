import { PoolData, usePoolData } from 'appGraphql/data/pools/usePoolData'
import { calculateApr } from 'appGraphql/data/pools/useTopPools'
import { gqlToCurrency, unwrapToken } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { LpIncentivesPoolDetailsRewardsDistribution } from 'components/LpIncentives/LpIncentivesPoolDetailsRewardsDistribution'
import ChartSection from 'components/Pools/PoolDetails/ChartSection'
import { PoolDetailsApr } from 'components/Pools/PoolDetails/PoolDetailsApr'
import { PoolDetailsBreadcrumb, PoolDetailsHeader } from 'components/Pools/PoolDetails/PoolDetailsHeader'
import { PoolDetailsLink } from 'components/Pools/PoolDetails/PoolDetailsLink'
import { PoolDetailsStats } from 'components/Pools/PoolDetails/PoolDetailsStats'
import { PoolDetailsStatsButtons } from 'components/Pools/PoolDetails/PoolDetailsStatsButtons'
import { PoolDetailsTableTab } from 'components/Pools/PoolDetails/PoolDetailsTable'
import { useColor } from 'hooks/useColor'
import styled, { useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore/constants'
import { useDynamicMetatags } from 'pages/metatags'
import { getPoolDetailPageTitle } from 'pages/PoolDetails/utils'
import { useEffect, useMemo, useReducer } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Text } from 'rebass'
import { ThemeProvider } from 'theme'
import { Flex } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { useChainIdFromUrlParam } from 'utils/chainParams'

const PageWrapper = styled(Row)`
  padding: 0 20px 52px;
  justify-content: center;
  width: 100%;
  gap: 80px;
  align-items: flex-start;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    padding: 48px 40px;
  }
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xl}px) {
    flex-direction: column;
    align-items: center;
    gap: 0px;
  }
`

const LeftColumn = styled(Column)`
  gap: 40px;
  max-width: 780px;
  overflow: hidden;
  justify-content: flex-start;
  width: 100%;

  @media (max-width: ${breakpoints.xl}px) {
    max-width: unset;
  }
`

const HR = styled.hr`
  border: 0.5px solid ${({ theme }) => theme.surface3};
  width: 100%;
`

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${breakpoints.xl}px) and (min-width: ${breakpoints.md}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${breakpoints.md}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
`

const LinksContainer = styled(Column)`
  gap: 16px;
  width: 100%;
`

function getUnwrappedPoolToken({
  poolData,
  chainId,
  protocolVersion,
}: {
  poolData?: PoolData
  chainId?: number
  protocolVersion?: GraphQLApi.ProtocolVersion
}): [GraphQLApi.Token | undefined, GraphQLApi.Token | undefined] {
  // for v4 pools can be created with ETH or WETH so we need to keep the original tokens
  if (protocolVersion === GraphQLApi.ProtocolVersion.V4) {
    return [poolData?.token0, poolData?.token1]
  }

  return poolData && chainId
    ? [unwrapToken(chainId, poolData.token0), unwrapToken(chainId, poolData.token1)]
    : [undefined, undefined]
}

export default function PoolDetailsPage() {
  const { t } = useTranslation()
  const { poolAddress } = useParams<{ poolAddress: string }>()
  const urlChain = useChainIdFromUrlParam()
  const chainInfo = urlChain ? getChainInfo(urlChain) : undefined
  const { data: poolData, loading } = usePoolData({
    poolIdOrAddress: normalizeAddress(poolAddress ?? '', AddressStringFormat.Lowercase),
    chainId: chainInfo?.id,
    isPoolAddress: isEVMAddress(poolAddress),
  })
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const unwrappedTokens = getUnwrappedPoolToken({
    poolData,
    chainId: chainInfo?.id,
    protocolVersion: poolData?.protocolVersion,
  })
  const [token0, token1] = isReversed ? [unwrappedTokens[1], unwrappedTokens[0]] : unwrappedTokens
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const poolApr = useMemo(
    () =>
      calculateApr({
        volume24h: poolData?.volumeUSD24H,
        tvl: poolData?.tvlUSD,
        feeTier: poolData?.feeTier?.feeAmount,
      }),
    [poolData?.volumeUSD24H, poolData?.tvlUSD, poolData?.feeTier],
  )
  const navigate = useNavigate()

  const { darkMode, surface2, accent1 } = useTheme()
  const color0 = useColor(token0 && gqlToCurrency(token0), {
    backgroundColor: surface2,
    darkMode,
  })
  const color1 = useColor(token1 && gqlToCurrency(token1), {
    backgroundColor: surface2,
    darkMode,
  })

  const isInvalidPool = !poolAddress || !chainInfo
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  const metatagProperties = useMemo(() => {
    const token0Symbol = poolData?.token0.symbol
    const token1Symbol = poolData?.token1.symbol
    const poolName = `${token0Symbol}/${token1Symbol}`
    const chainName = chainInfo?.label ?? 'Ethereum'
    return {
      title: poolName,
      url: window.location.href,
      description: `Swap ${poolName} on ${chainName}. Trade tokens and provide liquidity. Real-time prices, charts, transaction data, and more.`,
    }
  }, [chainInfo?.label, poolData?.token0.symbol, poolData?.token1.symbol])
  const metatags = useDynamicMetatags(metatagProperties)

  const showRewardsDistribution = useMemo(() => {
    return Boolean(
      isLPIncentivesEnabled &&
        poolData &&
        poolData.rewardsCampaign?.boostedApr &&
        poolData.rewardsCampaign.boostedApr > 0,
    )
  }, [isLPIncentivesEnabled, poolData])

  useEffect(() => {
    if (poolNotFound) {
      navigate(`/explore/pools?type=${ExploreTab.Pools}&result=${ModalName.NotFound}`)
    }
  }, [poolNotFound, navigate])

  if (poolNotFound) {
    return null
  }

  return (
    <ThemeProvider token0={color0 !== accent1 ? color0 : undefined} token1={color1 !== accent1 ? color1 : undefined}>
      <Helmet>
        <title>{getPoolDetailPageTitle(t, poolData)}</title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      <Trace
        logImpression={!loading}
        page={InterfacePageName.PoolDetailsPage}
        properties={{
          poolAddress,
          chainId: chainInfo.id,
          feeTier: poolData?.feeTier,
          token0Address: poolData?.token0.address,
          token1Address: poolData?.token1.address,
          token0Symbol: poolData?.token0.symbol,
          token1Symbol: poolData?.token1.symbol,
          token0Name: poolData?.token0.name,
          token1Name: poolData?.token1.name,
        }}
      >
        <PageWrapper>
          <LeftColumn>
            <Column gap="20px">
              <Column>
                <PoolDetailsBreadcrumb
                  chainId={chainInfo.id}
                  poolAddress={poolAddress}
                  token0={token0}
                  token1={token1}
                  loading={loading}
                />
                <PoolDetailsHeader
                  chainId={chainInfo.id}
                  poolAddress={poolAddress}
                  token0={token0}
                  token1={token1}
                  feeTier={poolData?.feeTier}
                  hookAddress={poolData?.hookAddress}
                  protocolVersion={poolData?.protocolVersion}
                  rewardsApr={poolData?.rewardsCampaign?.boostedApr}
                  toggleReversed={toggleReversed}
                  loading={loading}
                />
              </Column>
              <ChartSection
                poolData={poolData}
                loading={loading}
                isReversed={isReversed}
                chain={chainInfo.backendChain.chain}
              />
            </Column>
            <HR />
            <PoolDetailsTableTab
              poolAddress={poolAddress}
              token0={token0}
              token1={token1}
              protocolVersion={poolData?.protocolVersion}
            />
          </LeftColumn>
          <Flex gap="$spacing24" width={360} $xl={{ width: '100%', mt: 44, minWidth: 'unset', mb: 24 }}>
            <Flex $xl={{ marginTop: -24 }}>
              <PoolDetailsStatsButtons
                chainId={chainInfo.id}
                token0={token0}
                token1={token1}
                feeTier={poolData?.feeTier?.feeAmount}
                hookAddress={poolData?.hookAddress}
                isDynamic={poolData?.feeTier?.isDynamic}
                protocolVersion={poolData?.protocolVersion}
                loading={loading}
              />
            </Flex>
            {poolData && (
              <PoolDetailsApr
                poolApr={poolApr}
                rewardsApr={isLPIncentivesEnabled ? poolData.rewardsCampaign?.boostedApr : undefined}
              />
            )}
            {showRewardsDistribution && (
              <LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={poolData?.rewardsCampaign} />
            )}
            <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainInfo.id} loading={loading} />
            <TokenDetailsWrapper>
              <TokenDetailsHeader>
                <Trans i18nKey="common.links" />
              </TokenDetailsHeader>
              <LinksContainer>
                {poolData?.protocolVersion !== GraphQLApi.ProtocolVersion.V4 && (
                  <PoolDetailsLink
                    address={poolAddress}
                    chainId={chainInfo.id}
                    tokens={[token0, token1]}
                    loading={loading}
                  />
                )}
                <PoolDetailsLink address={token0?.address} chainId={chainInfo.id} tokens={[token0]} loading={loading} />
                <PoolDetailsLink address={token1?.address} chainId={chainInfo.id} tokens={[token1]} loading={loading} />
              </LinksContainer>
            </TokenDetailsWrapper>
          </Flex>
        </PageWrapper>
      </Trace>
    </ThemeProvider>
  )
}
