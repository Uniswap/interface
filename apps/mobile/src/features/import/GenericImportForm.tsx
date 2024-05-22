import React, { useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  LayoutChangeEvent,
  LayoutRectangle,
  TextInput as NativeTextInput,
  StyleSheet,
} from 'react-native'
import Trace from 'src/components/Trace/Trace'
import InputWithSuffix from 'src/features/import/InputWithSuffix'
import { Flex, Text, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import PasteButton from 'wallet/src/components/buttons/PasteButton'
import { SectionName } from 'wallet/src/telemetry/constants'

interface Props {
  value: string | undefined
  errorMessage: string | undefined
  onChange: (text: string | undefined) => void
  placeholderLabel: string
  onSubmit?: () => void
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
  shouldUseMinHeight?: boolean
}

export function GenericImportForm({
  value,
  onChange,
  errorMessage,
  placeholderLabel,
  onSubmit,
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
  shouldUseMinHeight = true,
}: Props): JSX.Element {
  const [focused, setFocused] = useState(false)
  const [layout, setLayout] = useState<LayoutRectangle | null>()
  const textInputRef = useRef<NativeTextInput>(null)
  const isKeyboardVisibleRef = useRef(false)
  const media = useMedia()

  const INPUT_FONT_SIZE = media.short ? fonts.subheading2.fontSize : fonts.subheading2.fontSize
  const INPUT_MAX_FONT_SIZE_MULTIPLIER = fonts.subheading2.maxFontSizeMultiplier

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
        if (!isKeyboardVisibleRef.current) {
          return
        }
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

  // Absolutely positioned paste button needs top padding to be vertically centered on bottom border of Flex
  const PASTE_BUTTON_TOP_PADDING = INPUT_MIN_HEIGHT / 2 + 4
  const SHORT_PASTE_BUTTON_TOP_PADDING = INPUT_MIN_HEIGHT_SHORT / 2 - 12

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex
        gap="$spacing12"
        onStartShouldSetResponder={(): boolean => {
          // Disable touch events when keyboard is visible (it prevents dismissing the keyboard
          // when this component is pressed while the keyboard is visible)
          return focused
        }}
        onTouchEnd={handleFocus}>
        <Flex
          shrink
          $short={{
            px: '$spacing24',
            py: '$spacing16',
            minHeight: shouldUseMinHeight ? INPUT_MIN_HEIGHT_SHORT : undefined,
          }}
          backgroundColor="$surface1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth={1}
          minHeight={shouldUseMinHeight ? INPUT_MIN_HEIGHT : undefined}
          px="$spacing24"
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
              grow
              row
              alignItems="center"
              gap="$spacing8"
              position="absolute"
              pt="$spacing16"
              px="$spacing24"
              width="100%"
              onLayout={(event: LayoutChangeEvent): void => setLayout(event.nativeEvent.layout)}>
              <Text
                adjustsFontSizeToFit
                $short={{ variant: 'body3' }}
                color="$neutral2"
                maxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
                style={styles.placeholderLabelStyle}
                variant="subheading2">
                {placeholderLabel}
              </Text>
            </Flex>
          )}
          {!value && !shouldUseMinHeight && (
            <Flex
              row
              alignItems="flex-end"
              justifyContent="flex-end"
              position="absolute"
              pr="$spacing12"
              pt="$spacing12"
              right={0}
              width="100%">
              <PasteButton
                afterClipboardReceived={afterPasteButtonPress}
                beforePress={beforePasteButtonPress}
                onPress={onChange}
              />
            </Flex>
          )}
          {!value && shouldUseMinHeight && (
            <Flex centered width="100%">
              <Flex
                $short={{ pt: SHORT_PASTE_BUTTON_TOP_PADDING }}
                position="absolute"
                pt={PASTE_BUTTON_TOP_PADDING}
                top={0}>
                <PasteButton
                  afterClipboardReceived={afterPasteButtonPress}
                  beforePress={beforePasteButtonPress}
                  onPress={onChange}
                />
              </Flex>
            </Flex>
          )}
        </Flex>
        <Flex>
          {errorMessage && value && (liveCheck || !focused) && (
            <Flex centered row gap="$spacing12">
              <Text color="$statusCritical" variant="body3">
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
