import React, { forwardRef, useState } from 'react'
import { TextInput as NativeTextInput } from 'react-native'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { useSporeColors } from 'ui/src'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { fonts, iconSizes } from 'ui/src/theme'

export const PasswordInput = forwardRef<NativeTextInput, TextInputProps>(function _PasswordInput(
  props,
  ref
) {
  const colors = useSporeColors()
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
          fontFamily={fonts.subheadSmall.family}
          fontSize={fonts.subheadSmall.fontSize}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral3.val}
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
                color={colors.neutral2.val}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            ) : (
              <EyeOffIcon
                color={colors.neutral2.val}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            )}
          </TouchableArea>
        </AnimatedFlex>
      </AnimatedFlex>
    </Flex>
  )
})
