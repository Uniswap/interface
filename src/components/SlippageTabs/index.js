import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled, { css } from 'styled-components'

import QuestionHelper from '../Question'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

import { darken } from 'polished'
import { useDebounce } from '../../hooks'

const WARNING_TYPE = Object.freeze({
  none: 'none',
  emptyInput: 'emptyInput',
  invalidEntryBound: 'invalidEntryBound',
  riskyEntryHigh: 'riskyEntryHigh',
  riskyEntryLow: 'riskyEntryLow'
})

const FancyButton = styled.button`
  color: ${({ theme }) => theme.textColor};
  align-items: center;
  min-width: 55px;
  height: 2rem;
  border-radius: 36px;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    cursor: inherit;
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.blue1};
  }
`

const Option = styled(FancyButton)`
  margin-right: 8px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active && theme.blue1};
  color: ${({ active, theme }) => (active ? theme.white : theme.text1)};
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  flex-grow: 1;
  font-size: 12px;
  min-width: 20px;
  outline: none;
  box-sizing: border-box;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  cursor: inherit;
  color: ${({ theme }) => theme.text1};
  text-align: left;
  ${({ active }) =>
    active &&
    css`
      color: initial;
      cursor: initial;
      text-align: right;
    `}
  ${({ placeholder }) =>
    placeholder !== 'Custom' &&
    css`
      text-align: right;
      color: ${({ theme }) => theme.text1};
    `}
  ${({ color }) =>
    color === 'red' &&
    css`
      color: ${({ theme }) => theme.red1};
    `}
`

const BottomError = styled(Text)`
  font-size: 14px;
  font-weight: 400;
  ${({ show }) =>
    show &&
    css`
      padding-top: 12px;
    `}
`

const OptionCustom = styled(FancyButton)`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  ${({ active }) =>
    active &&
    css`
      border: 1px solid ${({ theme, warning }) => (warning ? theme.red1 : theme.blue1)};
      :hover {
        border: 1px solid ${({ theme, warning }) => (warning ? darken(0.1, theme.red1) : darken(0.1, theme.blue1))};
      }
    `}

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageSelector = styled.div`
  padding: 0 20px;
`

const Percent = styled.div`
  color: inherit;
  font-size: 0, 8rem;
  flex-grow: 0;
  ${({ color, theme }) =>
    (color === 'faded' &&
      css`
        color: ${theme.bg1};
      `) ||
    (color === 'red' &&
      css`
        color: ${theme.red1};
      `)};
`

export default function TransactionDetails({ setRawSlippage, rawSlippage, deadline, setDeadline }) {
  const [activeIndex, setActiveIndex] = useState(2)

  const [warningType, setWarningType] = useState(WARNING_TYPE.none)

  const inputRef = useRef()

  const [userInput, setUserInput] = useState('')
  const debouncedInput = useDebounce(userInput, 150)

  const [initialSlippage] = useState(rawSlippage)

  const [deadlineInput, setDeadlineInput] = useState(deadline / 60)

  function parseCustomDeadline(e) {
    let val = e.target.value
    const acceptableValues = [/^$/, /^\d+$/]
    if (acceptableValues.some(re => re.test(val))) {
      setDeadlineInput(val)
      setDeadline(val * 60)
    }
  }

  const setFromCustom = () => {
    setActiveIndex(4)
    inputRef.current.focus()
    // if there's a value, evaluate the bounds
    checkBounds(debouncedInput)
  }

  const updateSlippage = useCallback(
    newSlippage => {
      // round to 2 decimals to prevent ethers error
      let numParsed = parseInt(newSlippage * 100)

      // set both slippage values in parents
      setRawSlippage(numParsed)
    },
    [setRawSlippage]
  )

  // used for slippage presets
  const setFromFixed = useCallback(
    (index, slippage) => {
      // update slippage in parent, reset errors and input state
      updateSlippage(slippage)
      setWarningType(WARNING_TYPE.none)
      setActiveIndex(index)
    },
    [updateSlippage]
  )

  useEffect(() => {
    switch (Number.parseInt(initialSlippage)) {
      case 10:
        setFromFixed(1, 0.1)
        break
      case 50:
        setFromFixed(2, 0.5)
        break
      case 100:
        setFromFixed(3, 1)
        break
      default:
        // restrict to 2 decimal places
        let acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/]
        // if its within accepted decimal limit, update the input state
        if (acceptableValues.some(val => val.test(initialSlippage / 100))) {
          setUserInput(initialSlippage / 100)
          setActiveIndex(4)
        }
    }
  }, [initialSlippage, setFromFixed])

  const checkBounds = useCallback(
    slippageValue => {
      setWarningType(WARNING_TYPE.none)

      if (slippageValue === '' || slippageValue === '.') {
        return setWarningType(WARNING_TYPE.emptyInput)
      }

      // check bounds and set errors
      if (Number(slippageValue) < 0 || Number(slippageValue) > 50) {
        return setWarningType(WARNING_TYPE.invalidEntryBound)
      }
      if (Number(slippageValue) >= 0 && Number(slippageValue) < 0.1) {
        setWarningType(WARNING_TYPE.riskyEntryLow)
      }
      if (Number(slippageValue) > 5) {
        setWarningType(WARNING_TYPE.riskyEntryHigh)
      }
      //update the actual slippage value in parent
      updateSlippage(Number(slippageValue))
    },
    [updateSlippage]
  )

  // check that the theyve entered number and correct decimal
  const parseInput = e => {
    let input = e.target.value

    // restrict to 2 decimal places
    let acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/]
    // if its within accepted decimal limit, update the input state
    if (acceptableValues.some(a => a.test(input))) {
      setUserInput(input)
    }
  }

  useEffect(() => {
    if (activeIndex === 4) {
      checkBounds(debouncedInput)
    }
  })

  const dropDownContent = () => {
    return (
      <>
        <SlippageSelector>
          <RowBetween>
            <Option
              onClick={() => {
                setFromFixed(1, 0.1)
              }}
              active={activeIndex === 1}
            >
              0.1%
            </Option>
            <Option
              onClick={() => {
                setFromFixed(2, 0.5)
              }}
              active={activeIndex === 2}
            >
              0.5%
            </Option>
            <Option
              onClick={() => {
                setFromFixed(3, 1)
              }}
              active={activeIndex === 3}
            >
              1%
            </Option>
            <OptionCustom
              active={activeIndex === 4}
              warning={
                warningType !== WARNING_TYPE.none &&
                warningType !== WARNING_TYPE.emptyInput &&
                warningType !== WARNING_TYPE.riskyEntryLow
              }
              onClick={() => {
                setFromCustom()
              }}
            >
              <RowBetween>
                {!(warningType === WARNING_TYPE.none || warningType === WARNING_TYPE.emptyInput) && (
                  <span
                    role="img"
                    aria-label="warning"
                    style={{
                      color:
                        warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                          ? 'red'
                          : warningType === WARNING_TYPE.riskyEntryLow
                          ? '#F3841E'
                          : ''
                    }}
                  >
                    ⚠️
                  </span>
                )}
                <Input
                  tabIndex={-1}
                  ref={inputRef}
                  active={activeIndex === 4}
                  placeholder={
                    activeIndex === 4
                      ? !!userInput
                        ? ''
                        : '0'
                      : activeIndex !== 4 && userInput !== ''
                      ? userInput
                      : 'Custom'
                  }
                  value={activeIndex === 4 ? userInput : ''}
                  onChange={parseInput}
                  color={
                    warningType === WARNING_TYPE.emptyInput
                      ? ''
                      : warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                      ? 'red'
                      : ''
                  }
                />
                <Percent
                  color={
                    activeIndex !== 4
                      ? 'faded'
                      : warningType === WARNING_TYPE.riskyEntryHigh || warningType === WARNING_TYPE.invalidEntryBound
                      ? 'red'
                      : ''
                  }
                >
                  %
                </Percent>
              </RowBetween>
            </OptionCustom>
          </RowBetween>
          <RowBetween>
            <BottomError
              show={activeIndex === 4}
              color={
                warningType === WARNING_TYPE.emptyInput
                  ? '#565A69'
                  : warningType !== WARNING_TYPE.none && warningType !== WARNING_TYPE.riskyEntryLow
                  ? 'red'
                  : warningType === WARNING_TYPE.riskyEntryLow
                  ? '#F3841E'
                  : ''
              }
            >
              {warningType === WARNING_TYPE.emptyInput && 'Enter a slippage percentage'}
              {warningType === WARNING_TYPE.invalidEntryBound && 'Please select a value no greater than 50%'}
              {warningType === WARNING_TYPE.riskyEntryHigh && 'Your transaction may be frontrun'}
              {warningType === WARNING_TYPE.riskyEntryLow && 'Your transaction may fail'}
            </BottomError>
          </RowBetween>
        </SlippageSelector>
        <AutoColumn gap="sm">
          <RowFixed padding={'0 20px'}>
            <TYPE.body fontSize={14}>Deadline</TYPE.body>
            <QuestionHelper text="Deadline in minutes. If your transaction takes longer than this it will revert." />
          </RowFixed>
          <RowBetween padding={'0 20px'}>
            <OptionCustom style={{ width: '80px' }}>
              <Input tabIndex={-1} placeholder={deadlineInput} value={deadlineInput} onChange={parseCustomDeadline} />
            </OptionCustom>
          </RowBetween>
        </AutoColumn>
      </>
    )
  }

  return dropDownContent()
}
