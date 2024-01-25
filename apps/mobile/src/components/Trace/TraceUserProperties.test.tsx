import React from 'react'
import { useColorScheme } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import * as appHooks from 'src/app/hooks'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import * as biometricHooks from 'src/features/biometrics/hooks'
import { AuthMethod, UserPropertyName } from 'src/features/telemetry/constants'
import * as versionUtils from 'src/utils/version'
import * as useIsDarkModeFile from 'ui/src/hooks/useIsDarkMode'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import * as fiatCurrencyHooks from 'wallet/src/features/fiatCurrency/hooks'
import * as languageHooks from 'wallet/src/features/language/hooks'
import { AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import * as walletHooks from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

// `any` is the actual type used by `jest.spyOn`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockFn(module: any, func: string, returnValue: any): jest.SpyInstance<any, unknown[]> {
  return jest.spyOn(module, func).mockImplementation(() => returnValue)
}

jest.mock('react-native/Libraries/Utilities/useColorScheme')

const address1 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BF'
const address2 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BD'
const address3 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BE'

const signerAccount1 = {
  type: AccountType.SignerMnemonic,
  address: address1,
  timeImportedMs: 100000,
}

const signerAccount2 = {
  type: AccountType.SignerMnemonic,
  address: address2,
  timeImportedMs: 100000,
}

const signerAccount3 = {
  type: AccountType.SignerMnemonic,
  address: address3,
  timeImportedMs: 100000,
}

describe('TraceUserProperties', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('sets user properties with active account', async () => {
    mockFn(versionUtils, 'getFullAppVersion', '1.0.0.345')
    // Hooks mocks
    const mockedUsedColorScheme = useColorScheme as jest.Mock
    mockedUsedColorScheme.mockReturnValue('dark')
    mockFn(walletHooks, 'useActiveAccount', {
      address: 'address',
      type: AccountType.SignerMnemonic,
      backups: [BackupType.Cloud],
      pushNotificationsEnabled: true,
    })
    mockFn(walletHooks, 'useViewOnlyAccounts', ['address1', 'address2'])
    mockFn(walletHooks, 'useSwapProtectionSetting', SwapProtectionSetting.On)
    mockFn(walletHooks, 'useNonPendingSignerAccounts', [
      signerAccount1,
      signerAccount2,
      signerAccount3,
    ])
    mockFn(walletHooks, 'useHideSpamTokensSetting', true)
    mockFn(walletHooks, 'useHideSmallBalancesSetting', false)
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: true,
      requiredForTransactions: true,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: true,
    })
    mockFn(useIsDarkModeFile, 'useIsDarkMode', true)
    mockFn(fiatCurrencyHooks, 'useAppFiatCurrency', FiatCurrency.UnitedStatesDollar)
    mockFn(languageHooks, 'useCurrentLanguageInfo', { loggingName: 'English' })
    mockFn(appHooks, 'useAppSelector', { enabled: true })

    // mock setUserProperty
    const mocked = mockFn(analytics, 'setUserProperty', undefined)

    // Execute useEffects
    // https://reactjs.org/docs/test-renderer.html#testrendereract
    await act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppVersion, '1.0.0.345')
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.DarkMode, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.ActiveWalletAddress, 'address')
    expect(mocked).toHaveBeenCalledWith(
      UserPropertyName.ActiveWalletType,
      AccountType.SignerMnemonic
    )
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsCloudBackedUp, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsPushEnabled, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsHideSmallBalancesEnabled, false)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsHideSpamTokensEnabled, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletViewOnlyCount, 2)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletSignerCount, 3)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletSignerAccounts, [
      address1,
      address2,
      address3,
    ])
    expect(mocked).toHaveBeenCalledWith(
      UserPropertyName.WalletSwapProtectionSetting,
      SwapProtectionSetting.On
    )
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppOpenAuthMethod, AuthMethod.FaceId)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.TransactionAuthMethod, AuthMethod.FaceId)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.Language, 'English')
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.Currency, 'USD')

    expect(mocked).toHaveBeenCalledTimes(16)
  })

  it('sets user properties without active account', async () => {
    mockFn(versionUtils, 'getFullAppVersion', '1.0.0.345')
    // Hooks mocks
    const mockedUsedColorScheme = useColorScheme as jest.Mock
    mockedUsedColorScheme.mockReturnValue('dark')
    mockFn(walletHooks, 'useActiveAccount', null)
    mockFn(walletHooks, 'useViewOnlyAccounts', [])
    mockFn(walletHooks, 'useSwapProtectionSetting', SwapProtectionSetting.On)
    mockFn(walletHooks, 'useNonPendingSignerAccounts', [])
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: false,
    })
    mockFn(useIsDarkModeFile, 'useIsDarkMode', true)
    mockFn(fiatCurrencyHooks, 'useAppFiatCurrency', FiatCurrency.UnitedStatesDollar)
    mockFn(languageHooks, 'useCurrentLanguageInfo', { loggingName: 'English' })

    // mock setUserProperty
    const mocked = mockFn(analytics, 'setUserProperty', undefined)

    // Execute useEffects
    await act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppVersion, '1.0.0.345')
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.DarkMode, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletViewOnlyCount, 0)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletSignerCount, 0)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppOpenAuthMethod, AuthMethod.None)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.TransactionAuthMethod, AuthMethod.None)

    expect(mocked).toHaveBeenCalledTimes(10)
  })
})
