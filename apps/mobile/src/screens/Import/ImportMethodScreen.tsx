import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import { isAndroid } from 'uniswap/src/utils/platform'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { ElementName, ElementNameType } from 'wallet/src/telemetry/constants'
import { openSettings } from 'wallet/src/utils/linking'

interface ImportMethodOption {
  title: (t: AppTFunction) => string
  blurb: (t: AppTFunction) => string
  icon: React.ReactNode
  nav: OnboardingScreens
  importType: ImportType
  name: ElementNameType
}

const options: ImportMethodOption[] = [
  {
    title: (t: AppTFunction) => t('onboarding.import.method.import.title'),
    blurb: (t: AppTFunction) => t('onboarding.import.method.import.message'),
    icon: <Icons.PaperStack color="$accent1" size={18} strokeWidth={1.5} />,
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
  },
  {
    title: (t: AppTFunction) => t('onboarding.import.method.restore.title'),
    blurb: (t: AppTFunction) =>
      isAndroid
        ? t(`onboarding.import.method.restore.message.android`)
        : t(`onboarding.import.method.restore.message.ios`),
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
  const isDarkMode = useIsDarkMode()
  const dispatch = useAppDispatch()
  const entryPoint = params?.entryPoint

  useAddBackButton(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const cloudStorageAvailable = await isCloudStorageAvailable()

    if (!cloudStorageAvailable) {
      Alert.alert(
        isAndroid
          ? t('account.cloud.error.unavailable.title.android')
          : t('account.cloud.error.unavailable.title.ios'),
        isAndroid
          ? t('account.cloud.error.unavailable.message.android')
          : t('account.cloud.error.unavailable.message.ios'),
        [
          {
            text: t('account.cloud.error.unavailable.button.settings'),
            onPress: openSettings,
            style: 'default',
          },
          { text: t('account.cloud.error.unavailable.button.cancel'), style: 'cancel' },
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
    <OnboardingScreen title={t('onboarding.import.title')}>
      <Flex
        grow
        gap="$spacing12"
        mt="$spacing4"
        shadowColor="$surface3"
        shadowRadius={!isDarkMode ? '$spacing8' : undefined}>
        {importOptions.map(({ title, blurb, icon, nav, importType, name }, i) => (
          <OptionCard
            key={'connection-option-' + name + i}
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
        <TouchableArea
          alignItems="center"
          hitSlop={16}
          mb="$spacing12"
          testID={ElementName.WatchWallet}>
          <Flex row alignItems="center" gap="$spacing8">
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
              {t('account.wallet.button.watch')}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    </OnboardingScreen>
  )
}
