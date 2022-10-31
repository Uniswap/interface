import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import PasteButton from 'src/components/buttons/PasteButton'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { SectionName } from '../telemetry/constants'
import { Trace } from '../telemetry/Trace'

const INPUT_VALUES = {
  height: 120,
}
interface Props {
  value: string | undefined
  errorMessage: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string | undefined
  onSubmit?: () => void
  showSuccess?: boolean // show succes indicator
  endAdornment?: string //text to auto to end of input string
  liveCheck?: boolean
  autoCorrect?: boolean
  onBlur?: () => void
  onFocus?: () => void
  beforePasteButtonPress?: () => void
  afterPasteButtonPress?: () => void
  blurOnSubmit?: boolean
}

export function GenericImportForm({
  value,
  onChange,
  errorMessage,
  placeholderLabel,
  onSubmit,
  showSuccess,
  endAdornment,
  liveCheck,
  autoCorrect,
  onBlur,
  onFocus,
  beforePasteButtonPress,
  afterPasteButtonPress,
  blurOnSubmit,
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()

  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }

  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
  }

  const handleSubmit = () => {
    onSubmit && onSubmit()
  }

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex gap="md">
        <Flex
          centered
          backgroundColor="background1"
          borderColor={
            showSuccess
              ? 'accentSuccess'
              : errorMessage && (liveCheck || !focused) && value
              ? 'accentCritical'
              : 'background2'
          }
          borderRadius="xl"
          borderWidth={1}
          flexShrink={1}
          gap="none"
          minHeight={INPUT_VALUES.height}
          p="sm"
          width="100%">
          <Flex row alignItems="flex-end" gap="none">
            <TextInput
              autoFocus
              autoCapitalize="none"
              autoCorrect={Boolean(autoCorrect)}
              backgroundColor="background1"
              blurOnSubmit={blurOnSubmit ?? false}
              fontSize={18}
              justifyContent="center"
              multiline={true}
              numberOfLines={5}
              px="none"
              py="none"
              returnKeyType="done"
              scrollEnabled={false}
              selectionColor={theme.colors.textPrimary}
              spellCheck={false}
              testID="import_account_form/input"
              textAlign={value ? 'center' : 'left'}
              value={value}
              width={value ? 'auto' : (layout?.width || 0) + theme.spacing.xs}
              onBlur={handleBlur}
              onChangeText={onChange}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmit}
            />
            {endAdornment && value && !value.includes(endAdornment) && (
              <Text color="textSecondary" fontSize={18} lineHeight={18} variant="bodyLarge">
                {endAdornment}
              </Text>
            )}
          </Flex>
          {!value && (
            <Flex
              centered
              row
              gap="xs"
              position="absolute"
              onLayout={(event: any) => setLayout(event.nativeEvent.layout)}>
              <Text color="textSecondary" variant="bodyLarge">
                {t('Type or')}
              </Text>
              <PasteButton
                afterClipboardReceived={afterPasteButtonPress}
                beforePress={beforePasteButtonPress}
                onPress={onChange}
              />
              {placeholderLabel && (
                <Text color="textSecondary" variant="bodyLarge">
                  {placeholderLabel}
                </Text>
              )}
            </Flex>
          )}
        </Flex>
        <Flex>
          {errorMessage && value && (liveCheck || !focused) && (
            <Flex centered row gap="sm">
              <AlertTriangle color={theme.colors.accentCritical} />
              <Text color="accentCritical" variant="bodyLarge">
                {errorMessage}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
