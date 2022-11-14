import { useResponsiveProp } from '@shopify/restyle'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle, StyleSheet, TextInput as NativeTextInput } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import PasteButton from 'src/components/buttons/PasteButton'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { flex } from 'src/styles/flex'
import { SectionName } from '../telemetry/constants'

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
  textAlign?: TextInputProps['textAlign']
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
  textAlign = 'center',
}: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const textInputRef = useRef<NativeTextInput>(null)

  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }

  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
    // Need this to allow for focus on click on container.
    textInputRef?.current?.focus()
  }

  const handleSubmit = () => {
    onSubmit && onSubmit()
  }

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex gap="md" onTouchEnd={handleFocus}>
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
          minHeight={useResponsiveProp({ xs: 90, sm: 120 })}
          px={useResponsiveProp({ xs: 'lg', sm: 'xl' })}
          py={useResponsiveProp({ xs: 'xs', sm: 'md' })}
          width="100%">
          <Flex row alignItems="flex-end" gap="none" pb="xxs">
            <TextInput
              ref={textInputRef}
              autoFocus
              autoCapitalize="none"
              autoCorrect={Boolean(autoCorrect)}
              backgroundColor="none"
              blurOnSubmit={blurOnSubmit ?? false}
              fontSize={18}
              justifyContent="center"
              multiline={true}
              numberOfLines={4}
              px="none"
              py="none"
              returnKeyType="done"
              scrollEnabled={false}
              selectionColor={theme.colors.textPrimary}
              spellCheck={false}
              style={flex.fill}
              testID="import_account_form/input"
              textAlign={textAlign}
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
              grow
              row
              gap="xs"
              position="absolute"
              onLayout={(event: any) => setLayout(event.nativeEvent.layout)}>
              <Text
                adjustsFontSizeToFit
                color="textSecondary"
                numberOfLines={1}
                style={styles.placeholderLabelStyle}
                variant="bodyLarge">
                {t('Type or')}
              </Text>
              <PasteButton
                afterClipboardReceived={afterPasteButtonPress}
                beforePress={beforePasteButtonPress}
                onPress={onChange}
              />
              {placeholderLabel && (
                <Text
                  adjustsFontSizeToFit
                  color="textSecondary"
                  numberOfLines={1}
                  style={styles.placeholderLabelStyle}
                  variant="bodyLarge">
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

const styles = StyleSheet.create({
  placeholderLabelStyle: {
    flexShrink: 1,
  },
})
