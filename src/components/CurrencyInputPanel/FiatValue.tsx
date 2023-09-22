import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { useMemo } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
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
}: {
  fiatValue: { data?: number; isLoading: boolean }
  priceImpact?: Percent
}) {
  const { formatNumber, formatPriceImpact } = useFormatter()

  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return 'success'
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return 'neutral3'
    if (severity < 3) return 'deprecated_yellow1'
    return 'critical'
  }, [priceImpact])

  if (fiatValue.isLoading) {
    return <FiatLoadingBubble />
  }

  return (
    <Row gap="sm">
      <ThemedText.BodySmall color="neutral2">
        {fiatValue.data ? (
          formatNumber({
            input: fiatValue.data,
            type: NumberType.FiatTokenPrice,
          })
        ) : (
          <MouseoverTooltip text={<Trans>Not enough liquidity to show accurate USD value.</Trans>}>-</MouseoverTooltip>
        )}
      </ThemedText.BodySmall>
      {priceImpact && (
        <ThemedText.BodySmall color={priceImpactColor}>
          <MouseoverTooltip
            text={<Trans>The estimated difference between the USD values of input and output amounts.</Trans>}
          >
            (<Trans>{formatPriceImpact(priceImpact)}</Trans>)
          </MouseoverTooltip>
        </ThemedText.BodySmall>
      )}
    </Row>
  )
}
