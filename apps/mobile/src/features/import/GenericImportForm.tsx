import React, { useEffect, useMemo, useRef, useState } from 'react'
// biome-ignore lint/style/noRestrictedImports: Keyboard addListener is allowed for this use case
import { Keyboard, TextInput as NativeTextInput } from 'react-native'
import InputWithSuffix from 'src/features/import/InputWithSuffix'
import { ColorTokens, Flex, Text, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

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
    textInputRef.current?.focus()
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
        textInputRef.current?.blur()
      }),
    ]

    return () => {
      keyboardListeners.forEach((listener) => listener.remove())
    }
  }, [])

  const INPUT_MIN_HEIGHT = 120
  const INPUT_MIN_HEIGHT_SHORT = 90
  const LINE_HEIGHT = INPUT_FONT_SIZE * 1.2

  const showError = errorMessage && value && (liveCheck || !focused)

  const borderColor: ColorTokens = useMemo(() => {
    if (value && (liveCheck || !focused)) {
      return errorMessage ? '$statusCritical' : '$statusSuccess'
    }
    return '$surface3'
  }, [value, liveCheck, focused, errorMessage])

  return (
    <Trace section={SectionName.ImportAccountForm}>
      <Flex
        gap="$spacing12"
        onStartShouldSetResponder={(): boolean => {
          // Disable touch events when keyboard is visible (it prevents dismissing the keyboard
          // when this component is pressed while the keyboard is visible)
          return focused
        }}
        onTouchEnd={handleFocus}
      >
        <Flex
          shrink
          $short={{
            px: '$spacing24',
            py: '$spacing16',
            minHeight: shouldUseMinHeight ? INPUT_MIN_HEIGHT_SHORT : undefined,
          }}
          backgroundColor="$surface1"
          borderColor={borderColor}
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          minHeight={shouldUseMinHeight ? INPUT_MIN_HEIGHT : undefined}
          px="$spacing24"
          py="$spacing16"
          width="100%"
        >
          {/* TODO: [MOB-225] make Box press re-focus TextInput. Fine for now since TexInput has autoFocus */}
          <InputWithSuffix
            autoCorrect={Boolean(autoCorrect)}
            blurOnSubmit={blurOnSubmit ?? false}
            inputAlignment={inputAlignment}
            inputFontSize={INPUT_FONT_SIZE}
            inputMaxFontSizeMultiplier={INPUT_MAX_FONT_SIZE_MULTIPLIER}
            inputSuffix={inputSuffix}
            lineHeight={LINE_HEIGHT}
            textAlign={textAlign}
            textInputRef={textInputRef}
            value={value}
            onBlur={handleBlur}
            onChangeText={onChange}
            onFocus={handleFocus}
            onSubmitEditing={handleSubmit}
          />
          {!value && placeholderLabel && (
            <Flex
              centered
              bottom={shouldUseMinHeight ? undefined : 0}
              left="$spacing24"
              position="absolute"
              py="$spacing16"
              top={0}
            >
              <Text color="$neutral2" fontSize={INPUT_FONT_SIZE} lineHeight={LINE_HEIGHT} pointerEvents="none">
                {placeholderLabel}
              </Text>
            </Flex>
          )}
          {!value && !shouldUseMinHeight && (
            <Flex bottom={0} justifyContent="center" position="absolute" right="$spacing12" top={0}>
              <PasteButton
                afterClipboardReceived={afterPasteButtonPress}
                beforePress={beforePasteButtonPress}
                onPress={onChange}
              />
            </Flex>
          )}
          {!value && shouldUseMinHeight && (
            <Flex centered bottom={0} height={0} left={0} position="absolute" right={0}>
              <Flex position="absolute">
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
          {showError && (
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
