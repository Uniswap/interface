import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import SeedPhraseIcon from 'src/assets/icons/pencil.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useCloudBackups } from 'src/features/CloudBackup/hooks'
import {
  isICloudAvailable,
  startFetchingICloudBackups,
  stopFetchingICloudBackups,
} from 'src/features/CloudBackup/RNICloudBackupsManager'
import { importAccountActions, IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { restoreMnemonicFromICloud } from 'src/lib/RNEthersRs'
import { OnboardingScreens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'
import { logger } from 'src/utils/logger'

interface ImportMethodOption {
  title: (t: TFunction) => string
  blurb: (t: TFunction) => string
  icon: (theme: Theme) => React.ReactNode
  nav: any
  importType: ImportType
  name: ElementName
}

const options: ImportMethodOption[] = [
  {
    title: (t: TFunction) => t('Restore from iCloud'),
    blurb: (t: TFunction) => t('Recover a backed-up recovery phrase'),
    icon: (theme: Theme) => <CloudIcon color={theme.colors.textPrimary} height={16} width={16} />,
    nav: OnboardingScreens.RestoreCloudBackup,
    importType: ImportType.Restore,
    name: ElementName.OnboardingImportBackup,
  },
  {
    title: (t: TFunction) => t('Import a recovery phrase'),
    blurb: (t: TFunction) => t('Enter, paste, or scan your words'),
    icon: (theme: Theme) => (
      <SeedPhraseIcon color={theme.colors.textPrimary} height={16} width={16} />
    ),
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
  },
  {
    title: (t: TFunction) => t('View only'),
    blurb: (t: TFunction) => t('Enter an Ethereum address or ENS'),
    icon: (theme: Theme) => <EyeIcon color={theme.colors.textPrimary} height={16} width={16} />,
    nav: OnboardingScreens.WatchWallet,
    importType: ImportType.Watch,
    name: ElementName.OnboardingImportWatchedAccount,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const cloudBackups = useCloudBackups()
  const entryPoint = params?.entryPoint

  useEffect(() => {
    const shouldRenderBackButton = navigation.getState().index === 0
    if (shouldRenderBackButton) {
      navigation.setOptions({
        headerLeft: () => <BackButton />,
      })
    }
  }, [navigation, theme.colors.textPrimary])

  useEffect(() => {
    async function fetchICloudBackups() {
      const available = await isICloudAvailable()
      if (available) {
        startFetchingICloudBackups()
      }
    }

    fetchICloudBackups()

    return () => {
      stopFetchingICloudBackups()
    }
  }, [])

  const handleOnPressRestoreBackup = async () => {
    // Handle multiple backups found by showing screen with list of backups
    if (cloudBackups.length > 1) {
      navigation.navigate({
        name: OnboardingScreens.RestoreCloudBackup,
        params: { importType: ImportType.Restore, entryPoint },
        merge: true,
      })
      return
    }

    // Handle one backup found with user pin
    const backup = cloudBackups[0]
    if (backup.isPinEncrypted) {
      navigation.navigate({
        name: OnboardingScreens.RestoreCloudBackupPin,
        params: { importType: ImportType.Restore, entryPoint, mnemonicId: backup.mnemonicId },
        merge: true,
      })
      return
    }

    // Handle one backup found with no user pin
    try {
      await restoreMnemonicFromICloud(backup.mnemonicId, '')
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.RestoreBackup,
          mnemonicId: backup.mnemonicId,
          indexes: Array.from(Array(IMPORT_WALLET_AMOUNT).keys()),
        })
      )

      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    } catch (error) {
      const err = error as Error
      logger.debug('RestoreCloudBackupScreen', 'restoreMnemonicFromICloud', 'Error', error)
      Alert.alert(t('iCloud error'), err.message, [
        {
          text: t('OK'),
          style: 'default',
        },
      ])
    }
  }

  const handleOnPress = (nav: OnboardingScreens, importType: ImportType) => {
    // Delete any pending accounts before entering flow.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))

    if (importType === ImportType.Restore) {
      handleOnPressRestoreBackup()
      return
    }

    navigation.navigate({
      name: nav,
      params: { importType, entryPoint },
      merge: true,
    })
  }

  const importOptions =
    entryPoint === OnboardingEntryPoint.Sidebar
      ? options.filter((option) => option.name !== ElementName.OnboardingImportWatchedAccount)
      : options

  return (
    <OnboardingScreen title={t('Choose how to add your wallet')}>
      <Flex grow gap="xs">
        {importOptions.map(({ title, blurb, icon, nav, importType, name }) => (
          <OptionCard
            key={'connection-option-' + title}
            blurb={blurb(t)}
            disabled={name === ElementName.OnboardingImportBackup && cloudBackups.length === 0}
            icon={icon(theme)}
            name={name}
            opacity={
              name === ElementName.OnboardingImportBackup && cloudBackups.length === 0 ? 0.4 : 1
            }
            title={title(t)}
            onPress={() => handleOnPress(nav, importType)}
          />
        ))}
      </Flex>
    </OnboardingScreen>
  )
}

function OptionCard({
  title,
  blurb,
  icon,
  onPress,
  name,
  disabled,
  opacity,
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  name: ElementName
  disabled?: boolean
  opacity?: number
}) {
  const theme = useAppTheme()
  return (
    <Button
      backgroundColor="backgroundContainer"
      borderColor="backgroundOutline"
      borderRadius="lg"
      borderWidth={1}
      disabled={disabled}
      name={name}
      opacity={opacity}
      px="md"
      py="sm"
      testID={name}
      onPress={onPress}>
      <Flex row alignItems="center" gap="md" justifyContent="space-between">
        <Flex row alignItems="center" gap="md" justifyContent="flex-start">
          <Flex
            centered
            borderColor="accentBranded"
            borderRadius="md"
            borderWidth={1}
            height={32}
            padding="md"
            width={32}>
            {icon}
          </Flex>

          <Flex alignItems="flex-start" gap="xxxs" justifyContent="space-around">
            <Text variant="subheadLarge">{title}</Text>
            <Text color="textSecondary" variant="caption_deprecated">
              {blurb}
            </Text>
          </Flex>
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
      </Flex>
    </Button>
  )
}
