import { JSBI, Percent } from '@uniswap/sdk'

import { darken } from 'polished'
import React, { useCallback, useContext, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Slider from '../../components/Slider'
import { BIPS_BASE } from '../../constants'
import { useIsExpertMode } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { AutoColumn } from '../Column'

import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh'
}

enum DeadlineError {
  InvalidInput = 'InvalidInput'
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 36px;
  font-size: 12px;
  width: auto;
  min-width: 3rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  border: ${({ theme, active, warning }) => active && `1px solid ${warning ? theme.red1 : theme.primary1}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary1)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

export interface TransactionSettingsProps {
  rawSlippage: number
  setRawSlippage: (rawSlippage: number) => void
  deadline: number
  setDeadline: (deadline: number) => void
}

export default function TransactionSettings({
  rawSlippage: rawSlippageOuter,
  setRawSlippage: setRawSlippageOuter,
  deadline,
  setDeadline
}: TransactionSettingsProps) {
  const theme = useContext(ThemeContext)

  const [deadlineInput, setDeadlineInput] = useState('')

  const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput

  const [rawSlippage, setRawSlippage] = useDebouncedChangeHandler(rawSlippageOuter, setRawSlippageOuter)

  let slippageError: SlippageError | undefined
  if (rawSlippage < 50) {
    slippageError = SlippageError.RiskyLow
  } else if (rawSlippage > 200) {
    slippageError = SlippageError.RiskyHigh
  }

  let deadlineError: DeadlineError | undefined
  if (deadlineInput !== '' && !deadlineInputIsValid) {
    deadlineError = DeadlineError.InvalidInput
  }

  function parseDeadline(event) {
    setDeadlineInput(event.target.value)

    let valueAsInt: number
    try {
      valueAsInt = Number.parseInt(event.target.value) * 60
    } catch {}

    if (typeof valueAsInt === 'number' && !Number.isNaN(valueAsInt) && valueAsInt > 0) {
      setDeadline(valueAsInt)
    }
  }

  const maxSlippage = useIsExpertMode() ? 5000 : 500

  const handleSlippageChange = useCallback(
    (value: number) => {
      setRawSlippage(value)
    },
    [setRawSlippage]
  )

  return (
    <AutoColumn gap="md">
      <AutoColumn gap="sm">
        <RowFixed>
          <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
            Slippage tolerance
          </TYPE.black>
          <QuestionHelper text="Your transaction will revert if the price changes unfavorably by more than this percentage." />
        </RowFixed>
        <RowBetween>
          <Slider size={18} value={rawSlippage} onChange={handleSlippageChange} step={10} min={0} max={maxSlippage} />
          <div style={{ minWidth: '4rem', textAlign: 'right' }}>
            {new Percent(JSBI.BigInt(rawSlippage), BIPS_BASE).toFixed(2)}%
          </div>
        </RowBetween>
        {slippageError && (
          <RowBetween
            style={{
              fontSize: '14px',
              paddingTop: '7px',
              color: '#F3841E'
            }}
          >
            {slippageError === SlippageError.RiskyLow
              ? 'Your transaction may fail'
              : 'Your transaction may be frontrun'}
          </RowBetween>
        )}
      </AutoColumn>

      <AutoColumn gap="sm">
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            Transaction deadline
          </TYPE.black>
          <QuestionHelper text="Your transaction will revert if it is pending for more than this long." />
        </RowFixed>
        <RowFixed>
          <OptionCustom style={{ width: '80px' }} tabIndex={-1}>
            <Input
              color={!!deadlineError ? 'red' : undefined}
              onBlur={() => {
                parseDeadline({ target: { value: (deadline / 60).toString() } })
              }}
              placeholder={(deadline / 60).toString()}
              value={deadlineInput}
              onChange={parseDeadline}
            />
          </OptionCustom>
          <TYPE.body style={{ paddingLeft: '8px' }} fontSize={14}>
            minutes
          </TYPE.body>
        </RowFixed>
      </AutoColumn>
    </AutoColumn>
  )
}
