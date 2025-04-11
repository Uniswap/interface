import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { ChangePasswordForm } from 'src/app/features/settings/password/ChangePasswordForm'
import { EnterPasswordForm } from 'src/app/features/settings/password/EnterPasswordForm'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'

enum Step {
  EnterPassword = 0,
  ChangePassword = 1,
}

export function SettingsChangePasswordScreen(): JSX.Element {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(Step.EnterPassword)
  const { navigateBack } = useExtensionNavigation()

  let formContent
  switch (currentStep) {
    case Step.EnterPassword:
      formContent = <EnterPasswordForm onNext={(): void => setCurrentStep(Step.ChangePassword)} />
      break
    case Step.ChangePassword:
      formContent = <ChangePasswordForm onNext={(): void => navigateBack()} />
      break
  }

  return (
    <Flex grow backgroundColor="$surface1" gap="$none">
      <ScreenHeader title={t('settings.setting.password.title')} />
      {formContent}
    </Flex>
  )
}
