import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'

interface ImportMethodOption {
  title: (t: AppTFunction) => string
  blurb: (t: AppTFunction) => string
  icon: React.ReactNode
  nav: OnboardingScreens
  importType: ImportType
  name: ElementName
}

const options: ImportMethodOption[] = [
  {
    title: (t: AppTFunction) => t('Import a wallet'),
    blurb: (t: AppTFunction) => t('Enter your recovery phrase from another crypto wallet'),
    icon: <Icons.PaperStack color="$accent1" size={18} strokeWidth={1.5} />,
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
  },
  {
    title: (t: AppTFunction) => t('Restore a wallet'),
    blurb: (t: AppTFunction) =>
      IS_ANDROID
        ? t(`Add wallets you’ve backed up to your Google Drive account`)
        : t(`Add wallets you’ve backed up to your iCloud account`),
    icon: <Icons.OSDynamicCloudIcon color="$accent1" size="$icon.24" />,
    nav: OnboardingScreens.RestoreCloudBackup,
    importType: ImportType.Restore,
    name: ElementName.RestoreFromCloud,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const entryPoint = params?.entryPoint

  useAddBackButton(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const cloudStorageAvailable = await isCloudStorageAvailable()

    if (!cloudStorageAvailable) {
      Alert.alert(
        IS_ANDROID ? t('Google Drive not available') : t('iCloud Drive not available'),
        IS_ANDROID
          ? t(
              'Please verify that you are logged in to a Google account with Google Drive enabled on this device and try again.'
            )
          : t(
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

  const handleOnPress = async (nav: OnboardingScreens, importType: ImportType): Promise<void> => {
    // Delete any pending accounts before entering flow.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))

    if (importType === ImportType.Restore) {
      await handleOnPressRestoreBackup()
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
      ? options.filter((option) => option.name !== ElementName.RestoreFromCloud)
      : options

  return (
    <OnboardingScreen title={t('How do you want to add your wallet?')}>
      <Flex grow gap="$spacing12" mt="$spacing4">
        {importOptions.map(({ title, blurb, icon, nav, importType, name }) => (
          <OptionCard
            key={'connection-option-' + title}
            hapticFeedback
            blurb={blurb(t)}
            elementName={name}
            icon={icon}
            title={title(t)}
            onPress={(): Promise<void> => handleOnPress(nav, importType)}
          />
        ))}
      </Flex>
      <Trace logPress element={ElementName.OnboardingImportBackup}>
        <TouchableArea alignItems="center" hitSlop={16} mb="$spacing12">
          <Flex row alignItems="center" gap="$spacing4">
            <EyeIcon
              color={colors.accent1.get()}
              height={iconSizes.icon20}
              strokeWidth="1.5"
              width={iconSizes.icon20}
            />
            <Text
              color="$accent1"
              variant="buttonLabel2"
              onPress={(): Promise<void> =>
                handleOnPress(OnboardingScreens.WatchWallet, ImportType.Watch)
              }>
              {t('Watch a wallet')}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    </OnboardingScreen>
  )
}
