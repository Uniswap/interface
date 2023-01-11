import { CompositeNavigationProp, RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { mockWalletPreloadedState } from 'src/test/fixtures'
import { renderWithProviders } from 'src/test/render'
import { render, screen } from 'src/test/test-utils'

const navigationProp = {} as CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, OnboardingScreens.Backup, undefined>,
  NativeStackNavigationProp<AppStackParamList, Screens.Education, undefined>
>
const routeProp = {} as RouteProp<OnboardingStackParamList, OnboardingScreens.Backup>

describe(BackupScreen, () => {
  it('renders backup options when none are completed', async () => {
    const tree = render(<BackupScreen navigation={navigationProp} route={routeProp} />)

    expect(await screen.queryByText('Completed')).toBeNull()
    expect(await screen.getAllByText('+ ADD').length).toBe(2)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders backup options when some are completed', async () => {
    const tree = renderWithProviders(
      <BackupScreen navigation={navigationProp} route={routeProp} />,
      {
        preloadedState: mockWalletPreloadedState,
      }
    )

    expect(await screen.getAllByText('Completed').length).toBe(1)
    expect(await screen.getAllByText('+ ADD').length).toBe(1)
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
