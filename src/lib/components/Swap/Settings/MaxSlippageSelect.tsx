import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import Popover from 'lib/components/Popover'
import Tooltip from 'lib/components/Tooltip'
import { AlertTriangle, Check, LargeIcon, XOctagon } from 'lib/icons'
import { MAX_VALID_SLIPPAGE, maxSlippageAtom, MIN_HIGH_SLIPPAGE } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { PropsWithChildren, ReactNode, useCallback, useMemo, useRef, useState } from 'react'

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

enum Warning {
  HIGH_SLIPPAGE,
  INVALID_SLIPPAGE,
}

const Button = styled(TextButton)<{ selected: boolean }>`
  ${({ selected }) => optionCss(selected)}
`

const Custom = styled(BaseButton)<{ selected: boolean }>`
  ${inputCss}
  ${({ selected }) => optionCss(selected)}
  padding: calc(0.75em - 3px) 0.625em;
`

interface OptionProps {
  wrapper: typeof Button | typeof Custom
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
}

function Option({ wrapper: Wrapper, children, selected, onSelect, icon }: PropsWithChildren<OptionProps>) {
  return (
    <Wrapper selected={selected} onClick={onSelect}>
      <Row gap={0.5}>
        {children}
        <span style={{ width: '1.2em' }}>{icon ? icon : selected && <LargeIcon icon={Check} />}</span>
      </Row>
    </Wrapper>
  )
}

export default function MaxSlippageSelect() {
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)

  const [custom, setCustom] = useState('')
  const [warning, setWarning] = useState<Warning | undefined>()
  const input = useRef<HTMLInputElement>(null)
  const focus = useCallback(() => input.current?.focus(), [input])

  const warningPopover = useMemo(() => {
    switch (warning) {
      case Warning.HIGH_SLIPPAGE:
        return (
          <Tooltip
            placement="top"
            icon={LargeIcon}
            iconProps={{ icon: AlertTriangle, color: 'warning', size: 1.2 }}
            offset={17}
            contained
          >
            <ThemedText.Caption>{highSlippage}</ThemedText.Caption>
          </Tooltip>
        )
      case Warning.INVALID_SLIPPAGE:
        return (
          <Popover
            content={<ThemedText.Caption>{invalidSlippage}</ThemedText.Caption>}
            show={true}
            placement="top"
            offset={17}
            contained
          >
            <LargeIcon icon={XOctagon} color="error" />
          </Popover>
        )
        return
      default:
        return
    }
  }, [warning])

  const onInputChange = useCallback(
    (custom: string) => {
      setCustom(custom)
      const numerator = Math.floor(+custom * 100)
      if (numerator) {
        const percent = new Percent(numerator, 10_000)
        if (percent.greaterThan(MAX_VALID_SLIPPAGE)) {
          setWarning(Warning.INVALID_SLIPPAGE)
          setMaxSlippage('auto')
          return
        } else if (percent.greaterThan(MIN_HIGH_SLIPPAGE)) {
          setWarning(Warning.HIGH_SLIPPAGE)
        }
        setMaxSlippage(percent)
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
        <Option wrapper={Custom} selected={maxSlippage !== 'auto'} onSelect={onInputSelect} icon={warningPopover}>
          <Row>
            <DecimalInput
              size={Math.max(custom.length, 3)}
              value={custom}
              onChange={onInputChange}
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
