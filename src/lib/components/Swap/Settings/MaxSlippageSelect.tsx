import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useSwapInfo } from 'lib/hooks/swap'
import { maxSlippageAtom } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode, useState } from 'react'

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
}

function InputOption<T>({ value, children, selected }: OptionProps<T> & { children: ReactNode }) {
  return (
    <StyledInputOption color="container" selected={selected}>
      <ThemedText.Subhead2>
        <Row>{children}</Row>
      </ThemedText.Subhead2>
    </StyledInputOption>
  )
}

export default function MaxSlippageSelect() {
  // grab user custom slippage and possible auto slippage from trade
  const [maxSlippage, setMaxSlippage] = useAtom(maxSlippageAtom)
  const { allowedSlippage } = useSwapInfo()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<boolean>(false)

  function parseSlippageInput(value: string) {
    // populate what the user typed and clear the error
    setSlippageInput(value)
    setSlippageError(false)

    if (value.length === 0) {
      setMaxSlippage('auto')
    } else {
      const parsed = Math.floor(Number.parseFloat(value) * 100)

      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
        setMaxSlippage('auto')
        if (value !== '.') {
          setSlippageError(true)
        }
      } else {
        setMaxSlippage(new Percent(parsed, 10_000))
      }
    }
  }

  const tooLow = maxSlippage !== 'auto' && maxSlippage.lessThan(new Percent(5, 10_000))
  const tooHigh = maxSlippage !== 'auto' && maxSlippage.greaterThan(new Percent(1, 100))

  return (
    <Column gap={0.75}>
      <Label name={<Trans>Max slippage</Trans>} tooltip={tooltip} />
      <Row gap={0.5} grow>
        <StyledOption
          onClick={() => {
            parseSlippageInput('')
          }}
          selected={maxSlippage === 'auto'}
        >
          <Trans>Auto</Trans>
        </StyledOption>
        <InputOption value={slippageInput} selected={maxSlippage !== 'auto'}>
          <DecimalInput
            value={slippageInput.length > 0 ? slippageInput : maxSlippage === 'auto' ? '' : maxSlippage.toFixed(2)}
            onChange={parseSlippageInput}
            placeholder={allowedSlippage.toFixed(2)}
            onBlur={() => {
              setSlippageInput('')
              setSlippageError(false)
            }}
          />
          %
        </InputOption>
      </Row>
      {slippageError || tooLow || tooHigh ? (
        <Row>
          <ThemedText.Caption color={slippageError ? 'error' : 'warning'}>
            {slippageError ? (
              <Trans>Enter a valid slippage percentage</Trans>
            ) : tooLow ? (
              <Trans>Your transaction may fail</Trans>
            ) : (
              <Trans>Your transaction may be frontrun</Trans>
            )}
          </ThemedText.Caption>
        </Row>
      ) : null}
    </Column>
  )
}
