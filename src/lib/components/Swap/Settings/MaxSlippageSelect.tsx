import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import Popover from 'lib/components/Popover'
import { useTooltip } from 'lib/components/Tooltip'
import { getSlippageWarning, toPercent } from 'lib/hooks/useSlippage'
import { AlertTriangle, Check, Icon, LargeIcon, XOctagon } from 'lib/icons'
import { autoSlippageAtom, maxSlippageAtom } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { forwardRef, memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BaseButton, TextButton } from '../../Button'
import Column from '../../Column'
import { DecimalInput, inputCss } from '../../Input'
import Row from '../../Row'
import { Label, optionCss } from './components'

const tooltip = (
  <Trans>Your transaction will revert if the price changes unfavorably by more than this percentage.</Trans>
)
const highSlippage = <Trans>High slippage increases the risk of price movement</Trans>
const invalidSlippage = <Trans>Please enter a valid slippage %</Trans>

const placeholder = '0.10'

const Button = styled(TextButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
`

const Custom = styled(BaseButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
  ${inputCss}
  padding: calc(0.75em - 3px) 0.625em;
`

interface OptionProps {
  wrapper: typeof Button | typeof Custom
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
  tabIndex?: number
  children: ReactNode
}

const Option = forwardRef<HTMLButtonElement, OptionProps>(function Option(
  { wrapper: Wrapper, children, selected, onSelect, icon, tabIndex }: OptionProps,
  ref
) {
  return (
    <Wrapper selected={selected} onClick={onSelect} ref={ref} tabIndex={tabIndex}>
      <Row gap={0.5}>
        {children}
        {icon ? icon : <LargeIcon icon={selected ? Check : undefined} size={1.25} />}
      </Row>
    </Wrapper>
  )
})

const Warning = memo(function Warning({ state, showTooltip }: { state?: 'warning' | 'error'; showTooltip: boolean }) {
  let icon: Icon | undefined
  let content: ReactNode
  let show = showTooltip
  switch (state) {
    case 'error':
      icon = XOctagon
      content = invalidSlippage
      show = true
      break
    case 'warning':
      icon = AlertTriangle
      content = highSlippage
      break
  }
  return (
    <Popover
      key={state}
      content={<ThemedText.Caption>{content}</ThemedText.Caption>}
      show={show}
      placement="top"
      offset={16}
      contained
    >
      <LargeIcon icon={icon} color={state} size={1.25} />
    </Popover>
  )
})

export default function MaxSlippageSelect() {
  const [autoSlippage, setAutoSlippage] = useAtom(autoSlippageAtom)
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)
  const maxSlippageInput = useMemo(() => maxSlippage?.toString() || '', [maxSlippage])

  const option = useRef<HTMLButtonElement>(null)
  const showTooltip = useTooltip(option.current)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  const [warning, setWarning] = useState<'warning' | 'error' | undefined>(getSlippageWarning(toPercent(maxSlippage)))
  useEffect(() => {
    setWarning(getSlippageWarning(toPercent(maxSlippage)))
  }, [maxSlippage])

  const onInputSelect = useCallback(() => {
    focus()
    const percent = toPercent(maxSlippage)
    const warning = getSlippageWarning(percent)
    setAutoSlippage(!percent || warning === 'error')
  }, [focus, maxSlippage, setAutoSlippage])

  const processValue = useCallback(
    (value: number | undefined) => {
      const percent = toPercent(value)
      const warning = getSlippageWarning(percent)
      setMaxSlippage(value)
      setAutoSlippage(!percent || warning === 'error')
    },
    [setAutoSlippage, setMaxSlippage]
  )

  return (
    <Column gap={0.75}>
      <Label name={<Trans>Max slippage</Trans>} tooltip={tooltip} />
      <Row gap={0.5} grow="last">
        <Option wrapper={Button} selected={autoSlippage} onSelect={() => setAutoSlippage(true)}>
          <ThemedText.ButtonMedium>
            <Trans>Auto</Trans>
          </ThemedText.ButtonMedium>
        </Option>
        <Option
          wrapper={Custom}
          selected={!autoSlippage}
          onSelect={onInputSelect}
          icon={warning && <Warning state={warning} showTooltip={showTooltip} />}
          ref={option}
          tabIndex={-1}
        >
          <Row color={warning === 'error' ? 'error' : undefined}>
            <DecimalInput
              size={Math.max(maxSlippageInput.length, 4)}
              value={maxSlippageInput}
              onChange={(input) => processValue(+input)}
              placeholder={placeholder}
              ref={input}
            />
            %
          </Row>
        </Option>
      </Row>
    </Column>
  )
}
