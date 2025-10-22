import { getBaseAndQuoteCurrencies } from 'components/Liquidity/utils/currency'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { numericInputRegex } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export enum RangeSelectionInput {
  MIN = 0,
  MAX = 1,
}

function numericInputEnforcerWithInfinity(value?: string): boolean {
  return !value || numericInputRegex.test(value) || value === '∞'
}

export function RangeAmountInput({
  value,
  input,
  decrement,
  increment,
  isIncrementDisabled,
  isDecrementDisabled,
  showIncrementButtons = true,
  isInvalid = false,
}: {
  value: string
  input: RangeSelectionInput
  decrement: () => string
  increment: () => string
  isIncrementDisabled?: boolean
  isDecrementDisabled?: boolean
  showIncrementButtons?: boolean
  isInvalid?: boolean
}) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const {
    currencies,
    creatingPoolOrPair,
    priceRangeState: { priceInverted },
    setPriceRangeState,
  } = useCreateLiquidityContext()

  const [typedValue, setTypedValue] = useState('')
  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceInverted)
  const [displayUserTypedValue, setDisplayUserTypedValue] = useState(false)

  const handlePriceRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value, fullRange: false }))
      }

      setTypedValue(value)
      setDisplayUserTypedValue(true)
    },
    [setPriceRangeState],
  )

  const handleDecrement = useCallback(() => {
    handlePriceRangeInput(input, decrement())
    setDisplayUserTypedValue(false)
  }, [decrement, handlePriceRangeInput, input])

  const handleIncrement = useCallback(() => {
    handlePriceRangeInput(input, increment())
    setDisplayUserTypedValue(false)
  }, [handlePriceRangeInput, increment, input])

  return (
    <Flex
      row
      flex={1}
      position="relative"
      backgroundColor="$surface2"
      borderTopLeftRadius={creatingPoolOrPair && input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
      borderTopRightRadius={creatingPoolOrPair && input === RangeSelectionInput.MAX ? '$rounded20' : '$none'}
      borderBottomRightRadius={input === RangeSelectionInput.MIN ? '$none' : '$rounded20'}
      borderBottomLeftRadius={input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
      $lg={{
        borderBottomRightRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
        borderBottomLeftRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
      }}
      p="$spacing16"
      justifyContent="space-between"
      overflow="hidden"
    >
      <Flex gap="$gap4" overflow="hidden" flex={1}>
        <Flex row gap="$gap4">
          <Text variant="body3" color="$neutral2">
            {input === RangeSelectionInput.MIN ? t(`pool.minPrice`) : t(`pool.maxPrice`)}
          </Text>
        </Flex>
        <AmountInput
          backgroundColor="$transparent"
          borderWidth="$none"
          borderRadius="$none"
          color={isInvalid ? '$statusCritical' : '$neutral1'}
          fontFamily="$heading"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          maxDecimals={quoteCurrency?.decimals ?? 18}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={displayUserTypedValue ? typedValue : value}
          onChangeText={(text) => handlePriceRangeInput(input, text)}
          onBlur={() => setDisplayUserTypedValue(false)}
          inputEnforcer={numericInputEnforcerWithInfinity}
          $md={{
            fontSize: fonts.subheading2.fontSize,
            fontWeight: fonts.subheading2.fontWeight,
          }}
          testID={`${TestID.RangeInput}-${input}`}
        />
        <Text variant="body3" color="$neutral2">
          {`${quoteCurrency?.symbol} = 1 ${baseCurrency?.symbol}`}
        </Text>
      </Flex>
      {showIncrementButtons && (
        <Flex gap={10}>
          <TouchableArea
            disabled={isIncrementDisabled}
            testID={`${TestID.RangeInputIncrement}-${input}`}
            alignItems="center"
            justifyContent="center"
            onPress={handleIncrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Plus size="$icon.16" color="$neutral2" />
          </TouchableArea>
          <TouchableArea
            disabled={isDecrementDisabled}
            testID={`${TestID.RangeInputDecrement}-${input}`}
            alignItems="center"
            justifyContent="center"
            onPress={handleDecrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Minus size="$icon.16" color="$neutral2" />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}
