import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppStackParamList,
  EducationContentType,
  OnboardingStackParamList,
  useOnboardingStackNavigation,
} from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { checkCloudBackupOrShowAlert } from 'src/components/mnemonic/cloudImportUtils'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { Flex, ScrollView, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import { Cloud, PenLine, QuestionInCircleFilled, ShieldCheck } from 'ui/src/components/icons'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup, hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type Props = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, OnboardingScreens.Backup>,
  NativeStackScreenProps<AppStackParamList, MobileScreens.Education>
>

export function BackupScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { navigate } = useOnboardingStackNavigation()
  const shadowProps = useShadowPropsShort()

  const { getOnboardingOrImportedAccount } = useOnboardingContext()
  const onboardingContextAccount = getOnboardingOrImportedAccount()
  const activeAccount = useActiveAccount()
  const account = onboardingContextAccount || activeAccount
  const address = account?.address

  const isCreatingNew =
    params.importType === ImportType.CreateNew || params.entryPoint === OnboardingEntryPoint.BackupCard
  const screenTitle = isCreatingNew ? t('onboarding.backup.title.new') : t('onboarding.backup.title.existing')
  const fromBackupCard = params.entryPoint === OnboardingEntryPoint.BackupCard

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
    const shouldOverrideBackButton = params.importType === ImportType.SeedPhrase
    if (shouldOverrideBackButton) {
      navigation.setOptions({
        headerLeft: renderHeaderLeft,
        gestureEnabled: false,
      })
    }
  })

  if (!address) {
    throw Error('No account available to backup')
  }

  const onPressNext = (): void => {
    if (fromBackupCard) {
      navigation.navigate(MobileScreens.Home)
    } else {
      navigation.navigate({
        name: OnboardingScreens.Notifications,
        params,
        merge: true,
      })
    }
  }

  const onPressEducationButton = (): void => {
    navigation.navigate(MobileScreens.Education, {
      type: EducationContentType.SeedPhrase,
      importType: params.importType,
      entryPoint: params.entryPoint,
    })
  }

  const onPressCloudBackup = async (): Promise<void> => {
    const hasCloudBackup = await checkCloudBackupOrShowAlert(t)
    if (!hasCloudBackup) {
      return
    }

    navigate({
      name: OnboardingScreens.BackupCloudPasswordCreate,
      params: { ...params, address },
      merge: true,
    })
  }

  const onPressManualBackup = (): void => {
    navigate({ name: OnboardingScreens.BackupManual, params: { ...params, address }, merge: true })
  }

  const showSkipOption =
    hasExternalBackup(account) &&
    (params.importType === ImportType.SeedPhrase || params.importType === ImportType.Restore)

  const hasCloudBackup = hasBackup(BackupType.Cloud, account)
  const hasManualBackup = hasBackup(BackupType.Manual, account)

  const options = []
  options.push(
    <OptionCard
      key={ElementName.AddCloudBackup}
      badgeText={t('onboarding.backup.option.badge.quick')}
      blurb={t('onboarding.backup.option.cloud.description', { cloudProviderName: getCloudProviderName() })}
      disabled={hasCloudBackup}
      elementName={ElementName.AddCloudBackup}
      icon={<Cloud color="$accent1" size="$icon.16" />}
      testID={TestID.AddCloudBackup}
      title={t('onboarding.backup.option.cloud.title')}
      onPress={onPressCloudBackup}
    />,
  )
  if (isCreatingNew || fromBackupCard) {
    options.push(
      <OptionCard
        key={ElementName.AddManualBackup}
        blurb={t('onboarding.backup.option.manual.description')}
        disabled={hasManualBackup}
        elementName={ElementName.AddManualBackup}
        icon={<PenLine color="$accent1" size="$icon.12" />}
        testID={TestID.AddManualBackup}
        title={t('onboarding.backup.option.manual.title')}
        onPress={onPressManualBackup}
      />,
    )
  }

  // In case, when RecoveryPhraseTooltip is on the bottom, we lower the height of ScrollView to make space for it
  const scrollViewHeight = isCreatingNew ? '90%' : '100%'

  return (
    <OnboardingScreen
      Icon={ShieldCheck}
      subtitle={t('onboarding.backup.subtitle')}
      title={screenTitle}
      onSkip={showSkipOption ? onPressNext : undefined}
    >
      <Flex grow justifyContent="space-between">
        <Flex gap="$spacing24">
          <ScrollView showsVerticalScrollIndicator={false} style={{ height: scrollViewHeight }}>
            <Flex {...shadowProps} gap="$spacing12">
              {options}
            </Flex>

            {!isCreatingNew && <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />}
          </ScrollView>
        </Flex>

        <Flex gap="$spacing12" justifyContent="flex-end">
          {isCreatingNew && <RecoveryPhraseTooltip onPressEducationButton={onPressEducationButton} />}
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
      py="$spacing16"
      onPress={onPressEducationButton}
    >
      <QuestionInCircleFilled color="$neutral3" size="$icon.20" />
      <Text color="$neutral3" variant="body2">
        {t('onboarding.tooltip.recoveryPhrase.trigger')}
      </Text>
    </TouchableArea>
  )
}
