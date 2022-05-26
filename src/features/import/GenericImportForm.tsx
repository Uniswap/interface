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
}

export function GenericImportForm({ value, onChange, error }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [focused, setFocused] = useState(false)

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex
        alignItems={'center'}
        backgroundColor="neutralSurface"
        borderColor={error && focused && value ? 'accentBackgroundFailure' : 'neutralContainer'}
        borderRadius="lg"
        borderWidth={1}
        flexShrink={1}
        gap="xs"
        minHeight={140}
        p="md"
        width="100%">
        <TextInput
          autoCapitalize="none"
          backgroundColor="neutralSurface"
          flex={2}
          fontSize={18}
          multiline={true}
          numberOfLines={5}
          returnKeyType="done"
          testID="import_account_form/input"
          textAlign="center"
          value={value}
          width="100%"
          onBlur={() => setFocused(false)}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {!value && (
          <Flex centered row gap="xs" position="absolute" top={14}>
            <Text color="accentText2" variant="body1">
              {t('Type or')}
            </Text>
            <PasteButton onPress={onChange} />
            <Text color="accentText2" variant="body1">
              {t('seed phrase')}
            </Text>
          </Flex>
        )}
        <Flex height={28}>
          {error && focused && value && (
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
