import { useState } from 'react'
// eslint-disable-next-line no-restricted-imports -- type imports are safe
import type { LayoutChangeEvent } from 'react-native'
import { Flex, Input, Text } from 'ui/src'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'

const INPUT_MIN_WIDTH = 32

export const Deadline: SwapSettingConfig = {
  renderTitle: (t) => t('swap.deadline.settings.title'),
  Control() {
    const [inputWidth, setInputWidth] = useState(0)
    const { isEditingDeadline, inputDeadline, onChangeDeadlineInput, onFocusDeadlineInput, onBlurDeadlineInput } =
      useDeadlineSettings()

    function onInputTextLayout(event: LayoutChangeEvent): void {
      setInputWidth(event.nativeEvent.layout.width)
    }

    const backgroundColor = isEditingDeadline ? '$surface2' : '$surface1'
    const inputValue = inputDeadline

    return (
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          backgroundColor={backgroundColor}
          borderColor={isEditingDeadline ? '$DEP_accentSoft' : '$surface3'}
          borderRadius="$rounded16"
          borderWidth={1}
          gap="$spacing8"
          p="$spacing4"
        >
          <Flex row pr="$spacing8" gap="$spacing4">
            <Flex style={{ position: 'relative' }}>
              <Input
                backgroundColor={backgroundColor}
                color="$neutral1"
                editable={true}
                fontFamily="$subHeading"
                fontSize="$small"
                height="100%"
                keyboardType="numeric"
                outlineColor="$transparent"
                p="$none"
                textAlign="right"
                value={inputValue}
                width={inputWidth}
                onBlur={onBlurDeadlineInput}
                onChangeText={onChangeDeadlineInput}
                onFocus={onFocusDeadlineInput}
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
              minutes
            </Text>
          </Flex>
        </Flex>
      </Flex>
    )
  },
}
