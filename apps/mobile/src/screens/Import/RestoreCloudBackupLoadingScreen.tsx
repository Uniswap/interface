import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useCloudBackups } from 'src/features/CloudBackup/useCloudBackups'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Loader } from 'ui/src'
import { DownloadAlt, OSDynamicCloudIcon } from 'ui/src/components/icons'
import { imageSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackupLoading>

export function RestoreCloudBackupLoadingScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const entryPoint = params.entryPoint
  const importType = params.importType

  const isRestoringMnemonic = importType === ImportType.RestoreMnemonic

  const { backups, isLoading, isError, triggerCloudStorageBackupsFetch } = useCloudBackups()
  const { addAndroidBackupEmail } = useOnboardingContext()

  useNavigationHeader(navigation)

  /**
   * Initiates the backup fetching process when the screen comes into focus, helping avoid potential issues with Android's consent screens.
   * 1. Listens for the end of a navigation transition event.
   * 2. Clears any previous fetched backups from state or redux store.
   * 3. Starts the backup fetching process anew.
   */
  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('transitionEnd', () => {
        triggerCloudStorageBackupsFetch()
      })
    }, [triggerCloudStorageBackupsFetch, navigation]),
  )

  /**
   * Redirects to restore screens after loading phase.
   * Waits until the loading state is false (indicating that the fetching process has ended).
   * - If only one backup is found, redirects the user to enter the backup password.
   * - If multiple backups are found, navigates the user to a screen to choose which backup to restore.
   */
  useEffect(() => {
    if (isLoading !== false || backups.length === 0) {
      return
    }
    const androidBackupEmail = backups[0]?.googleDriveEmail
    if (androidBackupEmail) {
      addAndroidBackupEmail(androidBackupEmail)
    }
    if (backups.length === 1 && backups[0]) {
      navigation.replace(OnboardingScreens.RestoreCloudBackupPassword, {
        ...params,
        mnemonicId: backups[0].mnemonicId,
      })
    } else {
      navigation.replace(OnboardingScreens.RestoreCloudBackup, {
        importType,
        entryPoint,
        backups,
      })
    }
  }, [backups, isLoading, navigation, params, entryPoint, importType, addAndroidBackupEmail])

  if (isError) {
    return (
      <Flex alignSelf="center" px="$spacing16" gap="$spacing16">
        <BaseCard.ErrorState
          description={t('account.cloud.error.backup.message')}
          icon={<OSDynamicCloudIcon color="$neutral3" size={imageSizes.image48} />}
          retryButtonLabel={t('common.button.retry')}
          title={t('account.cloud.error.backup.title')}
          alternativeButtonLabel={t('onboarding.import.method.restoreSeedPhrase.wallet.title')}
          onRetry={triggerCloudStorageBackupsFetch}
          onAlternativePress={() => {
            navigation.replace(OnboardingScreens.SeedPhraseInput, {
              ...params,
              showAsCloudBackupFallback: true,
            })
          }}
        />
      </Flex>
    )
  }

  // Handle no backups found error state
  if (isLoading === false && backups.length === 0) {
    if (isRestoringMnemonic) {
      navigation.replace(OnboardingScreens.SeedPhraseInput, {
        ...params,
        showAsCloudBackupFallback: true,
      })
    } else {
      return (
        <Flex alignSelf="center" px="$spacing16">
          <BaseCard.ErrorState
            description={t('account.cloud.empty.description', {
              cloudProviderName: getCloudProviderName(),
            })}
            icon={<OSDynamicCloudIcon color="$neutral3" size={imageSizes.image48} />}
            retryButtonLabel={t('common.button.retry')}
            title={t('account.cloud.empty.title')}
            onRetry={triggerCloudStorageBackupsFetch}
          />
        </Flex>
      )
    }
  }

  return (
    <OnboardingScreen Icon={DownloadAlt} title={t('account.cloud.loading.title')}>
      <Loader.Wallets repeat={5} />
    </OnboardingScreen>
  )
}
