import React, { forwardRef, useState } from 'react'
import { TextInput as NativeTextInput } from 'react-native'
import { Flex, TouchableArea, useSporeColors } from 'ui/src'
import EyeOffIcon from 'ui/src/assets/icons/eye-off.svg'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'

export const PasswordInput = forwardRef<NativeTextInput, TextInputProps>(function _PasswordInput(props, ref) {
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
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      p="$spacing4"
    >
      <AnimatedFlex fill grow row alignItems="center" minHeight={48}>
        <TextInput
          ref={ref}
          autoCapitalize="none"
          autoCorrect={false}
          backgroundColor="$transparent"
          blurOnSubmit={false}
          borderWidth="$none"
          clearTextOnFocus={false}
          flex={1}
          fontFamily="$subHeading"
          fontSize="$small"
          fontWeight="$book"
          placeholder={placeholder}
          placeholderTextColor="$neutral3"
          px="$spacing16"
          py="$spacing20"
          returnKeyType={returnKeyType || 'done'}
          secureTextEntry={!showPassword}
          textContentType="none"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          {...rest} // apply any textinputprops
        />
        <AnimatedFlex mx="$spacing12">
          <TouchableArea p="$spacing4" onPress={onPressEyeIcon}>
            {showPassword ? (
              <EyeIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
            ) : (
              <EyeOffIcon color={colors.neutral2.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
            )}
          </TouchableArea>
        </AnimatedFlex>
      </AnimatedFlex>
    </Flex>
  )
})
