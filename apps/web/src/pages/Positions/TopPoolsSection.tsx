import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { LoadingRows } from '~/components/Loader/styled'
import { LoadingRow } from '~/features/Liquidity/Loader'
import { TopPoolsCard } from '~/pages/Positions/TopPoolsCard'
import { PoolStat } from '~/types/explore'

export function TopPoolsSection({ pools, title, isLoading }: { pools: PoolStat[]; title: string; isLoading: boolean }) {
  const visiblePools = useMemo(() => pools.slice(0, 6), [pools])

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
        {visiblePools.map((pool) => (
          <TopPoolsCard key={pool.id} pool={pool} />
        ))}
      </Flex>
    </Flex>
  )
}
