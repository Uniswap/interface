import React, { forwardRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  LayoutChangeEvent,
  TextInput as NativeTextInput,
  useColorScheme,
  ViewStyle,
} from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedBox, AnimatedFlex, Box } from 'src/components/layout'
import { SHADOW_OFFSET_SMALL } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { dimensions } from 'src/styles/sizing'
import SearchIcon from '../../assets/icons/search.svg'

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
  endAdornment?: JSX.Element
  showCancelButton?: boolean
  showShadow?: boolean
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>((props, ref) => {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
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
    showCancelButton,
    showShadow,
    value,
  } = props

  const isFocus = useSharedValue(false)
  const showClearButton = useSharedValue(value.length > 0 && !disableClearable)
  const cancelButtonWidth = useSharedValue(showCancelButton ? 40 : 0)

  const onPressCancel = (): void => {
    isFocus.value = false
    showClearButton.value = false
    Keyboard.dismiss()
    sendAnalyticsEvent(MobileEventName.ExploreSearchCancel, { query: value })
    onChangeText?.('')
    onCancel?.()
  }

  const backgroundColorValue = backgroundColor ?? 'background1'

  const onCancelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      cancelButtonWidth.value = event.nativeEvent.layout.width
    },
    [cancelButtonWidth]
  )

  const onClear = (): void => {
    onChangeText?.('')
    showClearButton.value = false
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
      } else {
        showClearButton.value = false
      }
    },
    [showClearButton, onChangeText]
  )

  const textInputStyle = useAnimatedStyle(() => {
    return {
      marginRight: withSpring(
        showCancelButton && isFocus.value ? cancelButtonWidth.value + theme.spacing.spacing12 : 0,
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
        shadowColor: isDarkMode ? 'black' : 'brandedAccentSoft',
        shadowOffset: SHADOW_OFFSET_SMALL,
        shadowOpacity: 0.25,
        shadowRadius: 6,
      }
    : null

  return (
    <Box alignItems="center" flexDirection="row" flexShrink={1}>
      <AnimatedFlex
        row
        alignItems="center"
        backgroundColor={backgroundColorValue}
        borderRadius="roundedFull"
        flex={1}
        flexGrow={1}
        gap="spacing8"
        minHeight={48}
        px="spacing16"
        py="spacing16"
        style={textInputStyle}
        {...shadowProps}>
        <SearchIcon
          color={isDarkMode ? theme.colors.textSecondary : theme.colors.textTertiary}
          height={20}
          width={20}
        />
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontFamily={theme.textVariants.bodyLarge.fontFamily}
          fontSize={theme.textVariants.bodyLarge.fontSize}
          maxFontSizeMultiplier={theme.textVariants.bodyLarge.maxFontSizeMultiplier}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? theme.colors.textSecondary : theme.colors.textTertiary}
          px="none"
          py="none"
          returnKeyType="done"
          textContentType="none"
          value={value}
          onChangeText={onChangeTextInput}
          onFocus={onTextInputFocus}
          onSubmitEditing={onTextInputSubmitEditing}
        />
        {showClearButton.value ? (
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
            <Text variant="buttonLabelMedium">{t('Cancel')}</Text>
          </TouchableArea>
        </AnimatedBox>
      )}
    </Box>
  )
})

const CancelButtonDefaultStyle: ViewStyle = {
  position: 'absolute',
  right: 0,
}

interface ClearButtonProps {
  clearIcon: SearchTextInputProps['clearIcon']
  onPress: () => void
}

function ClearButton(props: ClearButtonProps): JSX.Element {
  const theme = useAppTheme()

  const { onPress, clearIcon = <X color={theme.colors.textSecondary} height={16} width={16} /> } =
    props

  return (
    <TouchableArea
      backgroundColor="backgroundOutline"
      borderRadius="roundedFull"
      p="spacing4"
      onPress={onPress}>
      {clearIcon}
    </TouchableArea>
  )
}
