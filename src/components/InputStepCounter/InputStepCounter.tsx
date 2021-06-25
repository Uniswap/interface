import { useState, useCallback, useEffect, ReactNode } from 'react'
import { LightCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { Input as NumericalInput } from '../NumericalInput'
import styled, { keyframes } from 'styled-components'
import { TYPE } from 'theme'
import { AutoColumn } from 'components/Column'
import { ButtonPrimary } from 'components/Button'
import { FeeAmount } from '@uniswap/v3-sdk'
import { formattedFeeAmount } from 'utils'
import { Trans } from '@lingui/macro'

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

const SmallButton = styled(ButtonPrimary)`
  /* background-color: ${({ theme }) => theme.bg2}; */
  border-radius: 8px;
  padding: 4px 6px;
  width: 48%;
`

const FocusedOutlineCard = styled(LightCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: ${({ active, theme }) => active && theme.blue1};
  padding: 12px;
  animation: ${({ pulsing, theme }) => pulsing && pulse(theme.blue1)} 0.8s linear;
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  /* background-color: ${({ theme }) => theme.bg0}; */
  text-align: center;
  margin-right: 12px;
  width: 100%;
  font-weight: 500;
`

const InputTitle = styled(TYPE.small)`
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  font-weight: 500;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  decrement: () => string
  increment: () => string
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
  feeAmount,
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

  // format fee amount
  const feeAmountFormatted = feeAmount ? formattedFeeAmount(feeAmount * 2) : ''

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
      <AutoColumn gap="6px" style={{ marginBottom: '12px' }}>
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
        <InputTitle fontSize={12} textAlign="center">
          <Trans>
            {tokenB} per {tokenA}
          </Trans>
        </InputTitle>
      </AutoColumn>
      {!locked ? (
        <RowBetween>
          <SmallButton onClick={handleDecrement}>
            <TYPE.white fontSize="12px">
              <Trans>-{feeAmountFormatted}%</Trans>
            </TYPE.white>
          </SmallButton>
          <SmallButton onClick={handleIncrement}>
            <TYPE.white fontSize="12px">
              <Trans>+{feeAmountFormatted}%</Trans>
            </TYPE.white>
          </SmallButton>
        </RowBetween>
      ) : null}
    </FocusedOutlineCard>
  )
}

export default StepCounter
