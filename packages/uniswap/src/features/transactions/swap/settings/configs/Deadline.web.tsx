import { useEffect, useRef, useState } from 'react'
import { Flex, Input, Text } from 'ui/src'
import { SwapSettingConfig, SwapSettingId } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/swap/settings/useDeadlineSettings'

/**
 * Note: This setting has its title overridden in the Web Swap flow
 * See {@link file:apps/web/src/pages/Swap/settings/DeadlineOverride.tsx}
 * If further overrides are needed, consider moving to a factory function
 */

const INPUT_MIN_WIDTH = 44

export const Deadline: SwapSettingConfig = {
  settingId: SwapSettingId.DEADLINE,
  renderTitle: (t) => t('swap.deadline.settings.title.short'),
  renderTooltip: (t) => t('swap.settings.deadline.tooltip'),
  Control() {
    const [inputWidth] = useState(INPUT_MIN_WIDTH)
    const { isEditingDeadline, inputDeadline, onChangeDeadlineInput, onFocusDeadlineInput, onBlurDeadlineInput } =
      useDeadlineSettings()
    const inputRef = useRef<Input>(null)

    const backgroundColor = isEditingDeadline ? '$surface2' : '$surface1'
    const inputValue = inputDeadline

    useEffect(() => {
      if (isEditingDeadline) {
        inputRef.current?.focus()
      }
    }, [isEditingDeadline])

    return (
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          backgroundColor={backgroundColor}
          borderColor={isEditingDeadline ? '$DEP_accentSoft' : '$surface3'}
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          gap="$spacing8"
          p="$spacing4"
          onPress={onFocusDeadlineInput}
        >
          <Flex row pr="$spacing8" gap="$spacing4">
            <Flex style={{ position: 'relative' }}>
              <Input
                ref={inputRef}
                backgroundColor={backgroundColor}
                color="$neutral1"
                editable={true}
                fontFamily="$subHeading"
                fontWeight="normal"
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
