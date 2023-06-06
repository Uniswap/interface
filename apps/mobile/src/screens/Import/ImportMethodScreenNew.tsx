import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import ImportIcon from 'ui/src/assets/icons/paper-stack.svg'
import { Theme } from 'ui/src/theme/restyle/theme'

interface ImportMethodOption {
  title: (t: TFunction) => string
  blurb: (t: TFunction) => string
  icon: (theme: Theme) => React.ReactNode
  nav: OnboardingScreens
  importType: ImportType
  name: ElementName
  badgeText?: (t: TFunction) => string
}

const options: ImportMethodOption[] = [
  {
    title: (t: TFunction) => t('Import a wallet'),
    blurb: (t: TFunction) => t('Enter your recovery phrase from another crypto wallet'),
    icon: (theme: Theme) => (
      <ImportIcon color={theme.colors.magentaVibrant} height={18} strokeWidth="1.5" width={18} />
    ),
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
    badgeText: (t: TFunction) => t('Recommended'),
  },
  {
    title: (t: TFunction) => t('Watch a wallet'),
    blurb: (t: TFunction) =>
      t('Explore the contents of a wallet by entering any address or ENS name '),
    icon: (theme: Theme) => (
      <EyeIcon color={theme.colors.magentaVibrant} height={24} strokeWidth="1.5" width={24} />
    ),
    nav: OnboardingScreens.WatchWallet,
    importType: ImportType.Watch,
    name: ElementName.OnboardingImportWatchedAccount,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreenNew({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const entryPoint = params?.entryPoint

  useAddBackButton(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const iCloudAvailable = await isICloudAvailable()

    if (!iCloudAvailable) {
      Alert.alert(
        t('iCloud Drive not available'),
        t(
          'Please verify that you are logged in to an Apple ID with iCloud Drive enabled on this device and try again.'
        ),
        [
          { text: t('Go to settings'), onPress: openSettings, style: 'default' },
          { text: t('Not now'), style: 'cancel' },
        ]
      )
      return
    }

    navigation.navigate({
      name: OnboardingScreens.RestoreCloudBackupLoading,
      params: { importType: ImportType.Restore, entryPoint },
      merge: true,
    })
  }

  const handleOnPress = (nav: OnboardingScreens, importType: ImportType): void => {
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
    <OnboardingScreen title={t('How do you want to add your wallet?')}>
      <Flex grow gap="spacing12" marginTop="spacing4">
        {importOptions.map(({ title, blurb, icon, nav, importType, name, badgeText }) => (
          <OptionCard
            key={'connection-option-' + title}
            hapticFeedback
            badgeText={badgeText?.(t)}
            blurb={blurb(t)}
            icon={icon(theme)}
            name={name}
            title={title(t)}
            onPress={(): void => handleOnPress(nav, importType)}
          />
        ))}
      </Flex>
      <Flex alignItems="center" mb="spacing12">
        <TouchableArea
          eventName={SharedEventName.ELEMENT_CLICKED}
          name={ElementName.OnboardingImportBackup}>
          <Text
            color="accentAction"
            variant="buttonLabelMedium"
            onPress={(): void =>
              handleOnPress(OnboardingScreens.RestoreCloudBackup, ImportType.Restore)
            }>
            {t('Restore from iCloud')}
          </Text>
        </TouchableArea>
      </Flex>
    </OnboardingScreen>
  )
}
