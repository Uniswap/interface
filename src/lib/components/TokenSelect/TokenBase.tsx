import { t } from '@lingui/macro'
import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'

import Button from '../Button'
import Row from '../Row'

const TokenButton = styled(Button)`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em 0.75em 0.25em 0.25em;

  img {
    border-radius: 100%;
    height: 1.5em;
    width: 1.5em;
  }
`

interface TokenBaseProps {
  value: Token
  onClick: (value: Token) => void
}

export default function TokenBase({ value, onClick }: TokenBaseProps) {
  return (
    <TokenButton onClick={() => onClick(value)}>
      <ThemedText.ButtonMedium>
        <Row gap={0.5}>
          <img src={value.logoURI} alt={t`${value.name || value.symbol} logo`} />
          {value.symbol}
        </Row>
      </ThemedText.ButtonMedium>
    </TokenButton>
  )
}
