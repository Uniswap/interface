import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { useLockScreenOnBlur } from 'src/features/authentication/lockScreenContext'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import {
  InputValidatedEvent,
  MnemonicStoredEvent,
  SeedPhraseInput,
  StringKey,
  useSeedPhraseInputRef,
} from 'src/screens/Import/SeedPhraseInput'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Button } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { useNonPendingSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { ElementName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>

export function SeedPhraseInputScreenV2({ navigation, route: { params } }: Props): JSX.Element {
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

  const [submitEnabled, setSubmitEnabled] = useState(false)
  const seedPhraseInputRef = useSeedPhraseInputRef()
  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  useAddBackButton(navigation)

  const signerAccounts = useNonPendingSignerAccounts()
  const targetMnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const handleNext = useCallback(
    (storedMnemonicId: string) => {
      dispatch(
        importAccountActions.trigger({
          type: ImportAccountType.MnemonicNative,
          mnemonicId: storedMnemonicId,
          indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
        })
      )

      // restore flow is handled in saga after `restoreMnemonicComplete` is dispatched
      if (!isRestoringMnemonic) {
        navigation.navigate({ name: OnboardingScreens.SelectWallet, params, merge: true })
      }
    },
    [dispatch, isRestoringMnemonic, navigation, params]
  )

  const onPressRecoveryHelpButton = (): Promise<void> =>
    openUri(uniswapUrls.helpArticleUrls.recoveryPhraseHelp)

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
        isRestoringMnemonic
          ? t('account.recoveryPhrase.title.restoring')
          : t('account.recoveryPhrase.title.import')
      }>
      {/* <Flex gap={itemSpacing}> */}
      <SeedPhraseInput
        ref={seedPhraseInputRef}
        strings={{
          [StringKey.HelpText]: isRestoringMnemonic
            ? t('account.recoveryPhrase.helpText.restoring')
            : t('account.recoveryPhrase.helpText.import'),
          [StringKey.InputPlaceholder]: t('account.recoveryPhrase.input'),
          [StringKey.PasteButton]: t('common.button.paste'),
          [StringKey.ErrorInvalidWord]: t('account.recoveryPhrase.error.invalidWord'),
          [StringKey.ErrorPhraseLength]: t('account.recoveryPhrase.error.phraseLength'),
          [StringKey.ErrorWrongPhrase]: t('account.recoveryPhrase.error.wrong'),
          [StringKey.ErrorInvalidPhrase]: t('account.recoveryPhrase.error.invalid'),
        }}
        targetMnemonicId={targetMnemonicId}
        onHelpTextPress={isRestoringMnemonic ? onPressTryAgainButton : onPressRecoveryHelpButton}
        onInputValidated={(e: NativeSyntheticEvent<InputValidatedEvent>): void =>
          setSubmitEnabled(e.nativeEvent.canSubmit)
        }
        onMnemonicStored={(e: NativeSyntheticEvent<MnemonicStoredEvent>): void =>
          handleNext(e.nativeEvent.mnemonicId)
        }
        onPasteEnd={(): void => {
          setPastePermissionModalOpen(false)
        }}
        onPasteStart={(): void => {
          setPastePermissionModalOpen(true)
        }}
      />

      <Trace logPress element={ElementName.Next}>
        <Button
          disabled={!submitEnabled}
          testID="seed-input-submit"
          onPress={(): void => {
            seedPhraseInputRef.current?.handleSubmit()
          }}>
          {t('common.button.continue')}
        </Button>
      </Trace>
    </SafeKeyboardOnboardingScreen>
  )
}
