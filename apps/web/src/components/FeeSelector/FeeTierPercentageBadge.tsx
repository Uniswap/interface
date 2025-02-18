import { FeeAmount } from '@uniswap/v3-sdk'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import { Trans } from 'react-i18next'
import { Text } from 'ui/src'

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
    <Text variant="body3" color="$neutral2">
      {!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID ? (
        <Trans i18nKey="common.notCreated.label" />
      ) : distributions[feeAmount] !== undefined ? (
        <Trans i18nKey="fee.selectPercentDescription" values={{ pct }} />
      ) : (
        <Trans i18nKey="common.noData" />
      )}
    </Text>
  )
}
