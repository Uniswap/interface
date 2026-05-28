import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { Input, InputProps } from 'src/app/components/Input'
import { useShouldShowBiometricUnlock } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { Flex, FlexProps, IconProps, Text, TouchableArea } from 'ui/src'
import { Eye, EyeOff, Fingerprint } from 'ui/src/components/icons'
import { getPasswordStrengthTextAndColor, PasswordStrength } from 'wallet/src/utils/password'

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
  hideBiometrics?: boolean
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
          <TouchableArea
            backgroundColor="$transparent"
            hoverStyle={hoverStyle}
            position="absolute"
            pressStyle={hoverStyle}
            right="$spacing8"
            p="$spacing12"
            onPress={(): void => onToggleHideInput(!hideInput)}
          >
            {hideInput ? <Eye {...iconProps} /> : <EyeOff {...iconProps} />}
          </TouchableArea>
        )
      )}
    </Flex>
  )
})

export const PasswordInputWithBiometrics = forwardRef<
  TextInput,
  PasswordInputProps & { onPressBiometricUnlock: () => void }
>(function PasswordInputWithBiometrics(
  { onPressBiometricUnlock, hideBiometrics = false, ...passwordInputProps },
  ref,
): JSX.Element {
  const shouldShowBiometricUnlock = useShouldShowBiometricUnlock() && !hideBiometrics

  return (
    <Flex row width="100%" alignItems="center">
      <Flex grow>
        <PasswordInput
          ref={ref}
          {...passwordInputProps}
          {...(shouldShowBiometricUnlock && {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          })}
        />
      </Flex>

      {shouldShowBiometricUnlock && (
        <TouchableArea
          height="100%"
          justifyContent="center"
          px="$spacing12"
          borderWidth="$spacing1"
          borderLeftWidth={0}
          borderTopLeftRadius={0}
          borderBottomLeftRadius={0}
          borderColor="$surface3"
          backgroundColor="$surface1"
          hoverStyle={{
            backgroundColor: '$accent2',
          }}
          onPress={onPressBiometricUnlock}
        >
          <Fingerprint color="$accent1" size="$icon.28" />
        </TouchableArea>
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
