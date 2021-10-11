import { useRef } from 'react'

import { TYPE, useTheme } from '../../../themed'
import { DecimalInput } from '../../NumericInput'
import { useMaxSlippage } from '../state/hooks'
import { MaxSlippage } from '../state/reducer'
import { Line, Option as BaseOption, Row, Selected, Spacer } from './components'
import Label from './Label'

interface OptionProps {
  value: MaxSlippage
  onSelect: (value: MaxSlippage) => void
  selected: boolean
}

function Option({ value, selected, onSelect }: OptionProps) {
  const theme = useTheme()
  const borderColor = selected ? theme.selected : undefined
  return (
    <BaseOption style={{ borderColor }} onClick={() => onSelect(value)}>
      <Line>
        <TYPE.text>{value}%</TYPE.text>
        {selected && <Selected />}
      </Line>
    </BaseOption>
  )
}

interface CustomOptionProps extends Omit<OptionProps, 'value'> {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

function CustomOption({ value, selected, onChange, onSelect }: CustomOptionProps) {
  const input = useRef<HTMLInputElement>(null)
  const theme = useTheme()
  const borderColor = selected ? theme.selected : undefined
  return (
    <BaseOption
      style={{ borderColor }}
      onClick={() => {
        input.current?.focus()
        value !== undefined && onSelect(value)
      }}
    >
      <Line>
        <TYPE.text style={{ display: 'flex', justifyContent: 'space-between' }} accent>
          <DecimalInput
            style={{ width: '100%' }}
            value={value}
            onUserInput={onChange}
            placeholder="Custom"
            ref={input}
          />
          <span>%</span>
        </TYPE.text>
      </Line>
    </BaseOption>
  )
}

export default function GasPriceSelect() {
  const { P01, P05, CUSTOM, DEFAULT } = MaxSlippage
  const [[maxSlippage, custom], setMaxSlippage] = useMaxSlippage()
  return (
    <>
      <Label name="Gas Price" />
      <Row>
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Spacer />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <Spacer />
        <CustomOption
          value={custom}
          onChange={(value) => {
            setMaxSlippage(value === undefined ? DEFAULT : CUSTOM, value)
          }}
          onSelect={(value) => setMaxSlippage(CUSTOM, value)}
          selected={maxSlippage === CUSTOM}
        />
      </Row>
    </>
  )
}
