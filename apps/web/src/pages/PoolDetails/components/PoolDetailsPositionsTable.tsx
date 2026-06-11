import { Link } from 'react-router'
import { Flex } from 'ui/src'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { LiquidityPositionCard } from '~/features/Liquidity/LiquidityPositionCard'

export function PoolDetailsPositionsTable({ positions }: { positions?: PositionInfo[] }) {
  return (
    <Flex gap="$gap24" width="100%">
      {positions?.map((position) => (
        <Link
          key={`${position.poolId}-${position.status}`}
          style={{ textDecoration: 'none' }}
          to={getPositionUrl(position)}
        >
          <LiquidityPositionCard liquidityPosition={position} />
        </Link>
      ))}
    </Flex>
  )
}
