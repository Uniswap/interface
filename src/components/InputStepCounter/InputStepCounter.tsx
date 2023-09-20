import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ButtonGray } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import styled, { keyframes } from 'styled-components'
import { ThemedText } from 'theme'

import { Input as NumericalInput } from '../NumericalInput'

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

const InputRow = styled.div`
  display: flex;
`

const SmallButton = styled(ButtonGray)`
  border-radius: 8px;
  padding: 4px;
`

const FocusedOutlineCard = styled(OutlineCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: ${({ active, theme }) => active && theme.deprecated_stateOverlayPressed};
  padding: 12px;
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.accent1)} 0.8s linear;
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: transparent;
  font-weight: 535;
  text-align: left;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 16px;
  `};
`

const InputColumn = styled(AutoColumn)`
  width: 100%;
`

const InputTitle = styled(ThemedText.DeprecatedSmall)`
  color: ${({ theme }) => theme.neutral2};
  font-size: 12px;
  font-weight: 535;
`

const ButtonLabel = styled(ThemedText.DeprecatedWhite)<{ disabled: boolean }>`
  color: ${({ theme, disabled }) => (disabled ? theme.neutral2 : theme.neutral1)} !important;
  display: flex;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  decrement: () => string
  increment: () => string
  decrementDisabled?: boolean
  incrementDisabled?: boolean
  feeAmount?: FeeAmount
  label?: string
  width?: string
  locked?: boolean // disable input
  title: ReactNode
  tokenA?: string
  tokenB?: string
}

const StepCounter = ({
  value,
  decrement,
  increment,
  decrementDisabled = false,
  incrementDisabled = false,
  width,
  locked,
  onUserInput,
  title,
  tokenA,
  tokenB,
}: StepCounterProps) => {
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

  // for button clicks
  const handleDecrement = useCallback(() => {
    setUseLocalValue(false)
    onUserInput(decrement())
  }, [decrement, onUserInput])

  const handleIncrement = useCallback(() => {
    setUseLocalValue(false)
    onUserInput(increment())
  }, [increment, onUserInput])

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
      <InputRow>
        <InputColumn justify="flex-start">
          <InputTitle fontSize={12} textAlign="center">
            {title}
          </InputTitle>
          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="20px"
            disabled={locked}
            onUserInput={(val) => {
              setLocalValue(val)
            }}
          />
          <InputTitle fontSize={12} textAlign="left">
            <Trans>
              {tokenB} per {tokenA}
            </Trans>
          </InputTitle>
        </InputColumn>

        <AutoColumn gap="8px">
          {!locked && (
            <SmallButton data-testid="increment-price-range" onClick={handleIncrement} disabled={incrementDisabled}>
              <ButtonLabel disabled={incrementDisabled} fontSize="12px">
                <Plus size={18} />
              </ButtonLabel>
            </SmallButton>
          )}
          {!locked && (
            <SmallButton data-testid="decrement-price-range" onClick={handleDecrement} disabled={decrementDisabled}>
              <ButtonLabel disabled={decrementDisabled} fontSize="12px">
                <Minus size={18} />
              </ButtonLabel>
            </SmallButton>
          )}
        </AutoColumn>
      </InputRow>
    </FocusedOutlineCard>
  )
}

export default StepCounter
