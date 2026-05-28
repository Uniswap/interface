import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PasswordInput } from 'src/app/components/PasswordInput'
import { Button, Flex, Text } from 'ui/src'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

function useEnterPasswordForm(): {
  password: string
  submitEnabled: boolean
  error: string
  onInputChange: (input: string) => void
  onSubmit: () => Promise<boolean>
} {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [submitEnabled, setSubmitEnabled] = useState(false)
  const [error, setError] = useState('')

  const onInputChange = function onInputChange(input: string): void {
    setPassword(input)
    setSubmitEnabled(!!input)
    setError('')
  }

  const onSubmit = async function onSubmit(): Promise<boolean> {
    const success = await Keyring.checkPassword(password)
    if (!success) {
      setError(t('extension.settings.password.error.wrong'))
    }
    return success
  }

  return {
    password,
    submitEnabled,
    error,
    onInputChange,
    onSubmit,
  }
}

export function EnterPasswordForm({ onNext }: { onNext: () => void }): JSX.Element {
  const { t } = useTranslation()
  const [hideInput, setHideInput] = useState(true)
  const { password, submitEnabled, error, onInputChange, onSubmit } = useEnterPasswordForm()

  const onContinue = async (): Promise<void> => {
    const success = await onSubmit()
    if (success) {
      onNext()
    }
  }

  return (
    <Flex grow>
      <Flex grow alignItems="center" gap="$spacing8" px="$spacing12">
        <Text color="$neutral2" pb="$spacing8" pt="$spacing32" variant="body2">
          {t('extension.settings.password.enter.title')}
        </Text>
        <PasswordInput
          autoFocus
          hideInput={hideInput}
          placeholder={t('extension.settings.password.placeholder')}
          value={password}
          onChangeText={onInputChange}
          onSubmitEditing={onContinue}
          onToggleHideInput={setHideInput}
        />
        {error && (
          <Text color="$statusCritical" variant="body3">
            {error}
          </Text>
        )}
      </Flex>
      <Flex row>
        <Button isDisabled={!submitEnabled} emphasis="secondary" onPress={onContinue}>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
