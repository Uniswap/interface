import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { PasswordInput } from 'src/app/components/PasswordInput'
import { removeAllDappConnectionsFromExtension } from 'src/app/features/dapp/actions'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { Flex, inputStyles, LabeledCheckbox, Text } from 'ui/src'
import { TrashFilled } from 'ui/src/components/icons'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function RemoveRecoveryPhraseVerify(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [password, setPassword] = useState('')
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [hideInput, setHideInput] = useState(true)
  const [checked, setChecked] = useState(false)

  const onChangeText = (text: string): void => {
    setPassword(text)
    setShowPasswordError(false)
  }

  const onCheckPressed = (): void => {
    setChecked(!checked)
  }

  const associatedAccounts = useSignerAccounts()

  const onRemove = async (): Promise<void> => {
    const accountsToRemove = associatedAccounts
    const mnemonicId = accountsToRemove[0]?.mnemonicId
    const accAddress = accountsToRemove[0]?.address

    if (!accAddress) {
      logger.error(new Error('No accounts to remove'), {
        tags: { file: 'RemoveRecoveryPhraseVerify', function: 'onRemove' },
      })
      return
    }

    if (!mnemonicId) {
      logger.error(new Error('mnemonicId does not exist'), {
        tags: { file: 'RemoveRecoveryPhraseVerify', function: 'onRemove' },
      })
      return
    }

    await Keyring.removeMnemonic(mnemonicId)
    await Keyring.removePassword()

    await removeAllDappConnectionsFromExtension()
    await dispatch(setIsTestnetModeEnabled(false))

    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        accounts: accountsToRemove,
      }),
    )

    sendAnalyticsEvent(WalletEventName.WalletRemoved, {
      wallets_removed: accountsToRemove.map((a) => a.address),
    })

    await focusOrCreateOnboardingTab()
    window.close()
  }

  const checkPassword = async (): Promise<void> => {
    if (!checked) {
      return
    }
    const success = await Keyring.checkPassword(password)
    if (!success) {
      setShowPasswordError(true)
      return
    }
    await onRemove()
  }

  const removeButtonEnabled = checked && !showPasswordError && password.length > 0

  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader title={t('setting.recoveryPhrase.remove')} />
      <SettingsRecoveryPhrase
        icon={<TrashFilled color="$statusCritical" size="$icon.24" strokeWidth="$spacing2" />}
        nextButtonEnabled={removeButtonEnabled}
        nextButtonText={t('setting.recoveryPhrase.remove')}
        nextButtonVariant="critical"
        subtitle={t('setting.recoveryPhrase.remove.subtitle')}
        title={t('setting.recoveryPhrase.remove.title')}
        onNextPressed={checkPassword}
      >
        <Flex grow justifyContent="space-between">
          <Flex alignItems="center" gap="$spacing12">
            <PasswordInput
              autoFocus
              backgroundColor={showPasswordError ? '$statusCritical2' : '$surface1'}
              focusStyle={inputStyles.inputFocus}
              hideInput={hideInput}
              placeholder={t('common.input.password.placeholder')}
              value={password}
              onChangeText={onChangeText}
              onSubmitEditing={checkPassword}
              onToggleHideInput={setHideInput}
              {...(showPasswordError && { borderColor: '$statusCritical' })}
            />
            <Text color="$statusCritical" minHeight="$spacing24" textAlign="center" variant="body2">
              {showPasswordError ? t('extension.passwordPrompt.error.wrongPassword') : ''}
            </Text>
          </Flex>
          <Flex pb="$spacing24">
            <LabeledCheckbox
              checked={checked}
              text={
                <Flex>
                  <Text color="$neutral1" variant="body3">
                    {t('setting.recoveryPhrase.remove.confirm.title')}
                  </Text>
                  <Text color="$neutral2" variant="body3">
                    {t('setting.recoveryPhrase.remove.confirm.subtitle')}
                  </Text>
                </Flex>
              }
              onCheckPressed={onCheckPressed}
            />
          </Flex>
        </Flex>
      </SettingsRecoveryPhrase>
    </Flex>
  )
}
