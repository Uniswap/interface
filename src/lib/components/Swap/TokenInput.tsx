import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
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

interface TokenInputProps {
  value?: number
  token?: Token
  onChangeValue: (value: number | undefined) => void
  onChangeToken: (token: Token) => void
  showMax?: true
}

export default function TokenInput({ value, token, onChangeValue, onChangeToken, showMax }: TokenInputProps) {
  return (
    <Column gap={0.25}>
      <TokenInputRow>
        <TYPE.h2>
          <DecimalInput value={value} onChange={onChangeValue} placeholder="0.0"></DecimalInput>
        </TYPE.h2>
        <TokenSelect value={token} onChange={onChangeToken} />
      </TokenInputRow>
      <TYPE.body2 color="secondary">
        <Row>
          -
          <Row gap={0.5}>
            <Row>
              <BookIcon />
            </Row>
            {showMax && <TextButton disabled>Max</TextButton>}
          </Row>
        </Row>
      </TYPE.body2>
    </Column>
  )
}
