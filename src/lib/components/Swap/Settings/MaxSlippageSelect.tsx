import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import Popover from 'lib/components/Popover'
import { useTooltip } from 'lib/components/Tooltip'
import { toPercent } from 'lib/hooks/useAllowedSlippage'
import { AlertTriangle, Check, Icon, LargeIcon, XOctagon } from 'lib/icons'
import { autoSlippageAtom, MAX_VALID_SLIPPAGE, maxSlippageAtom, MIN_HIGH_SLIPPAGE } from 'lib/state/settings'
import styled, { Color, ThemedText } from 'lib/theme'
import { forwardRef, memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react'

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

enum WarningState {
  INVALID_SLIPPAGE = 1,
  HIGH_SLIPPAGE,
}

function toWarningState(percent: Percent | undefined): WarningState | undefined {
  if (percent?.greaterThan(MAX_VALID_SLIPPAGE)) {
    return WarningState.INVALID_SLIPPAGE
  } else if (percent?.greaterThan(MIN_HIGH_SLIPPAGE)) {
    return WarningState.HIGH_SLIPPAGE
  }
  return
}

const Warning = memo(function Warning({ state, showTooltip }: { state: WarningState; showTooltip: boolean }) {
  let icon: Icon
  let color: Color
  let content: ReactNode
  let show = showTooltip
  switch (state) {
    case WarningState.INVALID_SLIPPAGE:
      icon = XOctagon
      color = 'error'
      content = invalidSlippage
      show = true
      break
    case WarningState.HIGH_SLIPPAGE:
      icon = AlertTriangle
      color = 'warning'
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
      <LargeIcon icon={icon} color={color} size={1.25} />
    </Popover>
  )
})

export default function MaxSlippageSelect() {
  const [autoSlippage, setAutoSlippage] = useAtom(autoSlippageAtom)
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)
  const maxSlippageInput = useMemo(() => maxSlippage?.toString() || '', [maxSlippage])
  const [warning, setWarning] = useState<WarningState | undefined>(toWarningState(toPercent(maxSlippage)))

  const option = useRef<HTMLButtonElement>(null)
  const showTooltip = useTooltip(option.current)

  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  const processValue = useCallback(
    (value: number | undefined) => {
      const percent = toPercent(value)
      const warning = toWarningState(percent)
      setWarning(warning)
      setMaxSlippage(value)
      setAutoSlippage(!percent || warning === WarningState.INVALID_SLIPPAGE)
    },
    [setAutoSlippage, setMaxSlippage]
  )
  const onInputSelect = useCallback(() => {
    focus()
    processValue(maxSlippage)
  }, [focus, maxSlippage, processValue])

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
          <Row color={warning === WarningState.INVALID_SLIPPAGE ? 'error' : undefined}>
            <DecimalInput
              size={Math.max(maxSlippageInput.length, 3)}
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
