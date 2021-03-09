import React, { useState, useCallback, useEffect } from 'react'
import { OutlineCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { ButtonGray } from 'components/Button'
import { TYPE } from 'theme'
import { Input as NumericalInput } from '../NumericalInput'
import styled, { keyframes, css } from 'styled-components'

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
  padding: 8px 12px;

  ${({ pulsing, theme }) =>
    pulsing &&
    css`
      animation: ${pulse(theme.blue1)} 0.8s linear;
    `}
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: ${({ theme }) => theme.bg0};
  text-align: ${({ usePercent }) => (usePercent ? 'right' : 'center')};
  margin-right: 2px;
`

const ContentWrapper = styled(RowBetween)`
  padding: 0 8px;
  width: 70%;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  onIncrement?: () => void
  onDecrement?: () => void
  usePercent?: boolean
  prependSymbol?: string | undefined
}

const StepCounter = ({ value, onUserInput, usePercent = false, prependSymbol }: StepCounterProps) => {
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

  const handleDeccrement = useCallback(() => {
    localValue && setLocalValue((parseFloat(localValue) * 0.997).toString())
  }, [localValue])

  const handleIncrement = useCallback(() => {
    localValue && setLocalValue((parseFloat(localValue) * 1.003).toString())
  }, [localValue])

  return (
    <FocusedOutlineCard pulsing={pulsing} active={active} onFocus={handleOnFocus} onBlur={handleOnBlur}>
      <RowBetween>
        <ButtonGray padding="2px 0px" borderRadius="8px" onClick={handleDeccrement} width="50px">
          <TYPE.label>-</TYPE.label>
        </ButtonGray>
        <ContentWrapper>
          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="18px"
            onUserInput={(val) => {
              setLocalValue(val)
            }}
            prependSymbol={prependSymbol}
            usePercent={usePercent}
          />
          {usePercent && <TYPE.main>%</TYPE.main>}
        </ContentWrapper>
        <ButtonGray padding="2px 0px" borderRadius="8px" onClick={handleIncrement} width="50px">
          <TYPE.label>+</TYPE.label>
        </ButtonGray>
      </RowBetween>
    </FocusedOutlineCard>
  )
}

export default StepCounter
