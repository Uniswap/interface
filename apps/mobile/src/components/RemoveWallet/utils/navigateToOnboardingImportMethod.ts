import { CommonActions } from '@react-navigation/core'
import { dispatchNavigationAction } from 'src/app/navigation/rootNavigation'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'

// This fast-forwards user to the same app state as if
// they have pressed "Get Started" on Landing and should now see import method view
export function navigateToOnboardingImportMethod(): void {
  dispatchNavigationAction(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: MobileScreens.OnboardingStack,
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
    }),
  )
}
