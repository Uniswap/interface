import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { openSettings } from 'src/utils/linking'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { OSDynamicCloudIcon, PaperStack, WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'

interface ImportMethodOption {
  title: (t: AppTFunction) => string
  blurb: (t: AppTFunction) => string
  icon: React.ReactNode
  nav: OnboardingScreens
  importType: ImportType
  name: ElementNameType
  testID: TestIDType
}

const options: ImportMethodOption[] = [
  {
    title: (t: AppTFunction) => t('onboarding.import.method.import.title'),
    blurb: (t: AppTFunction) => t('onboarding.import.method.import.message'),
    icon: <PaperStack color="$accent1" size={18} strokeWidth={1.5} />,
    nav: OnboardingScreens.SeedPhraseInput,
    importType: ImportType.SeedPhrase,
    name: ElementName.OnboardingImportSeedPhrase,
    testID: TestID.OnboardingImportSeedPhrase,
  },
  {
    title: (t: AppTFunction) => t('onboarding.import.method.restore.title'),
    blurb: (t: AppTFunction) =>
      isAndroid
        ? t(`onboarding.import.method.restore.message.android`)
        : t(`onboarding.import.method.restore.message.ios`),
    icon: <OSDynamicCloudIcon color="$accent1" size="$icon.24" />,
    nav: OnboardingScreens.RestoreCloudBackup,
    importType: ImportType.Restore,
    name: ElementName.RestoreFromCloud,
    testID: TestID.RestoreFromCloud,
  },
]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const entryPoint = params?.entryPoint

  useNavigationHeader(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const cloudStorageAvailable = await isCloudStorageAvailable()

    if (!cloudStorageAvailable) {
      Alert.alert(
        isAndroid ? t('account.cloud.error.unavailable.title.android') : t('account.cloud.error.unavailable.title.ios'),
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
        ],
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
    <OnboardingScreen Icon={WalletFilled} title={t('onboarding.import.title')}>
      <Flex
        grow
        gap="$spacing12"
        mt="$spacing4"
        shadowColor="$surface3"
        shadowRadius={!isDarkMode ? '$spacing8' : undefined}
      >
        {importOptions.map(({ title, blurb, icon, nav, importType, name, testID }, i) => (
          <OptionCard
            key={'connection-option-' + name + i}
            blurb={blurb(t)}
            elementName={name}
            icon={icon}
            testID={testID}
            title={title(t)}
            onPress={(): Promise<void> => handleOnPress(nav, importType)}
          />
        ))}
      </Flex>
      <Trace logPress element={ElementName.OnboardingImportBackup}>
        <TouchableArea alignItems="center" hitSlop={16} mb="$spacing12" testID={TestID.WatchWallet}>
          <Flex row alignItems="center" gap="$spacing8">
            <EyeIcon
              color={colors.accent1.get()}
              height={iconSizes.icon20}
              strokeWidth="1.5"
              width={iconSizes.icon20}
            />
            <Text
              color="$accent1"
              variant="buttonLabel1"
              onPress={(): Promise<void> => handleOnPress(OnboardingScreens.WatchWallet, ImportType.Watch)}
            >
              {t('account.wallet.button.watch')}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    </OnboardingScreen>
  )
}
