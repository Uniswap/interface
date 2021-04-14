import React, { useState, useCallback, useEffect } from 'react'
import { OutlineCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { Input as NumericalInput } from '../NumericalInput'
import styled, { keyframes, css } from 'styled-components'
import { TYPE } from 'theme'
import { AutoColumn } from 'components/Column'

const pulse = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color};
  }

  70% {
    box-shadow: 0 0 0 2px ${color};
  }

  100% {
    box-shadow: 0 0 0 0 ${color};
  }
`

const FocusedOutlineCard = styled(OutlineCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: ${({ active, theme }) => active && theme.blue1};
  padding: 12px;

  ${({ pulsing, theme }) =>
    pulsing &&
    css`
      animation: ${pulse(theme.blue1)} 0.8s linear;
    `}
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  margin-right: 2px;
`

const ContentWrapper = styled(RowBetween)`
  width: 92%;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  label?: string
  width?: string
}

const StepCounter = ({ value, onUserInput, label, width }: StepCounterProps) => {
  //  for focus state, styled components doesnt let you select input parent container
  const [active, setActive] = useState(false)

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState('')
  const [useLocalValue, setUseLocalValue] = useState(false)

  // animation if parent value updates local value
  const [pulsing, setPulsing] = useState<boolean>(false)

  const handleOnFocus = () => {
    setUseLocalValue(true)
    setActive(true)
  }

  const handleOnBlur = useCallback(() => {
    setUseLocalValue(false)
    setActive(false)
    onUserInput(localValue) // trigger update on parent value
  }, [localValue, onUserInput])

  useEffect(() => {
    if (localValue !== value && !useLocalValue) {
      setTimeout(() => {
        setLocalValue(value) // reset local value to match parent
        setPulsing(true) // trigger animation
        setTimeout(function () {
          setPulsing(false)
        }, 1800)
      }, 0)
    }
  }, [localValue, useLocalValue, value])

  return (
    <FocusedOutlineCard pulsing={pulsing} active={active} onFocus={handleOnFocus} onBlur={handleOnBlur} width={width}>
      <AutoColumn gap="md">
        <ContentWrapper>
          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="18px"
            onUserInput={(val) => {
              setLocalValue(val)
            }}
          />
        </ContentWrapper>
        {label && <TYPE.label fontSize="12px">{label}</TYPE.label>}
      </AutoColumn>
    </FocusedOutlineCard>
  )
}

export default StepCounter
