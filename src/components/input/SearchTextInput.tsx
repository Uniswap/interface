import React, { forwardRef, ReactElement, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, TextInput as NativeTextInput, ViewStyle } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { IconButton } from 'src/components/buttons/IconButton'
import { AnimatedTouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
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
  clearIcon?: ReactElement
  disableClearable?: boolean
  endAdornment?: ReactElement
  showBackButton?: boolean
  showCancelButton?: boolean
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>((props, ref) => {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const {
    autoFocus,
    backgroundColor = 'background1',
    clearIcon,
    disableClearable,
    endAdornment = <SearchIcon color={theme.colors.textTertiary} height={20} width={20} />,
    onCancel,
    onChangeText,
    onFocus,
    placeholder,
    showBackButton,
    showCancelButton,
    value,
  } = props

  const isFocus = useSharedValue(false)
  const showClearButton = useSharedValue(value.length > 0 && !disableClearable)
  const cancelButtonWidth = useSharedValue(showCancelButton ? 40 : 0)

  const onPressCancel = () => {
    isFocus.value = false
    Keyboard.dismiss()
    onChangeText?.('')
    onCancel?.()
  }

  const onCancelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      cancelButtonWidth.value = event.nativeEvent.layout.width
    },
    [cancelButtonWidth]
  )

  const onClear = () => {
    onChangeText?.('')
    showClearButton.value = false
  }

  const onTextInputFocus = () => {
    onFocus?.()
    isFocus.value = true
  }

  const onTextInputSubmitEditing = () => {
    isFocus.value = false
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
      marginRight: withSpring(isFocus.value ? cancelButtonWidth.value + 10 : 0, springConfig),
    }
  })

  const clearButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocus.value && showClearButton.value ? 1 : 0),
      transform: [{ scale: withTiming(isFocus.value && showClearButton.value ? 1 : 0) }],
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

  return (
    <Flex centered row gap="none">
      {showBackButton && <BackButton pr="sm" />}
      <AnimatedFlex
        row
        alignItems="center"
        backgroundColor={backgroundColor}
        borderRadius="lg"
        flex={1}
        flexGrow={1}
        gap="none"
        minHeight={48}
        style={textInputStyle}>
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          backgroundColor="none"
          borderWidth={0}
          flex={1}
          fontFamily={theme.textVariants.subheadSmall.fontFamily}
          fontSize={theme.textVariants.subheadSmall.fontSize}
          maxFontSizeMultiplier={theme.textVariants.subheadSmall.maxFontSizeMultiplier}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="done"
          textContentType="none"
          value={value}
          onChangeText={onChangeTextInput}
          onFocus={onTextInputFocus}
          onSubmitEditing={onTextInputSubmitEditing}
        />
        {showClearButton.value ? (
          <AnimatedFlex mx="sm" style={[clearButtonStyle]}>
            <ClearButton clearIcon={clearIcon} onPress={onClear} />
          </AnimatedFlex>
        ) : (
          <AnimatedFlex mx="md" style={[endAdornmentStyle]}>
            {endAdornment}
          </AnimatedFlex>
        )}
      </AnimatedFlex>
      {showCancelButton && (
        <AnimatedTouchableArea
          style={[cancelButtonStyle, CancelButtonDefaultStyle]}
          onLayout={onCancelLayout}
          onPress={onPressCancel}>
          <Text variant="buttonLabelMedium">{t('Cancel')}</Text>
        </AnimatedTouchableArea>
      )}
    </Flex>
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

function ClearButton(props: ClearButtonProps) {
  const theme = useAppTheme()

  const { onPress, clearIcon = <X color={theme.colors.textSecondary} height={16} width={16} /> } =
    props

  return (
    <IconButton
      bg="backgroundOutline"
      borderRadius="full"
      icon={clearIcon}
      p="xxs"
      onPress={onPress}
    />
  )
}
