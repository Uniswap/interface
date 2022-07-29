import { notificationAsync } from 'expo-haptics'
import React from 'react'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Theme } from 'src/styles/theme'

type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  onPress: () => void
  textVariant?: keyof Theme['textVariants']
}

export default function ActionButton({
  onPress,
  disabled,
  label,
  name,
  textVariant = 'largeLabel',
}: ActionButtonProps) {
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(onPress)
  const { requiredForTransactions } = useBiometricAppSettings()

  return (
    <>
      <PrimaryButton
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

      {BiometricModal}
    </>
  )
}
