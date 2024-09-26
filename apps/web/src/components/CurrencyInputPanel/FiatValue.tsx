import { Percent } from '@uniswap/sdk-core'
import Row from 'components/deprecated/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
import { useMemo } from 'react'
import { ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { warningSeverity } from 'utils/prices'

const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 1rem;
`

export function FiatValue({
  fiatValue,
  priceImpact,
  testId,
}: {
  fiatValue: { data?: number; isLoading: boolean }
  priceImpact?: Percent
  testId?: string
}) {
  const { formatNumber, formatPercent } = useFormatter()

  const priceImpactColor = useMemo(() => {
    if (!priceImpact) {
      return undefined
    }
    if (priceImpact.lessThan('0')) {
      return 'success'
    }
    const severity = warningSeverity(priceImpact)
    if (severity < 1) {
      return 'neutral3'
    }
    if (severity < 3) {
      return 'deprecated_yellow1'
    }
    return 'critical'
  }, [priceImpact])

  if (fiatValue.isLoading) {
    return <FiatLoadingBubble />
  }

  return (
    <Row gap="sm">
      <ThemedText.BodySmall color="neutral2" data-testid={testId}>
        {fiatValue.data ? (
          formatNumber({
            input: fiatValue.data,
            type: NumberType.FiatTokenPrice,
          })
        ) : (
          <MouseoverTooltip text={<Trans i18nKey="liquidity.notEnough.label" />}>-</MouseoverTooltip>
        )}
      </ThemedText.BodySmall>
      {priceImpact && (
        <ThemedText.BodySmall color={priceImpactColor}>
          <MouseoverTooltip placement="right" text={<Trans i18nKey="swap.estimatedDifference.label" />}>
            ({formatPercent(priceImpact.multiply(-1))})
          </MouseoverTooltip>
        </ThemedText.BodySmall>
      )}
    </Row>
  )
}
