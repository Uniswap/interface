import { LoadingRow } from 'components/Liquidity/Loader'
import { LoadingRows } from 'components/Loader/styled'
import { TopPoolsCard } from 'pages/Positions/TopPoolsCard'
import { PoolStat } from 'state/explore/types'
import { Flex, Text } from 'ui/src'

export function TopPoolsSection({ pools, title, isLoading }: { pools: PoolStat[]; title: string; isLoading: boolean }) {
  // 调试信息
  console.log('[TopPoolsSection] 渲染状态:', {
    poolsLength: pools.length,
    isLoading,
    title,
    pools: pools.slice(0, 3).map((p) => ({ id: p.id, token0: p.token0?.symbol, token1: p.token1?.symbol })),
  })

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

  if (!pools || pools.length === 0) {
    console.log('[TopPoolsSection] 没有 pools 数据')
    return null
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
