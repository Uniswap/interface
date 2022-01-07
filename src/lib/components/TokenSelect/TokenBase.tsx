import { Currency } from '@uniswap/sdk-core'
import styled, { ThemedText } from 'lib/theme'

import Button from '../Button'
import Row from '../Row'
import TokenImg from '../TokenImg'

const TokenButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em 0.75em 0.25em 0.25em;
`

interface TokenBaseProps {
  value: Currency
  onClick: (value: Currency) => void
}

export default function TokenBase({ value, onClick }: TokenBaseProps) {
  return (
    <TokenButton onClick={() => onClick(value)}>
      <ThemedText.ButtonMedium>
        <Row gap={0.5}>
          <TokenImg token={value} size={1.5} />
          {value.symbol}
        </Row>
      </ThemedText.ButtonMedium>
    </TokenButton>
  )
}
