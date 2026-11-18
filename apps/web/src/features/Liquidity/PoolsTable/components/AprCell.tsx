import { Flex } from '@universe/mycelium'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { PoolAprTooltip } from '~/features/Liquidity/LPIncentives/PoolAprTooltip'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'

interface AprCellProps {
  /** Served fee APR in percent units; undefined renders the formatter's placeholder. */
  apr?: number
  /** Served fee + reward APR. */
  totalApr?: number
  isLoading: boolean
  /** The pool's live per-token boosts, as served; empty renders the bare fee APR. */
  rewards?: PositionRewardApr[]
  token0CurrencyId?: string
  token1CurrencyId?: string
}

export function AprCell({ apr, totalApr, isLoading, rewards, token0CurrencyId, token1CurrencyId }: AprCellProps) {
  const { formatPercent } = useLocalizationContext()
  const formattedApr = formatPercent(apr)

  // Split so rows without a reward campaign don't pay for the currency lookups the tooltip needs.
  if (!rewards?.length) {
    return (
      <Cell loading={isLoading}>
        <TableText>{formattedApr}</TableText>
      </Cell>
    )
  }

  return (
    <BoostedAprCell
      apr={apr}
      totalApr={totalApr}
      formattedApr={formattedApr}
      isLoading={isLoading}
      rewards={rewards}
      token0CurrencyId={token0CurrencyId}
      token1CurrencyId={token1CurrencyId}
    />
  )
}

function BoostedAprCell({
  apr,
  totalApr,
  formattedApr,
  isLoading,
  rewards,
  token0CurrencyId,
  token1CurrencyId,
}: Omit<AprCellProps, 'rewards'> & { formattedApr: string; rewards: PositionRewardApr[] }) {
  const currency0Info = useCurrencyInfo(token0CurrencyId)
  const currency1Info = useCurrencyInfo(token1CurrencyId)

  return (
    <Cell loading={isLoading}>
      <MouseoverTooltip
        padding={0}
        text={
          <PoolAprTooltip
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            poolApr={apr}
            rewards={rewards}
            totalApr={totalApr}
          />
        }
        size={TooltipSize.Small}
        placement="top"
      >
        <Flex alignItems="flex-end" gap="$spacing6">
          <TableText>{formattedApr}</TableText>
          <RewardAprBadge rewards={rewards} size="sm" hideBackground />
        </Flex>
      </MouseoverTooltip>
    </Cell>
  )
}
