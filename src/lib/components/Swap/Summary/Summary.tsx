import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import useUSDCPriceImpact from 'lib/hooks/useUSDCPriceImpact'
import { ArrowRight } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { PropsWithChildren } from 'react'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import Column from '../../Column'
import Row from '../../Row'
import TokenImg from '../../TokenImg'

interface TokenValueProps {
  input: CurrencyAmount<Currency>
  usdc?: CurrencyAmount<Token>
}

function TokenValue({ input, usdc, children }: PropsWithChildren<TokenValueProps>) {
  const { i18n } = useLingui()
  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <TokenImg token={input.currency} />
        <ThemedText.Body2 userSelect>
          {formatCurrencyAmount(input, 6, i18n.locale)} {input.currency.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && (
        <Row justify="flex-start">
          <ThemedText.Caption color="secondary" userSelect>
            ${formatCurrencyAmount(usdc, 6, 'en', 2)}
            {children}
          </ThemedText.Caption>
        </Row>
      )}
    </Column>
  )
}

interface SummaryProps {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  usdcPriceImpact?: ReturnType<typeof useUSDCPriceImpact>
}

export default function Summary({ input, output, usdcPriceImpact }: SummaryProps) {
  const { inputUSDC, outputUSDC, priceImpact, warning: priceImpactWarning } = usdcPriceImpact || {}

  return (
    <Row gap={usdcPriceImpact ? 1 : 0.25}>
      <TokenValue input={input} usdc={inputUSDC} />
      <ArrowRight />
      <TokenValue input={output} usdc={outputUSDC}>
        {priceImpact && <ThemedText.Caption color={priceImpactWarning}>({priceImpact})</ThemedText.Caption>}
      </TokenValue>
    </Row>
  )
}
