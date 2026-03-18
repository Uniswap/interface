import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PADDING_STRENGTH_INDICATOR, PasswordInput } from 'src/app/components/PasswordInput'
import { useShouldShowBiometricUnlockEnrollment } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlockEnrollment'
import { BiometricUnlockSetUp } from 'src/app/features/onboarding/BiometricUnlockSetUp'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Square, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useEvent } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { usePasswordForm } from 'wallet/src/utils/password'

export function Password({
  flow,
  onComplete,
  onBack,
}: {
  flow: ExtensionOnboardingFlow
  onComplete: (password: string) => Promise<void>
  onBack?: () => void
}): JSX.Element {
  const { resetOnboardingContextData } = useOnboardingContext()

  const [password, setPassword] = useState<null | string>(null)

  const shouldShowBiometricUnlockEnrollment = useShouldShowBiometricUnlockEnrollment({ flow: 'onboarding' })

  const onPasswordNext = useEvent(async (password: string) => {
    if (shouldShowBiometricUnlockEnrollment) {
      setPassword(password)
    } else {
      await onComplete(password)
    }
  })

  const onPasswordBack = useEvent(() => {
    // reset the pending mnemonic when going back from password screen
    // to avoid having them in the context when coming back to either screen
    resetOnboardingContextData()
    if (onBack) {
      onBack()
    } else {
      navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })
    }
  })

  const onBiometricsNext = useEvent(async () => {
    if (!password) {
      // This should never happen, and we can't recover from it.
      throw new Error('Missing password when calling `onBiometricsNext`')
    }
    await onComplete(password)
  })

  const onBiometricsBack = useEvent(() => {
    setPassword(null)
  })

  return password ? (
    <BiometricUnlockSetUp flow={flow} password={password} onNext={onBiometricsNext} onBack={onBiometricsBack} />
  ) : (
    <PasswordScreen flow={flow} onNext={onPasswordNext} onBack={onPasswordBack} />
  )
}

function PasswordScreen({
  flow,
  onNext,
  onBack,
}: {
  flow: ExtensionOnboardingFlow
  onNext: (password: string) => Promise<void>
  onBack?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const { isResetting } = useOnboardingSteps()

  const {
    enableNext,
    hideInput,
    debouncedPasswordStrength,
    password,
    onPasswordBlur,
    onChangePassword,
    confirmPassword,
    onChangeConfirmPassword,
    setHideInput,
    errorText,
    checkSubmit,
  } = usePasswordForm()

  const onSubmit = useEvent(async () => {
    if (!enableNext) {
      return
    }

    if (checkSubmit()) {
      onNext(password)
    }
  })

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SetPassword}>
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <Lock color="$neutral1" size="$icon.24" />
          </Square>
        }
        nextButtonEnabled={enableNext}
        nextButtonText={t('common.button.continue')}
        subtitle={t('onboarding.extension.password.subtitle')}
        title={
          isResetting
            ? t('onboarding.extension.password.title.reset')
            : t('onboarding.extension.password.title.default')
        }
        onBack={onBack}
        onSubmit={onSubmit}
      >
        <Flex gap="$spacing16" py="$spacing24" width="100%">
          <PasswordInput
            autoFocus
            large
            backgroundColor="$surface2"
            hideInput={hideInput}
            passwordStrength={debouncedPasswordStrength}
            placeholder={t('common.input.password.new')}
            pr={PADDING_STRENGTH_INDICATOR}
            value={password}
            onBlur={onPasswordBlur}
            onChangeText={onChangePassword}
            onSubmitEditing={onSubmit}
          />
          <PasswordInput
            large
            backgroundColor="$surface2"
            hideInput={hideInput}
            placeholder={t('common.input.password.confirm')}
            pr="$spacing48"
            value={confirmPassword}
            onChangeText={onChangeConfirmPassword}
            onSubmitEditing={onSubmit}
            onToggleHideInput={setHideInput}
          />
          <Text color="$statusCritical" opacity={errorText ? 1 : 0} textAlign="center" variant="body3">
            {errorText || 'Placeholder text'}
          </Text>
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
