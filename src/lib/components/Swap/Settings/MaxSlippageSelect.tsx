import { t, Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { Check, LargeIcon } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useRef } from 'react'

import { BaseButton, TextButton } from '../../Button'
import Column from '../../Column'
import { DecimalInput, inputCss } from '../../Input'
import Row from '../../Row'
import { MaxSlippage, maxSlippageAtom } from '../state'
import { Label, optionCss } from './components'

const tooltip = (
  <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
)

const StyledOption = styled(TextButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
`

const StyledInputOption = styled(BaseButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
  ${inputCss}
  border-color: ${({ selected, theme }) => (selected ? theme.active : 'transparent')} !important;
  padding: calc(0.5em - 1px) 0.625em;
`

interface OptionProps<T> {
  value: T
  selected: boolean
  onSelect: (value: T) => void
}

function Option<T>({ value, selected, onSelect }: OptionProps<T>) {
  return (
    <StyledOption selected={selected} onClick={() => onSelect(value)}>
      <Row>
        <ThemedText.Subhead2>{value}%</ThemedText.Subhead2>
        {selected && <LargeIcon icon={Check} />}
      </Row>
    </StyledOption>
  )
}

function InputOption<T>({ value, children, selected, onSelect }: OptionProps<T> & { children: ReactNode }) {
  return (
    <StyledInputOption color="container" selected={selected} onClick={() => onSelect(value)}>
      <ThemedText.Subhead2>
        <Row>{children}</Row>
      </ThemedText.Subhead2>
    </StyledInputOption>
  )
}

export default function MaxSlippageSelect() {
  const { P01, P05, CUSTOM } = MaxSlippage
  const [{ value: maxSlippage, custom }, setMaxSlippage] = useAtom(maxSlippageAtom)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])
  const onInputSelect = useCallback(
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
      <Label name={<Trans>Max slippage</Trans>} tooltip={tooltip} />
      <Row gap={0.5} grow>
        <Option value={P01} onSelect={setMaxSlippage} selected={maxSlippage === P01} />
        <Option value={P05} onSelect={setMaxSlippage} selected={maxSlippage === P05} />
        <InputOption value={custom} onSelect={onInputSelect} selected={maxSlippage === CUSTOM}>
          <DecimalInput
            size={custom === undefined ? undefined : 5}
            value={custom}
            onChange={(custom) => setMaxSlippage({ value: CUSTOM, custom })}
            placeholder={t`Custom`}
            ref={input}
          />
          %
        </InputOption>
      </Row>
    </Column>
  )
}
