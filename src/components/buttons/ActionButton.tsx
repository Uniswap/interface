import { notificationAsync } from 'expo-haptics'
import React, { ComponentProps } from 'react'
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
  textVariant = 'largeLabel',
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
