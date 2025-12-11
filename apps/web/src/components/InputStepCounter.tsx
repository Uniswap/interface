import { FeeAmount } from '@uniswap/v3-sdk'
import { OutlineCard } from 'components/Card/cards'
import { Input as NumericalInput } from 'components/NumericalInput'
import { deprecatedStyled } from 'lib/styled-components'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Trans } from 'react-i18next'
import { Button, Flex, styled, Text, useSporeColors } from 'ui/src'

const StyledInput = deprecatedStyled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: transparent;
  font-weight: 535;
  text-align: left;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 16px;
  `};
`

const InputTitle = styled(Text, {
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
  const colors = useSporeColors()

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState('')
  const [useLocalValue, setUseLocalValue] = useState(false)

  const handleOnFocus = () => {
    setUseLocalValue(true)
  }

  const handleOnBlur = useCallback(() => {
    setUseLocalValue(false)
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
      }, 0)
    }
  }, [localValue, useLocalValue, value])

  return (
    <OutlineCard onFocus={handleOnFocus} onBlur={handleOnBlur} width={width}>
      <Flex>
        <Flex width="100%" justifyContent="flex-start">
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
        </Flex>

        <Flex gap="$gap8">
          {!locked && (
            <Button
              size="xxsmall"
              emphasis="tertiary"
              data-testid="increment-price-range"
              onPress={handleIncrement}
              isDisabled={incrementDisabled}
            >
              <Flex centered>
                <Plus size={16} color={colors.neutral2.val} />
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
                <Minus size={16} color={colors.neutral2.val} />
              </Flex>
            </Button>
          )}
        </Flex>
      </Flex>
    </OutlineCard>
  )
}

export default StepCounter
