import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { IS_ANDROID } from 'src/constants/globals'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import {
  startFetchingCloudStorageBackups,
  stopFetchingCloudStorageBackups,
} from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Icons } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
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
  const theme = useAppTheme()
  const entryPoint = params.entryPoint
  const importType = params.importType

  const isRestoringMnemonic = importType === ImportType.RestoreMnemonic

  const [isLoading, setIsLoading] = useState(true)

  // when we are restoring after phone migration
  const signerAccounts = useNonPendingSignerAccounts()
  const mnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const backups = useCloudBackups(mnemonicId)

  useAddBackButton(navigation)

  // Starts query for cloud backup files, backup files found are streamed into Redux
  const fetchCloudStorageBackupsWithTimeout = useCallback(async () => {
    // Show loading state for max 10s, then show no backups found
    setIsLoading(true)
    await startFetchingCloudStorageBackups()

    setTimeout(async () => {
      logger.debug(
        'RestoreCloudBackupLoadingScreen',
        'fetchCloudStorageBackupsWithTimeout',
        `Timed out fetching cloud backups after ${MAX_LOADING_TIMEOUT_MS}ms`
      )
      setIsLoading(false)
      await stopFetchingCloudStorageBackups()
    }, MAX_LOADING_TIMEOUT_MS)
  }, [])

  useAsyncData(fetchCloudStorageBackupsWithTimeout)
  // After finding backups, show loading state for minimum 1s to prevent screen changing too quickly
  useTimeout(
    backups.length > 0
      ? (): void => {
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
        }
      : (): undefined => undefined,
    MIN_LOADING_UI_MS
  )

  // Handle no backups found error state
  if (!isLoading && backups.length === 0) {
    if (isRestoringMnemonic) {
      navigation.replace(OnboardingScreens.SeedPhraseInput, {
        importType,
        entryPoint,
      })
    } else {
      return (
        <Box alignSelf="center" px="spacing16">
          <BaseCard.ErrorState
            description={
              IS_ANDROID
                ? t(`It looks like you haven't backed up any of your seed phrases to Google Drive.`)
                : t(`It looks like you haven't backed up any of your seed phrases to iCloud.`)
            }
            icon={
              IS_ANDROID ? (
                <Icons.GoogleDrive
                  color={theme.colors.neutral3}
                  height={theme.imageSizes.image48}
                  width={theme.imageSizes.image48}
                />
              ) : (
                <Icons.Cloud
                  color={theme.colors.neutral3}
                  height={theme.imageSizes.image48}
                  width={theme.imageSizes.image48}
                />
              )
            }
            retryButtonLabel={t('Retry')}
            title={t('0 backups found')}
            onRetry={fetchCloudStorageBackupsWithTimeout}
          />
        </Box>
      )
    }
  }

  return (
    <OnboardingScreen title={t('Searching for backups...')}>
      <Loader.Wallets repeat={5} />
    </OnboardingScreen>
  )
}
