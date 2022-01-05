import { ArrowRight } from 'lib/icons'
import { Input } from 'lib/state/swap'
import styled from 'lib/theme'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'

import Column from '../../Column'
import Row from '../../Row'
import TokenImg from '../../TokenImg'

const Percent = styled.span<{ gain: boolean }>`
  color: ${({ gain, theme }) => (gain ? theme.success : theme.error)};
`

interface TokenValueProps {
  input: Required<Pick<Input, 'token' | 'value'>> & Input
  usdc?: boolean
  change?: number
}

function TokenValue({ input, usdc, change }: TokenValueProps) {
  const percent = useMemo(() => {
    if (change) {
      const percent = (change * 100).toPrecision(3)
      return change > 0 ? `(+${percent}%)` : `(${percent}%)`
    }
    return undefined
  }, [change])
  return (
    <Column justify="flex-start">
      <Row gap={0.375} justify="flex-start">
        <TokenImg token={input.token} />
        <ThemedText.Body2>
          {input.value} {input.token.symbol}
        </ThemedText.Body2>
      </Row>
      {usdc && input.usdc && (
        <Row justify="flex-start">
          <ThemedText.Caption color="secondary">
            ~ ${input.usdc.toLocaleString('en')}
            {change && <Percent gain={change > 0}> {percent}</Percent>}
          </ThemedText.Caption>
        </Row>
      )}
    </Column>
  )
}

interface SummaryProps {
  input: Required<Pick<Input, 'token' | 'value'>> & Input
  output: Required<Pick<Input, 'token' | 'value'>> & Input
  usdc?: boolean
}

export default function Summary({ input, output, usdc }: SummaryProps) {
  const change = useMemo(() => {
    if (usdc && input.usdc && output.usdc) {
      return output.usdc / input.usdc - 1
    }
    return undefined
  }, [usdc, input.usdc, output.usdc])
  return (
    <Row gap={usdc ? 1 : 0.25}>
      <TokenValue input={input} usdc={usdc} />
      <ArrowRight />
      <TokenValue input={output} usdc={usdc} change={change} />
    </Row>
  )
}
