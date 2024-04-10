import { CommonActions } from '@react-navigation/core'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export function concatListOfAccountNames(accounts: Account[], endAdornmentText: string): string {
  let result = accounts.map((a) => a.name).join(', ')
  // replacing last comman with ' and'
  const lastCommaIndex = result.lastIndexOf(',')
  if (lastCommaIndex !== -1) {
    const before = result.slice(0, lastCommaIndex)
    const after = result.slice(lastCommaIndex + 1)
    result = before + ' ' + endAdornmentText + after
  }
  return result
}

// This fast-forwards user to the same app state as if
// they have pressed "Get Started" on Landing and should now see import method view
export function navigateToOnboardingImportMethod(): void {
  dispatchNavigationAction(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: Screens.OnboardingStack,
          state: {
            index: 1,
            routes: [
              {
                name: OnboardingScreens.Landing,
                params: {
                  entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
                  importType: ImportType.NotYetSelected,
                },
              },
              {
                name: OnboardingScreens.ImportMethod,
                params: {
                  entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
                  importType: ImportType.NotYetSelected,
                },
              },
            ],
          },
        },
      ],
    })
  )
}
