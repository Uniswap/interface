import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactNode, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
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

export function ManualBackupScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()

  const [acknowledged, setAcknowledged] = useState(false)
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
      navigation.navigate(OnboardingScreens.Backup)
    }
  }, [activeAccount?.backups, navigation])

  switch (view) {
    case View.Education:
      return (
        <OnboardingScreen
          subtitle={t('Prepare to back up your seed phrase by keeping these steps in mind.')}
          title={t('Back up manually')}>
          <Flex grow justifyContent="space-between" px="sm">
            <EducationSection />

            <Flex row>
              <Switch
                testID={ElementName.Switch}
                value={acknowledged}
                onValueChange={(newValue: boolean) => setAcknowledged(newValue)}
              />
              <Text color="deprecated_gray600" style={styles.switchLabel} variant="caption">
                {t(
                  'I acknowledge that if I lose my seed phrase, Uniswap Labs can’t recover my wallet.'
                )}
              </Text>
            </Flex>
            <Flex justifyContent="flex-end">
              <PrimaryButton
                disabled={!acknowledged}
                label={t('Continue')}
                name={ElementName.Next}
                testID={ElementName.Next}
                onPress={nextView}
              />
            </Flex>
          </Flex>
        </OnboardingScreen>
      )
    case View.View:
      return (
        <OnboardingScreen
          subtitle={t('Remember that the order of the words matters.')}
          title={t('Write down your seed phrase')}>
          <Flex justifyContent="space-between">
            <MnemonicDisplay address={activeAccount!.address} style={flex.fill} />
            <Flex justifyContent="flex-end">
              <PrimaryButton
                label={t('Continue')}
                name={ElementName.Next}
                testID={ElementName.Next}
                onPress={onValidationSuccessful}
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
  const spacer = <Box borderTopColor="deprecated_gray50" borderTopWidth={1} />
  return (
    <Flex gap="lg">
      {spacer}
      <EducationRow
        icon={<CloudIcon color="white" height={20} width={20} />}
        label={t('Write it down in private')}
        sublabel={t(
          "Ensure that you're in a private location and write down your seed phrase's words in order."
        )}
      />
      {spacer}
      <EducationRow
        icon={<CloudIcon color="white" height={20} width={20} />}
        label={t('Keep it somewhere safe')}
        sublabel={t('Remember that anyone who has your seed phrase can access your wallet.')}
      />
      {spacer}
      <EducationRow
        icon={<CloudIcon color="white" height={20} width={20} />}
        label={t("Don't lose it")}
        sublabel={t(
          "If you lose your seed phrase, you'll lose access to your wallet and its contents."
        )}
      />
      {spacer}
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
                <Box bg="deprecated_gray50" borderRadius="md" height={38} p="sm" width={38}>
                  {icon}
                </Box>
              </Box>
            </LinearGradientBox>
          </Box>
          <Flex flex={1} gap="none">
            <Text variant="body1">{label}</Text>
            <Text color="deprecated_gray600" variant="caption">
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
  switchLabel: {
    flex: 1,
    flexWrap: 'wrap',
  },
})
