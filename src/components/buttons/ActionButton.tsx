import { notificationAsync } from 'expo-haptics'
import React, { ComponentProps } from 'react'
import { GradientButton } from 'src/components/buttons/GradientButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

export type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  onPress: () => void
  textVariant?: keyof Theme['textVariants']
} & ComponentProps<typeof PrimaryButton>

export default function ActionButton({
  onPress,
  disabled,
  label,
  name,
  textVariant = 'buttonLabelLarge',
  ...rest
}: ActionButtonProps) {
  const { trigger: actionButtonTrigger } = useBiometricPrompt(onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  return (
    <>
      <PrimaryButton
        {...rest}
        disabled={disabled}
        label={label}
        name={name}
        py="md"
        testID={name}
        textVariant={textVariant}
        onPress={() => {
          notificationAsync()
          if (requiredForTransactions) {
            actionButtonTrigger()
          } else {
            onPress()
          }
        }}
      />
    </>
  )
}

// TODO: make this a more extensible component for use throughout the app
export function GradientActionButton({
  onPress,
  disabled,
  label,
  name,
  textVariant = 'buttonLabelLarge',
  ...rest
}: ActionButtonProps) {
  const { trigger: actionButtonTrigger } = useBiometricPrompt(onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  return (
    <GradientButton
      {...rest}
      disabled={disabled}
      height={56}
      label={label}
      name={name}
      testID={name}
      textVariant={textVariant}
      onPress={() => {
        notificationAsync()
        if (requiredForTransactions) {
          actionButtonTrigger()
        } else {
          onPress()
        }
      }}
    />
  )
}
