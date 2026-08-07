import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { useExploreStatsQuery } from 'uniswap/src/data/apiClients/dataApiService/exploreV1/exploreStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PoolSortFields } from '~/data/pools/useTopPools'
import { OrderDirection } from '~/data/util'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useTopPoolsLegacy } from '~/features/Explore/state/topPools'
import { ExternalArrowLink } from '~/features/Liquidity/ExternalArrowLink'
import { LP_INCENTIVES_POOLS_CHAIN_ID } from '~/features/Liquidity/LPIncentives/constants'
import { useAccount } from '~/hooks/useAccount'
import { TopPoolsSection } from '~/pages/Positions/TopPoolsSection'
import { getChainUrlParam } from '~/utils/params/chainParams'

const MAX_BOOSTED_POOLS = 3

function TopPoolsContent({ chainId }: { chainId: UniverseChainId | null }): JSX.Element | null {
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

  const { topPools, topBoostedPools } = useTopPoolsLegacy({
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
          <ExternalArrowLink
            href={`/explore/pools/${getChainUrlParam(LP_INCENTIVES_POOLS_CHAIN_ID)}`}
            openInNewTab={false}
          >
            {t('explore.more.robinhood')}
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

export function TopPools(props: { chainId: UniverseChainId | null }): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <TopPoolsContent {...props} />
    </ExploreTablesFilterStoreContextProvider>
  )
}
