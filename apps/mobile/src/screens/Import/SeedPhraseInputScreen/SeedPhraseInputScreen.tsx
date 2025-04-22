import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { useLockScreenOnBlur } from 'src/features/lockScreen/hooks/useLockScreenOnBlur'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'

import { SeedPhraseInput } from 'src/screens/Import/SeedPhraseInputScreen/SeedPhraseInput/SeedPhraseInput'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Text, TouchableArea, useIsShortMobileDevice } from 'ui/src'
import { PapersText, QuestionInCircleFilled } from 'ui/src/components/icons'
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

import {
  NativeSeedPhraseInputProps,
  NativeSeedPhraseInputRef,
  StringKey,
} from 'src/screens/Import/SeedPhraseInputScreen/SeedPhraseInput/types'
import { useFunctionAfterNavigationTransitionEndWithDelay } from 'src/utils/hooks'
import { MobileDeviceHeight } from 'ui/src'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type SeedPhraseInputScreenProps = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>

export function SeedPhraseInputScreen({ navigation, route: { params } }: SeedPhraseInputScreenProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { generateImportedAccounts } = useOnboardingContext()
  const signerAccounts = useSignerAccounts()
  const seedPhraseInputRef = useRef<NativeSeedPhraseInputRef>(null)

  const isShortMobileDevice = useIsShortMobileDevice(MobileDeviceHeight.iPhoneSE)

  const maybeFocusInput = useCallback(() => {
    if (!isShortMobileDevice) {
      seedPhraseInputRef.current?.focus()
    }
  }, [isShortMobileDevice])

  // Note: Not using navigation.addListener because of strange behavior on iOS where if the custom `SeedPhraseInput` is focused too quickly, the end result is that it's immediately blurred
  useFunctionAfterNavigationTransitionEndWithDelay(maybeFocusInput)

  /**
   * If paste permission modal is open, we need to manually disable the splash screen that appears on blur,
   * since the modal triggers the same `inactive` app state as does going to app switcher
   *
   * Technically seed phrase will be blocked if user pastes from keyboard,
   * but that is an extreme edge case.
   **/

  const {
    value: isPastePermissionModalOpen,
    setTrue: handleOpenPastePermissionModal,
    setFalse: handleClosePastePermissionModal,
  } = useBooleanState(false)

  const { value: isSubmitEnabled, setValue: setIsSubmitEnabled } = useBooleanState(false)

  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  const targetMnemonicId = (isRestoringMnemonic && signerAccounts[0]?.mnemonicId) || undefined

  const handleOnInputValidated: NativeSeedPhraseInputProps['onInputValidated'] = useCallback(
    (event) => {
      setIsSubmitEnabled(event.nativeEvent.canSubmit)
    },
    [setIsSubmitEnabled],
  )

  const handleOnMnemonicStored: NativeSeedPhraseInputProps['onMnemonicStored'] = useCallback(
    async (event) => {
      await generateImportedAccounts({ mnemonicId: event.nativeEvent.mnemonicId, backupType: BackupType.Manual })

      seedPhraseInputRef.current?.blur()

      onRestoreComplete({ isRestoringMnemonic, dispatch, params, navigation })
    },
    [dispatch, generateImportedAccounts, isRestoringMnemonic, navigation, params],
  )

  const onPressRecoveryHelpButton = useCallback(
    () => openUri(uniswapUrls.helpArticleUrls.recoveryPhraseHowToImport),
    [],
  )

  const onPressTryAgainButton = useCallback(() => {
    navigation.replace(OnboardingScreens.RestoreCloudBackupLoading, params)
  }, [navigation, params])

  useLockScreenOnBlur(isPastePermissionModalOpen)
  useNavigationHeader(navigation)

  return (
    <SafeKeyboardOnboardingScreen
      Icon={PapersText}
      footer={
        <Trace logPress element={ElementName.Next}>
          <Flex row>
            <Button
              isDisabled={!isSubmitEnabled}
              mx="$spacing16"
              my="$spacing12"
              size="large"
              variant="branded"
              testID={TestID.Continue}
              onPress={() => seedPhraseInputRef.current?.handleSubmit()}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
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
      keyboardDismissMode="interactive"
      onHeaderPress={() => {
        // Note: must use a referentially-unstable function to be sure the most recent value of `seedPhraseInputRef.current` is used
        seedPhraseInputRef.current?.blur()
      }}
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
        onInputValidated={handleOnInputValidated}
        onMnemonicStored={handleOnMnemonicStored}
        onPasteEnd={handleClosePastePermissionModal}
        onPasteStart={handleOpenPastePermissionModal}
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
