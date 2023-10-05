import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import {
  AppStackParamList,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { EducationContentType } from 'src/components/education'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import { Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import PaperIcon from 'ui/src/assets/icons/paper-stack.svg'
import { iconSizes } from 'ui/src/theme'
import { useAsyncData } from 'utilities/src/react/hooks'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
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
    navigation.navigate({
      name: OnboardingScreens.Notifications,
      params,
      merge: true,
    })
  }

  const onPressEducationButton = (): void => {
    navigation.navigate(Screens.Education, {
      type: EducationContentType.SeedPhrase,
      importType: params.importType,
      entryPoint: params.entryPoint,
    })
  }

  const onPressCloudBackup = (): void => {
    if (!cloudStorageAvailable) {
      Alert.alert(
        IS_ANDROID ? t('Google Drive not available') : t('iCloud Drive not available'),
        IS_ANDROID
          ? t(
              'Please verify that you are logged in to a Google account with Google Drive enabled on this device and try again.'
            )
          : t(
              'Please verify that you are logged in to an Apple ID with iCloud Drive enabled on this device and try again.'
            ),
        [
          {
            text: t('Go to settings'),
            onPress: openSettings,
            style: 'default',
          },
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
    navigation.navigate({
      name: OnboardingScreens.Notifications,
      params,
      merge: true,
    })
  }

  const disabled = !activeAccountBackups || activeAccountBackups.length < 1
  const showSkipOption =
    !activeAccountBackups?.length &&
    (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  const hasCloudBackup = activeAccountBackups?.some((backup) => backup === BackupType.Cloud)
  const hasManualBackup = activeAccountBackups?.some((backup) => backup === BackupType.Manual)

  const isCreatingNew = params?.importType === ImportType.CreateNew
  const screenTitle = isCreatingNew
    ? t('Choose a backup for your wallet')
    : t('Back up your wallet')
  const options = [
    <OptionCard
      blurb={t('Safe, simple, and all you need to save is your password.')}
      disabled={hasCloudBackup}
      elementName={ElementName.AddCloudBackup}
      icon={<Icons.OSDynamicCloudIcon color="$accent1" size="$icon.16" />}
      title={IS_ANDROID ? t('Backup with Google Drive') : t('Backup with iCloud')}
      onPress={onPressCloudBackup}
    />,
  ]
  if (isCreatingNew) {
    options.push(
      <OptionCard
        blurb={t('Top-notch security with no third parties. You’re in control.')}
        disabled={hasManualBackup}
        elementName={ElementName.AddManualBackup}
        icon={<PaperIcon color={colors.accent1.get()} height={iconSizes.icon16} />}
        title={t('Backup with recovery phrase')}
        onPress={onPressManualBackup}
      />
    )
  }

  return (
    <OnboardingScreen
      subtitle={t(
        'Remember, backups are your lifeline. They’re your ticket back in if something goes wrong.'
      )}
      title={screenTitle}>
      <Flex grow justifyContent="space-between">
        <Flex gap="$spacing12">{options}</Flex>
        <Flex gap="$spacing12" justifyContent="flex-end">
          <TouchableArea alignSelf="center" py="$none" onPress={onPressEducationButton}>
            <Flex centered row gap="$spacing4">
              <InfoCircle
                color={colors.neutral2.get()}
                height={iconSizes.icon24}
                width={iconSizes.icon24}
              />
              <Text color="$neutral1" variant="subheading2">
                {t('Learn about wallet safety and recovery')}
              </Text>
            </Flex>
          </TouchableArea>
          {showSkipOption && (
            <Trace logPress element={ElementName.Next}>
              <Button theme="tertiary" onPress={onPressNext}>
                {t('I already backed up')}
              </Button>
            </Trace>
          )}
          <Trace logPress element={ElementName.Next}>
            <Button disabled={disabled} onPress={onPressContinue}>
              {disabled ? t('Select backup to continue') : t('Continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}
