import React, { forwardRef, useState } from 'react'
import { TextInput as NativeTextInput } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Flex } from 'src/components/layout'

export const PasswordInput = forwardRef<NativeTextInput, TextInputProps>((props, ref) => {
  const theme = useAppTheme()
  const [showPassword, setShowPassword] = useState(false)

  const { value, placeholder, onChangeText, returnKeyType, onSubmitEditing, ...rest } = props

  const onPressEyeIcon = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Flex
      centered
      row
      backgroundColor="backgroundSurface"
      borderColor="backgroundContainer"
      borderRadius="md"
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
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType={returnKeyType || 'done'}
          secureTextEntry={!showPassword}
          textContentType="none"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          {...rest} // apply any textinputprops
        />
        <AnimatedFlex mx="sm">
          <IconButton
            color="textSecondary"
            icon={
              showPassword ? (
                <EyeIcon
                  color={theme.colors.textSecondary}
                  height={theme.iconSizes.sm}
                  width={theme.iconSizes.sm}
                />
              ) : (
                <EyeOffIcon
                  color={theme.colors.textSecondary}
                  height={theme.iconSizes.sm}
                  width={theme.iconSizes.sm}
                />
              )
            }
            p="xxs"
            onPress={onPressEyeIcon}
          />
        </AnimatedFlex>
      </AnimatedFlex>
    </Flex>
  )
})
