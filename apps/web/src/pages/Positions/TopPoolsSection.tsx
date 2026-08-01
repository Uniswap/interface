import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { LoadingRows } from '~/components/Loader/styled'
import { servedFeeKey, useServedProtocolFees, type ServedProtocolFeePool } from '~/features/fees/useServedProtocolFees'
import { LoadingRow } from '~/features/Liquidity/Loader'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { TopPoolsCard } from '~/pages/Positions/TopPoolsCard'
import { PoolStat } from '~/types/explore'

export function TopPoolsSection({ pools, title, isLoading }: { pools: PoolStat[]; title: string; isLoading: boolean }) {
  const { defaultChainId } = useEnabledChains()
  const isFeeDisplayEnabled = useFeatureFlag(FeatureFlags.V4ProtocolFeeDisplay)
  const visiblePools = useMemo(() => pools.slice(0, 6), [pools])

  // Explore's PoolStats carry no fee fields — fees come from the batched GetProtocolFees call.
  const protocolFeePools = useMemo<ServedProtocolFeePool[]>(() => {
    const result: ServedProtocolFeePool[] = []
    for (const pool of visiblePools) {
      const protocolVersion = getProtocolVersionFromLabel(pool.protocolVersion?.toLowerCase())
      if (protocolVersion === undefined) {
        continue
      }
      result.push({
        chainId: supportedChainIdFromGQLChain(pool.chain as GraphQLApi.Chain) ?? defaultChainId,
        protocolVersion,
        poolIdOrHash: pool.id,
      })
    }
    return result
  }, [visiblePools, defaultChainId])

  const servedProtocolFees = useServedProtocolFees({ pools: protocolFeePools, enabled: isFeeDisplayEnabled })

  if (isLoading) {
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
      <Text variant="subheading1">{title}</Text>
      <Flex gap="$gap12">
        {visiblePools.map((pool) => {
          const chainId = supportedChainIdFromGQLChain(pool.chain as GraphQLApi.Chain) ?? defaultChainId
          return (
            <TopPoolsCard
              key={pool.id}
              pool={pool}
              protocolFeePips={servedProtocolFees.get(servedFeeKey({ chainId, poolIdOrHash: pool.id }))}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
