import React, { useState, useRef, useCallback } from 'react'
import styled, { css } from 'styled-components'

import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

import border8pxRadius from '../../assets/images/border-8px-radius.png'
import { Text } from 'rebass'
import { Option } from '../Option'

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh'
}

enum DeadlineError {
  InvalidInput = 'InvalidInput'
}

const Input = styled.input`
  background: ${({ theme }) => theme.bg2};
  font-size: 15px;
  line-height: 18px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
  display: flex;
`

const OptionCustom = styled(Option)<{ active?: boolean; warning?: boolean; focused?: boolean }>`
  position: relative;
  flex: 1;
  display: flex;
  border: 8px solid;
  border-radius: 8px;
  ${({ focused }) =>
    focused
      ? css`
          border: solid 1px ${({ theme }) => theme.bg5};
          padding: 7px 11px;
        `
      : css`
          border: 8px solid transparent;
          border-image: url(${border8pxRadius}) 8;
          padding: 0px 4px;
        `};

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 8px;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`

export interface SlippageTabsProps {
  rawSlippage: number
  setRawSlippage: (rawSlippage: number) => void
  deadline: number
  setDeadline: (deadline: number) => void
}

export default function SlippageTabs({ rawSlippage, setRawSlippage, deadline, setDeadline }: SlippageTabsProps) {
  const inputRef = useRef<HTMLInputElement>()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageFocused, setSlippageFocused] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineFocused, setDeadlineFocused] = useState(false)

  const slippageInputIsValid =
    slippageInput === '' || (rawSlippage / 100).toFixed(2) === Number.parseFloat(slippageInput).toFixed(2)
  const deadlineInputIsValid = deadlineInput === '' || (deadline / 60).toString() === deadlineInput

  let slippageError: SlippageError | undefined
  if (slippageInput !== '' && !slippageInputIsValid) {
    slippageError = SlippageError.InvalidInput
  } else if (slippageInputIsValid && rawSlippage < 50) {
    slippageError = SlippageError.RiskyLow
  } else if (slippageInputIsValid && rawSlippage > 500) {
    slippageError = SlippageError.RiskyHigh
  } else {
    slippageError = undefined
  }

  let deadlineError: DeadlineError | undefined
  if (deadlineInput !== '' && !deadlineInputIsValid) {
    deadlineError = DeadlineError.InvalidInput
  } else {
    deadlineError = undefined
  }

  function parseCustomSlippage(value: string) {
    setSlippageInput(value)

    try {
      const valueAsIntFromRoundedFloat = Number.parseInt((Number.parseFloat(value) * 100).toString())
      if (!Number.isNaN(valueAsIntFromRoundedFloat) && valueAsIntFromRoundedFloat < 5000) {
        setRawSlippage(valueAsIntFromRoundedFloat)
      }
    } catch {}
  }

  function parseCustomDeadline(value: string) {
    setDeadlineInput(value)

    try {
      const valueAsInt: number = Number.parseInt(value) * 60
      if (!Number.isNaN(valueAsInt) && valueAsInt > 0) {
        setDeadline(valueAsInt)
      }
    } catch {}
  }

  const handleSlippageFocus = useCallback(() => {
    setSlippageFocused(true)
  }, [])

  const handleDeadlineFocus = useCallback(() => {
    setDeadlineFocused(true)
  }, [])

  return (
    <AutoColumn gap="16px">
      <AutoColumn gap="12px">
        <RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" lineHeight="15px">
            Slippage tolerance
          </TYPE.body>
          <QuestionHelper text="Your transaction will revert if the price changes unfavorably by more than this percentage." />
        </RowFixed>
        <RowBetween>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(10)
            }}
            active={rawSlippage === 10}
          >
            0.1%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(50)
            }}
            active={rawSlippage === 50}
          >
            0.5%
          </Option>
          <Option
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(100)
            }}
            active={rawSlippage === 100}
          >
            1%
          </Option>
          <OptionCustom focused={slippageFocused} warning={!slippageInputIsValid} tabIndex={-1}>
            <RowBetween>
              {!!slippageInput &&
              (slippageError === SlippageError.RiskyLow || slippageError === SlippageError.RiskyHigh) ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null}
              {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
              <Input
                ref={inputRef as any}
                placeholder={(rawSlippage / 100).toFixed(2)}
                value={slippageInput}
                onFocus={handleSlippageFocus}
                onBlur={() => {
                  setSlippageFocused(false)
                  parseCustomSlippage((rawSlippage / 100).toFixed(2))
                }}
                onChange={e => parseCustomSlippage(e.target.value)}
                color={!slippageInputIsValid ? 'red' : ''}
              />
              %
            </RowBetween>
          </OptionCustom>
        </RowBetween>
        {!!slippageError && (
          <RowBetween mt="8px">
            <Text
              fontWeight={500}
              fontSize="12px"
              lineHeight="15px"
              color={slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E'}
            >
              {slippageError === SlippageError.InvalidInput
                ? 'Enter a valid slippage percentage'
                : slippageError === SlippageError.RiskyLow
                ? 'Your transaction may fail'
                : 'Your transaction may be frontrun'}
            </Text>
          </RowBetween>
        )}
      </AutoColumn>

      <AutoColumn gap="12px">
        <RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" lineHeight="15px">
            Transaction deadline
          </TYPE.body>
          <QuestionHelper text="Your transaction will revert if it is pending for more than this long." />
        </RowFixed>
        <RowFixed>
          <OptionCustom focused={deadlineFocused} style={{ width: '80px' }} tabIndex={-1}>
            <Input
              color={!!deadlineError ? 'red' : undefined}
              onFocus={handleDeadlineFocus}
              onBlur={() => {
                setDeadlineFocused(false)
                parseCustomDeadline((deadline / 60).toString())
              }}
              placeholder={(deadline / 60).toString()}
              value={deadlineInput}
              onChange={e => parseCustomDeadline(e.target.value)}
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
