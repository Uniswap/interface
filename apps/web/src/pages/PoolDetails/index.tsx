import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useReducer } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Flex, Separator, styled, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { PoolData, usePoolData } from '~/appGraphql/data/pools/usePoolData'
import { calculateApr } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, unwrapToken } from '~/appGraphql/data/util'
import { DetailsHeaderContainer } from '~/components/Explore/stickyHeader/DetailsHeaderContainer'
import { LpIncentivesPoolDetailsRewardsDistribution } from '~/components/LpIncentives/LpIncentivesPoolDetailsRewardsDistribution'
import { useColor } from '~/hooks/useColor'
import { useScroll } from '~/hooks/useScroll'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { ExploreTab } from '~/pages/Explore/constants'
import { useDynamicMetatags } from '~/pages/metatags'
import ChartSection from '~/pages/PoolDetails/components/ChartSection'
import { PoolDetailsApr } from '~/pages/PoolDetails/components/PoolDetailsApr'
import { PoolDetailsBreadcrumb } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsBreadcrumb'
import { PoolDetailsHeader } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeader'
import { PoolDetailsLink } from '~/pages/PoolDetails/components/PoolDetailsLink'
import { PoolDetailsStats } from '~/pages/PoolDetails/components/PoolDetailsStats'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { PoolDetailsTableTab } from '~/pages/PoolDetails/components/PoolDetailsTable'
import { getPoolDetailPageTitle } from '~/pages/PoolDetails/utils'
import { ThemeProvider } from '~/theme'
import { useChainIdFromUrlParam } from '~/utils/chainParams'

const PageWrapper = styled(Flex, {
  row: true,
  py: 48,
  px: 40,
  justifyContent: 'center',
  width: '100%',
  gap: 80,
  alignItems: 'flex-start',
  $lg: {
    px: 20,
    pb: 52,
  },
  $xl: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: '$none',
  },
})

const LeftColumn = styled(Flex, {
  gap: 40,
  flex: 1,
  minWidth: 0,
  maxWidth: 780,
  overflow: 'hidden',
  justifyContent: 'flex-start',
  width: '100%',
  $xl: {
    maxWidth: 'none',
  },
})

const TokenDetailsWrapper = styled(Flex, {
  gap: '$gap24',
  p: '$padding20',
  $xl: {
    flexWrap: 'nowrap',
    p: '$none',
  },
})

const TokenDetailsHeader = styled(Text, {
  width: '100%',
  fontSize: 24,
  fontWeight: '$book',
  lineHeight: 32,
})

const LinksContainer = styled(Flex, {
  gap: '$gap16',
  width: '100%',
})

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

  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const color0 = useColor(token0 && gqlToCurrency(token0), {
    backgroundColor: colors.surface2.val,
    darkMode: isDarkMode,
  })
  const color1 = useColor(token1 && gqlToCurrency(token1), {
    backgroundColor: colors.surface2.val,
    darkMode: isDarkMode,
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

  const { height: scrollY } = useScroll()
  const isCompact = useScrollCompact({ scrollY, thresholdCompact: 100, thresholdExpanded: 60 })

  useEffect(() => {
    if (poolNotFound) {
      navigate(`/explore/pools?type=${ExploreTab.Pools}&result=${ModalName.NotFound}`)
    }
  }, [poolNotFound, navigate])

  if (poolNotFound) {
    return null
  }

  return (
    <ThemeProvider
      token0={color0 !== colors.accent1.val ? color0 : undefined}
      token1={color1 !== colors.accent1.val ? color1 : undefined}
    >
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
        <PoolDetailsBreadcrumb poolAddress={poolAddress} token0={token0} token1={token1} loading={loading} />
        <DetailsHeaderContainer isCompact={isCompact}>
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
            isCompact={isCompact}
          />
        </DetailsHeaderContainer>
        <PageWrapper>
          <LeftColumn>
            <Flex gap="$spacing20">
              <ChartSection
                poolData={poolData}
                loading={loading}
                isReversed={isReversed}
                chain={chainInfo.backendChain.chain}
                tokenAColor={isReversed ? color1 : color0}
                tokenBColor={isReversed ? color0 : color1}
              />
            </Flex>
            <Separator />
            <PoolDetailsTableTab
              poolAddress={poolAddress}
              token0={token0}
              token1={token1}
              protocolVersion={poolData?.protocolVersion}
            />
          </LeftColumn>
          <Flex
            gap="$spacing24"
            width={360}
            flexShrink={0}
            $lg={{ width: '100%', mt: 44, minWidth: 'unset', mb: 24 }}
            $xl={{ width: '100%', mt: 44, minWidth: 'unset', mb: 24 }}
          >
            <Flex $lg={{ marginTop: -24 }} $xl={{ marginTop: -24 }} min-height="fit-content">
              <PoolDetailsStatsButtons
                chainId={chainInfo.id}
                token0={token0}
                token1={token1}
                feeTier={poolData?.feeTier?.feeAmount}
                tickSpacing={poolData?.feeTier?.tickSpacing}
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
            <PoolDetailsStats
              poolData={poolData}
              isReversed={isReversed}
              tokenAColor={color0}
              tokenBColor={color1}
              chainId={chainInfo.id}
              loading={loading}
            />
            <TokenDetailsWrapper>
              <TokenDetailsHeader>{t('common.links')}</TokenDetailsHeader>
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
