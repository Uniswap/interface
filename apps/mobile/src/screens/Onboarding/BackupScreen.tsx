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
import Trace from 'src/components/Trace/Trace'
import { BackButton } from 'src/components/buttons/BackButton'
import { EducationContentType } from 'src/components/education'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { Button, Flex, Icons, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import PaperIcon from 'ui/src/assets/icons/paper-stack.svg'
import { iconSizes } from 'ui/src/theme'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { isAndroid } from 'uniswap/src/utils/platform'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { ElementName } from 'wallet/src/telemetry/constants'
import { openSettings } from 'wallet/src/utils/linking'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, Screens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
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
        isAndroid
          ? t('account.cloud.error.unavailable.title.android')
          : t('account.cloud.error.unavailable.title.ios'),
        isAndroid
          ? t('account.cloud.error.unavailable.message.android')
          : t('account.cloud.error.unavailable.message.ios'),
        [
          {
            text: t('account.cloud.error.unavailable.button.settings'),
            onPress: openSettings,
            style: 'default',
          },
          { text: t('account.cloud.error.unavailable.button.cancel'), style: 'cancel' },
        ]
      )
      return
    }
    if (!activeAccount?.address) {
      return
    }
    navigate({
      name: OnboardingScreens.BackupCloudPasswordCreate,
      params: { ...params, address: activeAccount.address },
      merge: true,
    })
  }

  const onPressManualBackup = (): void => {
    navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
  }

  const showSkipOption =
    !activeAccountBackups?.length &&
    (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  const hasCloudBackup = activeAccountBackups?.some((backup) => backup === BackupType.Cloud)
  const hasManualBackup = activeAccountBackups?.some((backup) => backup === BackupType.Manual)

  const isCreatingNew = params?.importType === ImportType.CreateNew
  const screenTitle = isCreatingNew
    ? t('onboarding.backup.title.new')
    : t('onboarding.backup.title.existing')
  const options = []
  options.push(
    <OptionCard
      key={ElementName.AddCloudBackup}
      blurb={t('onboarding.backup.option.cloud.description')}
      disabled={hasCloudBackup}
      elementName={ElementName.AddCloudBackup}
      icon={<Icons.OSDynamicCloudIcon color="$accent1" size="$icon.16" />}
      title={t('onboarding.backup.option.cloud.title', {
        cloudProviderName: getCloudProviderName(),
      })}
      onPress={onPressCloudBackup}
    />
  )
  if (isCreatingNew) {
    options.push(
      <OptionCard
        key={ElementName.AddManualBackup}
        blurb={t('onboarding.backup.option.manual.description')}
        disabled={hasManualBackup}
        elementName={ElementName.AddManualBackup}
        icon={<PaperIcon color={colors.accent1.get()} height={iconSizes.icon16} />}
        title={t('onboarding.backup.option.manual.title')}
        onPress={onPressManualBackup}
      />
    )
  }

  return (
    <OnboardingScreen subtitle={t('onboarding.backup.subtitle')} title={screenTitle}>
      <Flex grow justifyContent="space-between">
        <Flex gap="$spacing24">
          <Flex
            gap="$spacing12"
            shadowColor="$surface3"
            shadowRadius={!isDarkMode ? '$spacing8' : undefined}>
            {options}
          </Flex>
          {!isCreatingNew && (
            <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />
          )}
        </Flex>

        <Flex gap="$spacing12" justifyContent="flex-end">
          {isCreatingNew && (
            <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />
          )}
          {showSkipOption && (
            <Trace logPress element={ElementName.Next}>
              <Button testID={ElementName.Next} theme="tertiary" onPress={onPressNext}>
                {t('common.button.later')}
              </Button>
            </Trace>
          )}
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function RecoveryPhraseTooltip({
  onPressEducationButton,
}: {
  onPressEducationButton: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      flexDirection="row"
      gap="$spacing8"
      py="$spacing8"
      onPress={onPressEducationButton}>
      <Icons.QuestionInCircleFilled color="$surface1" size="$icon.20" />
      <Text color="$neutral3" variant="body2">
        {t('onboarding.tooltip.recoveryPhrase.trigger')}
      </Text>
    </TouchableArea>
  )
}
