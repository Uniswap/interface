import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import styled, { keyframes } from 'styled-components'

import { ButtonGray } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { Input as NumericalInput } from 'components/NumericalInput'
import useTheme from 'hooks/useTheme'
import { TYPE } from 'theme'

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
  display: grid;
  grid-template-columns: 30px 1fr 30px;
`

const SmallButton = styled(ButtonGray)`
  background: ${({ theme }) => theme.subText + '33'};
  border-radius: 999px;
  padding: 4px;
  width: 24px;
  height: 24px;
`

const FocusedOutlineCard = styled(OutlineCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: #00000000;
  padding: 12px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.blue1)} 0.8s linear;
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: transparent;
  text-align: center;
  width: 100%;
  font-weight: 500;
  padding: 0 10px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
  `};
`

const InputTitle = styled(TYPE.small)`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
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
  tokenA: string | undefined
  tokenB: string | undefined
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

  const theme = useTheme()

  return (
    <FocusedOutlineCard pulsing={pulsing} active={active} onFocus={handleOnFocus} onBlur={handleOnBlur} width={width}>
      <AutoColumn gap="6px">
        <InputTitle fontSize={12} textAlign="center" style={{ textTransform: 'uppercase' }}>
          {title}
        </InputTitle>

        <InputRow>
          {!locked && (
            <SmallButton onClick={handleDecrement} disabled={decrementDisabled}>
              <Minus size={18} color={decrementDisabled ? theme.subText : theme.text} />
            </SmallButton>
          )}

          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="20px"
            disabled={locked}
            onUserInput={val => {
              setLocalValue(val)
            }}
          />

          {!locked && (
            <SmallButton onClick={handleIncrement} disabled={incrementDisabled}>
              <Plus size={18} color={incrementDisabled ? theme.subText : theme.text} />
            </SmallButton>
          )}
        </InputRow>

        <InputTitle fontSize={12} textAlign="center">
          <Trans>
            {tokenB} per {tokenA}
          </Trans>
        </InputTitle>
      </AutoColumn>
    </FocusedOutlineCard>
  )
}

export default StepCounter
