import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { AddressStringFormat, normalizeAddress, type UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps, Text, type TextCompatProps } from '@universe/mycelium'
import { useQueryState } from 'nuqs'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Separator, useIsDarkMode, useSporeColors } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { type ParsedToken, v2TokenToCurrency, v2UnwrapToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { MOBILE_BAR_MAX_HEIGHT } from '~/components/NavBar/MobileBottomBar'
import { StickyCollapsibleHeader } from '~/components/StickyCollapsibleHeader/StickyCollapsibleHeader'
import type { PoolData } from '~/data/pools/poolData'
import { useLiquidityServicePoolData } from '~/data/pools/useLiquidityServicePoolData'
import { LpIncentivesPoolDetailsRewardsDistribution } from '~/features/Liquidity/LPIncentives/LpIncentivesPoolDetailsRewardsDistribution'
import { toPoolRewardAprEntries } from '~/features/Liquidity/LPIncentives/utils'
import { useColor } from '~/hooks/useColor'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { useDynamicMetatags } from '~/pages/metatags'
import { ChartSection } from '~/pages/PoolDetails/components/ChartSection'
import { OrderBook } from '~/pages/PoolDetails/components/ChartSection/OrderBook'
import { PoolDetailsBreadcrumb } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsBreadcrumb'
import { PoolDetailsHeader } from '~/pages/PoolDetails/components/PoolDetailsHeader/PoolDetailsHeader'
import { PoolDetailsLink } from '~/pages/PoolDetails/components/PoolDetailsLink'
import { PoolDetailsStats } from '~/pages/PoolDetails/components/PoolDetailsStats'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { PoolDetailsTableTab } from '~/pages/PoolDetails/components/PoolDetailsTable'
import { getPoolDetailPageTitle } from '~/pages/PoolDetails/utils'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

// Extra bottom padding so content (e.g. pool address links) can scroll above the fixed Swap/Add Liquidity CTA bar
const STICKY_CTA_CLEARANCE = `calc(${MOBILE_BAR_MAX_HEIGHT}px + env(safe-area-inset-bottom))` as const

const PageWrapper = forwardRef<HTMLDivElement, FlexCompatProps>(function PageWrapper(
  { $lg: lg, $xl: xl, ...props },
  ref,
) {
  return (
    <Flex
      ref={ref}
      row
      pt={24}
      pb={48}
      px={40}
      justifyContent="center"
      width="100%"
      gap={80}
      alignItems="flex-start"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $lg={{ px: 20, pb: STICKY_CTA_CLEARANCE, ...lg }}
      $xl={{
        flexDirection: 'column',
        alignItems: 'center',
        gap: '$none',
        pb: STICKY_CTA_CLEARANCE,
        ...xl,
      }}
      {...props}
    />
  )
})

const LeftColumn = forwardRef<HTMLDivElement, FlexCompatProps>(function LeftColumn({ $xl: xl, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      gap={40}
      flex={1}
      minWidth={0}
      maxWidth={780}
      overflow="hidden"
      justifyContent="flex-start"
      width="100%"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{ maxWidth: 'none', ...xl }}
      {...props}
    />
  )
})

const TokenDetailsWrapper = forwardRef<HTMLDivElement, FlexCompatProps>(function TokenDetailsWrapper(
  { $xl: xl, ...props },
  ref,
) {
  return (
    <Flex
      ref={ref}
      gap="$gap24"
      p="$padding20"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $xl={{ flexWrap: 'nowrap', p: '$none', ...xl }}
      {...props}
    />
  )
})

const TokenDetailsHeader = forwardRef<HTMLElement, TextCompatProps>(function TokenDetailsHeader(props, ref) {
  return <Text ref={ref} width="100%" fontSize={24} fontWeight="$book" lineHeight={32} {...props} />
})

const LinksContainer = forwardRef<HTMLDivElement, FlexCompatProps>(function LinksContainer(props, ref) {
  return <Flex ref={ref} gap="$gap16" width="100%" {...props} />
})

function getUnwrappedPoolToken({
  poolData,
  chainId,
  protocolVersion,
}: {
  poolData?: PoolData
  chainId?: UniverseChainId
  protocolVersion?: RestProtocolVersion
}): [ParsedToken | undefined, ParsedToken | undefined] {
  // for v4 pools can be created with ETH or WETH so we need to keep the original tokens
  if (protocolVersion === RestProtocolVersion.V4) {
    return [poolData?.token0, poolData?.token1]
  }

  return poolData && chainId
    ? [v2UnwrapToken(chainId, poolData.token0), v2UnwrapToken(chainId, poolData.token1)]
    : [undefined, undefined]
}

// oxlint-disable-next-line complexity
export function PoolDetailsPage() {
  const { t } = useTranslation()
  const { poolAddress } = useParams<{ poolAddress: string }>()
  const urlChain = useChainIdFromUrlParam()
  const chainInfo = urlChain ? getChainInfo(urlChain) : undefined
  const isLiquidityDepthChartEnabled = useFeatureFlag(FeatureFlags.LpPdpDepthChart)
  const [chartParam] = useQueryState('chart')
  const showOrderBook = isLiquidityDepthChartEnabled && chartParam?.toLowerCase() === 'depth'
  const { data: poolData, loading: poolLoading } = useLiquidityServicePoolData({
    poolIdOrAddress: normalizeAddress(poolAddress ?? '', AddressStringFormat.Lowercase),
    chainId: chainInfo?.id,
  })
  const unwrappedTokens = getUnwrappedPoolToken({
    poolData,
    chainId: chainInfo?.id,
    protocolVersion: poolData?.protocolVersion,
  })

  const waterfallDefault = useMemo(() => {
    if (!unwrappedTokens[0] || !unwrappedTokens[1]) {
      return false
    }
    const currA = v2TokenToCurrency(unwrappedTokens[0])
    const currB = v2TokenToCurrency(unwrappedTokens[1])
    return Boolean(currA && currB && shouldReverseForWaterfall(currA, currB))
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- unwrappedTokens changes every render; use underlying stable deps instead
  }, [poolData?.token0, poolData?.token1, chainInfo?.id, poolData?.protocolVersion])

  // The user's flip is stored relative to the waterfall default rather than as the absolute value,
  // since poolData arrives after mount.
  const [userFlipped, setUserFlipped] = useState(false)
  const toggleReversed = () => setUserFlipped((flipped) => !flipped)
  const isReversed = waterfallDefault !== userFlipped

  const [token0, token1] = isReversed ? [unwrappedTokens[1], unwrappedTokens[0]] : unwrappedTokens

  // GetPool serves the fee tier and the protocol fee on the same row, so they always pair.
  const protocolFeePips = poolData?.protocolFeePips
  const feeTier = poolData?.feeTier
  const [orderBookCurrencyA, orderBookCurrencyB] = useMemo(
    () => [
      poolData?.token0 ? v2TokenToCurrency(poolData.token0) : undefined,
      poolData?.token1 ? v2TokenToCurrency(poolData.token1) : undefined,
    ],
    [poolData?.token0, poolData?.token1],
  )

  const navigate = useNavigate()

  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const color0 = useColor(token0 && v2TokenToCurrency(token0), {
    backgroundColor: colors.surface2.val,
    darkMode: isDarkMode,
  })
  const color1 = useColor(token1 && v2TokenToCurrency(token1), {
    backgroundColor: colors.surface2.val,
    darkMode: isDarkMode,
  })

  const isInvalidPool = !poolAddress || !chainInfo
  const loading = poolLoading
  const poolNotFound = (!poolLoading && !poolData) || isInvalidPool

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

  // Every reward token the pool pays, not just the campaign's — `rewardsCampaign` collapses to the
  // first, and the stats breakdown renders the whole set.
  const poolRewards = useMemo(() => toPoolRewardAprEntries(poolData?.rewardTokens), [poolData?.rewardTokens])

  const showRewardsDistribution = useMemo(() => {
    return Boolean(poolData && poolData.rewardsCampaign?.boostedApr && poolData.rewardsCampaign.boostedApr > 0)
  }, [poolData])

  const isCompact = useScrollCompact({ thresholdCompact: 100, thresholdExpanded: 60 })

  useEffect(() => {
    if (poolNotFound) {
      navigate(`/explore/pools?type=${ExploreTab.Pools}&result=${ModalName.NotFound}`, { replace: true })
    }
  }, [poolNotFound, navigate])

  if (poolNotFound) {
    return null
  }

  return (
    <>
      <Helmet>
        <title>{getPoolDetailPageTitle(t, { token0, token1 })}</title>
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
          feeTier,
          token0Address: poolData?.token0.address,
          token1Address: poolData?.token1.address,
          token0Symbol: poolData?.token0.symbol,
          token1Symbol: poolData?.token1.symbol,
          token0Name: poolData?.token0.name,
          token1Name: poolData?.token1.name,
        }}
      >
        <PoolDetailsBreadcrumb poolAddress={poolAddress} token0={token0} token1={token1} loading={loading} />
        <StickyCollapsibleHeader isCompact={isCompact}>
          <PoolDetailsHeader
            chainId={chainInfo.id}
            poolAddress={poolAddress}
            token0={token0}
            token1={token1}
            feeTier={feeTier}
            protocolFeePips={protocolFeePips}
            hookAddress={poolData?.hookAddress}
            protocolVersion={poolData?.protocolVersion}
            toggleReversed={toggleReversed}
            loading={loading}
            isCompact={isCompact}
          />
        </StickyCollapsibleHeader>
        <PageWrapper>
          <LeftColumn>
            <Flex gap="$spacing20">
              <ChartSection
                poolData={poolData}
                loading={loading}
                isReversed={isReversed}
                chainId={chainInfo.id}
                tokenAColor={isReversed ? color1 : color0}
                tokenBColor={isReversed ? color0 : color1}
              />
            </Flex>
            <Separator />
            <PoolDetailsTableTab
              poolAddress={poolAddress}
              chainId={chainInfo.id}
              token0={token0}
              token1={token1}
              isPoolDataLoading={poolLoading}
            />
          </LeftColumn>
          <Flex
            gap="$spacing24"
            width={360}
            flexShrink={0}
            $lg={{ width: '100%', mt: 44, minWidth: 'unset' }}
            $xl={{ width: '100%', mt: 44, minWidth: 'unset' }}
          >
            <Flex gap="$spacing24" min-height="fit-content">
              <PoolDetailsStatsButtons
                chainId={chainInfo.id}
                poolIdOrAddress={poolAddress}
                token0={token0}
                token1={token1}
                feeTier={feeTier?.feeAmount}
                tickSpacing={feeTier?.tickSpacing}
                hookAddress={poolData?.hookAddress}
                isDynamic={feeTier?.isDynamic}
                protocolVersion={poolData?.protocolVersion}
                loading={loading}
              />
              {showOrderBook &&
                poolData &&
                poolData.protocolVersion !== RestProtocolVersion.V2 &&
                feeTier &&
                orderBookCurrencyA &&
                orderBookCurrencyB && (
                  <OrderBook
                    tokenA={orderBookCurrencyA}
                    tokenB={orderBookCurrencyB}
                    feeTier={Number(feeTier.feeAmount)}
                    isReversed={isReversed}
                    chainId={fromGraphQLChain(chainInfo.backendChain.chain) ?? chainInfo.id}
                    version={poolData.protocolVersion ?? RestProtocolVersion.V3}
                    hooks={poolData.hookAddress}
                    poolId={poolData.idOrAddress}
                    height={356}
                  />
                )}
            </Flex>
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
              poolApr={poolData?.apr}
              protocolFeePips={protocolFeePips}
              rewards={poolRewards}
              totalApr={poolData?.totalApr}
            />
            <TokenDetailsWrapper>
              <TokenDetailsHeader>{t('common.links')}</TokenDetailsHeader>
              <LinksContainer>
                {poolData?.protocolVersion !== RestProtocolVersion.V4 && (
                  <PoolDetailsLink
                    address={poolAddress}
                    chainId={chainInfo.id}
                    tokens={[token0, token1]}
                    loading={loading}
                  />
                )}
                <PoolDetailsLink
                  address={poolData?.token0.address}
                  chainId={chainInfo.id}
                  tokens={[poolData?.token0]}
                  loading={loading}
                />
                <PoolDetailsLink
                  address={poolData?.token1.address}
                  chainId={chainInfo.id}
                  tokens={[poolData?.token1]}
                  loading={loading}
                />
              </LinksContainer>
            </TokenDetailsWrapper>
          </Flex>
        </PageWrapper>
      </Trace>
    </>
  )
}

export default PoolDetailsPage
