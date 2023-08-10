import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInput } from 'src/app/features/onboarding/OnboardingInput'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { Circle, Icons } from 'ui/src'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useAsyncData } from 'utilities/src/react/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { translateMnemonicErrorMessage, validateMnemonic } from 'wallet/src/utils/mnemonics'

export function ImportMnemonic(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState('')
  const { password } = useOnboardingContext()
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const onChangeText = useCallback((text: string) => {
    setErrorMessage(undefined)
    setMnemonic(text)
  }, [])

  const deletePendingAccounts = useCallback(async () => {
    // Delete any pending accounts before entering flow.
    await dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
  }, [dispatch])

  useAsyncData(deletePendingAccounts)

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(async () => {
    const { validMnemonic, error, invalidWord } = validateMnemonic(mnemonic)

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
      nextButtonEnabled={!!mnemonic && !errorMessage}
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
      <OnboardingInput
        placeholderText="Recovery phrase (12 words)"
        value={mnemonic}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
      />
    </OnboardingScreen>
  )
}
