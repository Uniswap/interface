import { CompositeNavigationProp, RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { act } from 'react-test-renderer'
import { AppStackParamList, OnboardingStackParamList } from 'src/app/navigation/types'
import { BackupScreen } from 'src/screens/Onboarding/BackupScreen'
import { renderWithProviders } from 'src/test/render'
import { render } from 'src/test/test-utils'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { TamaguiProvider } from 'wallet/src/providers/tamagui-provider'
import { ACCOUNT, preloadedWalletPackageState } from 'wallet/src/test/fixtures'

jest.mock('wallet/src/features/wallet/accounts/utils', () => ({
  hasExternalBackup: jest.fn(),
  hasBackup: jest.fn(),
}))

jest.mock('wallet/src/features/onboarding/OnboardingContext', () => ({
  useOnboardingContext: jest.fn().mockReturnValue({
    getOnboardingOrImportedAccount: jest.fn().mockReturnValue({ address: 'mockedAccountAddress' }),
  }),
  useCreateImportedAccountsFromMnemonicIfNone: jest.fn(),
}))

const navigationProp = {} as CompositeNavigationProp<
  StackNavigationProp<OnboardingStackParamList, OnboardingScreens.Backup, undefined>,
  NativeStackNavigationProp<AppStackParamList, MobileScreens.Education, undefined>
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
      { preloadedState: preloadedWalletPackageState({ account: ACCOUNT }) },
    )

    await act(async () => {
      // Wait for the screen to render
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
