import { useAtom } from 'jotai'
import styled from 'lib/theme'
import { styledIcon } from 'lib/theme/components'
import TYPE from 'lib/theme/type'
import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { CheckCircle } from 'react-feather'

import Column from '../../Column'
import { DecimalInput } from '../../NumericInput'
import Row from '../../Row'
import { MaxSlippage, maxSlippageAtom } from '../state'
import Label, { Value } from './Label'

const tooltip = 'Your transaction will revert if the price changes unfavorably by more than this percentage.'

const OptionsRow = styled(Row)`
  grid-template-columns: repeat(3, 1fr);
`

const Selected = styledIcon(CheckCircle, 'active')

const InputType = styled(TYPE.subhead2)`
  color: ${({ theme }) => theme.secondary};
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
        {selected && <Selected />}
      </Row>
    </Value>
  )
}

export default function MaxSlippageSelect() {
  const { P01, P05, CUSTOM } = MaxSlippage
  const [[maxSlippage, custom], setMaxSlippage] = useAtom(maxSlippageAtom)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])
  const onCustomSelect = useCallback(
    (value) => {
      focus()
      if (value !== undefined) {
        setMaxSlippage([CUSTOM, value])
      }
    },
    [CUSTOM, focus, setMaxSlippage]
  )
  const hasCustomInput = useMemo(() => custom !== undefined, [custom])

  return (
    <Column gap="0.75em">
      <Label name="Max Slippage" tooltip={tooltip} />
      <OptionsRow gap="0.5em">
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <Option value={custom} onSelect={onCustomSelect} selected={maxSlippage === CUSTOM}>
          <Row>
            <InputType>
              <DecimalInput
                style={{ width: hasCustomInput ? '4ch' : '100%' }}
                value={custom}
                onUserInput={(value) => setMaxSlippage([CUSTOM, value])}
                placeholder="Custom"
                ref={input}
              />
              {hasCustomInput && '%'}
            </InputType>
          </Row>
        </Option>
      </OptionsRow>
    </Column>
  )
}
