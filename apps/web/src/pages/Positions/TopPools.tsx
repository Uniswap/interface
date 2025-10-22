import { PoolSortFields } from 'appGraphql/data/pools/useTopPools'
import { OrderDirection } from 'appGraphql/data/util'
import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { ExternalArrowLink } from 'components/Liquidity/ExternalArrowLink'
import { useAccount } from 'hooks/useAccount'
import { TopPoolsSection } from 'pages/Positions/TopPoolsSection'
import { useTranslation } from 'react-i18next'
import { useTopPools } from 'state/explore/topPools'
import { Flex, useMedia } from 'ui/src'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const MAX_BOOSTED_POOLS = 3

export function TopPools({ chainId }: { chainId: UniverseChainId | null }) {
  const account = useAccount()
  const { t } = useTranslation()
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const media = useMedia()
  const isBelowXlScreen = !media.xl

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    input: { chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG },
  })

  const { topPools, topBoostedPools } = useTopPools({
    topPoolData: { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    sortState: { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  })

  const displayBoostedPools =
    topBoostedPools && topBoostedPools.length > 0 && Boolean(account.address) && isLPIncentivesEnabled
  const displayTopPools = topPools && topPools.length > 0

  if (!isBelowXlScreen) {
    return null
  }

  return (
    <Flex gap={48}>
      {displayBoostedPools && (
        <Flex gap="$gap20">
          <TopPoolsSection
            title={t('pool.top.rewards')}
            pools={topBoostedPools.slice(0, MAX_BOOSTED_POOLS)}
            isLoading={exploreStatsLoading}
          />
          <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.unichain')}
          </ExternalArrowLink>
        </Flex>
      )}
      {displayTopPools && (
        <Flex gap="$gap20">
          <TopPoolsSection title={t('pool.top.tvl')} pools={topPools} isLoading={exploreStatsLoading} />
          <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
            {t('explore.more.pools')}
          </ExternalArrowLink>
        </Flex>
      )}
    </Flex>
  )
}
