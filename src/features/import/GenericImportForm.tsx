import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import PasteButton from 'src/components/buttons/PasteButton'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { SectionName } from '../telemetry/constants'
import { Trace } from '../telemetry/Trace'

interface Props {
  value: string | undefined
  error: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string | undefined
  onSubmit?: () => void
  showSuccess?: boolean // show succes indicator
  endAdornment?: string //text to auto to end of input string
}

export function GenericImportForm({
  value,
  onChange,
  error,
  placeholderLabel,
  onSubmit,
  showSuccess,
  endAdornment,
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [focused, setFocused] = useState(false)

  const handleSubmit = () => {
    onSubmit && onSubmit()
    Keyboard.dismiss()
  }

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex gap="md">
        <Flex
          centered
          backgroundColor="neutralSurface"
          borderColor={
            showSuccess
              ? 'accentBackgroundSuccess'
              : error && !focused && value
              ? 'accentBackgroundFailure'
              : 'neutralContainer'
          }
          borderRadius="lg"
          borderWidth={1}
          flexShrink={1}
          height={160}
          p="sm"
          width="100%">
          <Flex row alignItems={'flex-end'} gap="none">
            <TextInput
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              backgroundColor="neutralSurface"
              blurOnSubmit={true}
              caretHidden={!value}
              fontSize={18}
              justifyContent="center"
              multiline={true}
              numberOfLines={5}
              px={'none'}
              py={'none'}
              returnKeyType="done"
              spellCheck={false}
              testID="import_account_form/input"
              textAlign="center"
              value={value}
              onBlur={() => setFocused(false)}
              onChangeText={onChange}
              onFocus={() => setFocused(true)}
              onSubmitEditing={handleSubmit}
            />
            {endAdornment && value && !value.includes(endAdornment) && (
              <Text color="neutralTextSecondary" fontSize={18} lineHeight={18} variant="body1">
                {endAdornment}
              </Text>
            )}
          </Flex>
          {!value && (
            <Flex centered row gap="xs" position="absolute" top={52}>
              <Text color="accentText2" variant="body1">
                {t('Type or')}
              </Text>
              <PasteButton onPress={onChange} />
              {placeholderLabel && (
                <Text color="accentText2" variant="body1">
                  {placeholderLabel}
                </Text>
              )}
            </Flex>
          )}
        </Flex>
        <Flex>
          {error && value && !focused && (
            <Flex centered row gap="sm">
              <AlertTriangle color={theme.colors.accentBackgroundFailure} />
              <Text color="accentBackgroundFailure" fontWeight="600" variant="body1">
                {error}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
