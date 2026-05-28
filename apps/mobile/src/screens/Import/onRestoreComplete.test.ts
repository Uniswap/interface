import { NavigationProp } from '@react-navigation/core'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { setHasCopiedPrivateKeys } from 'wallet/src/features/behaviorHistory/slice'
import { restoreMnemonicComplete } from 'wallet/src/features/wallet/slice'

jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

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
      screen: OnboardingScreens.SeedPhraseInput,
    })

    expect(mockDispatch).toHaveBeenCalledWith(restoreMnemonicComplete())
    expect(mockDispatch).toHaveBeenCalledWith(setHasCopiedPrivateKeys(false))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(MobileEventName.RestoreSuccess, {
      import_type: mockParams.importType,
      is_restoring_mnemonic: true,
      screen: OnboardingScreens.SeedPhraseInput,
    })
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
      screen: OnboardingScreens.SeedPhraseInput,
    })

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockNavigation.navigate).toHaveBeenCalledWith({
      name: OnboardingScreens.SelectWallet,
      params: mockParams,
      merge: true,
    })
  })
})
