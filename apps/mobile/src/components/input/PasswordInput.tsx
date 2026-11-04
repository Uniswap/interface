import { Flex, TouchableArea } from '@universe/mycelium'
import { Eye } from '@universe/mycelium/icons/Eye'
import { EyeOff } from '@universe/mycelium/icons/EyeOff'
import React, { forwardRef, type ForwardRefExoticComponent, type RefAttributes, useState } from 'react'
import { TextInput as NativeTextInput } from 'react-native'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'

export const PasswordInput: ForwardRefExoticComponent<TextInputProps & RefAttributes<NativeTextInput>> = forwardRef<
  NativeTextInput,
  TextInputProps
>(function PasswordInputInner(props, ref) {
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
      <Flex fill grow row alignItems="center" minHeight={48}>
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
          py="$spacing12"
          returnKeyType={returnKeyType || 'done'}
          secureTextEntry={!showPassword}
          textContentType="none"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          {...rest} // apply any textinputprops
        />
        <Flex mx="$spacing12">
          <TouchableArea p="$spacing4" onPress={onPressEyeIcon}>
            {showPassword ? <Eye color="$neutral2" size="$icon.20" /> : <EyeOff color="$neutral2" size="$icon.20" />}
          </TouchableArea>
        </Flex>
      </Flex>
    </Flex>
  )
})
