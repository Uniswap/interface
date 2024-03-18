import { CompositeNavigationProp, RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { act } from 'react-test-renderer'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { renderWithProviders } from 'src/test/render'
import { render } from 'src/test/test-utils'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'
import { ACCOUNT, preloadedSharedState } from 'wallet/src/test/fixtures'

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

    await act(async () => {
      // Wait for the screen to render
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders backup options when some are completed', async () => {
    const tree = renderWithProviders(
      <TamaguiProvider>
        <BackupScreen navigation={navigationProp} route={routeProp} />
      </TamaguiProvider>,
      { preloadedState: preloadedSharedState({ account: ACCOUNT }) }
    )

    await act(async () => {
      // Wait for the screen to render
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
