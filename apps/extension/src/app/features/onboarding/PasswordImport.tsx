import { useCallback } from 'react'
import { ONBOARDING_PANE_TRANSITION_DURATION_WITH_LEEWAY } from 'src/app/features/onboarding/OnboardingPaneAnimatedContents'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Password } from 'src/app/features/onboarding/Password'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { sleep } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { validateMnemonic } from 'wallet/src/utils/mnemonics'

export function PasswordImport({
  flow,
  allowBack = true,
}: {
  flow: ExtensionOnboardingFlow
  allowBack?: boolean
}): JSX.Element {
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const { getOnboardingAccountMnemonicString, generateImportedAccountsByMnemonic } = useOnboardingContext()
  const mnemonicString = getOnboardingAccountMnemonicString()

  const onSubmit = useCallback(
    async (password: string) => {
      const { validMnemonic } = validateMnemonic(mnemonicString)

      if (!validMnemonic) {
        throw new Error('Mnemonic are invalid on PasswordImport screen')
      }

      goToNextStep()

      // TODO: EXT-1164 - Move Keyring methods to workers to not block main thread during onboarding
      // start running the validation after going to next step since they clog the main thread with work
      // plus just a bit of extra leeway since animations can take just a tad extra to finish
      await sleep(ONBOARDING_PANE_TRANSITION_DURATION_WITH_LEEWAY)
      await generateImportedAccountsByMnemonic(validMnemonic, password, BackupType.Manual)
    },
    [mnemonicString, goToNextStep, generateImportedAccountsByMnemonic],
  )

  return <Password flow={flow} onBack={allowBack ? goToPreviousStep : undefined} onComplete={onSubmit} />
}
