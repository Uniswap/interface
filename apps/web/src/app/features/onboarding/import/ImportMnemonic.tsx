import { useCallback, useEffect, useState } from 'react'
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
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { validateMnemonic } from 'wallet/src/utils/mnemonics'

export function ImportMnemonic(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState('')
  const { password } = useOnboardingContext()
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Delete any pending accounts before entering flow.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
  }, [dispatch])

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(() => {
    const { validMnemonic, error } = validateMnemonic(mnemonic)

    if (error) {
      // TODO: better error handling
      setErrorMessage(`Invalid recovery phrase: ${error}`)
      return
    }

    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        validatedMnemonic: validMnemonic,
        validatedPassword: password,
        indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
      })
    )

    navigate(
      `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Select}`
    )
  }, [mnemonic, navigate, dispatch, password])

  return (
    <OnboardingScreen
      Icon={
        <Circle backgroundColor="$magentaDark" height={iconSizes.icon64} width={iconSizes.icon64}>
          <Icons.FileListLock color="$magentaVibrant" size={iconSizes.icon36} />
        </Circle>
      }
      inputError={errorMessage}
      nextButtonEnabled={!!mnemonic && !errorMessage}
      nextButtonText="Continue"
      subtitle="Your recovery phrase will only be stored locally on your browser"
      title="Enter your recovery phrase"
      onSubmit={onSubmit}>
      <OnboardingInput
        placeholderText="Recovery phrase (12 words)"
        value={mnemonic}
        onChangeText={setMnemonic}
        onSubmit={onSubmit}
      />
    </OnboardingScreen>
  )
}
