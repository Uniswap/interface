import { NavigationProp } from '@react-navigation/core'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { restoreMnemonicComplete } from 'wallet/src/features/wallet/slice'

describe('onRestoreComplete', () => {
  it('should dispatch restoreMnemonicComplete when isRestoringMnemonic is true', () => {
    const mockDispatch = jest.fn()
    const mockNavigation = { navigate: jest.fn() }
    const mockParams = {
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      importType: ImportType.RestoreMnemonic,
    }

    onRestoreComplete({
      isRestoringMnemonic: true,
      dispatch: mockDispatch,
      params: mockParams,
      navigation: mockNavigation as unknown as NavigationProp<OnboardingStackParamList>,
    })

    expect(mockDispatch).toHaveBeenCalledWith(restoreMnemonicComplete())
    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })

  it('should navigate to SelectWallet screen when isRestoringMnemonic is false', () => {
    const mockDispatch = jest.fn()
    const mockNavigation = { navigate: jest.fn() }
    const mockParams = {
      entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      importType: ImportType.Restore,
    }

    onRestoreComplete({
      isRestoringMnemonic: false,
      dispatch: mockDispatch,
      params: mockParams,
      navigation: mockNavigation as unknown as NavigationProp<OnboardingStackParamList>,
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockNavigation.navigate).toHaveBeenCalledWith({
      name: OnboardingScreens.SelectWallet,
      params: mockParams,
      merge: true,
    })
  })
})
