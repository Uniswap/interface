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
}

export function GenericImportForm({
  value,
  onChange,
  error,
  placeholderLabel,
  onSubmit,
  showSuccess,
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
              : error && focused && value
              ? 'accentBackgroundFailure'
              : 'neutralContainer'
          }
          borderRadius="lg"
          borderWidth={1}
          flexShrink={1}
          height={160}
          p="sm"
          width="100%">
          <TextInput
            autoFocus
            autoCapitalize="none"
            backgroundColor="neutralSurface"
            blurOnSubmit={true}
            fontSize={18}
            multiline={true}
            numberOfLines={5}
            returnKeyType="done"
            spellCheck={false}
            testID="import_account_form/input"
            textAlign="center"
            value={value}
            width={'100%'}
            onBlur={() => setFocused(false)}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onSubmitEditing={handleSubmit}
          />

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
          {error && value && (
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
