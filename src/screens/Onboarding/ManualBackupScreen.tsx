import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactNode, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import BriefcaseIcon from 'src/assets/icons/briefcase.svg'
import EyeIcon from 'src/assets/icons/eye-off.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import WarningModal from 'src/components/modals/WarningModal'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { BackupType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.BackupManual>

enum View {
  Education,
  View,
}

export function ManualBackupScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showScreenShotWarningModal, setShowScreenShotWarningModal] = useState(false)
  const [view, nextView] = useReducer((curView: View) => curView + 1, View.Education)

  const onValidationSuccessful = () => {
    if (activeAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: activeAccount.address,
          backupMethod: BackupType.Manual,
        })
      )
    }
  }

  useEffect(() => {
    if (activeAccount?.backups?.includes(BackupType.Manual)) {
      navigation.navigate({ name: OnboardingScreens.Backup, params, merge: true })
    }
  }, [activeAccount?.backups, navigation, params])

  switch (view) {
    case View.Education:
      return (
        <OnboardingScreen
          subtitle={t('Keep the following steps in mind before backing up your recovery phrase:')}
          title={t('Back up manually')}>
          <WarningModal
            caption={t(
              'It’s up to you to backup your recovery phrase by storing it in a safe and memorable place.'
            )}
            closeText={t('Cancel')}
            confirmText={t('I understand')}
            isVisible={showTermsModal}
            modalName={ModalName.RecoveryWarning}
            title={t('If your lose your recovery phrase, Uniswap Labs can’t restore your wallet')}
            onClose={() => setShowTermsModal(false)}
            onConfirm={nextView}
          />

          <Flex grow alignItems="center" justifyContent="space-between" px="sm">
            <Flex width="90%">
              <EducationSection />
            </Flex>
            <Flex justifyContent="flex-end" width="100%">
              <PrimaryButton
                label={t('Backup')}
                name={ElementName.Next}
                testID={ElementName.Next}
                variant="onboard"
                onPress={() => setShowTermsModal(true)}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
    case View.View:
      return (
        <OnboardingScreen
          subtitle={t('Remember to record your words in the same order as they are below.')}
          title={t('Write down your recovery phrase')}>
          <WarningModal
            caption={t(
              'Storing your recovery phrase as a screenshot is easy, but it allows anyone with access to your device access to your wallet. We encourage you to delete the screenshot and write down your recovery phrase instead.'
            )}
            confirmText={t('OK')}
            isVisible={showScreenShotWarningModal}
            modalName={ModalName.ScreenshotWarning}
            title={t('Screenshots aren’t secure')}
            onClose={() => setShowScreenShotWarningModal(false)}
            onConfirm={onValidationSuccessful}
          />
          <Flex grow justifyContent="space-between">
            <MnemonicDisplay address={activeAccount!.address} style={flex.fill} />
            <Flex grow justifyContent="flex-end">
              <PrimaryButton
                label={t('Continue')}
                name={ElementName.Next}
                testID={ElementName.Next}
                variant="onboard"
                onPress={() => setShowScreenShotWarningModal(true)}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
  }

  return null
}

function EducationSection() {
  const { t } = useTranslation()
  const spacer = <Box borderTopColor="translucentBackground" borderTopWidth={1} />
  const theme = useAppTheme()
  return (
    <Flex gap="lg" py="xl">
      <EducationRow
        icon={<EyeIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Write it down in private')}
        sublabel={t(
          "Ensure that you're in a private location and write down your recovery phrase's words in order."
        )}
      />
      {spacer}
      <EducationRow
        icon={<BriefcaseIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Keep it somewhere safe')}
        sublabel={t('Remember that anyone who has your recovery phrase can access your wallet.')}
      />
      {spacer}
      <EducationRow
        icon={<LockIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t("Don't lose it")}
        sublabel={t(
          'If you lose your recovery phrase, you’ll lose access to your wallet and its contents.'
        )}
      />
    </Flex>
  )
}

interface EducationRowProps {
  icon: ReactNode
  label: string
  sublabel: string
}

function EducationRow({ icon, label, sublabel }: EducationRowProps) {
  return (
    <Flex gap="lg">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex centered row>
          <Box height={40} width={40}>
            <LinearGradientBox radius="md" stops={RainbowLinearGradientStops}>
              {/* TODO: simplify Rainbow border */}
              <Box alignItems="center" justifyContent="center" style={styles.padded}>
                <Flex centered bg="backgroundBackdrop" borderRadius="md" height={38} width={38}>
                  {icon}
                </Flex>
              </Box>
            </LinearGradientBox>
          </Box>
          <Flex flex={1} gap="none">
            <Text variant="subhead">{label}</Text>
            <Text color="textSecondary" variant="caption">
              {sublabel}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  padded: {
    padding: 1,
  },
})
