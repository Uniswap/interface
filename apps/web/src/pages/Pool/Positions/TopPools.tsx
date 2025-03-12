import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { LoadingRows } from 'components/Loader/styled'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { PoolSortFields } from 'graphql/data/pools/useTopPools'
import { OrderDirection, gqlToCurrency, supportedChainIdFromGQLChain, unwrapToken } from 'graphql/data/util'
import { ExternalArrowLink, LoadingRow } from 'pages/Pool/Positions/shared'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTopPools } from 'state/explore/topPools'
import { PoolStat } from 'state/explore/types'
import { Flex, Text } from 'ui/src'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

function TopPoolCard({ pool }: { pool: PoolStat }) {
  const { defaultChainId } = useEnabledChains()
  const { formatPercent } = useLocalizationContext()
  const navigate = useNavigate()

  const chainId = supportedChainIdFromGQLChain(pool.chain as Chain) ?? defaultChainId
  const token0 = pool.token0 ? gqlToCurrency(unwrapToken(chainId, pool.token0)) : undefined
  const token1 = pool.token1 ? gqlToCurrency(unwrapToken(chainId, pool.token1)) : undefined

  return (
    <Flex
      row
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
      justifyContent="space-between"
      cursor="pointer"
      hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
      onPress={() => navigate(`/explore/pools/${toGraphQLChain(chainId ?? defaultChainId).toLowerCase()}/${pool.id}`)}
    >
      <Flex row gap="$gap16">
        <DoubleCurrencyLogo currencies={[token0, token1]} size={44} />
        <Flex gap="$gap4">
          <Text variant="subheading2">
            {token0?.symbol} / {token1?.symbol}
          </Text>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              versionLabel={pool.protocolVersion?.toLowerCase()}
              feeTier={pool.feeTier}
            />
          </Flex>
        </Flex>
      </Flex>
      <Text variant="body2" color="$neutral2">
        {formatPercent(pool.apr.toFixed(3))} <Trans i18nKey="pool.apr" />
      </Text>
    </Flex>
  )
}

export function TopPools({ chainId }: { chainId?: UniverseChainId | null }) {
  const { t } = useTranslation()
  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery({
    chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG,
  })

  const { topPools } = useTopPools(
    { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    { sortDirection: OrderDirection.Desc, sortBy: PoolSortFields.TVL },
  )

  if (exploreStatsLoading) {
    return (
      <LoadingRows>
        <LoadingRow />
        <LoadingRow />
        <LoadingRow />
        <LoadingRow />
        <LoadingRow />
        <LoadingRow />
      </LoadingRows>
    )
  }

  return (
    <Flex gap="$gap20">
      <Text variant="subheading1">
        <Trans i18nKey="pool.top.tvl" />
      </Text>
      <Flex gap="$gap12">
        {topPools?.slice(0, 6).map((pool) => {
          return <TopPoolCard key={pool.id} pool={pool} />
        })}
      </Flex>
      <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
        {t('explore.more.pools')}
      </ExternalArrowLink>
    </Flex>
  )
}
