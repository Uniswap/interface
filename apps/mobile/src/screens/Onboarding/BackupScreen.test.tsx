import { CompositeNavigationProp, RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { renderWithProviders } from 'src/test/render'
import { render } from 'src/test/test-utils'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'
import { mockWalletPreloadedState } from 'wallet/src/test/fixtures'

const navigationProp = {} as CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, OnboardingScreens.Backup, undefined>,
  NativeStackNavigationProp<AppStackParamList, Screens.Education, undefined>
>
const routeProp = {
  params: {
    importType: ImportType.CreateNew,
    entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
  },
} as RouteProp<OnboardingStackParamList, OnboardingScreens.Backup>

describe(BackupScreen, () => {
  it('renders backup options when none are completed', async () => {
    const tree = render(<BackupScreen navigation={navigationProp} route={routeProp} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders backup options when some are completed', async () => {
    const tree = renderWithProviders(
      <TamaguiProvider>
        <BackupScreen navigation={navigationProp} route={routeProp} />
      </TamaguiProvider>,
      {
        preloadedState: mockWalletPreloadedState,
      }
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
