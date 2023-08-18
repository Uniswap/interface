import { ResponsiveValue, useResponsiveProp } from '@shopify/restyle'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  TextInput as NativeTextInput,
} from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import PasteButton from 'src/components/buttons/PasteButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import InputWithSuffix from 'src/features/import/InputWithSuffix'
import { SectionName } from 'src/features/telemetry/constants'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import { Theme } from 'ui/src/theme/restyle'

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
  textAlign?: 'left' | 'right' | 'center'
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
  textAlign,
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
  const px = useResponsiveProp({ xs: 'spacing24', sm: 'spacing36' })
  const py = useResponsiveProp({ xs: 'spacing8', sm: 'spacing16' })

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
      <Flex gap="spacing16" onTouchEnd={handleFocus}>
        <Flex
          centered
          backgroundColor="surface2"
          borderColor={
            showSuccess
              ? 'statusSuccess'
              : errorMessage && (liveCheck || !focused) && value
              ? 'statusCritical'
              : 'surface2'
          }
          borderRadius="rounded20"
          borderWidth={1}
          flexShrink={1}
          gap="none"
          minHeight={minHeight}
          px={px}
          py={py}
          width="100%">
          {/* TODO: [MOB-225] make Box press re-focus TextInput. Fine for now since TexInput has autoFocus */}
          <InputWithSuffix
            autoCorrect={Boolean(autoCorrect)}
            blurOnSubmit={blurOnSubmit ?? false}
            inputAlignment={inputAlignment}
            inputFontSize={INPUT_FONT_SIZE}
            inputMaxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
            inputSuffix={inputSuffix}
            layout={layout}
            textAlign={textAlign}
            textInputRef={textInputRef}
            theme={theme}
            value={value}
            onBlur={handleBlur}
            onChangeText={onChange}
            onFocus={handleFocus}
            onSubmitEditing={handleSubmit}
          />
          {!value && (
            <Flex
              centered
              grow
              row
              gap="spacing8"
              position="absolute"
              pt="spacing4"
              onLayout={(event: LayoutChangeEvent): void => setLayout(event.nativeEvent.layout)}>
              <Text
                adjustsFontSizeToFit
                color="neutral2"
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
                  color="neutral2"
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
            <Flex centered row gap="spacing12">
              <AlertTriangle color={theme.colors.statusCritical} />
              <Text color="statusCritical" variant="bodyLarge">
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
