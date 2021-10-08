import { useState } from 'react'

import { TYPE, useTheme } from '../../../themed'
import { useMaxSlippage } from '../state/hooks'
import { MaxSlippage, MaxSlippages } from '../state/reducer'
import { Line, Option as BaseOption, Row, Selected, Spacer } from './components'
import Label from './Label'

interface OptionProps {
  value: MaxSlippage
  onChange?: (value: number) => void
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

export default function GasPriceSelect() {
  const { P01, P05 } = MaxSlippages
  const [maxSlippage, setMaxSlippage] = useMaxSlippage()
  const [custom, setCustom] = useState(+maxSlippage)

  return (
    <>
      <Label name="Gas Price" />
      <Row>
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Spacer />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <Spacer />
        <Option value={custom} onChange={setCustom} onSelect={setMaxSlippage} selected={maxSlippage === custom} />
      </Row>
    </>
  )
}
