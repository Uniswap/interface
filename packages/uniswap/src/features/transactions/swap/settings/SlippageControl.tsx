import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent } from 'react-native'
import { Flex, Input, Text } from 'ui/src'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'
import { getSlippageWarningColor } from 'uniswap/src/features/transactions/swap/utils/styleHelpers'

interface SlippageControlProps {
  saveOnBlur: boolean
}

const INPUT_MIN_WIDTH = 44

export function SlippageControl({ saveOnBlur }: SlippageControlProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<Input>(null)
  const [inputWidth, setInputWidth] = useState(0)
  const [isLayoutReady, setIsLayoutReady] = useState(false)

  // TODO (WEB-6896): determine how to use tradeAutoSlippage update here
  // See:https://github.com/Uniswap/universe/pull/16428

  const {
    isEditingSlippage,
    autoSlippageEnabled,
    inputSlippageTolerance,
    autoSlippageTolerance,
    inputAnimatedStyle,
    onPressAutoSlippage,
    onChangeSlippageInput,
    onFocusSlippageInput,
    onBlurSlippageInput,
  } = useSlippageSettings({ saveOnBlur })

  useEffect(() => {
    inputRef.current?.blur()
  }, [isLayoutReady])

  function onInputTextLayout(event: LayoutChangeEvent): void {
    setInputWidth(event.nativeEvent.layout.width)
    setIsLayoutReady(true)
  }

  const backgroundColor = isEditingSlippage ? '$surface2' : '$surface1'
  const inputValue = autoSlippageEnabled ? autoSlippageTolerance.toFixed(2).toString() : inputSlippageTolerance
  const parsedInputValue = parseFloat(inputValue)

  const inputValueTextColor = useMemo(
    () =>
      getSlippageWarningColor(parsedInputValue, autoSlippageTolerance, autoSlippageEnabled ? '$neutral2' : '$neutral1'),
    [parsedInputValue, autoSlippageEnabled, autoSlippageTolerance],
  )

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex
        row
        backgroundColor={backgroundColor}
        borderColor={isEditingSlippage ? '$DEP_accentSoft' : '$surface3'}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        gap="$spacing8"
        p="$spacing4"
        pr="$spacing8"
        style={inputAnimatedStyle}
      >
        <Flex
          centered
          backgroundColor={autoSlippageEnabled ? '$accent2' : '$surface3'}
          borderRadius="$roundedFull"
          px="$spacing8"
          onPress={onPressAutoSlippage}
        >
          <Text color={autoSlippageEnabled ? '$accent1' : '$neutral2'} variant="buttonLabel3">
            {t('swap.settings.slippage.control.auto')}
          </Text>
        </Flex>
        <Flex row alignItems="center" paddingEnd="$spacing12" paddingStart="$spacing4">
          <Flex style={{ position: 'relative' }}>
            <Input
              ref={inputRef}
              keyboardType="decimal-pad"
              backgroundColor={backgroundColor}
              color={inputValueTextColor}
              editable={true}
              fontFamily="$subHeading"
              fontWeight="normal"
              fontSize="$small"
              height="100%"
              outlineColor="$transparent"
              p="$none"
              paddingEnd="$spacing4"
              textAlign="right"
              value={inputValue}
              width={inputWidth}
              onBlur={onBlurSlippageInput}
              onChangeText={onChangeSlippageInput}
              onPressIn={onFocusSlippageInput}
            />
            <Text
              minWidth={INPUT_MIN_WIDTH}
              opacity={0}
              px="$spacing4"
              style={{ position: 'absolute' }}
              variant="subheading2"
              zIndex={-1}
              onLayout={onInputTextLayout}
            >
              {inputValue}
            </Text>
          </Flex>
          <Text color={inputValueTextColor} variant="subheading2">
            %
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
