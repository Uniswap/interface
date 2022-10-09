import useThemedContext from 'hooks/useThemedContext'
import { darken } from 'polished'
import { useRef, useState } from 'react'
import styled from 'styled-components'

import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  InvalidInput = 'InvalidInput',
  RiskyLow = 'RiskyLow',
  RiskyHigh = 'RiskyHigh'
}

enum DeadlineError {
  InvalidInput = 'InvalidInput'
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 1.3rem;
  /* border-radius: 36px; */
  border-radius: 8px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    // border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    // border: 1px solid ${({ theme }) => theme.primary1};
  }
`

const Option = styled(FancyButton).attrs((props) => ({
  ...props,
  className: Array.isArray(props.className)
    ? [...props.className, 'text-small']
    : props.className
    ? [props.className, 'text-small']
    : ['text-small']
}))<{ active: boolean }>`
  margin-right: 0.4rem;
  background-color: rgba(255, 255, 255, 0.1);
  font-weight: ${({ active }) => (!active ? 400 : 600)};
  :hover {
    color: #39e1ba;
    cursor: pointer;
  }
  :focus {
    background-color: ${({ theme }) => theme.primary1};
    color: ${({ theme }) => theme.common1};
    font-weight: 600;
  }
  background-color: ${({ active, theme }) => (!active ? `rgba(255, 255, 255, 0.1)` : theme.primary1)};
  color: ${({ active, theme }) => (active ? theme.common1 : `rgba(255, 255, 255, 1)`)};
  border-radius: 0.5rem;

  // ${({ theme }) => theme.mediaWidth.upToSmall`
  //   font-size: .6rem;
  // `}
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   font-size: .5rem;
  `}
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 1.3rem;
  position: relative;
  padding: 0 0.75rem;
  input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  flex: 1;
  border: ${({ theme, active, warning }) => active && `1px solid ${warning ? theme.red1 : theme.primary1}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary1)}`};
  }
  display: flex;
  input {
    width: 100%;
    height: 90%;
    border: 0px;
    border-radius: 2rem;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 0.3rem;
  `}
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
  const theme = useThemedContext()

  const inputRef = useRef<HTMLInputElement>()

  const [slippageInput, setSlippageInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

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

  return (
    <AutoColumn gap="1.2rem">
      <AutoColumn gap="sm">
        <RowFixed>
          <TYPE.black fontWeight={500} className="text" color={theme.common2}>
            Slippage tolerance
          </TYPE.black>
          <QuestionHelper text="Your transaction will revert if the price changes unfavorably by more than this percentage." />
        </RowFixed>
        <RowBetween
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            fontWeight: '500',
            padding: '0.5rem!important',
            borderRadius: '0.8rem',
            fontSize: '.4rem'
          }}
        >
          <OptionCustom
            style={{ background: 'unset', border: 'unset', paddingLeft: 0 }}
            active={![10, 50, 100].includes(rawSlippage)}
            warning={!slippageInputIsValid}
            tabIndex={-1}
          >
            <RowBetween sx={{ height: '100%' }} className="text-small">
              {/*  {!!slippageInput &&
              (slippageError === SlippageError.RiskyLow || slippageError === SlippageError.RiskyHigh) ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null} */}
              {/* https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451 */}
              <Input
                style={{ background: 'unset', textAlign: 'left' }}
                ref={inputRef as any}
                placeholder={(rawSlippage / 100).toFixed(2)}
                value={slippageInput}
                onBlur={() => {
                  parseCustomSlippage((rawSlippage / 100).toFixed(2))
                }}
                onChange={(e) => parseCustomSlippage(e.target.value)}
                // color={!slippageInputIsValid ? 'red' : ''}
              />
              %
            </RowBetween>
          </OptionCustom>
          <Option
            style={{ border: 'unset' }}
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(10)
            }}
            active={rawSlippage === 10}
          >
            0.1&nbsp;%
          </Option>
          <Option
            style={{ border: 'unset' }}
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(50)
            }}
            active={rawSlippage === 50}
          >
            0.5&nbsp;%
          </Option>
          <Option
            style={{ border: 'unset' }}
            onClick={() => {
              setSlippageInput('')
              setRawSlippage(100)
            }}
            active={rawSlippage === 100}
          >
            1&nbsp;%
          </Option>
        </RowBetween>
        {!!slippageError && (
          <RowBetween
            className="text-detail"
            style={{
              color: slippageError === SlippageError.InvalidInput ? 'red' : '#F3841E'
            }}
          >
            {slippageError === SlippageError.InvalidInput
              ? 'Enter a valid slippage percentage'
              : slippageError === SlippageError.RiskyLow
              ? 'Your transaction may fail'
              : 'Your transaction may be frontrun'}
          </RowBetween>
        )}
      </AutoColumn>

      <AutoColumn gap="sm">
        <RowFixed>
          <TYPE.black className="text" fontWeight={400} color={theme.common2}>
            Transaction deadline
          </TYPE.black>
          <QuestionHelper text="Your transaction will revert if it is pending for more than this long." />
        </RowFixed>
        <RowFixed
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            border: `1px solid rgba(255, 255, 255, 0.2)`,
            fontWeight: '500',
            padding: '0.5rem!important',
            borderRadius: '0.8rem',
            fontSize: '.4rem'
          }}
        >
          <OptionCustom
            style={{ background: 'unset', width: '4.3rem', border: 'unset', paddingLeft: 0 }}
            // style={{ width: '4.3rem' }}
            tabIndex={-1}
          >
            <Input
              className="text-small"
              style={{ background: 'unset', textAlign: 'left' }}
              color={!!deadlineError ? 'red' : undefined}
              onBlur={() => {
                parseCustomDeadline((deadline / 60).toString())
              }}
              placeholder={(deadline / 60).toString()}
              value={deadlineInput}
              onChange={(e) => parseCustomDeadline(e.target.value)}
            />
          </OptionCustom>
          <TYPE.body style={{ paddingLeft: '8px' }} className="text-detail" color={theme.common3}>
            min
          </TYPE.body>
        </RowFixed>
      </AutoColumn>
    </AutoColumn>
  )
}
