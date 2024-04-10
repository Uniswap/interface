import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import { Trans } from 'i18n'
import { ThemedText } from 'theme/components'

export function FeeTierPercentageBadge({
  feeAmount,
  distributions,
  poolState,
}: {
  feeAmount: FeeAmount
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
}) {
  const pct = distributions?.[feeAmount]?.toFixed(0)
  return (
    <Badge>
      <ThemedText.DeprecatedLabel fontSize={10}>
        {!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID ? (
          <Trans>Not created</Trans>
        ) : distributions[feeAmount] !== undefined ? (
          <Trans>{{ pct }}% select</Trans>
        ) : (
          <Trans>No data</Trans>
        )}
      </ThemedText.DeprecatedLabel>
    </Badge>
  )
}
