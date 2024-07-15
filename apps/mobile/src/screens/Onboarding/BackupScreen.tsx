import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { AppStackParamList, OnboardingStackParamList, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { EducationContentType } from 'src/components/education'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { Button, Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import PaperIcon from 'ui/src/assets/icons/paper-stack.svg'
import { OSDynamicCloudIcon, QuestionInCircleFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { isAndroid } from 'utilities/src/platform'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { openSettings } from 'wallet/src/utils/linking'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, MobileScreens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const { navigate } = useOnboardingStackNavigation()

  const { data: cloudStorageAvailable } = useAsyncData(isCloudStorageAvailable)

  const { getImportedAccountsAddresses, getOnboardingAccountAddress, hasBackup } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const importedAccountsAddresses = getImportedAccountsAddresses()

  const address = onboardingAccountAddress || importedAccountsAddresses?.[0]

  if (!address) {
    throw Error('No account available to backup')
  }

  const renderHeaderLeft = useCallback(
    () => (
      <BackButton
        onPressBack={(): void => {
          navigation.pop(2)
        }}
      />
    ),
    [navigation],
  )

  useEffect(() => {
    const shouldOverrideBackButton = params?.importType === ImportType.SeedPhrase
    if (shouldOverrideBackButton) {
      navigation.setOptions({
        headerLeft: renderHeaderLeft,
        gestureEnabled: false,
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
    navigation.navigate(MobileScreens.Education, {
      type: EducationContentType.SeedPhrase,
      importType: params.importType,
      entryPoint: params.entryPoint,
    })
  }

  const onPressCloudBackup = (): void => {
    if (!cloudStorageAvailable) {
      Alert.alert(
        isAndroid ? t('account.cloud.error.unavailable.title.android') : t('account.cloud.error.unavailable.title.ios'),
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
        ],
      )
      return
    }

    navigate({
      name: OnboardingScreens.BackupCloudPasswordCreate,
      params: { ...params, address },
      merge: true,
    })
  }

  const onPressManualBackup = (): void => {
    navigate({ name: OnboardingScreens.BackupManual, params, merge: true })
  }

  const showSkipOption =
    hasBackup(address) && (params?.importType === ImportType.SeedPhrase || params?.importType === ImportType.Restore)

  const hasCloudBackup = hasBackup(address, BackupType.Cloud)
  const hasManualBackup = hasBackup(address, BackupType.Manual)

  const isCreatingNew = params?.importType === ImportType.CreateNew
  const screenTitle = isCreatingNew ? t('onboarding.backup.title.new') : t('onboarding.backup.title.existing')
  const options = []
  options.push(
    <OptionCard
      key={ElementName.AddCloudBackup}
      blurb={t('onboarding.backup.option.cloud.description')}
      disabled={hasCloudBackup}
      elementName={ElementName.AddCloudBackup}
      icon={<OSDynamicCloudIcon color="$accent1" size="$icon.16" />}
      testID={TestID.AddCloudBackup}
      title={t('onboarding.backup.option.cloud.title', {
        cloudProviderName: getCloudProviderName(),
      })}
      onPress={onPressCloudBackup}
    />,
  )
  if (isCreatingNew) {
    options.push(
      <OptionCard
        key={ElementName.AddManualBackup}
        blurb={t('onboarding.backup.option.manual.description')}
        disabled={hasManualBackup}
        elementName={ElementName.AddManualBackup}
        icon={<PaperIcon color={colors.accent1.get()} height={iconSizes.icon16} />}
        testID={TestID.AddManualBackup}
        title={t('onboarding.backup.option.manual.title')}
        onPress={onPressManualBackup}
      />,
    )
  }

  return (
    <OnboardingScreen subtitle={t('onboarding.backup.subtitle')} title={screenTitle}>
      <Flex grow justifyContent="space-between">
        <Flex gap="$spacing24">
          <Flex gap="$spacing12" shadowColor="$surface3" shadowRadius={!isDarkMode ? '$spacing8' : undefined}>
            {options}
          </Flex>
          {!isCreatingNew && <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />}
        </Flex>

        <Flex gap="$spacing12" justifyContent="flex-end">
          {isCreatingNew && <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />}
          {showSkipOption && (
            <Trace logPress element={ElementName.Next}>
              <Button testID={TestID.Next} theme="tertiary" onPress={onPressNext}>
                {t('common.button.later')}
              </Button>
            </Trace>
          )}
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}

function RecoveryPhraseTooltip({ onPressEducationButton }: { onPressEducationButton: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea
      alignItems="center"
      alignSelf="center"
      flexDirection="row"
      gap="$spacing8"
      py="$spacing8"
      onPress={onPressEducationButton}
    >
      <QuestionInCircleFilled color="$neutral3" size="$icon.20" />
      <Text color="$neutral3" variant="body2">
        {t('onboarding.tooltip.recoveryPhrase.trigger')}
      </Text>
    </TouchableArea>
  )
}
