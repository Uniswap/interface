import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { checkCloudBackupOrShowAlert } from 'src/components/mnemonic/cloudImportUtils'
import { useRegionalizedLineHeight } from 'src/components/text/useRegionalizedLineHeight'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import {
  ImportMethodOption,
  importFromCloudBackupOption,
  passKeySignInOption,
  seedPhraseImportOption,
} from 'src/screens/Import/constants'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Eye, WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

const options: ImportMethodOption[] = [passKeySignInOption, importFromCloudBackupOption, seedPhraseImportOption]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.ImportMethod>

export function ImportMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const entryPoint = params.entryPoint

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
    if (importType === ImportType.Restore) {
      await handleOnPressRestoreBackup()
      return
    }

    // Passkey now defers to RecoveryFlowScreen so the Continue-with-passkey button is the
    // single place where the ceremony spins. `initialMethod: 'passkey'` tells that screen
    // to auto-trigger the prompt on mount; failure falls back to email/OAuth tiles there.
    if (importType === ImportType.Passkey) {
      navigation.navigate({
        name: OnboardingScreens.RecoveryFlow,
        params: { importType, entryPoint, initialMethod: 'passkey' },
        merge: true,
      })
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

  const regionalizedLineHeight = useRegionalizedLineHeight()

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
            icon={icon}
            testID={testID}
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
          testID={TestID.WatchWallet}
          onPress={(): Promise<void> => handleOnPress(OnboardingScreens.WatchWallet, ImportType.Watch)}
        >
          <Flex row alignItems="center" gap="$spacing8">
            <Eye color="$accent1" size="$icon.20" />
            <Text numberOfLines={1} color="$accent1" variant="buttonLabel1" lineHeight={regionalizedLineHeight}>
              {t('account.wallet.button.watch')}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    </OnboardingScreen>
  )
}
