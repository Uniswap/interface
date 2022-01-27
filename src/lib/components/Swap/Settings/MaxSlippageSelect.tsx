import { t, Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { Check, LargeIcon } from 'lib/icons'
import { maxSlippageAtom } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { PropsWithChildren, useCallback, useRef, useState } from 'react'

import { BaseButton, TextButton } from '../../Button'
import Column from '../../Column'
import { DecimalInput, inputCss } from '../../Input'
import Row from '../../Row'
import { Label, optionCss } from './components'

const tooltip = (
  <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
)

const Button = styled(TextButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
`

const Custom = styled(BaseButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
  ${inputCss}
  border-color: ${({ selected, theme }) => (selected ? theme.active : 'transparent')} !important;
  padding: calc(0.75em - 3px) 0.625em;
`

interface OptionProps {
  wrapper: typeof Button | typeof Custom
  selected: boolean
  onSelect: () => void
}

function Option({ wrapper: Wrapper, children, selected, onSelect }: PropsWithChildren<OptionProps>) {
  return (
    <Wrapper selected={selected} onClick={onSelect}>
      <Row gap={0.5}>
        {children}
        <span style={{ width: '1.2em' }}>{selected && <LargeIcon icon={Check} />}</span>
      </Row>
    </Wrapper>
  )
}

export default function MaxSlippageSelect() {
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)

  const [custom, setCustom] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  const onInputChange = useCallback(
    (custom: string) => {
      setCustom(custom)
      const numerator = Math.floor(+custom * 100)
      if (numerator) {
        setMaxSlippage(new Percent(numerator, 10_000))
      } else {
        setMaxSlippage('auto')
      }
    },
    [setMaxSlippage]
  )
  const onInputSelect = useCallback(() => {
    focus()
    onInputChange(custom)
  }, [custom, focus, onInputChange])

  return (
    <Column gap={0.75}>
      <Label name={<Trans>Max slippage</Trans>} tooltip={tooltip} />
      <Row gap={0.5} grow="last">
        <Option wrapper={Button} selected={maxSlippage === 'auto'} onSelect={() => setMaxSlippage('auto')}>
          <ThemedText.ButtonMedium>
            <Trans>Auto</Trans>
          </ThemedText.ButtonMedium>
        </Option>
        <Option wrapper={Custom} onSelect={onInputSelect} selected={maxSlippage !== 'auto'}>
          <Row>
            <DecimalInput value={custom} onChange={onInputChange} placeholder={t`Custom`} ref={input} />%
          </Row>
        </Option>
      </Row>
    </Column>
  )
}
