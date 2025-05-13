import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent } from 'react-native'
import { Flex, Input, Text } from 'ui/src'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/hooks/useSlippageSettings'
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
    showSlippageWarning,
    showSlippageCritical,
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

  const borderColor = useMemo(() => {
    if (isEditingSlippage) {
      if (showSlippageCritical) {
        return '$statusCritical'
      }
      if (showSlippageWarning) {
        return '$statusWarning'
      }
      return '$accent1'
    }
    if (showSlippageCritical) {
      return '$statusCritical'
    }
    if (showSlippageWarning) {
      return '$statusWarning'
    }
    return '$surface3'
  }, [showSlippageWarning, isEditingSlippage, showSlippageCritical])

  const hoverBorderColor = useMemo(() => {
    if (showSlippageCritical) {
      return '$statusCriticalHovered'
    }
    if (showSlippageWarning) {
      return '$statusWarningHovered'
    }
    return '$surface3Hovered'
  }, [showSlippageCritical, showSlippageWarning])

  return (
    <Flex
      row
      group
      alignItems="center"
      justifyContent="space-between"
      style={{
        containerType: 'normal',
      }}
    >
      <Flex
        row
        backgroundColor={backgroundColor}
        borderColor={borderColor}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        gap="$spacing8"
        p="$spacing4"
        pr="$spacing8"
        style={inputAnimatedStyle}
        $group-hover={{
          borderColor: hoverBorderColor,
          backgroundColor: '$surface1Hovered',
        }}
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
              $group-hover={{ backgroundColor: '$surface1Hovered' }}
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
