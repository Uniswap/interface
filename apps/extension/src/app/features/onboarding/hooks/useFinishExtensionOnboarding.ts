import { useEffect, useRef } from 'react'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { ImportType } from 'uniswap/src/types/onboarding'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

/**
 * Activates onboarding accounts on component mount,
 * and auto-connects to app.uniswap.org.
 */
export function useFinishExtensionOnboarding({
  callback,
  extensionOnboardingFlow,
  skip,
}: {
  callback?: () => void
  extensionOnboardingFlow?: ExtensionOnboardingFlow
  skip?: boolean
}): void {
  const { finishOnboarding, getOnboardingOrImportedAccount, getOnboardingAccountAddress } = useOnboardingContext()
  const importType = getImportType(getOnboardingAccountAddress(), extensionOnboardingFlow)

  const isFinishedRef = useRef(false)

  useEffect(() => {
    if (skip || isFinishedRef.current) {
      return
    }

    const runFinishOnboarding = async () => {
      isFinishedRef.current = true

      await finishOnboarding({ importType, extensionOnboardingFlow })

      const account = getOnboardingOrImportedAccount()
      if (account) {
        await saveDappConnection({ dappUrl: UNISWAP_WEB_URL, account })
      }

      callback?.()
    }

    runFinishOnboarding().catch((e) => {
      logger.error(e, {
        tags: { file: 'useFinishExtensionOnboarding.ts', function: 'finishOnboarding' },
      })
    })
  }, [finishOnboarding, importType, callback, extensionOnboardingFlow, skip, getOnboardingOrImportedAccount])
}

function getImportType(
  onboardingAccountAddress: string | undefined,
  extensionOnboardingFlow: ExtensionOnboardingFlow | undefined,
): ImportType {
  if (extensionOnboardingFlow === ExtensionOnboardingFlow.Passkey) {
    return ImportType.Passkey
  }
  if (onboardingAccountAddress) {
    return ImportType.CreateNew
  }
  return ImportType.RestoreMnemonic
}
