import { useCallback, useEffect } from 'react'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Password } from 'src/app/features/onboarding/Password'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { validateMnemonic } from 'wallet/src/utils/mnemonics'

export function PasswordImport({
  flow,
  allowBack = true,
}: {
  flow: ExtensionOnboardingFlow
  allowBack?: boolean
}): JSX.Element {
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const { getOnboardingAccountMnemonicString, generateInitialAddresses, importMnemonicToKeychain } =
    useOnboardingContext()
  const mnemonicString = getOnboardingAccountMnemonicString()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on component mount to generate addresses
  useEffect(() => {
    generateInitialAddresses().catch((error) => {
      logger.error(error, {
        tags: { file: 'PasswordImport.tsx', function: 'generateInitialAddresses' },
      })
    })
  }, [])

  const onSubmit = useCallback(
    async (password: string) => {
      const { validMnemonic } = validateMnemonic(mnemonicString)

      if (!validMnemonic) {
        throw new Error('Mnemonic are invalid on PasswordImport screen')
      }

      goToNextStep()
      await importMnemonicToKeychain({ mnemonic: validMnemonic, password, allowOverwrite: true })
    },
    [mnemonicString, goToNextStep, importMnemonicToKeychain],
  )

  return <Password flow={flow} onBack={allowBack ? goToPreviousStep : undefined} onComplete={onSubmit} />
}
