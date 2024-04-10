import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { Flex, Input, Text } from 'ui/src'
import { SlippageSettingsRowProps } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsRowProps'
import { useSlippageSettings } from 'wallet/src/features/transactions/swap/modals/settings/useSlippageSettings'

const INPUT_MIN_WIDTH = 44

export function SlippageSettingsRow({
  derivedSwapInfo,
  onSlippageChange,
}: SlippageSettingsRowProps): JSX.Element {
  const { t } = useTranslation()

  const [inputWidth, setInputWidth] = useState(0)
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
  } = useSlippageSettings({ derivedSwapInfo, onSlippageChange })

  function onInputTextLayout(event: LayoutChangeEvent): void {
    setInputWidth(event.nativeEvent.layout.width)
  }

  const backgroundColor = isEditingSlippage ? '$surface2' : '$surface1'
  const inputValue = autoSlippageEnabled
    ? autoSlippageTolerance.toFixed(2).toString()
    : inputSlippageTolerance

  return (
    <Flex gap="$spacing4">
      <Flex row alignItems="center" justifyContent="space-between">
        <Text color="$neutral1" variant="subheading2">
          {t('swap.settings.slippage.control.title')}
        </Text>
        <Flex
          row
          backgroundColor={backgroundColor}
          borderColor={isEditingSlippage ? '$accentSoft' : '$surface3'}
          borderRadius="$rounded16"
          borderWidth={1}
          gap="$spacing8"
          p="$spacing4"
          style={inputAnimatedStyle}>
          <Flex
            centered
            backgroundColor="$accent2"
            borderRadius="$roundedFull"
            px="$spacing8"
            onPress={onPressAutoSlippage}>
            <Text color="$accent1" variant="buttonLabel4">
              {t('swap.settings.slippage.control.auto')}
            </Text>
          </Flex>
          <Flex row paddingEnd="$spacing12" paddingStart="$spacing4">
            <Flex style={{ position: 'relative' }}>
              <Input
                backgroundColor={backgroundColor}
                color={autoSlippageEnabled ? '$neutral2' : '$neutral1'}
                editable={true}
                fontFamily="$subHeading"
                fontSize="$small"
                height="100%"
                outlineColor="$transparent"
                p="$none"
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
                onLayout={onInputTextLayout}>
                {inputValue}
              </Text>
            </Flex>
            <Text color="$neutral2" variant="subheading2">
              %
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
