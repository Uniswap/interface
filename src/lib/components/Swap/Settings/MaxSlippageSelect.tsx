import { useAtom } from 'jotai'
import styled, { icon, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { CheckCircle } from 'react-feather'

import Button from '../../Button'
import Column from '../../Column'
import { DecimalInput } from '../../Input'
import Row from '../../Row'
import { MaxSlippage, maxSlippageAtom } from '../state'
import Label, { value } from './Label'

const tooltip = 'Your transaction will revert if the price changes unfavorably by more than this percentage.'

const Value = value(Button)

const SelectedIcon = icon(CheckCircle, 'active')

const InputType = styled(TYPE.subhead2)<{ empty: boolean; theme: Theme }>`
  color: ${({ empty, theme }) => (empty ? theme.secondary : theme.primary)};
`

interface OptionProps<T> {
  value: T
  children?: ReactNode
  onSelect: (value: T) => void
  selected: boolean
}

function Option<T>({ value, children, selected, onSelect }: OptionProps<T>) {
  return (
    <Value selected={selected} onClick={() => onSelect(value)}>
      <Row>
        <TYPE.subhead2>{children ? children : `${value}%`}</TYPE.subhead2>
        {selected && <SelectedIcon />}
      </Row>
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
  const hasCustomInput = useMemo(() => custom !== undefined, [custom])

  return (
    <Column gap="0.75em">
      <Label name="Max Slippage" tooltip={tooltip} />
      <Row gap="0.5em" grow>
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <Option value={custom} onSelect={onCustomSelect} selected={maxSlippage === CUSTOM}>
          <Row>
            <InputType empty={!hasCustomInput}>
              <DecimalInput
                style={{ width: hasCustomInput ? '4ch' : '100%' }}
                value={custom}
                onChange={(custom) => setMaxSlippage({ value: CUSTOM, custom })}
                placeholder="Custom"
                ref={input}
              />
              {hasCustomInput && '%'}
            </InputType>
          </Row>
        </Option>
      </Row>
    </Column>
  )
}
