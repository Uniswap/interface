import React, { forwardRef, useState } from 'react'
import { TextInput as NativeTextInput } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'

export const PasswordInput = forwardRef<NativeTextInput, TextInputProps>(function _PasswordInput(
  props,
  ref
) {
  const theme = useAppTheme()
  const [showPassword, setShowPassword] = useState(false)

  const { value, placeholder, onChangeText, returnKeyType, onSubmitEditing, ...rest } = props

  const onPressEyeIcon = (): void => {
    setShowPassword(!showPassword)
  }

  return (
    <Flex
      centered
      row
      backgroundColor="surface2"
      borderColor="surface3"
      borderRadius="rounded12"
      borderWidth={1}
      gap="none">
      <AnimatedFlex fill grow row alignItems="center" gap="none" minHeight={48}>
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          backgroundColor="none"
          blurOnSubmit={false}
          borderWidth={0}
          clearTextOnFocus={false}
          flex={1}
          fontFamily={theme.textVariants.subheadSmall.fontFamily}
          fontSize={theme.textVariants.subheadSmall.fontSize}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral3}
          returnKeyType={returnKeyType || 'done'}
          secureTextEntry={!showPassword}
          textContentType="none"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          {...rest} // apply any textinputprops
        />
        <AnimatedFlex mx="spacing12">
          <TouchableArea p="spacing4" onPress={onPressEyeIcon}>
            {showPassword ? (
              <EyeIcon
                color={theme.colors.neutral2}
                height={theme.iconSizes.icon20}
                width={theme.iconSizes.icon20}
              />
            ) : (
              <EyeOffIcon
                color={theme.colors.neutral2}
                height={theme.iconSizes.icon20}
                width={theme.iconSizes.icon20}
              />
            )}
          </TouchableArea>
        </AnimatedFlex>
      </AnimatedFlex>
    </Flex>
  )
})
