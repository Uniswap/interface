import { useRef } from 'react'

import { TYPE, useTheme } from '../../../themed'
import { IntegerInput } from '../../NumericInput'
import { useGasPrice } from '../state/hooks'
import { GasPrice } from '../state/reducer'
import { Line, Option as BaseOption, Row, Selected, Spacer } from './components'
import Label from './Label'

interface OptionProps {
  name: string
  value: GasPrice
  onSelect: (value: GasPrice) => void
  selected: boolean
}

function Option({ name, value, selected, onSelect }: OptionProps) {
  const theme = useTheme()
  const borderColor = selected ? theme.selected : undefined
  return (
    <BaseOption style={{ borderColor }} onClick={() => onSelect(value)}>
      <Line>
        <TYPE.text>{name}</TYPE.text>
        {selected && <Selected />}
      </Line>
      <TYPE.subtext accent>{value} gwei</TYPE.subtext>
    </BaseOption>
  )
}

interface CustomOptionProps extends Omit<OptionProps, 'name' | 'value'> {
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
        <TYPE.text>Custom</TYPE.text>
        {selected && <Selected />}
      </Line>
      <TYPE.subtext style={{ display: 'flex' }} accent>
        <IntegerInput
          style={{ width: '3ch' }}
          value={value}
          onUserInput={onChange}
          placeholder="-"
          maxLength={5}
          ref={input}
        />
        <span>&emsp;gwei</span>
      </TYPE.subtext>
    </BaseOption>
  )
}

export default function GasPriceSelect() {
  const { FAST, TRADER, CUSTOM, DEFAULT } = GasPrice
  const [[gasPrice, custom], setGasPrice] = useGasPrice()
  return (
    <>
      <Label name="Gas Price" />
      <Row>
        <Option name="Fast" value={FAST} onSelect={setGasPrice} selected={gasPrice === FAST} />
        <Spacer />
        <Option name="Trader" value={TRADER} onSelect={setGasPrice} selected={gasPrice === TRADER} />
        <Spacer />
        <CustomOption
          value={custom}
          onChange={(value) => {
            setGasPrice(value === undefined ? DEFAULT : CUSTOM, value)
          }}
          onSelect={(value) => setGasPrice(CUSTOM, value)}
          selected={gasPrice === CUSTOM}
        />
      </Row>
    </>
  )
}
