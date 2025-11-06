import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { checkCloudBackupOrShowAlert } from 'src/components/mnemonic/cloudImportUtils'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import {
  ImportMethodOption,
  importFromCloudBackupOption,
  passKeySignInOption,
  seedPhraseImportOption,
} from 'src/screens/Import/constants'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { Eye, WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { iconSizes } from 'ui/src/theme'
import { authenticateWithPasskeyForSeedPhraseExport } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'

const options: ImportMethodOption[] = [seedPhraseImportOption, importFromCloudBackupOption, passKeySignInOption]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const entryPoint = params.entryPoint
  const [isLoadingPasskey, setIsLoadingPasskey] = useState(false)

  useNavigationHeader(navigation)

  const handleOnPressRestoreBackup = async (): Promise<void> => {
    const hasCloudBackup = await checkCloudBackupOrShowAlert(t)
    if (!hasCloudBackup) {
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

    // We check against nav instead of importType to satisfy typescript
    // This screen requires passkeyCredential as a param
    if (importType === ImportType.Passkey) {
      setIsLoadingPasskey(true)
      let credential: string | undefined
      try {
        credential = await authenticateWithPasskeyForSeedPhraseExport()
      } catch (error) {
        logger.warn('ImportMethodScreen', 'handleOnPress', 'Error authenticating with passkey', { error })
      }

      if (!credential) {
        navigate(ModalName.PasskeysHelp)
        setIsLoadingPasskey(false)
        return
      }

      navigation.navigate({
        name: OnboardingScreens.PasskeyImport,
        params: {
          importType,
          entryPoint,
          passkeyCredential: credential,
        },
        merge: true,
      })
      setIsLoadingPasskey(false)
      return
    }
    if (nav === OnboardingScreens.SeedPhraseInput || nav === OnboardingScreens.WatchWallet) {
      navigation.navigate({
        name: nav,
        params: { importType, entryPoint },
        merge: true,
      })
    }
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
            <Eye color="$accent1" size="$icon.20" />
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
