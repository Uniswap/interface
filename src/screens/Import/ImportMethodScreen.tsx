import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import CloudIcon from 'src/assets/icons/cloud.svg'
import EyeIcon from 'src/assets/icons/eyeball.svg'
import KeyIcon from 'src/assets/icons/key-icon.svg'
import SeedPhraseIcon from 'src/assets/icons/seed-phrase-icon.svg'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Disclaimer from 'src/features/import/Disclaimer'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'

interface ImportMethodOption {
  title: (t: TFunction) => string
  blurb: (t: TFunction) => string
  icon: React.ReactNode
  nav: any
  importType: ImportType
  name: ElementName
}
const backupOption: ImportMethodOption = {
  title: (t: TFunction) => t('Restore from iCloud'),
  blurb: (t: TFunction) => t('Recover a backed-up recovery phrase'),
  icon: <CloudIcon />,
  nav: OnboardingScreens.RestoreWallet,
  importType: ImportType.Restore,
  name: ElementName.OnboardingImportBackup,
}

const options: ImportMethodOption[] = [
  {
    title: (t: TFunction) => t('Import a recovery phrase'),
    blurb: (t: TFunction) => t('Enter or paste words'),
    icon: <SeedPhraseIcon />,
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
  },
  {
    title: (t: TFunction) => t('Import a private key'),
    blurb: (t: TFunction) => t('Enter or paste your key'),
    icon: <KeyIcon />,
    nav: OnboardingScreens.PrivateKeyInput,
    importType: ImportType.PrivateKey,
    name: ElementName.OnboardingImportPrivateKey,
  },
  {
    title: (t: TFunction) => t('View only'),
    blurb: (t: TFunction) => t('Enter an Ethereum address or ENS name'),
    icon: <EyeIcon />,
    nav: OnboardingScreens.WatchWallet,
    importType: ImportType.Watch,
    name: ElementName.OnboardingImportWatchedAccount,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const entryPoint = params?.entryPoint

  /**
   * @TODO include check icloud backups and conditionally render restore option
   */
  const backupFound = true

  const handleOnPress = (nav: OnboardingScreens, importType: ImportType) => {
    // Delete any pending accounts before entering flow.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    navigation.navigate({
      name: nav,
      params: { importType, entryPoint },
      merge: true,
    })
  }

  const importOptions =
    entryPoint === OnboardingEntryPoint.Sidebar
      ? options.filter((option) => option.name !== ElementName.OnboardingImportWatchedAccount)
      : [...(backupFound ? [backupOption] : []), ...options]

  return (
    <OnboardingScreen title={t('Choose how to add your wallet')}>
      <Flex grow gap="md">
        {importOptions.map(({ title, blurb, icon, nav, importType, name }) => (
          <OptionCard
            key={'connection-option-' + title}
            blurb={blurb(t)}
            icon={icon}
            name={name}
            title={title(t)}
            onPress={() => handleOnPress(nav, importType)}
          />
        ))}
        <Flex grow justifyContent="flex-end">
          <Disclaimer />
        </Flex>
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
      backgroundColor="backgroundBackdrop"
      borderRadius="lg"
      borderWidth={1}
      name={name}
      p="md"
      style={{ borderColor: theme.colors.backgroundOutline }}
      testID={name}
      onPress={onPress}>
      <Flex row alignItems="center" gap="md" justifyContent="space-between">
        <Flex gap="xs">
          <Flex row alignItems="center" gap="sm">
            {icon}
            <Text variant="mediumLabel">{title}</Text>
          </Flex>
          <Text color="textSecondary" variant="caption">
            {blurb}
          </Text>
        </Flex>
        <Chevron color={theme.colors.backgroundOutline} direction="e" height={12} width={12} />
      </Flex>
    </Button>
  )
}
