import React, { forwardRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  TextInputFocusEventData,
} from 'react-native'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
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
} from 'ui/src'
import { dimensions, fonts, spacing } from 'ui/src/theme'
import { SHADOW_OFFSET_SMALL } from 'wallet/src/components/BaseCard/BaseCard'

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
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchCancel, { query: value })
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

          <Input
            ref={ref}
            ellipse
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            backgroundColor="$transparent"
            borderWidth={0}
            f={1}
            fontFamily="$body"
            height="100%"
            maxFontSizeMultiplier={fonts.body1.maxFontSizeMultiplier}
            pl="$none"
            placeholder={placeholder}
            placeholderTextColor="$neutral2"
            pr="$spacing8"
            py="$none"
            returnKeyType="done"
            textContentType="none"
            value={value}
            onChangeText={onChangeTextInput}
            onFocus={onTextInputFocus}
            onSubmitEditing={onTextInputSubmitEditing}
          />

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
