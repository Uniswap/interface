import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { Check, LargeIcon } from 'lib/icons'
import { maxSlippageAtom } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useRef } from 'react'

import { BaseButton, TextButton } from '../../Button'
import Column from '../../Column'
import { DecimalInput, inputCss } from '../../Input'
import Row from '../../Row'
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
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  //@TODO(ianlapham): hook up inputs to either set custom slippage or update to auto
  //@TODO(ianlapham): update UI to match designs in spec

  const onInputSelect = useCallback(
    (custom: Percent | 'auto') => {
      focus()
      if (custom !== undefined) {
        setMaxSlippage(custom)
      }
    },
    [focus, setMaxSlippage]
  )

  return (
    <Column gap={0.75}>
      <Label name={<Trans>Max slippage</Trans>} tooltip={tooltip} />
      <Row gap={0.5} grow>
        <Option value={'auto'} onSelect={setMaxSlippage} selected={maxSlippage === 'auto'} />
        <InputOption value={maxSlippage} onSelect={onInputSelect} selected={maxSlippage !== 'auto'}>
          <DecimalInput size={5} value={''} onChange={() => null} placeholder={t`Custom`} ref={input} />%
        </InputOption>
      </Row>
    </Column>
  )
}
