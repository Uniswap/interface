import { Percent } from '@uniswap/sdk-core'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { warningSeverity } from 'utils/prices'

export function FiatValue({
  fiatValue,
  priceImpact,
  testId,
}: {
  fiatValue: { data?: number; isLoading: boolean }
  priceImpact?: Percent
  testId?: string
}) {
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()

  const priceImpactColor = useMemo(() => {
    if (!priceImpact) {
      return undefined
    }
    if (priceImpact.lessThan('0')) {
      return '$statusSuccess'
    }
    const severity = warningSeverity(priceImpact)
    if (severity < 1) {
      return '$neutral3'
    }
    if (severity < 3) {
      return '$statusWarning'
    }
    return '$statusCritical'
  }, [priceImpact])

  if (fiatValue.isLoading) {
    return <LoadingBubble borderRadius="$rounded4" width={64} height={14} />
  }

  return (
    <Flex row gap="$gap8">
      <Text variant="body3" color="$neutral2" data-testid={testId}>
        {fiatValue.data ? (
          convertFiatAmountFormatted(fiatValue.data, NumberType.FiatTokenPrice)
        ) : (
          <MouseoverTooltip text={<Trans i18nKey="liquidity.notEnough.label" />}>-</MouseoverTooltip>
        )}
      </Text>
      {priceImpact && (
        <Text variant="body3" color={priceImpactColor}>
          <MouseoverTooltip placement="right" text={<Trans i18nKey="swap.estimatedDifference.label" />}>
            ({formatPercent(priceImpact.multiply(-1).toSignificant())})
          </MouseoverTooltip>
        </Text>
      )}
    </Flex>
  )
}
