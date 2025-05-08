import { FeeAmount } from '@uniswap/v3-sdk'
import { OutlineCard } from 'components/Card/cards'
import { Input as NumericalInput } from 'components/NumericalInput'
import { AutoColumn } from 'components/deprecated/Column'
import styled, { keyframes } from 'lib/styled-components'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Trans } from 'react-i18next'
import { Button, Flex, Text, styled as tamaguiStyled } from 'ui/src'

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

const InputTitle = tamaguiStyled(Text, {
  fontSize: 12,
  fontWeight: '$medium',
  color: '$neutral2',
})

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
            <Trans i18nKey="common.feesEarnedPerBase" values={{ symbolA: tokenB, symbolB: tokenA }} />
          </InputTitle>
        </InputColumn>

        <AutoColumn gap="8px">
          {!locked && (
            <Button
              size="xxsmall"
              emphasis="tertiary"
              data-testid="increment-price-range"
              onPress={handleIncrement}
              isDisabled={incrementDisabled}
            >
              <Flex centered>
                <Plus size={16} />
              </Flex>
            </Button>
          )}
          {!locked && (
            <Button
              size="xxsmall"
              emphasis="tertiary"
              data-testid="decrement-price-range"
              onPress={handleDecrement}
              isDisabled={decrementDisabled}
            >
              <Flex centered>
                <Minus size={16} />
              </Flex>
            </Button>
          )}
        </AutoColumn>
      </InputRow>
    </FocusedOutlineCard>
  )
}

export default StepCounter
