import { Trans } from '@lingui/macro'
import { formatNumber, formatPriceImpact, NumberType } from '@uniswap/conedison/format'
import { Percent } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTransactionAmount } from 'utils/formatNumbers'
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
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return 'accentSuccess'
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return 'textTertiary'
    if (severity < 3) return 'deprecated_yellow1'
    return 'accentFailure'
  }, [priceImpact])

  if (fiatValue.isLoading) {
    return <FiatLoadingBubble />
  }

  let formattedValue = formatNumber(fiatValue.data, NumberType.FiatTokenPrice)
  if (formattedValue.length > 18) {
    //Removes the dollar sign at the start, commas, and decimal places
    formattedValue = formattedValue.slice(1).replaceAll(',', '').slice(0, -4)
    formattedValue = formatTransactionAmount(Number(formattedValue))
    formattedValue = '$' + formattedValue + 'T'
  }

  return (
    <Row gap="sm">
      <ThemedText.BodySmall>
        {fiatValue.data ? (
          formattedValue
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
