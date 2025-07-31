import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import {
  startFetchingCloudStorageBackups,
  stopFetchingCloudStorageBackups,
} from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { clearCloudBackups } from 'src/features/CloudBackup/cloudBackupSlice'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Loader } from 'ui/src'
import { DownloadAlt, OSDynamicCloudIcon } from 'ui/src/components/icons'
import { imageSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { config } from 'uniswap/src/config'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid, isIOS } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackupLoading>

const MIN_LOADING_UI_MS = ONE_SECOND_MS
// 10s timeout time for query for backups, since we don't know when the query completes

const MAX_LOADING_TIMEOUT_MS = config.isE2ETest ? ONE_SECOND_MS : ONE_SECOND_MS * 10
/**
 * Workaround for Android GDrive backup. There are many UXs depending on the API and
 * at the moment we are only e2e testing seed phrase input.
 */
const ANDROID_E2E_WORKAROUND = config.isE2ETest && isAndroid

export function RestoreCloudBackupLoadingScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic
  // inits with null before fetchCloudStorageBackups starts fetching
  const [isLoading, setIsLoading] = useState<boolean | null>(null)
  const [isError, setIsError] = useState(false)

  // when we are restoring after phone migration
  const signerAccounts = useSignerAccounts()
  const mnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const backups = useCloudBackups(mnemonicId)

  useNavigationHeader(navigation)

  // Starts query for cloud backup files, backup files found are streamed into Redux
  const fetchCloudStorageBackups = useCallback(() => {
    setIsError(false)
    setIsLoading(true)
    // delays native oauth consent screen to avoid UI freezes
    setTimeout(async () => {
      try {
        if (ANDROID_E2E_WORKAROUND) {
          setIsLoading(false)
          return
        }
        await startFetchingCloudStorageBackups()
        // Workaround for Android. Android awaits fetching as part of initial call, so we can stop fetching after the await.
        // TODO: iOS native module needs to be rewritten to await backups fetch instead of using unreliable setTimeout
        if (isAndroid) {
          setIsLoading(false)
        }
      } catch (e) {
        logger.error(e, { tags: { file: 'RestoreCloudBackupLoadingScreen.tsx', function: 'fetchCloudStorageBackups' } })
        setIsError(true)
      }
    }, 0)
  }, [])

  /**
   * iOS workaround for awaiting for the native module to finish fetching backups.
   * Current implementation of iOS startFetchingCloudStorageBackups does not await backup fetching.
   *
   * Monitors the fetching process and uses two different timeouts:
   * - MAX_LOADING_TIMEOUT_MS for initial backup fetch
   * - MIN_LOADING_UI_MS if subsequent backups are being fetched.
   * Stops the backup fetching process and sets the loading state to false once the timeout is reached.
   */
  useEffect(() => {
    if (!isLoading || !isIOS) {
      return undefined
    }
    const timer = setTimeout(
      () => {
        if (backups.length === 0) {
          logger.debug(
            'RestoreCloudBackupLoadingScreen',
            'fetchCloudStorageBackups',
            `Timed out fetching cloud backups after ${MAX_LOADING_TIMEOUT_MS}ms`,
          )
        }
        stopFetchingCloudStorageBackups()
        setIsLoading(false)
      },
      backups.length === 0 ? MAX_LOADING_TIMEOUT_MS : MIN_LOADING_UI_MS,
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
      return navigation.addListener('transitionEnd', () => {
        dispatch(clearCloudBackups())
        fetchCloudStorageBackups()
      })
    }, [dispatch, fetchCloudStorageBackups, navigation]),
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
        ...params,
        mnemonicId: backups[0].mnemonicId,
      })
    } else {
      navigation.replace(OnboardingScreens.RestoreCloudBackup, {
        ...params,
      })
    }
  }, [backups, isLoading, navigation, params])

  if (isError) {
    return (
      <Flex alignSelf="center" px="$spacing16">
        <BaseCard.ErrorState
          description={t('account.cloud.error.backup.message')}
          icon={<OSDynamicCloudIcon color="$neutral3" size={imageSizes.image48} />}
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
            onRetry={fetchCloudStorageBackups}
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
