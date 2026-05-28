import { usePasskeyImportContext } from 'src/app/features/onboarding/import/PasskeyImportContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { Flex } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { PasskeyImportLoading } from 'wallet/src/features/onboarding/PasskeyImportLoading'
import { WelcomeSplash } from 'wallet/src/features/onboarding/WelcomeSplash'

const SCREEN_HEIGHT = 281

export function PasskeyImport(): JSX.Element {
  const { importedAddress } = usePasskeyImportContext()
  const { goToNextStep } = useOnboardingSteps()

  return (
    <OnboardingScreen>
      <Flex grow height={SCREEN_HEIGHT}>
        <Trace
          logImpression
          properties={{ flow: ExtensionOnboardingFlow.Passkey }}
          screen={ExtensionOnboardingScreens.PasskeyImport}
        >
          {importedAddress ? (
            <WelcomeSplash address={importedAddress} onContinue={goToNextStep} />
          ) : (
            <PasskeyImportLoading />
          )}
        </Trace>
      </Flex>
    </OnboardingScreen>
  )
}
