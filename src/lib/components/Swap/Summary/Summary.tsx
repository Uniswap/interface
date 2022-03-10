import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import useUSDCPriceImpact, { toHumanReadablePriceImpact } from 'lib/hooks/useUSDCPriceImpact'
import { ArrowRight } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { getPriceImpactWarning } from 'utils/prices'

import Column from '../../Column'
import Row from '../../Row'
import TokenImg from '../../TokenImg'

interface TokenValueProps {
  input: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Token>
  priceImpact?: Percent
}

function TokenValue({ input, usdc, priceImpact }: TokenValueProps) {
  const { i18n } = useLingui()
  const priceImpactWarning = useMemo(() => getPriceImpactWarning(priceImpact), [priceImpact])
  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <TokenImg token={input.currency} />
        <ThemedText.Body2 userSelect>
          {formatCurrencyAmount(input, 6, i18n.locale)} {input.currency.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && (
        <ThemedText.Caption color="secondary" userSelect>
          <Row justify="flex-start" gap={0.25}>
            ${formatCurrencyAmount(usdc, 2, i18n.locale)}
            {priceImpact && (
              <ThemedText.Caption color={priceImpactWarning}>
                ({toHumanReadablePriceImpact(priceImpact)})
              </ThemedText.Caption>
            )}
          </Row>
        </ThemedText.Caption>
      )}
    </Column>
  )
}

interface SummaryProps {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  showUSDC?: true
}

export default function Summary({ input, output, showUSDC }: SummaryProps) {
  const { inputUSDC, outputUSDC, priceImpact } = useUSDCPriceImpact(input, output)

  return (
    <Row gap={showUSDC ? 1 : 0.25}>
      <TokenValue input={input} usdc={showUSDC && inputUSDC} />
      <ArrowRight />
      <TokenValue input={output} usdc={showUSDC && outputUSDC} priceImpact={priceImpact} />
    </Row>
  )
}
