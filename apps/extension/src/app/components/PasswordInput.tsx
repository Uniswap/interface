import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { Input, InputProps } from 'src/app/components/Input'
import { Button, Flex, FlexProps, IconProps, Text } from 'ui/src'
import { Eye, EyeOff } from 'ui/src/components/icons'
import { PasswordStrength, getPasswordStrengthTextAndColor } from 'wallet/src/utils/password'

export const PADDING_STRENGTH_INDICATOR = 76

const iconProps: IconProps = {
  color: '$neutral3',
  size: '$icon.20',
}
const hoverStyle: FlexProps = {
  backgroundColor: 'transparent',
}

interface PasswordInputProps extends InputProps {
  passwordStrength?: PasswordStrength
  hideInput: boolean
  onToggleHideInput?: (hideInput: boolean) => void
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(function PasswordInput(
  { passwordStrength, hideInput, onToggleHideInput, value, ...inputProps },
  ref,
): JSX.Element {
  return (
    <Flex row alignItems="center" position="relative" width="100%">
      <Input ref={ref} hideInput={hideInput} minHeight="$spacing24" pr="$spacing48" value={value} {...inputProps} />

      {passwordStrength !== undefined ? (
        <StrengthIndicator strength={passwordStrength} />
      ) : (
        onToggleHideInput && (
          <Button
            backgroundColor="$transparent"
            hoverStyle={hoverStyle}
            position="absolute"
            pressStyle={hoverStyle}
            right="$spacing8"
            onPress={(): void => onToggleHideInput(!hideInput)}
          >
            {hideInput ? <Eye {...iconProps} /> : <EyeOff {...iconProps} />}
          </Button>
        )
      )}
    </Flex>
  )
})

function StrengthIndicator({ strength }: { strength: PasswordStrength }): JSX.Element | null {
  const { t } = useTranslation()
  if (strength === PasswordStrength.NONE) {
    return null
  }

  const { text, color } = getPasswordStrengthTextAndColor(t, strength)

  return (
    <Flex position="absolute" right="$spacing24">
      <Text color={color} variant="buttonLabel2">
        {text}
      </Text>
    </Flex>
  )
}
