import { LiquidityPositionCard } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils'
import { Link } from 'react-router-dom'
import { Flex } from 'ui/src'

export function PoolDetailsPositionsTable({ positions }: { positions?: PositionInfo[] }) {
  return (
    <Flex gap="$gap24" width="100%">
      {positions?.map((position) => (
        <Link key={position.poolId} style={{ textDecoration: 'none' }} to={getPositionUrl(position)}>
          <LiquidityPositionCard liquidityPosition={position} />
        </Link>
      ))}
    </Flex>
  )
}
