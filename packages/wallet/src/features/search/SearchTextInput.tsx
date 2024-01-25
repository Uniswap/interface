import { forwardRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  TextInputFocusEventData,
} from 'react-native'
import {
  AnimatePresence,
  Button,
  Flex,
  Icons,
  Input,
  InputProps,
  SpaceTokens,
  Text,
  TouchableArea,
  useDeviceDimensions,
} from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { SHADOW_OFFSET_SMALL } from 'wallet/src/components/BaseCard/BaseCard'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
}

export type SearchTextInputProps = InputProps & {
  onCancel?: () => void
  clearIcon?: JSX.Element
  disableClearable?: boolean
  endAdornment?: JSX.Element | null
  showCancelButton?: boolean
  showShadow?: boolean
  py?: SpaceTokens
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>(
  function _SearchTextInput(props, ref) {
    const dimensions = useDeviceDimensions()
    const { t } = useTranslation()
    const {
      autoFocus,
      backgroundColor,
      clearIcon,
      disableClearable,
      endAdornment,
      onCancel,
      onChangeText,
      onFocus,
      placeholder,
      py = '$spacing12',
      showCancelButton,
      showShadow,
      value = '',
    } = props

    const [isFocus, setIsFocus] = useState(false)
    const [cancelButtonWidth, setCancelButtonWidth] = useState(showCancelButton ? 40 : 0)
    const [showClearButton, setShowClearButton] = useState(value.length > 0 && !disableClearable)

    const onPressCancel = (): void => {
      setIsFocus(false)
      setShowClearButton(false)
      Keyboard.dismiss()
      sendWalletAnalyticsEvent(WalletEventName.ExploreSearchCancel, { query: value })
      onChangeText?.('')
      onCancel?.()
    }

    const onCancelButtonLayout = useCallback((event: LayoutChangeEvent) => {
      setCancelButtonWidth(event.nativeEvent.layout.width)
    }, [])

    const onClear = (): void => {
      onChangeText?.('')
      setShowClearButton(false)
    }

    const onTextInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
      onFocus?.(e)
      setIsFocus(true)
    }

    const onTextInputSubmitEditing = (): void => {
      Keyboard.dismiss()
    }

    const onChangeTextInput = useCallback(
      (text: string) => {
        onChangeText?.(text)
        setShowClearButton(text.length > 0)
      },
      [onChangeText]
    )

    return (
      <Flex row shrink alignItems="center">
        <Flex
          fill
          grow
          row
          alignItems="center"
          animateOnly={['marginRight']}
          animation="quick"
          backgroundColor={backgroundColor ?? '$surface2'}
          borderRadius="$roundedFull"
          gap="$spacing8"
          marginRight={showCancelButton && isFocus ? cancelButtonWidth + spacing.spacing12 : 0}
          minHeight={48}
          px="$spacing16"
          py={py}
          {...(showShadow && {
            shadowColor: '$DEP_brandedAccentSoft',
            shadowOffset: SHADOW_OFFSET_SMALL,
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 6,
            '$theme-dark': {
              shadowColor: '$sporeBlack',
            },
          })}>
          <Flex py="$spacing4">
            <Icons.Search color="$neutral2" size="$icon.20" />
          </Flex>

          <Flex grow alignSelf="stretch" mr="$spacing8" overflow="hidden">
            <Input
              ref={ref}
              ellipse
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={autoFocus}
              backgroundColor="$transparent"
              borderWidth={0}
              fontFamily="$body"
              height="100%"
              maxFontSizeMultiplier={fonts.body1.maxFontSizeMultiplier}
              p="$none"
              placeholder={placeholder}
              placeholderTextColor="$neutral2"
              position="absolute"
              returnKeyType="done"
              textContentType="none"
              top={0}
              value={value}
              // This fixes Android TextInput issue when the width is changed
              // (the placeholder text was wrapping in 2 lines when the width was changed)
              width={value ? undefined : 9999}
              onChangeText={onChangeTextInput}
              onFocus={onTextInputFocus}
              onSubmitEditing={onTextInputSubmitEditing}
            />
          </Flex>

          <AnimatePresence>
            {showClearButton ? (
              <Button
                animation="quick"
                backgroundColor="$surface3"
                borderRadius="$roundedFull"
                // eslint-disable-next-line react-native/no-inline-styles
                enterStyle={{ o: 0, scale: 0 }}
                // eslint-disable-next-line react-native/no-inline-styles
                exitStyle={{ o: 0, scale: 0 }}
                icon={clearIcon ?? <Icons.X color="$neutral2" size="$icon.16" />}
                p="$spacing4"
                theme="secondary"
                onPress={onClear}
              />
            ) : endAdornment ? (
              <Flex
                animation="quick"
                opacity={isFocus && showClearButton ? 0 : 1}
                scale={isFocus && showClearButton ? 0 : 1}>
                {endAdornment}
              </Flex>
            ) : null}
          </AnimatePresence>
        </Flex>

        {showCancelButton && (
          <Flex
            animation="200ms"
            o={isFocus ? 1 : 0}
            pos="absolute"
            r={0}
            scale={isFocus ? 1 : 0}
            x={isFocus ? 0 : dimensions.fullWidth}
            onLayout={onCancelButtonLayout}>
            <TouchableArea hitSlop={16} onPress={onPressCancel}>
              <Text variant="buttonLabel2">{t('Cancel')}</Text>
            </TouchableArea>
          </Flex>
        )}
      </Flex>
    )
  }
)
