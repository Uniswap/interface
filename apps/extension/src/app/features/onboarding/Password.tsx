import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PADDING_STRENGTH_INDICATOR, PasswordInput } from 'src/app/components/PasswordInput'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Square, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
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
  const { t } = useTranslation()
  const { isResetting } = useOnboardingSteps()
  const { resetOnboardingContextData } = useOnboardingContext()

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

  const onSubmit = useCallback(async () => {
    if (!enableNext) {
      return
    }

    if (checkSubmit()) {
      await onComplete(password)
    }
  }, [onComplete, password, checkSubmit, enableNext])

  const handleBack = useCallback(() => {
    // reset the pending mnemonic when going back from password screen
    // to avoid having them in the context when coming back to either screen
    resetOnboardingContextData()
    if (onBack) {
      onBack()
    } else {
      navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })
    }
  }, [onBack, resetOnboardingContextData])

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SetPassword}>
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <Lock color="$neutral1" size={iconSizes.icon24} />
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
        onBack={handleBack}
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
