import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/CurrencyLogo'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { ArrowRight } from 'lib/icons'
import styled from 'lib/theme'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'

import Column from '../../Column'
import Row from '../../Row'

const Percent = styled.span<{ gain: boolean }>`
  color: ${({ gain, theme }) => (gain ? theme.success : theme.error)};
`

interface TokenValueProps {
  inputAmount: CurrencyAmount<Currency>
  usdc?: boolean
  change?: number
}

function TokenValue({ inputAmount, usdc, change }: TokenValueProps) {
  const percent = useMemo(() => {
    if (change) {
      const percent = (change * 100).toPrecision(3)
      return change > 0 ? `(+${percent}%)` : `(${percent}%)`
    }
    return undefined
  }, [change])

  const usdcAmount = useUSDCValue(inputAmount)

  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <CurrencyLogo currency={inputAmount.currency} />
        <ThemedText.Body2>
          {inputAmount.toSignificant(6)} {inputAmount.currency.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && usdcAmount && (
        <Row justify="flex-start">
          <ThemedText.Caption color="secondary">
            ~ ${usdcAmount.toFixed(2)}
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

  const change = useMemo(() => {
    if (inputUSDCValue && outputUSDCValue) {
      return parseFloat(inputUSDCValue.divide(outputUSDCValue).quotient.toString())
    }
    return undefined
  }, [inputUSDCValue, outputUSDCValue])

  return (
    <Row gap={usdc ? 1 : 0.25}>
      <TokenValue inputAmount={input} usdc={usdc} />
      <ArrowRight />
      <TokenValue inputAmount={output} usdc={usdc} change={change} />
    </Row>
  )
}
