import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { useAccount } from 'hooks/useAccount'
import { useHSKSubgraphPools } from 'hooks/useHSKSubgraphPools'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useTopPools } from 'state/explore/topPools'
import { Flex, useMedia } from 'ui/src'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMemo } from 'react'

const MAX_BOOSTED_POOLS = 3

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const account = useAccount()
  const { t } = useTranslation()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const media = useMedia()
  const isBelowXlScreen = !media.xl

  // 使用 HSK Subgraph 获取所有 pools 数据（获取足够多的数量以确保获取全部）
  // 注意：GraphQL 查询可能有限制，如果 pools 数量超过限制，可能需要分页获取
  const {
    data: hskPools,
    isLoading: hskPoolsLoading,
    error: hskPoolsError,
  } = useHSKSubgraphPools(1000) // 获取足够多的 pools（1000 应该足够覆盖所有 pools）

  // 调试信息
  console.log('[TopPools] HSK Subgraph 数据:', {
    hskPools,
    hskPoolsLoading,
    hskPoolsError,
    poolsCount: hskPools?.length,
  })

  // 按 TVL 排序 pools
  const sortedHSKPools = useMemo(() => {
    if (!hskPools) {
      console.log('[TopPools] hskPools 为空')
      return []
    }
    console.log('[TopPools] 开始排序，pools 数量:', hskPools.length)
    const sorted = [...hskPools].sort((a, b) => {
      // totalLiquidity.value 是 number 类型
      const tvlA = typeof a.totalLiquidity?.value === 'number' 
        ? a.totalLiquidity.value 
        : parseFloat(String(a.totalLiquidity?.value || '0'))
      const tvlB = typeof b.totalLiquidity?.value === 'number'
        ? b.totalLiquidity.value
        : parseFloat(String(b.totalLiquidity?.value || '0'))
      return tvlB - tvlA
    })
    console.log('[TopPools] 排序后的 pools (前6个):', sorted.slice(0, 6).map(p => ({
      id: p.id,
      token0: p.token0?.symbol,
      token1: p.token1?.symbol,
      tvl: p.totalLiquidity?.value
    })))
    // 输出所有 pools 的完整数据
    console.log('[TopPools] 所有 pools 数据 (完整):', {
      totalCount: sorted.length,
      allPools: sorted.map(p => ({
        id: p.id,
        address: p.address,
        token0: {
          symbol: p.token0?.symbol,
          name: p.token0?.name,
          address: p.token0?.address,
        },
        token1: {
          symbol: p.token1?.symbol,
          name: p.token1?.name,
          address: p.token1?.address,
        },
        totalLiquidity: p.totalLiquidity?.value,
        feeTier: p.feeTier,
        volume24h: p.volume24h?.value,
        volume30d: p.volume30d?.value,
        txCount: p.txCount,
      }))
    })
    return sorted
  }, [hskPools])

  // 屏蔽原有的 explore stats 查询
  // const {
  //   data: exploreStatsData,
  //   isLoading: exploreStatsLoading,
  //   error: exploreStatsError,
  // } = useExploreStatsQuery<ExploreStatsResponse>({
  //   input: { chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG },
  // })

  // const { topPools: exploreTopPools, topBoostedPools } = useTopPools({
  //   topPoolData: { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
  //   sortState: { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  // })

  // 只使用 HSK Subgraph 数据（所有 pools 都是 V3）
  // 按 TVL 排序后，只取前 6 个
  const topPools = useMemo(() => {
    return sortedHSKPools.slice(0, 6)
  }, [sortedHSKPools])
  const isLoading = hskPoolsLoading
  const hasError = !!hskPoolsError

  // 屏蔽 boosted pools（因为我们已经屏蔽了原有的 explore stats）
  const displayBoostedPools = false // HSK Subgraph 数据不包含 boosted pools
  const displayTopPools = topPools && topPools.length > 0

  // 调试信息
  console.log('[TopPools] 渲染状态:', {
    isBelowXlScreen,
    topPoolsLength: topPools?.length,
    displayTopPools,
    isLoading,
    hasError,
    media: media,
  })

  // 临时：即使屏幕很大也显示，用于调试
  // if (!isBelowXlScreen) {
  //   return null
  // }

  return (
    <Flex gap={48}>
      {/* {displayBoostedPools && (
        <Flex gap="$gap20">
          <TopPoolsSection
            title={t('pool.top.rewards')}
            pools={topBoostedPools.slice(0, MAX_BOOSTED_POOLS)}
            isLoading={isLoading}
          />
          <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.unichain')}
          </ExternalArrowLink>
        </Flex>
      )} */}
      {displayTopPools && (
        <Flex gap="$gap20">
          <TopPoolsSection title={t('pool.top.tvl')} pools={topPools} isLoading={isLoading} />
          {/* 隐藏 explore more pools 链接 */}
          {/* <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.pools')}
          </ExternalArrowLink> */}
        </Flex>
      )}
    </Flex>
  )
}
