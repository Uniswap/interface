import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Book } from 'react-feather'

import { TextButton } from '../Button'
import Column from '../Column'
import { DecimalInput } from '../Input'
import Row from '../Row'
import TokenSelect from '../TokenSelect'

const TokenInputRow = styled(Row)`
  grid-template-columns: 1fr;
`

const BookIcon = icon(Book)

interface Token {
  address: string
  symbol: string
  logoUri?: string
}

interface TokenInputProps {
  value?: number
  token?: Token
  onChange: (value: number | undefined) => void
  onMax?: (value: number) => void
}

export default function TokenInput({ value, token, onChange, onMax }: TokenInputProps) {
  return (
    <Column gap="0.25em">
      <TokenInputRow>
        <TYPE.h2>
          <DecimalInput value={value} onChange={onChange} placeholder="0.0"></DecimalInput>
        </TYPE.h2>
        <TokenSelect value={token} onChange={() => void 0} />
      </TokenInputRow>
      <TYPE.body2 color="secondary">
        <Row>
          -
          <Row gap="0.5em">
            <Row>
              <BookIcon />
            </Row>
            {onMax && <TextButton disabled>Max</TextButton>}
          </Row>
        </Row>
      </TYPE.body2>
    </Column>
  )
}
