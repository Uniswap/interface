import { ResponsiveValue, useResponsiveProp } from '@shopify/restyle'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  TextInput as NativeTextInput,
  View,
} from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import PasteButton from 'src/components/buttons/PasteButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { SectionName } from '../telemetry/constants'

interface Props {
  value: string | undefined
  errorMessage: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string | undefined
  onSubmit?: () => void
  showSuccess?: boolean // show success indicator
  inputSuffix?: string //text to auto to end of input string
  liveCheck?: boolean
  autoCorrect?: boolean
  inputAlignment?: ResponsiveValue<'center' | 'flex-start', Theme>
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
  inputSuffix,
  liveCheck,
  autoCorrect,
  onBlur,
  onFocus,
  beforePasteButtonPress,
  afterPasteButtonPress,
  blurOnSubmit,
  inputAlignment = 'center',
}: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const textInputRef = useRef<NativeTextInput>(null)

  const INPUT_FONT_SIZE = theme.textVariants.bodyLarge.fontSize
  const INPUT_MAX_FONT_SIZE_MULTIPLIER = theme.textVariants.bodyLarge.maxFontSizeMultiplier

  const minHeight = useResponsiveProp({ xs: 90, sm: 120 })
  const px = useResponsiveProp({ xs: 'lg', sm: 'xl' })
  const py = useResponsiveProp({ xs: 'xs', sm: 'md' })

  const handleBlur = (): void => {
    setFocused(false)
    onBlur?.()
  }

  const handleFocus = (): void => {
    setFocused(true)
    onFocus?.()
    // Need this to allow for focus on click on container.
    textInputRef?.current?.focus()
  }

  const handleSubmit = (): void => {
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
          minHeight={minHeight}
          px={px}
          py={py}
          width="100%">
          {/* TODO: [MOB-3890] make Box press re-focus TextInput. Fine for now since TexInput has autoFocus */}
          <Box
            alignItems="flex-end"
            flexDirection="row"
            justifyContent={inputAlignment}
            width="100%">
            <TextInput
              ref={textInputRef}
              autoFocus
              autoCapitalize="none"
              autoCorrect={Boolean(autoCorrect)}
              backgroundColor="none"
              blurOnSubmit={blurOnSubmit ?? false}
              fontSize={INPUT_FONT_SIZE}
              justifyContent="center"
              lineHeight={INPUT_FONT_SIZE}
              maxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
              multiline={true}
              numberOfLines={4}
              px="none"
              py="none"
              returnKeyType="done"
              scrollEnabled={false}
              selectionColor={theme.colors.textPrimary}
              spellCheck={false}
              testID="import_account_form/input"
              textAlign={inputAlignment === 'center' || !value ? 'left' : 'center'}
              value={value}
              width={value ? 'auto' : (layout?.width || 0) + theme.spacing.xs}
              onBlur={handleBlur}
              onChangeText={onChange}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmit}
            />
            {inputSuffix && value && !value.includes(inputSuffix) ? (
              <View pointerEvents="none">
                <TextInput
                  backgroundColor="none"
                  color="textSecondary"
                  editable={false}
                  fontSize={INPUT_FONT_SIZE}
                  justifyContent="center"
                  lineHeight={INPUT_FONT_SIZE}
                  maxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
                  multiline={true}
                  px="none"
                  py="none"
                  scrollEnabled={false}
                  value={inputSuffix}
                />
              </View>
            ) : null}
          </Box>
          {!value && (
            <Flex
              centered
              grow
              row
              gap="xs"
              position="absolute"
              pt="xxs"
              onLayout={(event: LayoutChangeEvent): void => setLayout(event.nativeEvent.layout)}>
              <Text
                adjustsFontSizeToFit
                color="textSecondary"
                maxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
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
