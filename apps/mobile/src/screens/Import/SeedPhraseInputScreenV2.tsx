import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import {
  InputValidatedEvent,
  MnemonicStoredEvent,
  NativeSeedPhraseInputRef,
  SeedPhraseInput,
  StringKey,
  handleSubmit,
} from 'src/screens/Import/SeedPhraseInput'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>

export function SeedPhraseInputScreenV2({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const { generateImportedAccounts } = useOnboardingContext()

  /**
   * If paste permission modal is open, we need to manually disable the splash screen that appears on blur,
   * since the modal triggers the same `inactive` app state as does going to app switcher
   *
   * Technically seed phrase will be blocked if user pastes from keyboard,
   * but that is an extreme edge case.
   **/
  const [pastePermissionModalOpen, setPastePermissionModalOpen] = useState(false)
  useLockScreenOnBlur(pastePermissionModalOpen)

  const [submitEnabled, setSubmitEnabled] = useState(false)
  const seedPhraseInputRef = useRef<NativeSeedPhraseInputRef>(null)
  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  useAddBackButton(navigation)

  const signerAccounts = useSignerAccounts()
  const targetMnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const handleNext = useCallback(
    async (storedMnemonicId: string) => {
      await generateImportedAccounts(storedMnemonicId, BackupType.Manual)

      // restore flow is handled in saga after `restoreMnemonicComplete` is dispatched
      if (!isRestoringMnemonic) {
        navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
      }
    },
    [generateImportedAccounts, isRestoringMnemonic, navigation, params],
  )

  const onPressRecoveryHelpButton = (): Promise<void> => openUri(uniswapUrls.helpArticleUrls.recoveryPhraseHowToImport)

  const onPressTryAgainButton = (): void => {
    navigation.replace(OnboardingScreens.RestoreCloudBackupLoading, params)
  }

  return (
    <SafeKeyboardOnboardingScreen
      footer={
        <Trace logPress element={ElementName.Next}>
          <Button
            disabled={!submitEnabled}
            mx="$spacing16"
            my="$spacing12"
            testID={TestID.Continue}
            onPress={(): void => {
              handleSubmit(seedPhraseInputRef)
            }}
          >
            {t('common.button.continue')}
          </Button>
        </Trace>
      }
      minHeightWhenKeyboardExpanded={false}
      subtitle={
        isRestoringMnemonic
          ? t('account.recoveryPhrase.subtitle.restoring')
          : t('account.recoveryPhrase.subtitle.import')
      }
      title={
        isRestoringMnemonic ? t('account.recoveryPhrase.title.restoring') : t('account.recoveryPhrase.title.import')
      }
    >
      <SeedPhraseInput
        ref={seedPhraseInputRef}
        navigation={navigation}
        strings={{
          [StringKey.InputPlaceholder]: t('account.recoveryPhrase.input'),
          [StringKey.PasteButton]: t('common.button.paste'),
          // No good way to pass interpolated strings to native code, but an empty string is okay here
          [StringKey.ErrorInvalidWord]: t('account.recoveryPhrase.error.invalidWord', { word: '' }),
          [StringKey.ErrorPhraseLength]: t('account.recoveryPhrase.error.phraseLength'),
          [StringKey.ErrorWrongPhrase]: t('account.recoveryPhrase.error.wrong'),
          [StringKey.ErrorInvalidPhrase]: t('account.recoveryPhrase.error.invalid'),
        }}
        targetMnemonicId={targetMnemonicId}
        testID={TestID.ImportAccountInput}
        onInputValidated={(e: NativeSyntheticEvent<InputValidatedEvent>): void =>
          setSubmitEnabled(e.nativeEvent.canSubmit)
        }
        onMnemonicStored={(e: NativeSyntheticEvent<MnemonicStoredEvent>): Promise<void> =>
          handleNext(e.nativeEvent.mnemonicId)
        }
        onPasteEnd={(): void => {
          setPastePermissionModalOpen(false)
        }}
        onPasteStart={(): void => {
          setPastePermissionModalOpen(true)
        }}
      />

      <Flex row justifyContent="center" pt="$spacing24">
        <TouchableArea onPress={isRestoringMnemonic ? onPressTryAgainButton : onPressRecoveryHelpButton}>
          <Flex row alignItems="center" gap="$spacing4">
            <QuestionInCircleFilled color="$neutral3" size="$icon.20" />
            <Text color="$neutral3" variant="body2">
              {isRestoringMnemonic
                ? t('account.recoveryPhrase.helpText.restoring')
                : t('account.recoveryPhrase.helpText.import')}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </SafeKeyboardOnboardingScreen>
  )
}
