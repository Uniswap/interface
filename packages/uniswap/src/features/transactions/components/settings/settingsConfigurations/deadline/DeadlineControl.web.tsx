import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text } from 'ui/src'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'

const INPUT_MIN_WIDTH = 44

export function DeadlineControl(): JSX.Element {
  const { t } = useTranslation()
  const {
    isEditingDeadline,
    inputDeadline,
    currentDeadline,
    onChangeDeadlineInput,
    onFocusDeadlineInput,
    onBlurDeadlineInput,
  } = useDeadlineSettings()
  const inputRef = useRef<Input>(null)

  const backgroundColor = isEditingDeadline ? '$surface2' : '$surface1'

  useEffect(() => {
    if (isEditingDeadline) {
      inputRef.current?.focus()
    }
  }, [isEditingDeadline])

  return (
    <Flex
      row
      group
      alignItems="center"
      justifyContent="space-between"
      $platform-web={{
        containerType: 'normal',
      }}
    >
      <Flex
        row
        backgroundColor={backgroundColor}
        borderColor={isEditingDeadline ? '$DEP_accentSoft' : '$surface3'}
        borderRadius="$rounded16"
        $group-hover={{ borderColor: '$surface3Hovered', backgroundColor: '$surface1Hovered' }}
        borderWidth="$spacing1"
        gap="$spacing8"
        p="$spacing4"
        onPress={onFocusDeadlineInput}
      >
        <Flex row alignItems="center" pr="$spacing8" gap="$spacing4">
          <Input
            ref={inputRef}
            backgroundColor={backgroundColor}
            $group-hover={{ backgroundColor: '$surface1Hovered' }}
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
            value={inputDeadline}
            width={INPUT_MIN_WIDTH}
            onBlur={onBlurDeadlineInput}
            onChangeText={onChangeDeadlineInput}
            onFocus={onFocusDeadlineInput}
          />
          <Text color="$neutral2" variant="subheading2">
            {t('common.minutes.lowercase', { count: currentDeadline })}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
