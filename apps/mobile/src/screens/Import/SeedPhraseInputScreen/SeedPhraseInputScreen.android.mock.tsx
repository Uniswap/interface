import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { useLockScreenOnBlur } from 'src/features/lockScreen/hooks/useLockScreenOnBlur'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import {
  MnemonicValidationError,
  translateMnemonicErrorMessage,
  userFinishedTypingWord,
  validateMnemonic,
  validateSetOfWords,
} from 'wallet/src/utils/mnemonics'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>

// Original SeedPhraseInputScreen component including JS input field. Used as a mock for Android Detox e2e testing.
export function SeedPhraseInputScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
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

  const [value, setValue] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  useNavigationHeader(navigation)

  const signerAccounts = useSignerAccounts()
  const mnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(async () => {
    // Check phrase validation
    const { validMnemonic, error, invalidWord } = validateMnemonic(value)

    if (error) {
      setErrorMessage(translateMnemonicErrorMessage({ error, invalidWord, t }))
      return
    }

    if (!validMnemonic) {
      return
    }

    if (mnemonicId && validMnemonic) {
      const generatedMnemonicId = await Keyring.generateAddressForMnemonic(validMnemonic, 0)
      if (generatedMnemonicId !== mnemonicId) {
        setErrorMessage(t('account.recoveryPhrase.error.wrong'))
        return
      }

      await generateImportedAccounts({ mnemonicId, backupType: BackupType.Manual })
    }

    onRestoreComplete({
      isRestoringMnemonic,
      dispatch,
      params,
      navigation,
      screen: OnboardingScreens.SeedPhraseInput,
    })
  }, [value, mnemonicId, isRestoringMnemonic, t, generateImportedAccounts, dispatch, navigation, params])

  const onBlur = useCallback(() => {
    const { error, invalidWord } = validateMnemonic(value)
    if (error) {
      setErrorMessage(translateMnemonicErrorMessage({ error, invalidWord, t }))
    }
  }, [t, value])

  const onChange = (text: string | undefined): void => {
    const { error, invalidWord } = validateSetOfWords(text)

    // suppress error messages if the  user is not done typing a word
    const suppressError =
      (error === MnemonicValidationError.InvalidWord && !userFinishedTypingWord(text)) ||
      error === MnemonicValidationError.NotEnoughWords

    if (!error || suppressError) {
      setErrorMessage(undefined)
    } else {
      setErrorMessage(translateMnemonicErrorMessage({ error, invalidWord, t }))
    }

    setValue(text)
  }

  const onPressRecoveryHelpButton = (): Promise<void> =>
    openUri({ uri: uniswapUrls.helpArticleUrls.recoveryPhraseHowToImport })

  const onPressTryAgainButton = (): void => {
    navigation.replace(OnboardingScreens.RestoreCloudBackupLoading, params)
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={
        isRestoringMnemonic
          ? t('account.recoveryPhrase.subtitle.restoring')
          : t('account.recoveryPhrase.subtitle.import')
      }
      title={
        isRestoringMnemonic ? t('account.recoveryPhrase.title.restoring') : t('account.recoveryPhrase.title.import')
      }
    >
      <Flex $short={{ gap: '$spacing12' }} gap="$spacing16">
        <Flex px="$spacing8">
          <GenericImportForm
            blurOnSubmit
            liveCheck
            afterPasteButtonPress={(): void => setPastePermissionModalOpen(false)}
            beforePasteButtonPress={(): void => setPastePermissionModalOpen(true)}
            errorMessage={errorMessage}
            inputAlignment="flex-start"
            placeholderLabel={t('account.recoveryPhrase.input')}
            textAlign="left"
            value={value}
            onBlur={onBlur}
            onChange={onChange}
          />
        </Flex>
        <Flex centered>
          <Trace logPress element={ElementName.RecoveryHelpButton}>
            <TouchableArea
              flexDirection="row"
              gap="$spacing8"
              onPress={isRestoringMnemonic ? onPressTryAgainButton : onPressRecoveryHelpButton}
            >
              <QuestionInCircleFilled color="$neutral3" size="$icon.20" />
              <Text $short={{ variant: 'body3' }} color="$neutral3" variant="body2">
                {isRestoringMnemonic
                  ? t('account.recoveryPhrase.helpText.restoring')
                  : t('account.recoveryPhrase.helpText.import')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
      </Flex>
      <Trace logPress element={ElementName.Next}>
        <Flex row>
          <Button
            isDisabled={!!errorMessage || !value}
            size="large"
            variant="branded"
            testID={ElementName.Continue}
            onPress={onSubmit}
          >
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Trace>
    </SafeKeyboardOnboardingScreen>
  )
}
