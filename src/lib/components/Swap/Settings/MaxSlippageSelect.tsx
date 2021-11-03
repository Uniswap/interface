import { useAtom } from 'jotai'
import { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useCallback, useRef } from 'react'
import { CheckCircle } from 'react-feather'

import Button from '../../Button'
import Column from '../../Column'
import { DecimalInput } from '../../Input'
import Row from '../../Row'
import { MaxSlippage, maxSlippageAtom } from '../state'
import Label, { value } from './Label'

const tooltip = 'Your transaction will revert if the price changes unfavorably by more than this percentage.'

const Value = value(Button)

const SelectedIcon = icon(CheckCircle, { color: 'accent' })

interface OptionProps<T> {
  value: T
  children?: ReactNode
  onSelect: (value: T) => void
  selected: boolean
  cursor?: string
}

function Option<T>({ value, children, selected, cursor, onSelect }: OptionProps<T>) {
  return (
    <Value selected={selected} onClick={() => onSelect(value)} cursor={cursor}>
      <TYPE.subhead2>
        <Row>
          {children ? children : `${value}%`}
          {selected && <SelectedIcon />}
        </Row>
      </TYPE.subhead2>
    </Value>
  )
}

export default function MaxSlippageSelect() {
  const { P01, P05, CUSTOM } = MaxSlippage
  const [{ value: maxSlippage, custom }, setMaxSlippage] = useAtom(maxSlippageAtom)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])
  const onCustomSelect = useCallback(
    (custom) => {
      focus()
      if (custom !== undefined) {
        setMaxSlippage({ value: CUSTOM, custom })
      }
    },
    [CUSTOM, focus, setMaxSlippage]
  )

  return (
    <Column gap={0.75}>
      <Label name="Max Slippage" tooltip={tooltip} />
      <Row gap={0.5} grow>
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <Option value={custom} onSelect={onCustomSelect} selected={maxSlippage === CUSTOM} cursor="text">
          <Row>
            <DecimalInput
              size={custom === undefined ? undefined : 5}
              value={custom}
              onChange={(custom) => setMaxSlippage({ value: CUSTOM, custom })}
              placeholder="Custom"
              ref={input}
            />
            {custom !== undefined && <span>%</span>}
          </Row>
        </Option>
      </Row>
    </Column>
  )
}
