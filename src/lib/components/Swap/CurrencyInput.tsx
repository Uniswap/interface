import { useAtomValue } from 'jotai/utils'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'

import Column from '../Column'
import { DecimalInput } from '../NumericInput'
import Row from '../Row'
import CurrencySelect from './CurrencySelect'
import { simplifyUiAtom } from './state'

const CurrencyInputRow = styled(Row)`
  grid-template-columns: 1fr;
`

interface CurrencyInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  onMax?: (value: number) => void
}

export default function CurrencyInput({ value, onChange, onMax }: CurrencyInputProps) {
  const simplified = useAtomValue(simplifyUiAtom)
  const InputType = simplified ? TYPE.h1 : TYPE.h2
  return (
    <Column gap="0.25em">
      <CurrencyInputRow>
        <InputType>
          <DecimalInput value={value} onChange={onChange} placeholder="0.0"></DecimalInput>
        </InputType>
        <CurrencySelect />
      </CurrencyInputRow>
      {!simplified && (
        <TYPE.body2>
          <CurrencyValue value={value} />
          <CurrencyBalance onMax={onMax} />
        </TYPE.body2>
      )}
    </Column>
  )
}

function CurrencyValue({}: { value: number | undefined }) {
  return <TYPE.body2>-</TYPE.body2>
}

function CurrencyBalance({}: { onMax?: (value: number) => void }) {
  return <TYPE.body2></TYPE.body2>
}
