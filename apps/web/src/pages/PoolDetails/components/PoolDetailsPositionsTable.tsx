import { Link } from 'react-router'
import { Flex } from 'ui/src'
import { LiquidityPositionCard } from '~/features/Liquidity/LiquidityPositionCard'
import { getPositionUrl } from '~/features/Liquidity/utils/getPositionUrl'
import { PositionInfo } from '~/types/liquidity'

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
