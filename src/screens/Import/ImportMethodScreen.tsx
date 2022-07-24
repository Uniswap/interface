import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import KeyIcon from 'src/assets/icons/key-icon.svg'
import SeedPhraseIcon from 'src/assets/icons/pencil.svg'
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
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { Theme } from 'src/styles/theme'

interface ImportMethodOption {
  title: (t: TFunction) => string
  blurb: (t: TFunction) => string
  icon: (theme: Theme) => React.ReactNode
  nav: any
  importType: ImportType
  name: ElementName
}

const backupOption: ImportMethodOption = {
  title: (t: TFunction) => t('Restore from iCloud'),
  blurb: (t: TFunction) => t('Recover a backed-up recovery phrase'),
  icon: (theme: Theme) => <CloudIcon color={theme.colors.textPrimary} height={16} width={16} />,
  nav: OnboardingScreens.RestoreCloudBackup,
  importType: ImportType.Restore,
  name: ElementName.OnboardingImportBackup,
}

const options: ImportMethodOption[] = [
  {
    title: (t: TFunction) => t('Import a recovery phrase'),
    blurb: (t: TFunction) => t('Enter or paste words'),
    icon: (theme: Theme) => <SeedPhraseIcon color={theme.colors.textPrimary} />,
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
  },
  {
    title: (t: TFunction) => t('Import a private key'),
    blurb: (t: TFunction) => t('Enter or paste your key'),
    icon: (theme: Theme) => <KeyIcon color={theme.colors.textPrimary} />,
    nav: OnboardingScreens.PrivateKeyInput,
    importType: ImportType.PrivateKey,
    name: ElementName.OnboardingImportPrivateKey,
  },
  {
    title: (t: TFunction) => t('View only'),
    blurb: (t: TFunction) => t('Enter an Ethereum address or ENS name'),
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
        headerLeft: () => (
          <Button onPress={() => navigation.goBack()}>
            <Chevron color={theme.colors.textPrimary} />
          </Button>
        ),
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

  const handleOnPressRestoreBackup = () => {
    if (cloudBackups.length > 1) {
      navigation.navigate({
        name: OnboardingScreens.RestoreCloudBackup,
        params: { importType: ImportType.Restore, entryPoint },
        merge: true,
      })
      return
    }

    const backup = cloudBackups[0]
    if (backup.isPinEncrypted) {
      navigation.navigate({
        name: OnboardingScreens.RestoreCloudBackupPin,
        params: { importType: ImportType.Restore, entryPoint, mnemonicId: backup.mnemonicId },
        merge: true,
      })
    } else {
      // TODO(fetch-icloud-backups-p3): Dispatch importAccountActions with ImportAcountType.Restore to load mnemonic from backup

      navigation.navigate({
        name: OnboardingScreens.SelectWallet,
        params: { importType: ImportType.Restore, entryPoint },
        merge: true,
      })
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
      : [...(cloudBackups.length > 0 ? [backupOption] : []), ...options]

  return (
    <OnboardingScreen title={t('Choose how to add your wallet')}>
      <Flex grow gap="md">
        {importOptions.map(({ title, blurb, icon, nav, importType, name }) => (
          <OptionCard
            key={'connection-option-' + title}
            blurb={blurb(t)}
            icon={icon(theme)}
            name={name}
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
}: {
  title: string
  blurb: string
  icon: React.ReactNode
  onPress: () => void
  name: ElementName
}) {
  const theme = useAppTheme()
  return (
    <Button
      backgroundColor="backgroundContainer"
      borderColor="backgroundOutline"
      borderRadius="lg"
      borderWidth={1}
      name={name}
      p="md"
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
            <Text variant="subhead">{title}</Text>
            <Text color="textSecondary" variant="caption">
              {blurb}
            </Text>
          </Flex>
        </Flex>
        <Chevron color={theme.colors.textSecondary} direction="e" height={24} width={24} />
      </Flex>
    </Button>
  )
}
