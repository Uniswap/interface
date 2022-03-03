import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { ArrowRight } from 'lib/icons'
import styled from 'lib/theme'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import Column from '../../Column'
import Row from '../../Row'
import TokenImg from '../../TokenImg'

const Percent = styled.span<{ gain: boolean }>`
  color: ${({ gain, theme }) => (gain ? theme.success : theme.error)};
`

interface TokenValueProps {
  input: CurrencyAmount<Currency>
  usdc?: boolean
  change?: number
}

function TokenValue({ input, usdc, change }: TokenValueProps) {
  const { i18n } = useLingui()
  const percent = useMemo(() => {
    if (change) {
      const percent = change.toPrecision(3)
      return change > 0 ? `(+${percent}%)` : `(${percent}%)`
    }
    return undefined
  }, [change])

  const usdcAmount = useUSDCValue(input)

  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <TokenImg token={input.currency} />
        <ThemedText.Body2 userSelect>
          {formatCurrencyAmount(input, 6, i18n.locale)} {input.currency.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && usdcAmount && (
        <Row justify="flex-start">
          <ThemedText.Caption color="secondary" userSelect>
            ${formatCurrencyAmount(usdcAmount, 2, i18n.locale)}
            {change && <Percent gain={change > 0}> {percent}</Percent>}
          </ThemedText.Caption>
        </Row>
      )}
    </Column>
  )
}

interface SummaryProps {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  usdc?: boolean
}

export default function Summary({ input, output, usdc }: SummaryProps) {
  const inputUSDCValue = useUSDCValue(input)
  const outputUSDCValue = useUSDCValue(output)

  const priceImpact = useMemo(() => {
    const computedChange = computeFiatValuePriceImpact(inputUSDCValue, outputUSDCValue)
    return computedChange ? parseFloat(computedChange.multiply(-1)?.toSignificant(3)) : undefined
  }, [inputUSDCValue, outputUSDCValue])

  return (
    <Row gap={usdc ? 1 : 0.25}>
      <TokenValue input={input} usdc={usdc} />
      <ArrowRight />
      <TokenValue input={output} usdc={usdc} change={priceImpact} />
    </Row>
  )
}
