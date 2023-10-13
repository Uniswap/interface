import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { Circle, Icons, inputStyles } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { useAsyncData } from 'utilities/src/react/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { translateMnemonicErrorMessage, validateMnemonic } from 'wallet/src/utils/mnemonics'

import { wordlists } from 'ethers'
import {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  TextInputFocusEventData,
} from 'react-native'

import { Button, Flex, Input, styled as styledTamagui, Text } from 'ui/src'

const ExpandInputButton = styledTamagui(Button, {
  style: { backgroundColor: 'transparent' },
  pressStyle: { backgroundColor: 'transparent' },
  hoverStyle: { backgroundColor: 'transparent' },
})

export function ImportMnemonic(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [mnemonic, setMnemonic] = useState<string[]>(new Array(24).fill(''))
  const { password } = useOnboardingContext()
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState(false)
  const [errors, setErrors] = useState<Record<number, boolean | undefined>>({})

  // TODO(EXT-345): add support for pasting a full mnemonic
  // If a user pastes a valid mnemonic at any time we replace all current input state with that mnemonic
  // useEffect(() => {
  //   function handlePaste({ clipboardData }: ClipboardEvent): void {
  //     if (!clipboardData) return
  //     const pastedText = clipboardData.getData('Text').toLowerCase()
  //     if (!pastedText) return
  //     const { error } = validateMnemonic(pastedText)
  //     if (error) return
  //     setMnemonic(pastedText.split(' '))
  //   }
  //   document.addEventListener('paste', handlePaste)
  //   return () => document.removeEventListener('paste', handlePaste)
  // }, [setMnemonic])

  const handleChange = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputChangeEventData>): void => {
        const newMnemonic = [...mnemonic]
        // @ts-expect-error event.target.value expects target to be a number
        newMnemonic[index] = event.target.value
        setMnemonic(newMnemonic)
      },
    [mnemonic, setMnemonic]
  )

  const handleBlur = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputFocusEventData>): void => {
        // @ts-expect-error event.target.value expects target to be a number
        const word = event.target.value
        if (!word && errors[index] !== undefined) {
          setErrors({ ...errors, [index]: undefined })
        }
        if (!word) return
        const wordInList = wordlists.en?.getWordIndex(word) !== -1
        setErrors({ ...errors, [index]: !wordInList })
      },
    [errors]
  )

  const deletePendingAccounts = useCallback(async () => {
    // Delete any pending accounts before entering flow.
    await dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
  }, [dispatch])

  useAsyncData(deletePendingAccounts)

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(async () => {
    const { validMnemonic, error, invalidWord } = validateMnemonic(
      mnemonic.map((word) => word.trim().toLowerCase()).join(' ')
    )

    if (error) {
      setErrorMessage(
        `Invalid recovery phrase: ${translateMnemonicErrorMessage(error, invalidWord, t)}`
      )
      return
    }

    await dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        validatedMnemonic: validMnemonic,
        validatedPassword: password,
        indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
      })
    )

    navigate(
      `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Select}`,
      { replace: true }
    )
  }, [mnemonic, dispatch, password, navigate, t])

  const { error: mnemonicError } = useMemo(() => {
    const mnemonicString = mnemonic.join(' ').toLowerCase()

    return validateMnemonic(mnemonicString)
  }, [mnemonic])

  return (
    <OnboardingScreen
      Icon={
        <Circle
          backgroundColor="$DEP_magentaDark"
          height={iconSizes.icon64}
          width={iconSizes.icon64}>
          <Icons.FileListLock color="$accent1" size={iconSizes.icon36} />
        </Circle>
      }
      inputError={errorMessage}
      nextButtonEnabled={!mnemonicError && !errorMessage}
      nextButtonText="Continue"
      subtitle="Your recovery phrase will only be stored locally on your browser"
      title="Enter your recovery phrase"
      onBack={(): void =>
        navigate(
          `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Password}`,
          {
            replace: true,
          }
        )
      }
      onSubmit={onSubmit}>
      <Flex row flexWrap="wrap" gap="$spacing16">
        {mnemonic.map(
          (word, index) =>
            Boolean(expanded || (!expanded && index < 12)) && (
              <Flex key={index} position="relative" width={138}>
                <Text
                  color="$neutral2"
                  left="$spacing16"
                  pointerEvents="none"
                  position="absolute"
                  top="$spacing12">
                  {(index + 1).toString().padStart(2, '0')}
                </Text>

                <Input
                  autoFocus={index === 0}
                  backgroundColor={word ? '$surface2' : '$transparent'}
                  borderColor={word ? '$transparent' : '$surface3'}
                  borderRadius="$rounded20"
                  borderWidth={1}
                  focusStyle={inputStyles.inputFocus}
                  fontSize={fonts.subheading1.fontSize}
                  height="auto"
                  hoverStyle={inputStyles.inputHover}
                  pl={44}
                  placeholderTextColor="$neutral3"
                  py="$spacing12"
                  value={word}
                  onBlur={handleBlur(index)}
                  onChange={handleChange(index)}
                  {...(errors[index] && {
                    borderColor: '$statusCritical',
                    hoverStyle: { borderColor: '$statusCritical' },
                  })}
                />
              </Flex>
            )
        )}
        {!expanded && (
          <ExpandInputButton mt="$spacing16" mx="auto" onPress={(): void => setExpanded(true)}>
            <Text color="$neutral3">{t('My recovery phrase is longer than 12 words')}</Text>{' '}
            <Icons.RotatableChevron color="$neutral3" direction="s" />
          </ExpandInputButton>
        )}
      </Flex>
    </OnboardingScreen>
  )
}
