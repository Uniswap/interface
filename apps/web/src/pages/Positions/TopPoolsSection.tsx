import { LoadingRow } from 'components/Liquidity/Loader'
import { LoadingRows } from 'components/Loader/styled'
import { TopPoolsCard } from 'pages/Positions/TopPoolsCard'
import { PoolStat } from 'state/explore/types'
import { Flex, Text } from 'ui/src'

export function TopPoolsSection({ pools, title, isLoading }: { pools: PoolStat[]; title: string; isLoading: boolean }) {
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
        {pools.slice(0, 6).map((pool) => {
          return <TopPoolsCard key={pool.id} pool={pool} />
        })}
      </Flex>
    </Flex>
  )
}
