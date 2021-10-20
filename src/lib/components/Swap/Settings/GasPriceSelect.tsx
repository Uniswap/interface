import { useAtom } from 'jotai'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useCallback, useRef } from 'react'
import { CheckCircle } from 'react-feather'

import Button from '../../Button'
import Column from '../../Column'
import { IntegerInput } from '../../NumericInput'
import Row from '../../Row'
import { GasPrice, gasPriceAtom } from '../state'
import Label, { value } from './Label'

const Value = value(Button)

const SelectedIcon = icon(CheckCircle, 'active')

const InputType = styled(TYPE.body2)`
  color: ${({ theme }) => theme.secondary};
`

interface OptionProps<T> {
  name: string
  value: T
  children?: ReactNode
  onSelect: (value: T) => void
  selected: boolean
}

function Option<T>({ name, value, children, selected, onSelect }: OptionProps<T>) {
  return (
    <Value selected={selected} onClick={() => onSelect(value)}>
      <Row>
        <TYPE.subhead2>{name}</TYPE.subhead2>
        {selected && <SelectedIcon />}
      </Row>
      <TYPE.body2 color="secondary">{children ? children : `${value} gwei`}</TYPE.body2>
    </Value>
  )
}

export default function GasPriceSelect() {
  const { FAST, TRADER, CUSTOM } = GasPrice
  const [{ value: gasPrice, custom }, setGasPrice] = useAtom(gasPriceAtom)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])
  const onCustomSelect = useCallback(
    (custom) => {
      focus()
      if (custom !== undefined) {
        setGasPrice({ value: CUSTOM, custom })
      }
    },
    [CUSTOM, focus, setGasPrice]
  )

  return (
    <Column gap="0.75em">
      <Label name="Gas Price" />
      <Row gap="0.5em" grow>
        <Option name="Fast" value={'-'} onSelect={() => setGasPrice(FAST)} selected={gasPrice === FAST} />
        <Option name="Trader" value={'-'} onSelect={() => setGasPrice(TRADER)} selected={gasPrice === TRADER} />
        <Option name="Custom" value={custom} onSelect={onCustomSelect} selected={gasPrice === CUSTOM}>
          <InputType>
            <IntegerInput
              style={{ width: '4ch' }}
              value={custom}
              onChange={(custom) => setGasPrice({ value: CUSTOM, custom })}
              placeholder="-"
              maxLength={4}
              ref={input}
            />
            <span>&emsp;gwei</span>
          </InputType>
        </Option>
      </Row>
    </Column>
  )
}
