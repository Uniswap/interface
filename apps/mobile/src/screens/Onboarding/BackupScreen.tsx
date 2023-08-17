import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import {
  AppStackParamList,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { EducationContentType } from 'src/components/education'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import CloudIcon from 'ui/src/assets/icons/cloud.svg'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import PaperIcon from 'ui/src/assets/icons/paper-stack.svg'
import { useAsyncData } from 'utilities/src/react/hooks'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const { navigate } = useOnboardingStackNavigation()

  const { data: cloudStorageAvailable } = useAsyncData(isCloudStorageAvailable)

  const activeAccount = useActiveAccount()
  const activeAccountBackups = activeAccount?.backups

  const renderHeaderLeft = useCallback(
    () => (
      <BackButton
        onPressBack={(): void => {
          navigation.pop(2)
        }}
      />
    ),
    [navigation]
  )

  useEffect(() => {
    const shouldOverrideBackButton = params?.importType === ImportType.SeedPhrase
    if (shouldOverrideBackButton) {
      navigation.setOptions({
        headerLeft: renderHeaderLeft,
      })
    }
  })

  const onPressNext = (): void => {
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }

  const onPressEducationButton = (): void => {
    navigation.navigate(Screens.Education, {
      type: EducationContentType.SeedPhrase,
      importType: params.importType,
      entryPoint: params.entryPoint,
    })
  }

  const onPressICloudBackup = (): void => {
    if (!cloudStorageAvailable) {
      Alert.alert(
        t('iCloud Drive not available'),
        t(
          'Please verify that you are logged in to an Apple ID with iCloud Drive enabled on this device and try again.'
        ),
        [
          { text: t('Go to settings'), onPress: openSettings, style: 'default' },
          { text: t('Not now'), style: 'cancel' },
        ]
      )
      return
    }
    if (!activeAccount?.address) return
    navigate({
      name: OnboardingScreens.BackupCloudPasswordCreate,
      params: { ...params, address: activeAccount.address },
      merge: true,
    })
  }

  const onPressManualBackup = (): void => {
    navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
  }

  const onPressContinue = (): void => {
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1
  const showSkipOption =
    !activeAccountBackups?.length &&
    (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  const hasCloudBackup = activeAccountBackups?.some((backup) => backup === BackupType.Cloud)
  const hasManualBackup = activeAccountBackups?.some((backup) => backup === BackupType.Manual)

  return (
    <OnboardingScreen
      subtitle={t(
        "Remember, backups are your lifeline. They're your ticket back in if something goes wrong."
      )}
      title={t('Choose a backup for your wallet')}>
      <Flex grow justifyContent="space-between">
        <Flex gap="spacing12">
          <OptionCard
            blurb={t('Safe, simple, and all you need to save is your password.')}
            disabled={hasCloudBackup}
            elementName={ElementName.AddiCloudBackup}
            icon={<CloudIcon color={theme.colors.accent1} height={theme.iconSizes.icon16} />}
            title={IS_ANDROID ? t('Backup with Google Drive') : t('Backup with iCloud')}
            onPress={onPressICloudBackup}
          />
          <OptionCard
            blurb={t("Top-notch security with no third parties. You're in control.")}
            disabled={hasManualBackup}
            elementName={ElementName.AddManualBackup}
            icon={<PaperIcon color={theme.colors.accent1} height={theme.iconSizes.icon16} />}
            title={t('Backup with recovery phrase')}
            onPress={onPressManualBackup}
          />
        </Flex>
        <Flex grow justifyContent="flex-end">
          <TouchableArea alignSelf="center" py="none" onPress={onPressEducationButton}>
            <Flex centered row gap="spacing4">
              <InfoCircle
                color={theme.colors.neutral2}
                height={theme.iconSizes.icon24}
                width={theme.iconSizes.icon24}
              />
              <Text color="neutral1" variant="subheadSmall">
                {t('Learn about wallet safety and recovery')}
              </Text>
            </Flex>
          </TouchableArea>
          {showSkipOption && (
            <Trace logPress element={ElementName.Next}>
              <Button
                emphasis={ButtonEmphasis.Tertiary}
                label={t('I already backed up')}
                onPress={onPressNext}
              />
            </Trace>
          )}
          <Trace logPress element={ElementName.Next}>
            <Button
              disabled={disabled}
              label={disabled ? t('Select backup to continue') : t('Continue')}
              onPress={onPressContinue}
            />
          </Trace>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}
