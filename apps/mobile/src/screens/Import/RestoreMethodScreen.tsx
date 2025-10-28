import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OptionCard } from 'src/features/onboarding/OptionCard'
import {
  ImportMethodOption,
  restoreFromCloudBackupOption,
  restoreWalletWithSeedPhraseOption,
} from 'src/screens/Import/constants'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex, Text, TouchableArea } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'

const options: ImportMethodOption[] = [restoreFromCloudBackupOption, restoreWalletWithSeedPhraseOption]

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreMethod>

/**
 * This screen is used to select the method of restoring a wallet.
 */
export function RestoreMethodScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const shouldShowPrivateKeys = useFeatureFlag(FeatureFlags.EnableExportPrivateKeys)
  const entryPoint = params.entryPoint

  useNavigationHeader(navigation)

  const handleOnPress = async (nav: ImportMethodOption['nav'], importType: ImportType): Promise<void> => {
    if (nav === OnboardingScreens.PasskeyImport) {
      const error = new Error('Invalid screen passed to handleOnPress')
      logger.error(error, {
        tags: { file: 'RestoreMethodScreen', function: 'handleOnPress' },
      })
      throw error
    }

    if (nav !== OnboardingScreens.RestoreCloudBackup) {
      navigation.navigate({
        name: nav,
        params: { ...params, importType, entryPoint },
        merge: true,
      })
    }
  }

  const onViewPrivateKeys = (): void => {
    navigation.navigate(ModalName.PrivateKeySpeedBumpModal)
  }

  return (
    <OnboardingScreen Icon={WalletFilled} title={t('onboarding.import.method.restoreSeedPhrase.title')}>
      <Flex
        grow
        gap="$gap12"
        mt="$spacing4"
        shadowColor="$surface3"
        shadowRadius={!isDarkMode ? '$spacing8' : undefined}
      >
        {options.map(({ title, blurb, icon, nav, importType, name, testID }, i) => (
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
      {shouldShowPrivateKeys && (
        <Flex alignItems="center" gap="$gap12">
          <Text variant="body2" color="$neutral3">
            {t('onboarding.import.method.viewPrivateKeys.title')}
          </Text>
          <Trace logPress element={ElementName.OnboardingImportViewPrivateKeys}>
            <TouchableArea alignItems="center" mb="$spacing12" onPress={onViewPrivateKeys}>
              <Text color="$accent1" variant="buttonLabel1" testID={TestID.OnboardingViewPrivateKeys}>
                {t('onboarding.import.method.viewPrivateKeys.button.desc')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
      )}
    </OnboardingScreen>
  )
}
