import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import Popover from 'lib/components/Popover'
import { TooltipHandlers, useTooltip } from 'lib/components/Tooltip'
import { AlertTriangle, Check, Icon, LargeIcon, XOctagon } from 'lib/icons'
import { autoSlippageAtom, MAX_VALID_SLIPPAGE, maxSlippageAtom, MIN_HIGH_SLIPPAGE } from 'lib/state/settings'
import styled, { Color, ThemedText } from 'lib/theme'
import { memo, PropsWithChildren, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

interface OptionProps extends Partial<TooltipHandlers> {
  wrapper: typeof Button | typeof Custom
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
}

function Option({
  wrapper: Wrapper,
  children,
  selected,
  onSelect,
  icon,
  ...tooltipHandlers
}: PropsWithChildren<OptionProps>) {
  return (
    <Wrapper selected={selected} onClick={onSelect} {...tooltipHandlers}>
      <Row gap={0.5}>
        {children}
        {icon ? icon : <LargeIcon icon={selected ? Check : undefined} size={1.25} />}
      </Row>
    </Wrapper>
  )
}

enum WarningState {
  NONE,
  HIGH_SLIPPAGE,
  INVALID_SLIPPAGE,
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
    case WarningState.NONE:
      return null
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
  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  const [autoSlippage, setAutoSlippage] = useAtom(autoSlippageAtom)
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)
  const maxSlippageInput = useMemo(() => maxSlippage?.toString() || '', [maxSlippage])
  const [warning, setWarning] = useState(WarningState.NONE)
  const [showTooltip, setShowTooltip, tooltipProps] = useTooltip()

  const processInput = useCallback(
    (input: number | undefined) => {
      const numerator = input && Math.floor(input * 100)
      if (numerator) {
        const percent = new Percent(numerator, 10_000)
        if (percent.greaterThan(MAX_VALID_SLIPPAGE)) {
          setWarning(WarningState.INVALID_SLIPPAGE)
          setAutoSlippage(true)
          setMaxSlippage(input)
        } else if (percent.greaterThan(MIN_HIGH_SLIPPAGE)) {
          setWarning(WarningState.HIGH_SLIPPAGE)
          setAutoSlippage(false)
          setMaxSlippage(input)
        } else {
          setWarning(WarningState.NONE)
          setAutoSlippage(false)
          setMaxSlippage(input)
        }
      } else {
        setAutoSlippage(true)
        setMaxSlippage(undefined)
      }
    },
    [setAutoSlippage, setMaxSlippage]
  )
  const onInputSelect = useCallback(() => {
    focus()
    processInput(maxSlippage)
  }, [focus, maxSlippage, processInput])

  useEffect(() => processInput(maxSlippage), [maxSlippage, processInput]) // processes any warnings on mount
  useEffect(() => setShowTooltip(true), [warning, setShowTooltip]) // enables the tooltip if a warning is set

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
          icon={<Warning state={warning} showTooltip={showTooltip} />}
          {...tooltipProps}
        >
          <Row color={warning === WarningState.INVALID_SLIPPAGE ? 'error' : undefined}>
            <DecimalInput
              size={Math.max(maxSlippageInput.length, 3)}
              value={maxSlippageInput}
              onChange={(input) => processInput(+input)}
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
