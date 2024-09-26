import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge/Badge'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import { ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'

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
          <Trans i18nKey="common.notCreated.label" />
        ) : distributions[feeAmount] !== undefined ? (
          <Trans i18nKey="fee.selectPercent" values={{ pct }} />
        ) : (
          <Trans i18nKey="common.noData" />
        )}
      </ThemedText.DeprecatedLabel>
    </Badge>
  )
}
