import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import { openSettings } from 'src/utils/linking'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, SpinningLoader, Text, TouchableArea, useSporeColors } from 'ui/src'
import EyeIcon from 'ui/src/assets/icons/eye.svg'
import { OSDynamicCloudIcon, PaperStack, Passkey, WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { exportSeedPhrase } from 'wallet/src/features/passkeys/passkeys'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

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
    title: (t: AppTFunction) => t('onboarding.import.method.passkey.title'),
    blurb: (t: AppTFunction) => t('onboarding.import.method.passkey.message'),
    icon: <Passkey color="$accent1" size="$icon.18" />,
    nav: OnboardingScreens.WelcomeSplash,
    importType: ImportType.Passkey,
    name: ElementName.OnboardingPasskey,
    testID: TestID.OnboardingPasskey,
  },
  {
    title: (t: AppTFunction) => t('onboarding.import.method.import.title'),
    blurb: (t: AppTFunction) => t('onboarding.import.method.import.message'),
    icon: <PaperStack color="$accent1" size="$icon.18" strokeWidth={1.5} />,
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
    icon: <OSDynamicCloudIcon color="$accent1" size="$icon.18" />,
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
  const [isLoadingPasskey, setIsLoadingPasskey] = useState(false)

  const { generateImportedAccounts } = useOnboardingContext()

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
    if (isLoadingPasskey) {
      return
    }

    if (importType === ImportType.Restore) {
      await handleOnPressRestoreBackup()
      return
    }

    if (importType === ImportType.Passkey) {
      setIsLoadingPasskey(true)
      const mnemonic = await exportSeedPhrase()
      if (!mnemonic) {
        navigate(ModalName.PasskeysHelp)
        setIsLoadingPasskey(false)
        return
      }

      const mnemonicId = await Keyring.importMnemonic(mnemonic)
      const account = (await generateImportedAccounts({ mnemonicId }))[0]

      if (!account) {
        throw new Error('No account generated')
      }

      navigation.navigate({
        name: OnboardingScreens.WelcomeSplash,
        params: {
          importType,
          entryPoint,
          address: account.address,
        },
        merge: true,
      })
      return
    }

    navigation.navigate({
      name: nav,
      params: { importType, entryPoint },
      merge: true,
    })
  }

  let importOptions =
    entryPoint === OnboardingEntryPoint.Sidebar
      ? options.filter((option) => option.name !== ElementName.RestoreFromCloud)
      : options

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  if (!isEmbeddedWalletEnabled) {
    importOptions = importOptions.filter((option) => option.name !== ElementName.OnboardingPasskey)
  }

  return (
    <OnboardingScreen
      Icon={WalletFilled}
      title={isEmbeddedWalletEnabled ? t('onboarding.import.selectMethod.title') : t('onboarding.import.title')}
    >
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
            icon={
              isLoadingPasskey && name === ElementName.OnboardingPasskey ? (
                <SpinningLoader size={iconSizes.icon32} />
              ) : (
                icon
              )
            }
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
