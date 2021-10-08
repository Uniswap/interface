import { useState } from 'react'

import { TYPE, useTheme } from '../../../themed'
import { useGasPrice } from '../state/hooks'
import { GasPrice, GasPrices } from '../state/reducer'
import { Line, Option as BaseOption, Row, Selected, Spacer } from './components'
import Label from './Label'

interface OptionProps {
  name: string
  value: GasPrice
  onChange?: (value: number) => void
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

export default function GasPriceSelect() {
  const { FAST, TRADER } = GasPrices
  const [gasPrice, setGasPrice] = useGasPrice()
  const [custom, setCustom] = useState(+gasPrice)

  return (
    <>
      <Label name="Gas Price" />
      <Row>
        <Option name="Fast" value={FAST} onSelect={setGasPrice} selected={gasPrice === FAST} />
        <Spacer />
        <Option name="Trader" value={TRADER} onSelect={setGasPrice} selected={gasPrice === TRADER} />
        <Spacer />
        <Option
          name="Custom"
          value={custom}
          onChange={setCustom}
          onSelect={setGasPrice}
          selected={gasPrice === custom}
        />
      </Row>
    </>
  )
}
