import { wordlists } from '@ethersproject/wordlists'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  TextInputFocusEventData,
  TextInputKeyPressEventData,
} from 'react-native'
import { useDispatch } from 'react-redux'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { SyncFromPhoneButton } from 'src/app/features/onboarding/SyncFromPhoneButton'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Button, Flex, Input, inputStyles, Square, Text } from 'ui/src'
import { FileListLock, RotatableChevron } from 'ui/src/components/icons'
import { fonts, iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useDebounce } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { isValidMnemonicWord, validateMnemonic } from 'wallet/src/utils/mnemonics'

const inputRefs: Array<Input | null> = Array(24).fill(null)

export function ImportMnemonic(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [mnemonic, setMnemonic] = useState<string[]>(new Array(24).fill(''))
  const { addOnboardingAccountMnemonic } = useOnboardingContext()
  const [expanded, setExpanded] = useState(false)
  const [errors, setErrors] = useState<Record<number, boolean | undefined>>({})
  const isEmptyMnemonic = useMemo(() => !mnemonic.join(' ').toLocaleLowerCase().trim(), [mnemonic])

  const accounts = useSignerAccounts()

  const { isResetting, goToNextStep } = useOnboardingSteps()

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent): void | (() => void) => {
      if (!event.clipboardData) {
        return
      }
      const pastedText = event.clipboardData.getData('text').toLowerCase().trim()
      if (!pastedText) {
        return
      }
      const { validMnemonic, error } = validateMnemonic(pastedText)
      if (error || !validMnemonic) {
        return
      }
      // We conditionally prevent default here because we want paste to work as expected in all other cases.
      event.preventDefault()
      const words = validMnemonic.replaceAll(/\s+/g, ' ').split(' ')
      setExpanded(words.length > 12)

      const newMnemonic = Array(24)
        .fill('')
        .map((_, i) => words[i] || '')

      setMnemonic(newMnemonic)
      setErrors({})

      // We focus the last input on the next tick after the state has been updated.
      setTimeout(() => inputRefs[words.length - 1]?.focus(), 0)

      // Clear clipboard after paste
      navigator.clipboard.writeText('').catch(() => {})
    }

    window.document.addEventListener('paste', handlePaste)

    return () => {
      window.document.removeEventListener('paste', handlePaste)
    }
  }, [])

  const handleChange = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputChangeEventData>): void => {
        const newMnemonic = [...mnemonic]
        const word = event.nativeEvent.text

        // Focus next input when the space key is pressed.
        if (word.length > 1 && word.endsWith(' ')) {
          inputRefs[index + 1]?.focus()
        }

        newMnemonic[index] = word.trim()
        setMnemonic(newMnemonic)
      },
    [mnemonic],
  )

  const handleKeyPress = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
        // Focus previous input when the backspace key is pressed.
        if (event.nativeEvent.key === 'Backspace' && !mnemonic[index] && index > 0) {
          inputRefs[index - 1]?.focus()
        }
      },
    [mnemonic],
  )

  const handleBlur = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputFocusEventData>): void => {
        const word = event.nativeEvent.text

        if (!word && errors[index] !== undefined) {
          setErrors({ ...errors, [index]: undefined })
        }
        if (!word) {
          return
        }
        const wordInList = wordlists.en?.getWordIndex(word) !== -1
        setErrors({ ...errors, [index]: !wordInList })
      },
    [errors],
  )

  const { error: mnemonicValidationError, invalidWordCount } = useMemo(() => {
    const mnemonicString = mnemonic.join(' ').toLowerCase()

    if (!mnemonicString.trim()) {
      return { error: undefined, invalidWordCount: undefined }
    }

    return validateMnemonic(mnemonicString)
  }, [mnemonic])

  const errorMessageToDisplay = useMemo(() => {
    // If all cells are filled, but there is an error, display the invalid phrase error
    const trimmedMnemonic = expanded ? mnemonic : mnemonic.slice(0, 12)
    const allCellsFilled = trimmedMnemonic.every((word) => word.length > 0)

    if (allCellsFilled && mnemonicValidationError) {
      return t('onboarding.importMnemonic.error.invalidPhrase')
    }

    if (mnemonicValidationError && invalidWordCount && invalidWordCount >= 1) {
      return t('onboarding.import.error.invalidWords', { count: invalidWordCount })
    }

    return undefined
  }, [expanded, mnemonic, mnemonicValidationError, t, invalidWordCount])

  const debouncedErrorMessageToDisplay = useDebounce(errorMessageToDisplay, 500)

  const enableSubmit = !isEmptyMnemonic && !mnemonicValidationError && !errorMessageToDisplay

  const onSubmit = useCallback(async () => {
    if (!enableSubmit) {
      return
    }

    if (isResetting) {
      // Remove all accounts before importing mnemonic.
      await dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Remove,
          accounts,
        }),
      )
    }

    addOnboardingAccountMnemonic(mnemonic)
    goToNextStep()
  }, [accounts, dispatch, goToNextStep, isResetting, mnemonic, addOnboardingAccountMnemonic, enableSubmit])

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Import }}
      screen={ExtensionOnboardingScreens.SeedPhraseInput}
    >
      <Flex gap="$spacing16">
        <OnboardingScreen
          Icon={
            <Square
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              height={iconSizes.icon48}
              width={iconSizes.icon48}
            >
              <FileListLock color="$neutral1" size="$icon.24" />
            </Square>
          }
          belowFrameContent={
            isResetting ? (
              <Flex
                centered
                row
                backgroundColor="$surface1"
                borderColor="$surface3"
                borderRadius={100}
                borderWidth="$spacing1"
                mt="$spacing8"
                px="$spacing12"
                py="$spacing8"
                shadowColor="$surface3"
                shadowRadius={10}
                style={{ margin: 'auto' }}
              >
                <SyncFromPhoneButton isResetting={isResetting} />
              </Flex>
            ) : undefined
          }
          nextButtonEnabled={!isEmptyMnemonic && !mnemonicValidationError && !errorMessageToDisplay}
          nextButtonText={t('common.button.continue')}
          subtitle={t('onboarding.importMnemonic.subtitle')}
          title={t('onboarding.importMnemonic.title')}
          onBack={isResetting ? undefined : (): void => navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })}
          onSubmit={onSubmit}
        >
          <>
            <Text
              color="$statusCritical"
              opacity={debouncedErrorMessageToDisplay ? 1 : 0}
              py="$spacing8"
              textAlign="center"
              variant="body3"
            >
              {debouncedErrorMessageToDisplay ?? DUMMY_TEXT} {/* To prevent layout shift */}
            </Text>
            <Flex row flexWrap="wrap" gap="$spacing16">
              {mnemonic.map(
                (word, index) =>
                  Boolean(expanded || index < 12) && (
                    <Flex key={index} style={styles.recoveryPhraseWord}>
                      <RecoveryPhraseWord
                        key={index + 'input'}
                        ref={(ref) => {
                          inputRefs[index] = ref
                        }}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                        handleKeyPress={handleKeyPress}
                        index={index}
                        word={word}
                        onSubmitEditing={onSubmit}
                      />
                    </Flex>
                  ),
              )}
            </Flex>
            <Flex row alignSelf="stretch">
              <Button
                mt="$spacing16"
                mb="$spacing8"
                icon={
                  <RotatableChevron color="$neutral3" direction={expanded ? 'up' : 'down'} width={iconSizes.icon20} />
                }
                iconPosition="after"
                emphasis="text-only"
                onPress={(): void => {
                  if (expanded) {
                    setMnemonic([...mnemonic.slice(0, 12), ...Array(12).fill('')])
                  }
                  setExpanded(!expanded)
                }}
              >
                {expanded
                  ? t('onboarding.importMnemonic.button.default')
                  : t('onboarding.importMnemonic.button.longPhrase')}
              </Button>
            </Flex>
          </>
        </OnboardingScreen>
      </Flex>
    </Trace>
  )
}

const RecoveryPhraseWord = forwardRef<
  Input,
  {
    word: string
    index: number
    handleBlur: (index: number) => (event: NativeSyntheticEvent<TextInputFocusEventData>) => void
    handleChange: (index: number) => (event: NativeSyntheticEvent<TextInputChangeEventData>) => void
    handleKeyPress: (index: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void
    onSubmitEditing: () => void
  }
>(function _RecoveryPhraseWord(
  { word, index, handleBlur, handleChange, handleKeyPress, onSubmitEditing },
  ref,
): JSX.Element {
  const debouncedWord = useDebounce(word, 500)
  const showError = isValidMnemonicWord(debouncedWord)

  return (
    <Flex key={index} position="relative" width={130}>
      <Text
        color="$neutral2"
        fontSize={fonts.body3.fontSize}
        left="$spacing16"
        pointerEvents="none"
        position="absolute"
        top={11}
      >
        {(index + 1).toString()}
      </Text>

      <Input
        ref={ref}
        autoFocus={index === 0}
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        focusStyle={styles.inputFocus}
        fontSize={fonts.body3.fontSize}
        height={44}
        hoverStyle={inputStyles.inputHover}
        pl={40}
        placeholderTextColor="$neutral1"
        py="$spacing12"
        value={word}
        onBlur={handleBlur(index)}
        onChange={handleChange(index)}
        onKeyPress={handleKeyPress(index)}
        onSubmitEditing={onSubmitEditing}
        {...(showError && {
          backgroundColor: '$statusCritical2',
          color: '$statusCritical',
        })}
      />
    </Flex>
  )
})

const styles = {
  inputFocus: {
    backgroundColor: '$surface1',
    borderWidth: 1,
    borderColor: '$surface3',
    outlineWidth: 0,
  },
  recoveryPhraseWord: {
    width: 'calc(calc(100% - 32px) / 3)', // 3 columns with 16px gap
  },
} as const

const DUMMY_TEXT = 'DUMMY TEXT'
