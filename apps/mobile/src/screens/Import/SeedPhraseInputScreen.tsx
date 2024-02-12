import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { useNonPendingSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import {
  MnemonicValidationError,
  translateMnemonicErrorMessage,
  userFinishedTypingWord,
  validateMnemonic,
  validateSetOfWords,
} from 'wallet/src/utils/mnemonics'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>

export function SeedPhraseInputScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

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
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  useAddBackButton(navigation)

  const signerAccounts = useNonPendingSignerAccounts()
  const mnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(async () => {
    // Check phrase validation
    const { validMnemonic, error, invalidWord } = validateMnemonic(value)

    if (error) {
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
      return
    }

    if (mnemonicId && validMnemonic) {
      const generatedMnemonicId = await Keyring.generateAddressForMnemonic(validMnemonic, 0)
      if (generatedMnemonicId !== mnemonicId) {
        setErrorMessage(t('Wrong recovery phrase'))
        return
      }
    }

    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        validatedMnemonic: validMnemonic,
        indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
      })
    )
    // restore flow is handled in saga after `restoreMnemonicComplete` is dispatched
    if (!isRestoringMnemonic) {
      navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
    }
  }, [value, mnemonicId, dispatch, isRestoringMnemonic, t, navigation, params])

  const onBlur = useCallback(() => {
    const { error, invalidWord } = validateMnemonic(value)
    if (error) {
      setShowSuccess(false)
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
    }
  }, [t, value])

  const onChange = (text: string | undefined): void => {
    const { error, invalidWord, isValidLength } = validateSetOfWords(text)

    // always show success UI if phrase is valid length
    if (isValidLength) {
      setShowSuccess(true)
    } else {
      setShowSuccess(false)
    }

    // suppress error messages if the  user is not done typing a word
    const suppressError =
      (error === MnemonicValidationError.InvalidWord && !userFinishedTypingWord(text)) ||
      error === MnemonicValidationError.NotEnoughWords

    if (!error || suppressError) {
      setErrorMessage(undefined)
    } else {
      setErrorMessage(translateMnemonicErrorMessage(error, invalidWord, t))
    }

    setValue(text)
  }

  const onPressRecoveryHelpButton = (): Promise<void> =>
    openUri(uniswapUrls.helpArticleUrls.recoveryPhraseHelp)

  const onPressTryAgainButton = (): void => {
    navigation.replace(OnboardingScreens.RestoreCloudBackupLoading, params)
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={
        isRestoringMnemonic
          ? t('Enter your recovery phrase below, or try searching for backups again.')
          : t('Your recovery phrase will only be stored locally on your device.')
      }
      title={isRestoringMnemonic ? t('No backups found') : t('Enter your recovery phrase')}>
      <Flex $short={{ gap: '$none' }} gap="$spacing8">
        <GenericImportForm
          blurOnSubmit
          liveCheck
          afterPasteButtonPress={(): void => setPastePermissionModalOpen(false)}
          beforePasteButtonPress={(): void => setPastePermissionModalOpen(true)}
          errorMessage={errorMessage}
          placeholderLabel={t('Enter recovery phrase')}
          showSuccess={showSuccess}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
        />
        <Flex centered>
          <Trace logPress element={ElementName.RecoveryHelpButton}>
            <TouchableArea
              onPress={isRestoringMnemonic ? onPressTryAgainButton : onPressRecoveryHelpButton}>
              <Text $short={{ variant: 'body3' }} color="$accent1" variant="subheading2">
                {isRestoringMnemonic
                  ? t('Try searching again')
                  : t('How do I find my recovery phrase?')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
      </Flex>

      <Trace logPress element={ElementName.Next}>
        <Button disabled={!!errorMessage || !value} testID="seed-input-submit" onPress={onSubmit}>
          {t('Continue')}
        </Button>
      </Trace>
    </SafeKeyboardOnboardingScreen>
  )
}
