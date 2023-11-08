import React, { useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  TextInput as NativeTextInput,
} from 'react-native'
import PasteButton from 'src/components/buttons/PasteButton'
import Trace from 'src/components/Trace/Trace'
import InputWithSuffix from 'src/features/import/InputWithSuffix'
import { SectionName } from 'src/features/telemetry/constants'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import { fonts } from 'ui/src/theme'

interface Props {
  value: string | undefined
  errorMessage: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string
  onSubmit?: () => void
  showSuccess?: boolean // show success indicator
  inputSuffix?: string //text to auto to end of input string
  liveCheck?: boolean
  autoCorrect?: boolean
  inputAlignment?: 'center' | 'flex-start'
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
  const colors = useSporeColors()
  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const textInputRef = useRef<NativeTextInput>(null)
  const isKeyboardVisibleRef = useRef(false)

  const INPUT_FONT_SIZE = fonts.body1.fontSize
  const INPUT_MAX_FONT_SIZE_MULTIPLIER = fonts.body1.maxFontSizeMultiplier

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

  useEffect(() => {
    const keyboardListeners = [
      Keyboard.addListener('keyboardDidShow', (): void => {
        isKeyboardVisibleRef.current = true
      }),
      Keyboard.addListener('keyboardDidHide', (): void => {
        if (!isKeyboardVisibleRef.current) return
        isKeyboardVisibleRef.current = false
        textInputRef?.current?.blur()
      }),
    ]

    return () => {
      keyboardListeners.forEach((listener) => listener.remove())
    }
  }, [])

  const INPUT_MIN_HEIGHT = 120
  const INPUT_MIN_HEIGHT_SHORT = 90

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex
        gap="$spacing16"
        onStartShouldSetResponder={(): boolean => {
          // Disable touch events when keyboard is visible (it prevents dismissing the keyboard
          // when this component is pressed while the keyboard is visible)
          return focused
        }}
        onTouchEnd={handleFocus}>
        <Flex
          centered
          shrink
          $short={{ px: '$spacing24', py: '$spacing8', minHeight: INPUT_MIN_HEIGHT_SHORT }}
          backgroundColor="$surface2"
          borderColor={
            showSuccess
              ? '$statusSuccess'
              : errorMessage && (liveCheck || !focused) && value
              ? '$statusCritical'
              : '$surface2'
          }
          borderRadius="$rounded20"
          borderWidth={1}
          minHeight={INPUT_MIN_HEIGHT}
          px="$spacing36"
          py="$spacing16"
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
              gap="$spacing8"
              position="absolute"
              pt="$spacing4"
              onLayout={(event: LayoutChangeEvent): void => setLayout(event.nativeEvent.layout)}>
              <Text
                adjustsFontSizeToFit
                color="$neutral2"
                maxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                style={styles.placeholderLabelStyle}
                variant="body1">
                {placeholderLabel}
              </Text>
              <PasteButton
                afterClipboardReceived={afterPasteButtonPress}
                beforePress={beforePasteButtonPress}
                onPress={onChange}
              />
            </Flex>
          )}
        </Flex>
        <Flex>
          {errorMessage && value && (liveCheck || !focused) && (
            <Flex centered row gap="$spacing12">
              <AlertTriangle color={colors.statusCritical.val} />
              <Text color="$statusCritical" variant="body1">
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
