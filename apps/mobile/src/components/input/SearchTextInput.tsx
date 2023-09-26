import React, { forwardRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TextInput as NativeTextInput, ViewStyle } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedBox, AnimatedFlex } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import X from 'ui/src/assets/icons/x.svg'
import { dimensions, fonts, iconSizes, spacing } from 'ui/src/theme'
import { Theme } from 'ui/src/theme/restyle'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
}

export type SearchTextInputProps = TextInputProps & {
  value: string
  onFocus?: () => void
  onCancel?: () => void
  clearIcon?: JSX.Element
  disableClearable?: boolean
  endAdornment?: JSX.Element | null
  showCancelButton?: boolean
  showShadow?: boolean
  py?: keyof Theme['spacing']
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>(
  function _SearchTextInput(props, ref) {
    const colors = useSporeColors()
    const isDarkMode = useIsDarkMode()
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
      py = 'spacing12',
      showCancelButton,
      showShadow,
      value,
    } = props

    const isFocus = useSharedValue(false)
    const cancelButtonWidth = useSharedValue(showCancelButton ? 40 : 0)
    const showClearButton = useSharedValue(value.length > 0 && !disableClearable)
    // Required to update React view hierarchy when show/hiding the clear button
    const [showClearButtonJS, setShowClearButtonJS] = useState(
      value.length > 0 && !disableClearable
    )

    const onPressCancel = (): void => {
      isFocus.value = false
      showClearButton.value = false
      Keyboard.dismiss()
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchCancel, { query: value })
      onChangeText?.('')
      onCancel?.()
    }

    const backgroundColorValue = backgroundColor ?? 'surface2'

    const onCancelLayout = useCallback(
      (event: LayoutChangeEvent) => {
        cancelButtonWidth.value = event.nativeEvent.layout.width
      },
      [cancelButtonWidth]
    )

    const onClear = (): void => {
      onChangeText?.('')
      showClearButton.value = false
      setShowClearButtonJS(false)
    }

    const onTextInputFocus = (): void => {
      onFocus?.()
      isFocus.value = true
    }

    const onTextInputSubmitEditing = (): void => {
      Keyboard.dismiss()
    }

    const onChangeTextInput = useCallback(
      (text: string) => {
        onChangeText?.(text)
        if (text.length > 0) {
          showClearButton.value = true
          setShowClearButtonJS(true)
        } else {
          showClearButton.value = false
          setShowClearButtonJS(false)
        }
      },
      [showClearButton, onChangeText]
    )

    const textInputStyle = useAnimatedStyle(() => {
      return {
        marginRight: withSpring(
          showCancelButton && isFocus.value ? cancelButtonWidth.value + spacing.spacing12 : 0,
          springConfig
        ),
      }
    })

    const clearButtonStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(showClearButton.value ? 1 : 0),
        transform: [{ scale: withTiming(showClearButton.value ? 1 : 0) }],
      }
    })

    const endAdornmentStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(isFocus.value && showClearButton.value ? 0 : 1),
        transform: [{ scale: withTiming(isFocus.value && showClearButton.value ? 0 : 1) }],
      }
    })

    const cancelButtonStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(isFocus.value ? 1 : 0),
        transform: [
          { scale: withTiming(isFocus.value ? 1 : 0) },
          {
            translateX: isFocus.value
              ? withTiming(0, { duration: 0 })
              : withTiming(dimensions.fullWidth, { duration: 650 }),
          },
        ],
      }
    })

    const shadowProps = showShadow
      ? {
          shadowColor: isDarkMode ? 'sporeBlack' : 'DEP_brandedAccentSoft',
          shadowOffset: SHADOW_OFFSET_SMALL,
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }
      : null

    return (
      <Flex row shrink alignItems="center">
        <AnimatedFlex
          fill
          grow
          row
          alignItems="center"
          backgroundColor={backgroundColorValue}
          borderRadius="roundedFull"
          gap="spacing8"
          minHeight={48}
          px="spacing16"
          py={py}
          style={textInputStyle}
          {...shadowProps}>
          <Flex py="$spacing4">
            <Icons.Search color="$neutral2" height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
          <TextInput
            ref={ref}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            backgroundColor="none"
            borderWidth={0}
            flex={1}
            fontFamily={fonts.body1.family}
            fontSize={fonts.body1.fontSize}
            maxFontSizeMultiplier={fonts.body1.maxFontSizeMultiplier}
            placeholder={placeholder}
            placeholderTextColor={colors.neutral2.get()}
            px="none"
            py="none"
            returnKeyType="done"
            textContentType="none"
            value={value}
            onChangeText={onChangeTextInput}
            onFocus={onTextInputFocus}
            onSubmitEditing={onTextInputSubmitEditing}
          />

          {showClearButtonJS ? (
            <AnimatedBox style={[clearButtonStyle]}>
              <ClearButton clearIcon={clearIcon} onPress={onClear} />
            </AnimatedBox>
          ) : (
            <AnimatedBox style={[endAdornmentStyle]}>{endAdornment}</AnimatedBox>
          )}
        </AnimatedFlex>
        {showCancelButton && (
          <AnimatedBox
            style={[cancelButtonStyle, CancelButtonDefaultStyle]}
            onLayout={onCancelLayout}>
            <TouchableArea onPress={onPressCancel}>
              <Text variant="buttonLabel2">{t('Cancel')}</Text>
            </TouchableArea>
          </AnimatedBox>
        )}
      </Flex>
    )
  }
)

const CancelButtonDefaultStyle: ViewStyle = {
  position: 'absolute',
  right: 0,
}

interface ClearButtonProps {
  clearIcon: SearchTextInputProps['clearIcon']
  onPress: () => void
}

function ClearButton(props: ClearButtonProps): JSX.Element {
  const colors = useSporeColors()

  const {
    onPress,
    clearIcon = (
      <X color={colors.neutral2.get()} height={iconSizes.icon16} width={iconSizes.icon16} />
    ),
  } = props

  return (
    <TouchableArea
      backgroundColor="$surface3"
      borderRadius="$roundedFull"
      p="$spacing4"
      onPress={onPress}>
      {clearIcon}
    </TouchableArea>
  )
}
