import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import {
  startFetchingCloudStorageBackups,
  stopFetchingCloudStorageBackups,
} from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { clearCloudBackups } from 'src/features/CloudBackup/cloudBackupSlice'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Flex, Icons, Loader } from 'ui/src'
import { imageSizes } from 'ui/src/theme'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { useNonPendingSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupLoading
>

const MIN_LOADING_UI_MS = ONE_SECOND_MS
// 10s timeout time for query for backups, since we don't know when the query completes
const MAX_LOADING_TIMEOUT_MS = ONE_SECOND_MS * 10

export function RestoreCloudBackupLoadingScreen({
  navigation,
  route: { params },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const entryPoint = params.entryPoint
  const importType = params.importType

  const isRestoringMnemonic = importType === ImportType.RestoreMnemonic
  // inits with null before fetchCloudStorageBackups starts fetching
  const [isLoading, setIsLoading] = useState<boolean | null>(null)
  const [isError, setIsError] = useState(false)

  // when we are restoring after phone migration
  const signerAccounts = useNonPendingSignerAccounts()
  const mnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const backups = useCloudBackups(mnemonicId)

  useAddBackButton(navigation)

  // Starts query for cloud backup files, backup files found are streamed into Redux
  const fetchCloudStorageBackups = useCallback(async () => {
    setIsError(false)
    try {
      await startFetchingCloudStorageBackups()
      setIsLoading(true)
    } catch (e) {
      setIsError(true)
    }
  }, [])

  /**
   * Monitors the fetching process and uses two different timeouts:
   * - MAX_LOADING_TIMEOUT_MS for initial backup fetch
   * - MIN_LOADING_UI_MS if subsequent backups are being fetched.
   * Stops the backup fetching process and sets the loading state to false once the timeout is reached.
   */
  useEffect(() => {
    if (!isLoading) {
      return
    }
    const timer = setTimeout(
      () => {
        if (backups.length === 0) {
          logger.debug(
            'RestoreCloudBackupLoadingScreen',
            'fetchCloudStorageBackups',
            `Timed out fetching cloud backups after ${MAX_LOADING_TIMEOUT_MS}ms`
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        stopFetchingCloudStorageBackups()
        setIsLoading(false)
      },
      backups.length === 0 ? MAX_LOADING_TIMEOUT_MS : MIN_LOADING_UI_MS
    )

    return () => {
      clearTimeout(timer)
    }
  }, [backups.length, isLoading])

  /**
   * Initiates the backup fetching process when the screen comes into focus, helping avoid potential issues with Android's consent screens.
   * 1. Listens for the end of a navigation transition event.
   * 2. Clears any previous fetched backups from state or redux store.
   * 3. Starts the backup fetching process anew.
   */
  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('transitionEnd', async () => {
        dispatch(clearCloudBackups())
        await fetchCloudStorageBackups()
      })
    }, [dispatch, fetchCloudStorageBackups, navigation])
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
    if (backups.length === 1 && backups[0]) {
      navigation.replace(OnboardingScreens.RestoreCloudBackupPassword, {
        importType,
        entryPoint,
        mnemonicId: backups[0].mnemonicId,
      })
    } else {
      navigation.replace(OnboardingScreens.RestoreCloudBackup, {
        importType,
        entryPoint,
      })
    }
  }, [backups, entryPoint, importType, isLoading, navigation])

  if (isError) {
    return (
      <Flex alignSelf="center" px="$spacing16">
        <BaseCard.ErrorState
          description={t('account.cloud.error.backup.message')}
          icon={<Icons.OSDynamicCloudIcon color="$neutral3" size={imageSizes.image48} />}
          retryButtonLabel={t('common.button.retry')}
          title={t('account.cloud.error.backup.title')}
          onRetry={fetchCloudStorageBackups}
        />
      </Flex>
    )
  }

  // Handle no backups found error state
  if (isLoading === false && backups.length === 0) {
    if (isRestoringMnemonic) {
      navigation.replace(OnboardingScreens.SeedPhraseInput, {
        importType,
        entryPoint,
      })
    } else {
      return (
        <Flex alignSelf="center" px="$spacing16">
          <BaseCard.ErrorState
            description={t('account.cloud.empty.description', {
              cloudProviderName: getCloudProviderName(),
            })}
            icon={<Icons.OSDynamicCloudIcon color="$neutral3" size={imageSizes.image48} />}
            retryButtonLabel={t('common.button.retry')}
            title={t('account.cloud.empty.title')}
            onRetry={fetchCloudStorageBackups}
          />
        </Flex>
      )
    }
  }

  return (
    <OnboardingScreen title={t('account.cloud.loading.title')}>
      <Loader.Wallets repeat={5} />
    </OnboardingScreen>
  )
}
