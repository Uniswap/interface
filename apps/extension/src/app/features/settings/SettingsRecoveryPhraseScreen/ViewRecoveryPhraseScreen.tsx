import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { SeedPhraseDisplay } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SeedPhraseDisplay'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled, Eye, Key, Laptop } from 'ui/src/components/icons'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

const enum ViewStep {
  Warning = 0,
  Password = 1,
  Reveal = 2,
}

/**
 * This screen is rendered both as a settings route and as a modal in the force upgrade prompt.
 * When making UI changes, please verify both versions look good.
 */
export function ViewRecoveryPhraseScreen({
  mnemonicId: mnemonicIdProp,
  showRemoveButton = true,
  onBackClick,
}: {
  mnemonicId?: string
  showRemoveButton?: boolean
  onBackClick?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const [viewStep, setViewStep] = useState(ViewStep.Warning)

  const mnemonicAccounts = useSignerAccounts()
  const mnemonicAccount = mnemonicAccounts[0]

  const mnemonicId = mnemonicIdProp ?? mnemonicAccount?.mnemonicId

  if (!mnemonicId) {
    throw new Error('Invalid render of `ViewRecoveryPhraseScreen` without `mnemonicId`')
  }

  const showPasswordModal = (): void => {
    setViewStep(ViewStep.Password)
  }

  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader title={t('settings.setting.recoveryPhrase.title')} onBackClick={onBackClick} />

      {viewStep !== ViewStep.Reveal ? (
        <SettingsRecoveryPhrase
          icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
          nextButtonEnabled={true}
          nextButtonText={t('common.button.continue')}
          nextButtonEmphasis="secondary"
          subtitle={t('setting.recoveryPhrase.view.warning.message1')}
          title={t('setting.recoveryPhrase.view.warning.title')}
          onNextPressed={showPasswordModal}
        >
          <EnterPasswordModal
            isOpen={viewStep === ViewStep.Password}
            onClose={() => setViewStep(ViewStep.Warning)}
            onNext={() => setViewStep(ViewStep.Reveal)}
          />

          <Flex
            alignItems="flex-start"
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth="$spacing1"
            gap="$spacing24"
            p="$spacing12"
            mb="$spacing12"
          >
            <Flex row alignItems="center" gap="$spacing12">
              <Flex p={6}>
                <Eye color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message2')}
              </Text>
            </Flex>

            <Flex row alignItems="center" gap="$spacing12" width="100%">
              <Flex p={6}>
                <Key color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message3')}
              </Text>
            </Flex>

            <Flex row alignItems="center" gap="$spacing12">
              <Flex p={6}>
                <Laptop color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message4')}
              </Text>
            </Flex>
          </Flex>
        </SettingsRecoveryPhrase>
      ) : (
        <Flex fill gap="$spacing24" pt="$spacing36">
          <SeedPhraseDisplay mnemonicId={mnemonicId} />

          <Flex alignItems="center" gap="$spacing8">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('setting.recoveryPhrase.warning.view.message')}
            </Text>
          </Flex>

          {showRemoveButton && (
            <Flex fill justifyContent="flex-end">
              <Flex row>
                <Button
                  variant="critical"
                  emphasis="secondary"
                  onPress={(): void =>
                    navigate(
                      `/${AppRoutes.Settings}/${SettingsRoutes.RemoveRecoveryPhrase}/${RemoveRecoveryPhraseRoutes.Wallets}`,
                      { replace: true },
                    )
                  }
                >
                  {t('setting.recoveryPhrase.remove')}
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  )
}
