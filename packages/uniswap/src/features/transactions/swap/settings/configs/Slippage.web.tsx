import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports -- type imports are safe
import type { LayoutChangeEvent } from 'react-native'
import { Flex, Input, Text } from 'ui/src'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/settings/useSlippageSettings'

const INPUT_MIN_WIDTH = 44

export const Slippage: SwapSettingConfig = {
  renderTitle: (t) => t('swap.slippage.settings.title'),
  Control() {
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
    } = useSlippageSettings()

    useEffect(() => {
      // It seems like tamagui is automatically causing the Input to autofocus on first render, so we're force blurring it when the component mounts.
      // Ideally, we could remove this if we can figure out how to prevent tamagui from triggering the autofocus.
      inputRef.current?.blur()
    }, [isLayoutReady])

    function onInputTextLayout(event: LayoutChangeEvent): void {
      setInputWidth(event.nativeEvent.layout.width)
      setIsLayoutReady(true)
    }

    const backgroundColor = isEditingSlippage ? '$surface2' : '$surface1'
    const inputValue = autoSlippageEnabled ? autoSlippageTolerance.toFixed(2).toString() : inputSlippageTolerance

    return (
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          backgroundColor={backgroundColor}
          borderColor={isEditingSlippage ? '$DEP_accentSoft' : '$surface3'}
          borderRadius="$rounded16"
          borderWidth={1}
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
                backgroundColor={backgroundColor}
                color={autoSlippageEnabled ? '$neutral2' : '$neutral1'}
                editable={true}
                fontFamily="$subHeading"
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
                onFocus={onFocusSlippageInput}
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
            <Text color="$neutral2" variant="subheading2">
              %
            </Text>
          </Flex>
        </Flex>
      </Flex>
    )
  },
}
